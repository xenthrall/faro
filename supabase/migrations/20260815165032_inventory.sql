-- Faro | Existencias actuales
--
-- `inventory` responde "cuanto hay y donde". Es el saldo vivo; la historia que
-- lo explica esta en `inventory_movement_items`.
--
--   products               inventory                       locations
--   ---------      ---------------------------------      -----------
--   Tornillo 1/4   Tornillo 1/4 | Bodega principal | 500   Bodega principal
--                  Tornillo 1/4 | Tienda           |  50   Tienda
--
-- Un producto existe en varias ubicaciones a la vez, por eso NO hay
-- `location_id` en `products`.

create table public.inventory (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products (id)  on delete restrict,
  location_id bigint not null references public.locations (id) on delete restrict,

  -- NULL = existencia sin capa de costo asociada (por ejemplo una carga
  -- inicial de la que no se conoce el costo). Toda entrada generada por Faro
  -- crea su lote, asi que en operacion normal esto viene informado.
  lot_id      bigint,

  quantity    numeric(18,4) not null default 0,

  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),

  constraint inventory_quantity_non_negative check (quantity >= 0),

  -- FK compuesta: el lote debe pertenecer al mismo producto de la fila.
  constraint inventory_lot_matches_product
    foreign key (lot_id, product_id)
    references public.inventory_lots (id, product_id)
    on delete restrict
);

-- ---------------------------------------------------------------------------
-- Unicidad de la existencia
-- ---------------------------------------------------------------------------
-- Un UNIQUE tradicional sobre (product_id, location_id, lot_id) NO sirve:
-- en Postgres los NULL son distintos entre si, asi que
--   (1, 1, NULL) y (1, 1, NULL)
-- convivirian sin conflicto y el stock del producto quedaria partido en dos
-- filas.
--
-- `NULLS NOT DISTINCT` (Postgres 15+) hace que dos NULL se consideren iguales,
-- resolviendo el caso con un solo indice. Ventaja adicional frente a la
-- alternativa clasica (dos indices parciales): `ON CONFLICT
-- (product_id, location_id, lot_id)` funciona igual con lote y sin lote, lo
-- que mantiene simple el upsert de apply_inventory_movement().
create unique index inventory_product_location_lot_key
  on public.inventory (product_id, location_id, lot_id)
  nulls not distinct;

-- Consultas "que hay en esta ubicacion" (conteo fisico, POS).
create index inventory_location_product_idx
  on public.inventory (location_id, product_id);

-- Consultas de disponibilidad y asignacion FIFO/FEFO: solo interesan las
-- filas con saldo. El indice parcial deja fuera las filas en cero, que en un
-- inventario maduro son la mayoria.
create index inventory_available_idx
  on public.inventory (product_id, location_id)
  where quantity > 0;

create index inventory_lot_id_idx
  on public.inventory (lot_id)
  where lot_id is not null;

create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

comment on table public.inventory is
  'Saldo actual por (producto, ubicacion, lote). Unico por esas tres columnas, tratando NULL como valor.';
comment on column public.inventory.lot_id is
  'Capa de costo. NULL solo para existencias sin costo conocido.';
