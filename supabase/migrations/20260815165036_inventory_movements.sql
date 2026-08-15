-- Faro | Libro mayor de inventario
--
-- Todo cambio de existencias se explica por un movimiento. El invariante del
-- modelo es:
--
--   inventory.quantity
--     = sum(inventory_movement_items.quantity)
--       de los movimientos aplicados, agrupado por (product, location, lot)
--
-- La CANTIDAD VA CON SIGNO: positiva = entrada, negativa = salida. Gracias a
-- eso una transferencia es UN solo movimiento (lineas negativas en el origen y
-- positivas en el destino) y el saldo se obtiene con un simple SUM.

-- ---------------------------------------------------------------------------
-- inventory_movements (cabecera)
-- ---------------------------------------------------------------------------
create table public.inventory_movements (
  id             bigint generated always as identity primary key,
  type           public.movement_type not null,

  -- Documento que origino el movimiento. Referencia debil a proposito: apunta
  -- a purchases / sales / inventory_transfers segun reference_type, y una FK
  -- real polimorfica no es expresable en Postgres. La integridad efectiva la
  -- da que solo las funciones confirm_* escriben estos campos.
  reference_type public.document_type,
  reference_id   bigint,

  date           timestamptz not null default now(),
  notes          text,

  -- Marca de idempotencia: mientras sea NULL el movimiento es un borrador que
  -- todavia no toco `inventory`. Una vez aplicado, el movimiento y sus lineas
  -- quedan inmutables.
  applied_at     timestamptz,

  -- Auditoria. Base para la futura capa de autorizacion por rol.
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),

  -- Un id de documento sin decir de que documento es no significa nada. Al
  -- reves si: reference_type = 'manual' con reference_id NULL identifica un
  -- ajuste o carga inicial hecha sin documento de respaldo.
  constraint inventory_movements_reference_typed
    check (reference_id is null or reference_type is not null)
);

-- Un documento produce como maximo un movimiento: barrera dura contra
-- confirmar dos veces la misma compra o venta.
create unique index inventory_movements_reference_key
  on public.inventory_movements (reference_type, reference_id)
  where reference_id is not null;

-- Listado cronologico del kardex.
create index inventory_movements_date_idx
  on public.inventory_movements (date desc, id desc);

create index inventory_movements_type_date_idx
  on public.inventory_movements (type, date desc);

create index inventory_movements_created_by_idx
  on public.inventory_movements (created_by)
  where created_by is not null;

comment on table public.inventory_movements is
  'Cabecera del kardex. applied_at NULL = borrador que aun no afecta inventory.';

-- ---------------------------------------------------------------------------
-- inventory_movement_items (lineas)
-- ---------------------------------------------------------------------------
create table public.inventory_movement_items (
  id          bigint generated always as identity primary key,
  movement_id bigint not null references public.inventory_movements (id) on delete cascade,
  product_id  bigint not null references public.products (id)            on delete restrict,
  location_id bigint not null references public.locations (id)           on delete restrict,
  lot_id      bigint,

  -- CON SIGNO. Positiva = entra a location_id, negativa = sale de location_id.
  quantity    numeric(18,4) not null,

  -- Costo unitario al momento del movimiento. Redundante con
  -- inventory_lots.unit_cost cuando hay lote, pero se conserva porque el
  -- kardex debe poder leerse sin depender de que el lote siga existiendo.
  unit_cost   numeric(14,4),

  created_at  timestamptz   not null default now(),

  constraint inventory_movement_items_quantity_not_zero check (quantity <> 0),
  constraint inventory_movement_items_unit_cost_non_negative
    check (unit_cost is null or unit_cost >= 0),

  constraint inventory_movement_items_lot_matches_product
    foreign key (lot_id, product_id)
    references public.inventory_lots (id, product_id)
    on delete restrict
);

create index inventory_movement_items_movement_id_idx
  on public.inventory_movement_items (movement_id);

-- Reconstruccion del saldo y kardex por producto.
create index inventory_movement_items_balance_idx
  on public.inventory_movement_items (product_id, location_id, lot_id);

create index inventory_movement_items_location_id_idx
  on public.inventory_movement_items (location_id);

create index inventory_movement_items_lot_id_idx
  on public.inventory_movement_items (lot_id)
  where lot_id is not null;

comment on table public.inventory_movement_items is
  'Lineas del kardex. quantity con signo: + entrada, - salida.';

-- ---------------------------------------------------------------------------
-- Reglas de integridad del libro mayor
-- ---------------------------------------------------------------------------
-- 1) El signo debe ser coherente con el tipo de movimiento.
-- 2) Un movimiento ya aplicado no se puede alterar.
-- Ninguna de las dos es expresable con un CHECK (dependen de la cabecera).
create or replace function public.inventory_movement_items_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_movement    public.inventory_movements;
  v_movement_id bigint;
begin
  -- En un trigger de DELETE, NEW no esta asignado.
  if tg_op = 'DELETE' then
    v_movement_id := old.movement_id;
  else
    v_movement_id := new.movement_id;
  end if;

  select * into v_movement
    from public.inventory_movements
   where id = v_movement_id;

  -- Cabecera inexistente = borrado en cascada del movimiento completo.
  if v_movement.id is not null and v_movement.applied_at is not null then
    raise exception
      'El movimiento % ya fue aplicado al inventario y es inmutable', v_movement_id
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if v_movement.type in ('purchase', 'initial_stock') and new.quantity <= 0 then
    raise exception
      'Un movimiento de tipo % solo admite cantidades positivas', v_movement.type
      using errcode = 'check_violation';
  end if;

  if v_movement.type = 'sale' and new.quantity >= 0 then
    raise exception 'Un movimiento de venta solo admite cantidades negativas'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger inventory_movement_items_guard
  before insert or update or delete on public.inventory_movement_items
  for each row execute function public.inventory_movement_items_guard();

-- El kardex es inmutable una vez aplicado: ni la cabecera se reescribe.
-- Corregir un movimiento aplicado se hace con un movimiento de ajuste
-- contrario, no editando la historia.
create or replace function public.inventory_movements_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.applied_at is not null then
      raise exception 'No se puede eliminar un movimiento ya aplicado (id %)', old.id
        using errcode = 'check_violation';
    end if;
    return old;
  end if;

  if old.applied_at is not null then
    -- Se permite unicamente anotar en `notes`; el resto queda congelado.
    if (new.type, new.reference_type, new.reference_id, new.date, new.applied_at)
       is distinct from
       (old.type, old.reference_type, old.reference_id, old.date, old.applied_at)
    then
      raise exception 'El movimiento % ya fue aplicado y es inmutable', old.id
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger inventory_movements_guard
  before update or delete on public.inventory_movements
  for each row execute function public.inventory_movements_guard();
