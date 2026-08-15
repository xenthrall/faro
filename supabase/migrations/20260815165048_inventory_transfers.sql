-- Faro | Transferencias entre ubicaciones
--
-- Una transferencia no es una compra ni una venta: no hay tercero, no hay
-- impuesto y no cambia el valor del inventario. Solo lo mueve.
--
--   Bodega principal 100        Transferir 30        Bodega principal  70
--                                              ->    Tienda            30
--
-- EL LOTE Y EL COSTO SE CONSERVAN: la linea que entra en el destino apunta al
-- MISMO inventory_lot que la que sale del origen. Por eso mover mercancia
-- nunca altera la valorizacion.

create table public.inventory_transfers (
  id                      bigint generated always as identity primary key,
  source_location_id      bigint not null references public.locations (id) on delete restrict,
  destination_location_id bigint not null references public.locations (id) on delete restrict,

  reference    text,
  date         timestamptz            not null default now(),
  status       public.document_status not null default 'draft',
  notes        text,

  confirmed_at timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint inventory_transfers_distinct_locations
    check (source_location_id <> destination_location_id),
  constraint inventory_transfers_confirmed_at_consistent
    check (status <> 'confirmed' or confirmed_at is not null)
);

create index inventory_transfers_source_idx      on public.inventory_transfers (source_location_id);
create index inventory_transfers_destination_idx on public.inventory_transfers (destination_location_id);
create index inventory_transfers_date_idx        on public.inventory_transfers (date desc, id desc);
create index inventory_transfers_status_date_idx on public.inventory_transfers (status, date desc);
create index inventory_transfers_created_by_idx
  on public.inventory_transfers (created_by) where created_by is not null;

create trigger inventory_transfers_set_updated_at
  before update on public.inventory_transfers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- inventory_transfer_items
-- ---------------------------------------------------------------------------
create table public.inventory_transfer_items (
  id          bigint generated always as identity primary key,
  transfer_id bigint not null references public.inventory_transfers (id) on delete cascade,
  product_id  bigint not null references public.products (id)            on delete restrict,

  -- Lote concreto a mover. NULL = asignacion automatica FEFO/FIFO sobre el
  -- stock disponible en la ubicacion origen al confirmar.
  lot_id      bigint,
  quantity    numeric(18,4) not null,

  -- Copia informativa del costo del lote al momento de mover. No se usa para
  -- revalorizar: el costo real sigue viviendo en inventory_lots.unit_cost.
  unit_cost   numeric(14,4),

  created_at  timestamptz not null default now(),

  constraint inventory_transfer_items_quantity_positive check (quantity > 0),
  constraint inventory_transfer_items_unit_cost_non_negative
    check (unit_cost is null or unit_cost >= 0),

  constraint inventory_transfer_items_lot_matches_product
    foreign key (lot_id, product_id)
    references public.inventory_lots (id, product_id)
    on delete restrict
);

create index inventory_transfer_items_transfer_id_idx
  on public.inventory_transfer_items (transfer_id);
create index inventory_transfer_items_product_id_idx
  on public.inventory_transfer_items (product_id);
create index inventory_transfer_items_lot_id_idx
  on public.inventory_transfer_items (lot_id) where lot_id is not null;

create trigger inventory_transfer_items_require_draft
  before insert or update or delete on public.inventory_transfer_items
  for each row
  execute function public.document_items_require_draft('inventory_transfers', 'transfer_id');

comment on table public.inventory_transfers is
  'Movimiento de existencias entre ubicaciones. No altera el costo ni el valor del inventario.';
