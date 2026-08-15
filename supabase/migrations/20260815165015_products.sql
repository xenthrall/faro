-- Faro | Productos
--
-- `products` responde "que es el producto" (identidad y configuracion).
-- NO responde "cuanto hay" ni "donde esta" -> eso es `inventory`.
-- NO responde "a que costo entro"          -> eso es `inventory_lots`.
-- NO guarda precio de venta                -> eso es `product_prices`.

create table public.products (
  id                bigint generated always as identity primary key,
  category_id       bigint        references public.categories (id) on delete restrict,
  unit_id           bigint not null references public.units (id)      on delete restrict,

  sku               text        not null,
  barcode           text,
  name              text        not null,
  description       text,

  -- Porcentaje: 19 significa 19%. Ver convenciones en la migracion 0001.
  -- Es el valor por defecto que se copia a purchase_items / sale_items;
  -- las lineas guardan su propia tasa para no reescribir historia si cambia.
  tax_rate          numeric(6,3) not null default 0,

  -- Banderas de comportamiento. Permiten que la ferreteria y el distribuidor
  -- de alimentos convivan en el mismo modelo sin tablas separadas.
  --   track_lot        -> exige numero de lote del fabricante en cada entrada
  --   track_expiration -> exige fecha de vencimiento en cada entrada
  -- OJO: track_lot = false NO significa "sin lotes". Toda entrada crea una
  -- capa de costo en inventory_lots; estas banderas solo controlan si el
  -- usuario debe capturar lot_number / expiration_date.
  track_lot         boolean      not null default false,
  track_expiration  boolean      not null default false,

  -- Punto de reorden opcional, evaluado contra el stock total del producto.
  min_stock         numeric(18,4),

  active            boolean      not null default true,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now(),

  constraint products_sku_not_blank    check (length(btrim(sku)) > 0),
  constraint products_name_not_blank   check (length(btrim(name)) > 0),
  constraint products_tax_rate_valid   check (tax_rate >= 0 and tax_rate <= 100),
  constraint products_min_stock_valid  check (min_stock is null or min_stock >= 0),
  -- Controlar vencimiento sin controlar lote es incoherente: la fecha de
  -- vencimiento es un atributo del lote.
  constraint products_expiration_requires_lot
    check (not track_expiration or track_lot),
  -- Un barcode vacio debe guardarse como NULL, no como ''.
  constraint products_barcode_not_blank
    check (barcode is null or length(btrim(barcode)) > 0)
);

-- SKU: obligatorio y unico en toda la instancia (un negocio = una instancia).
create unique index products_sku_key on public.products (upper(sku));

-- Barcode: opcional -- no todos los negocios lo usan -- pero si existe no se
-- puede repetir. Indice parcial: los NULL ni siquiera entran al indice.
create unique index products_barcode_key
  on public.products (barcode)
  where barcode is not null;

create index products_category_id_idx on public.products (category_id);
create index products_unit_id_idx     on public.products (unit_id);

-- Busqueda por nombre con ILIKE '%texto%' desde el buscador de productos.
create index products_name_trgm_idx
  on public.products using gin (name extensions.gin_trgm_ops);

-- Listados del catalogo: casi siempre filtran por activos.
create index products_active_name_idx
  on public.products (name)
  where active;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

comment on table public.products is
  'Identidad y configuracion del producto. Las existencias viven en inventory.';
comment on column public.products.tax_rate is
  'Tasa de impuesto en PORCENTAJE (19 = 19%), no fraccion.';
comment on column public.products.track_lot is
  'true = cada entrada debe traer numero de lote del fabricante.';
comment on column public.products.track_expiration is
  'true = cada entrada debe traer fecha de vencimiento. Requiere track_lot.';
