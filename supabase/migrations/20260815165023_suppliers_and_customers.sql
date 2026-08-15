-- Faro | Terceros: proveedores y clientes
--
-- Se mantienen como dos tablas y no como una tabla `partners` polimorfica:
-- comparten campos hoy, pero divergen apenas entren condiciones de pago,
-- cupo de credito o lista de precios asignada (que ya aparece en customers).

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
create table public.suppliers (
  id         bigint generated always as identity primary key,
  name       text        not null,
  tax_id     text,
  phone      text,
  email      text,
  address    text,
  notes      text,
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint suppliers_name_not_blank check (length(btrim(name)) > 0),
  constraint suppliers_tax_id_not_blank
    check (tax_id is null or length(btrim(tax_id)) > 0),
  constraint suppliers_email_valid
    check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- El NIT/RUT es opcional (proveedor informal), pero si esta no se repite.
create unique index suppliers_tax_id_key
  on public.suppliers (lower(tax_id))
  where tax_id is not null;

create index suppliers_name_trgm_idx
  on public.suppliers using gin (name extensions.gin_trgm_ops);

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table public.customers (
  id            bigint generated always as identity primary key,
  name          text        not null,
  tax_id        text,
  phone         text,
  email         text,
  address       text,
  notes         text,
  -- Punto de extension para precios por cliente / mayorista. Si es NULL la
  -- venta usa la lista por defecto.
  price_list_id bigint      references public.price_lists (id) on delete set null,
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint customers_name_not_blank check (length(btrim(name)) > 0),
  constraint customers_tax_id_not_blank
    check (tax_id is null or length(btrim(tax_id)) > 0),
  constraint customers_email_valid
    check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create unique index customers_tax_id_key
  on public.customers (lower(tax_id))
  where tax_id is not null;

create index customers_name_trgm_idx
  on public.customers using gin (name extensions.gin_trgm_ops);

create index customers_price_list_id_idx
  on public.customers (price_list_id)
  where price_list_id is not null;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

comment on table public.customers is
  'Clientes. La venta puede no tener cliente (mostrador): sales.customer_id es nullable.';
comment on column public.customers.price_list_id is
  'Lista de precios preferente del cliente. NULL = lista por defecto.';
