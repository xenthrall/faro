-- Faro | Compras
--
-- Una compra es el documento COMERCIAL (a quien, a que precio, con que
-- impuesto). El efecto FISICO sobre el inventario es un movimiento aparte.
-- No se duplica logica entre ambos: `purchase_items` guarda las condiciones
-- economicas, `inventory_movement_items` guarda el impacto en existencias, y
-- el puente son dos referencias explicitas:
--
--   inventory_movements.reference_type = 'purchase'
--   inventory_movements.reference_id   = purchases.id
--   purchase_items.lot_id              -> capa de costo creada por esa linea
--
-- Mientras status = 'draft' la compra no toca el inventario. Al confirmarla
-- (confirm_purchase) se crean los lotes y el movimiento de entrada.

-- ---------------------------------------------------------------------------
-- Helpers reutilizables por compras y ventas
-- ---------------------------------------------------------------------------
-- Recalcula los totales de la cabecera a partir de sus lineas.
-- Se parametriza por argumentos de trigger (constantes escritas en esta
-- migracion, nunca entrada de usuario), por eso el format() es seguro.
--   TG_ARGV[0] = tabla cabecera, TG_ARGV[1] = columna FK en la linea
create or replace function public.recalculate_document_totals()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_header_table text := tg_argv[0];
  v_fk_column    text := tg_argv[1];
  v_header_id    bigint;
begin
  -- to_jsonb en vez de leer NEW/OLD dinamicamente: en un trigger de DELETE
  -- NEW no esta asignado, y asi la funcion sirve para las tres operaciones.
  if tg_op = 'DELETE' then
    v_header_id := (to_jsonb(old) ->> v_fk_column)::bigint;
  else
    v_header_id := (to_jsonb(new) ->> v_fk_column)::bigint;
  end if;

  execute format($sql$
    update public.%1$I h
       set subtotal = coalesce(t.subtotal, 0),
           tax      = coalesce(t.tax, 0),
           total    = coalesce(t.total, 0)
      from (
        select sum(subtotal) as subtotal,
               sum(tax)      as tax,
               sum(total)    as total
          from public.%2$I
         where %3$I = $1
      ) t
     where h.id = $1
  $sql$, v_header_table, tg_table_name, v_fk_column)
  using v_header_id;

  return null;  -- trigger AFTER: el valor de retorno se ignora
end;
$$;

comment on function public.recalculate_document_totals() is
  'Trigger AFTER sobre lineas de documento: mantiene subtotal/tax/total de la cabecera.';

-- Impide editar las lineas de un documento que ya no esta en borrador.
--   TG_ARGV[0] = tabla cabecera, TG_ARGV[1] = columna FK en la linea
create or replace function public.document_items_require_draft()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_header_id bigint;
  v_status    public.document_status;
begin
  if tg_op = 'DELETE' then
    v_header_id := (to_jsonb(old) ->> tg_argv[1])::bigint;
  else
    v_header_id := (to_jsonb(new) ->> tg_argv[1])::bigint;
  end if;

  execute format('select status from public.%I where id = $1', tg_argv[0])
    into v_status
    using v_header_id;

  -- Cabecera inexistente = borrado en cascada del documento completo. Se deja
  -- pasar; quien decide si el documento se puede borrar es su propia tabla.
  if v_status is not null and v_status <> 'draft' then
    raise exception 'El documento % esta en estado "%" y sus lineas no se pueden modificar',
      v_header_id, v_status
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- purchases
-- ---------------------------------------------------------------------------
create table public.purchases (
  id           bigint generated always as identity primary key,
  -- Opcional: una compra menor puede no tener proveedor registrado.
  supplier_id  bigint references public.suppliers (id) on delete restrict,
  -- Obligatoria: toda entrada de mercancia llega a algun lugar.
  location_id  bigint not null references public.locations (id) on delete restrict,

  -- Numero de factura del proveedor.
  reference    text,
  date         timestamptz             not null default now(),
  status       public.document_status  not null default 'draft',

  -- Derivados de las lineas y mantenidos por trigger. Se almacenan (y no se
  -- calculan al vuelo) porque son la cifra que se imprime y se concilia: deben
  -- quedar congelados aunque cambie la definicion del calculo mas adelante.
  subtotal     numeric(14,2) not null default 0,
  tax          numeric(14,2) not null default 0,
  total        numeric(14,2) not null default 0,

  notes        text,
  confirmed_at timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint purchases_amounts_non_negative
    check (subtotal >= 0 and tax >= 0 and total >= 0),
  -- Una compra confirmada siempre tiene fecha de confirmacion. Anularla
  -- despues no borra ese dato historico.
  constraint purchases_confirmed_at_consistent
    check (status <> 'confirmed' or confirmed_at is not null)
);

create index purchases_supplier_id_idx on public.purchases (supplier_id);
create index purchases_location_id_idx on public.purchases (location_id);
create index purchases_date_idx        on public.purchases (date desc, id desc);
create index purchases_status_date_idx on public.purchases (status, date desc);
create index purchases_created_by_idx  on public.purchases (created_by) where created_by is not null;

create unique index purchases_supplier_reference_key
  on public.purchases (supplier_id, lower(reference))
  where reference is not null and supplier_id is not null;

create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- purchase_items
-- ---------------------------------------------------------------------------
create table public.purchase_items (
  id          bigint generated always as identity primary key,
  purchase_id bigint not null references public.purchases (id) on delete cascade,
  product_id  bigint not null references public.products (id)  on delete restrict,

  quantity    numeric(18,4) not null,
  unit_cost   numeric(14,4) not null,
  -- Se copia de products.tax_rate al crear la linea, pero se guarda aparte:
  -- cambiar el impuesto de un producto no debe reescribir compras pasadas.
  tax_rate    numeric(6,3)  not null default 0,

  -- Capa de costo generada por esta linea. NULL mientras la compra es
  -- borrador; confirm_purchase() la crea y la enlaza. Tambien se puede fijar
  -- a mano antes de confirmar para capturar lot_number / vencimiento.
  lot_id      bigint,

  -- Importes DERIVADOS: columnas generadas, no escribibles. Es imposible que
  -- se desincronicen de quantity/unit_cost/tax_rate, y no dependen del
  -- frontend. Postgres no permite que una generated column referencie a otra,
  -- por eso la expresion de subtotal se repite dentro de tax y total.
  subtotal numeric(14,2)
    generated always as (round(quantity * unit_cost, 2)) stored,
  tax numeric(14,2)
    generated always as (round(round(quantity * unit_cost, 2) * tax_rate / 100, 2)) stored,
  total numeric(14,2)
    generated always as (
      round(quantity * unit_cost, 2)
      + round(round(quantity * unit_cost, 2) * tax_rate / 100, 2)
    ) stored,

  created_at timestamptz not null default now(),

  constraint purchase_items_quantity_positive     check (quantity > 0),
  constraint purchase_items_unit_cost_non_negative check (unit_cost >= 0),
  constraint purchase_items_tax_rate_valid        check (tax_rate >= 0 and tax_rate <= 100),

  constraint purchase_items_lot_matches_product
    foreign key (lot_id, product_id)
    references public.inventory_lots (id, product_id)
    on delete restrict
);

create index purchase_items_purchase_id_idx on public.purchase_items (purchase_id);
create index purchase_items_product_id_idx  on public.purchase_items (product_id);
create index purchase_items_lot_id_idx      on public.purchase_items (lot_id) where lot_id is not null;

-- Una capa de costo pertenece a una sola linea de compra.
create unique index purchase_items_lot_id_key
  on public.purchase_items (lot_id)
  where lot_id is not null;

create trigger purchase_items_require_draft
  before insert or update or delete on public.purchase_items
  for each row execute function public.document_items_require_draft('purchases', 'purchase_id');

create trigger purchase_items_recalculate_totals
  after insert or update or delete on public.purchase_items
  for each row execute function public.recalculate_document_totals('purchases', 'purchase_id');

comment on table public.purchase_items is
  'Lineas comerciales de la compra. Los importes son columnas generadas.';
comment on column public.purchase_items.lot_id is
  'Capa de costo creada al confirmar. Prefijable para capturar lote/vencimiento.';
