-- Faro | Tipos enumerados
--
-- Se usan enums nativos (y no text + check) porque:
--   * `supabase gen types typescript` los exporta como uniones de literales,
--     lo que le da al frontend tipado real sin duplicar constantes.
--   * El almacenamiento es de 4 bytes y la comparacion es por oid.
-- Agregar valores nuevos mas adelante se hace con
-- `alter type ... add value 'x'` en su propia migracion.

-- Tipo de ubicacion. Deliberadamente NO se limita a "warehouse": una ubicacion
-- es cualquier sitio donde puede existir inventario.
create type public.location_type as enum (
  'warehouse',      -- bodega
  'store',          -- tienda
  'pos',            -- punto de venta
  'dispatch',       -- zona de despacho / transito
  'production',     -- area de produccion o taller
  'other'
);

-- Tipo de operacion de inventario.
-- El SIGNO no vive aca sino en cada linea del movimiento
-- (inventory_movement_items.quantity), por eso 'transfer' es un solo tipo
-- (lineas negativas en origen, positivas en destino) y 'return' cubre tanto
-- devolucion de cliente (entrada) como devolucion a proveedor (salida).
create type public.movement_type as enum (
  'initial_stock',
  'purchase',
  'sale',
  'transfer',
  'adjustment',
  'return'
);

-- Documento de negocio que origina un movimiento de inventario.
create type public.document_type as enum (
  'purchase',
  'sale',
  'transfer',
  'manual'          -- ajuste o carga inicial hecha directamente
);

-- Ciclo de vida de compras, ventas y transferencias.
--   draft     -> editable, NO afecta inventario
--   confirmed -> inmutable, ya genero su movimiento de inventario
--   cancelled -> anulado
create type public.document_status as enum (
  'draft',
  'confirmed',
  'cancelled'
);
