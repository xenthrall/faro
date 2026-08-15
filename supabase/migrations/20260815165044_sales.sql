-- Faro | Ventas
--
-- Simetrico a compras: `sales` es el documento comercial, el efecto fisico es
-- un `inventory_movement` de tipo 'sale' con lineas negativas.

create table public.sales (
  id           bigint generated always as identity primary key,
  -- Opcional: venta de mostrador sin cliente identificado.
  customer_id  bigint references public.customers (id) on delete restrict,
  -- Obligatoria: de algun lado sale la mercancia.
  location_id  bigint not null references public.locations (id) on delete restrict,

  -- Numero de factura / ticket propio.
  reference    text,
  date         timestamptz            not null default now(),
  status       public.document_status not null default 'draft',

  subtotal     numeric(14,2) not null default 0,
  tax          numeric(14,2) not null default 0,
  total        numeric(14,2) not null default 0,

  notes        text,
  confirmed_at timestamptz,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint sales_amounts_non_negative
    check (subtotal >= 0 and tax >= 0 and total >= 0),
  constraint sales_confirmed_at_consistent
    check (status <> 'confirmed' or confirmed_at is not null)
);

create index sales_customer_id_idx on public.sales (customer_id);
create index sales_location_id_idx on public.sales (location_id);
create index sales_date_idx        on public.sales (date desc, id desc);
create index sales_status_date_idx on public.sales (status, date desc);
create index sales_created_by_idx  on public.sales (created_by) where created_by is not null;

create unique index sales_reference_key
  on public.sales (lower(reference))
  where reference is not null;

create trigger sales_set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sale_items
-- ---------------------------------------------------------------------------
create table public.sale_items (
  id         bigint generated always as identity primary key,
  sale_id    bigint not null references public.sales (id)    on delete cascade,
  product_id bigint not null references public.products (id) on delete restrict,

  quantity   numeric(18,4) not null,
  unit_price numeric(14,4) not null,
  tax_rate   numeric(6,3)  not null default 0,

  -- Lote a descargar. NULL = que confirm_sale() elija automaticamente por
  -- FEFO (vence primero, sale primero) y, en empate, FIFO. Informarlo permite
  -- costo especifico o trazabilidad exigida por el cliente.
  -- No estaba en el diseno original: se agrega porque sin el la base no puede
  -- saber de que capa de costo descontar la salida.
  lot_id     bigint,

  subtotal numeric(14,2)
    generated always as (round(quantity * unit_price, 2)) stored,
  tax numeric(14,2)
    generated always as (round(round(quantity * unit_price, 2) * tax_rate / 100, 2)) stored,
  total numeric(14,2)
    generated always as (
      round(quantity * unit_price, 2)
      + round(round(quantity * unit_price, 2) * tax_rate / 100, 2)
    ) stored,

  created_at timestamptz not null default now(),

  constraint sale_items_quantity_positive      check (quantity > 0),
  constraint sale_items_unit_price_non_negative check (unit_price >= 0),
  constraint sale_items_tax_rate_valid         check (tax_rate >= 0 and tax_rate <= 100),

  constraint sale_items_lot_matches_product
    foreign key (lot_id, product_id)
    references public.inventory_lots (id, product_id)
    on delete restrict
);

create index sale_items_sale_id_idx    on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);
create index sale_items_lot_id_idx     on public.sale_items (lot_id) where lot_id is not null;

create trigger sale_items_require_draft
  before insert or update or delete on public.sale_items
  for each row execute function public.document_items_require_draft('sales', 'sale_id');

create trigger sale_items_recalculate_totals
  after insert or update or delete on public.sale_items
  for each row execute function public.recalculate_document_totals('sales', 'sale_id');

comment on column public.sale_items.lot_id is
  'Lote a descargar. NULL = asignacion automatica FEFO/FIFO al confirmar.';
