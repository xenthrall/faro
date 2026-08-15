-- Faro | Ubicaciones de inventario

-- Una "location" es cualquier sitio donde puede existir inventario: bodega,
-- tienda, punto de venta, zona de despacho. El producto NO pertenece a una
-- ubicacion; la relacion product <-> location vive en `inventory`.
create table public.locations (
  id          bigint generated always as identity primary key,
  code        text                 not null,
  name        text                 not null,
  type        public.location_type not null default 'warehouse',
  description text,
  -- Marca la ubicacion por defecto para operaciones nuevas (compras, POS).
  is_default  boolean              not null default false,
  active      boolean              not null default true,
  created_at  timestamptz          not null default now(),
  updated_at  timestamptz          not null default now(),

  constraint locations_code_not_blank check (length(btrim(code)) > 0),
  constraint locations_name_not_blank check (length(btrim(name)) > 0)
);

create unique index locations_code_key on public.locations (lower(code));

-- Como maximo una ubicacion por defecto en toda la instancia.
create unique index locations_single_default_key
  on public.locations ((true))
  where is_default;

create index locations_type_idx on public.locations (type) where active;

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

comment on table public.locations is
  'Cualquier lugar donde puede existir inventario (bodega, tienda, POS, despacho).';
