-- Faro | Vistas de consulta
--
-- Todas se crean con security_invoker = true. Sin esa opcion una vista se
-- ejecuta con los permisos de su dueno y se convertiria en un bypass de RLS:
-- cualquiera podria leer por la vista lo que la politica le niega en la tabla.

-- ---------------------------------------------------------------------------
-- v_stock_by_lot | el grano mas fino: producto + ubicacion + lote
-- ---------------------------------------------------------------------------
create view public.v_stock_by_lot
with (security_invoker = true) as
select
  i.id                as inventory_id,
  p.id                as product_id,
  p.sku,
  p.name              as product_name,
  u.code              as unit_code,
  l.id                as location_id,
  l.code              as location_code,
  l.name              as location_name,
  lot.id              as lot_id,
  lot.lot_number,
  lot.unit_cost,
  lot.received_at,
  lot.expiration_date,
  i.quantity,
  round(i.quantity * coalesce(lot.unit_cost, 0), 2) as stock_value
from public.inventory i
join public.products  p   on p.id = i.product_id
join public.units     u   on u.id = p.unit_id
join public.locations l   on l.id = i.location_id
left join public.inventory_lots lot on lot.id = i.lot_id;

comment on view public.v_stock_by_lot is
  'Existencias al maximo detalle: producto, ubicacion, lote, costo y valor.';

-- ---------------------------------------------------------------------------
-- v_stock_by_location | cuanto hay de cada producto en cada ubicacion
-- ---------------------------------------------------------------------------
create view public.v_stock_by_location
with (security_invoker = true) as
select
  i.product_id,
  p.sku,
  p.name  as product_name,
  i.location_id,
  l.code  as location_code,
  l.name  as location_name,
  sum(i.quantity)                                        as quantity,
  round(sum(i.quantity * coalesce(lot.unit_cost, 0)), 2) as stock_value
from public.inventory i
join public.products  p on p.id = i.product_id
join public.locations l on l.id = i.location_id
left join public.inventory_lots lot on lot.id = i.lot_id
group by i.product_id, p.sku, p.name, i.location_id, l.code, l.name;

-- ---------------------------------------------------------------------------
-- v_product_stock | total del producto en toda la instancia
-- ---------------------------------------------------------------------------
-- El costo promedio se calcula ponderado por cantidad, no como promedio simple
-- de los lotes: 100 u a $8.000 y 50 u a $9.500 dan $8.500, no $8.750.
create view public.v_product_stock
with (security_invoker = true) as
select
  p.id            as product_id,
  p.sku,
  p.name          as product_name,
  p.min_stock,
  u.code          as unit_code,
  c.name          as category_name,
  coalesce(sum(i.quantity), 0)                                        as total_quantity,
  round(coalesce(sum(i.quantity * coalesce(lot.unit_cost, 0)), 0), 2) as total_value,
  case
    when coalesce(sum(i.quantity), 0) > 0
      then round(sum(i.quantity * coalesce(lot.unit_cost, 0)) / sum(i.quantity), 4)
  end                                                                 as weighted_average_cost,
  p.min_stock is not null
    and coalesce(sum(i.quantity), 0) <= p.min_stock                   as below_min_stock
from public.products p
join public.units u on u.id = p.unit_id
left join public.categories c on c.id = p.category_id
left join public.inventory i  on i.product_id = p.id
left join public.inventory_lots lot on lot.id = i.lot_id
group by p.id, p.sku, p.name, p.min_stock, u.code, c.name;

comment on view public.v_product_stock is
  'Stock total, valorizacion y costo promedio ponderado por producto.';

-- ---------------------------------------------------------------------------
-- v_expiring_stock | vencimientos
-- ---------------------------------------------------------------------------
-- El vencimiento NO descuenta stock: la mercancia vencida sigue existiendo
-- fisicamente. Esta vista solo la senala; retirarla es un `adjustment`.
create view public.v_expiring_stock
with (security_invoker = true) as
select
  p.id   as product_id,
  p.sku,
  p.name as product_name,
  l.id   as location_id,
  l.name as location_name,
  lot.id as lot_id,
  lot.lot_number,
  lot.expiration_date,
  (lot.expiration_date - current_date) as days_to_expiration,
  i.quantity,
  lot.unit_cost,
  round(i.quantity * lot.unit_cost, 2) as stock_value,
  case
    when lot.expiration_date <  current_date            then 'expired'
    when lot.expiration_date <= current_date + 7        then 'critical'
    when lot.expiration_date <= current_date + 15       then 'warning'
    when lot.expiration_date <= current_date + 30       then 'upcoming'
    else 'ok'
  end as expiration_status
from public.inventory i
join public.inventory_lots lot on lot.id = i.lot_id
join public.products  p on p.id = i.product_id
join public.locations l on l.id = i.location_id
where lot.expiration_date is not null
  and i.quantity > 0;

comment on view public.v_expiring_stock is
  'Existencias con vencimiento y su estado (expired/critical/warning/upcoming/ok).';

-- ---------------------------------------------------------------------------
-- v_current_prices | precio de venta vigente por lista
-- ---------------------------------------------------------------------------
create view public.v_current_prices
with (security_invoker = true) as
select
  pp.product_id,
  p.sku,
  p.name         as product_name,
  pp.price_list_id,
  pl.code        as price_list_code,
  pl.is_default  as is_default_list,
  pp.price,
  p.tax_rate,
  -- Derivado, no almacenado: nunca puede quedar desincronizado.
  round(pp.price * (1 + p.tax_rate / 100), 2) as price_with_tax,
  pp.valid_from
from public.product_prices pp
join public.products    p  on p.id  = pp.product_id
join public.price_lists pl on pl.id = pp.price_list_id
where pp.valid_to is null;

-- ---------------------------------------------------------------------------
-- v_inventory_ledger | kardex legible
-- ---------------------------------------------------------------------------
create view public.v_inventory_ledger
with (security_invoker = true) as
select
  mi.id           as item_id,
  m.id            as movement_id,
  m.type          as movement_type,
  m.reference_type,
  m.reference_id,
  m.date,
  m.applied_at,
  m.notes,
  p.id            as product_id,
  p.sku,
  p.name          as product_name,
  l.id            as location_id,
  l.name          as location_name,
  lot.id          as lot_id,
  lot.lot_number,
  mi.quantity,                          -- con signo
  mi.unit_cost,
  round(mi.quantity * coalesce(mi.unit_cost, 0), 2) as value_change
from public.inventory_movement_items mi
join public.inventory_movements m on m.id = mi.movement_id
join public.products  p on p.id = mi.product_id
join public.locations l on l.id = mi.location_id
left join public.inventory_lots lot on lot.id = mi.lot_id;

comment on view public.v_inventory_ledger is
  'Kardex: cada linea de movimiento con su signo y su impacto en valor.';
