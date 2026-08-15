-- Faro | Lotes de inventario (capas de costo)
--
-- CONCEPTO CENTRAL DEL MODELO DE COSTOS
--
-- Un `inventory_lot` es UNA ENTRADA de producto con costo propio. Es una capa
-- de costo, no necesariamente un lote del fabricante.
--
--   Ferreteria (track_lot = false)
--     Rodamiento 6204, enero, 100 u a $8.000   -> lote #1, lot_number NULL
--     Rodamiento 6204, junio,  50 u a $9.500   -> lote #2, lot_number NULL
--
--   Alimentos (track_lot = true, track_expiration = true)
--     Aceite 1L, lote 'A', 100 u a $4.000, vence 2026-09-01 -> lote #3
--     Aceite 1L, lote 'B', 200 u a $4.300, vence 2026-11-15 -> lote #4
--
-- Por eso NO hay unique sobre lot_number: recibir dos veces el mismo lote del
-- fabricante a costos distintos debe producir DOS capas de costo. Para ver el
-- lote fisico agregado basta con agrupar por (product_id, lot_number).
--
-- Tampoco hay columna `quantity` aca: la cantidad depende de la ubicacion y es
-- un dato vivo. Vive en `inventory` (product, location, lot) y se explica por
-- `inventory_movement_items`. Duplicarla en el lote garantizaria desincronia.
--
-- Una nueva compra NUNCA sobrescribe el costo anterior: crea un lote nuevo.
-- Esto deja preparado FIFO / FEFO / promedio ponderado / costo especifico sin
-- cambios de esquema.

create table public.inventory_lots (
  id              bigint generated always as identity primary key,
  product_id      bigint not null references public.products (id) on delete restrict,

  -- Numero de lote del fabricante. NULL cuando el producto no lo maneja
  -- (caso tipico de ferreteria).
  lot_number      text,

  -- Costo unitario de ESTA entrada. Inmutable en la practica.
  unit_cost       numeric(14,4) not null,

  received_at     timestamptz   not null default now(),
  expiration_date date,

  notes           text,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),

  constraint inventory_lots_unit_cost_non_negative check (unit_cost >= 0),
  constraint inventory_lots_lot_number_not_blank
    check (lot_number is null or length(btrim(lot_number)) > 0)
);

create index inventory_lots_product_id_idx on public.inventory_lots (product_id);

-- Habilita FK compuestas (lot_id, product_id) desde inventory, movimientos y
-- lineas de documento. Con eso la base garantiza -- declarativamente, sin
-- triggers -- que un lote nunca se asocie al producto equivocado.
-- Con MATCH SIMPLE (el default), si lot_id es NULL la FK no se evalua, que es
-- justo lo que necesitamos para los productos sin lote.
alter table public.inventory_lots
  add constraint inventory_lots_id_product_id_key unique (id, product_id);

-- Orden FIFO: entrada mas antigua primero.
create index inventory_lots_fifo_idx
  on public.inventory_lots (product_id, received_at, id);

-- Orden FEFO y consultas de vencimiento ("vence en los proximos N dias",
-- "ya vencidos"). Indice parcial: los productos sin vencimiento no lo ocupan.
create index inventory_lots_expiration_idx
  on public.inventory_lots (expiration_date, product_id)
  where expiration_date is not null;

-- Busqueda por numero de lote (trazabilidad, retiros de mercado).
create index inventory_lots_lot_number_idx
  on public.inventory_lots (product_id, lot_number)
  where lot_number is not null;

create trigger inventory_lots_set_updated_at
  before update on public.inventory_lots
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Coherencia con las banderas del producto
-- ---------------------------------------------------------------------------
-- No se puede expresar con un CHECK porque depende de otra tabla. El trigger
-- es la unica forma de impedir, desde la base, que se cree un lote sin numero
-- para un producto que si controla lotes.
create or replace function public.inventory_lots_validate_tracking()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product public.products;
begin
  select * into v_product
    from public.products
   where id = new.product_id;

  if v_product.track_lot and new.lot_number is null then
    raise exception
      'El producto "%" controla lotes: lot_number es obligatorio', v_product.name
      using errcode = 'check_violation';
  end if;

  if v_product.track_expiration and new.expiration_date is null then
    raise exception
      'El producto "%" controla vencimiento: expiration_date es obligatorio', v_product.name
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger inventory_lots_validate_tracking
  before insert or update of product_id, lot_number, expiration_date
  on public.inventory_lots
  for each row execute function public.inventory_lots_validate_tracking();

comment on table public.inventory_lots is
  'Capa de costo / entrada de inventario. lot_number y expiration_date son opcionales.';
comment on column public.inventory_lots.unit_cost is
  'Costo unitario de esta entrada. No se sobrescribe con compras posteriores.';
