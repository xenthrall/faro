-- Faro | Analítica de negocio
--
-- Responde las preguntas que no se contestan mirando existencias:
-- cuánto se vendió, cuánto costó esa mercancía, cuánta ganancia dejó y
-- cuánto se gastó reponiendo.
--
-- LA GANANCIA SE CALCULA CONTRA EL COSTO REAL, no contra un promedio.
--
-- Ese es el pago del modelo de capas de costo: cuando se vendieron 8 llantas,
-- `confirm_sale` dejó registrado en el kardex de qué lote salieron y a qué
-- costo entró ese lote. La ganancia de esa venta es su precio menos ESE costo,
-- no menos el costo promedio del producto ni el de la última compra.
--
-- BASE DE CÁLCULO: todo se mide sobre el subtotal, sin impuestos. El IVA no es
-- ingreso del negocio — se recauda y se transfiere — así que incluirlo inflaría
-- tanto las ventas como el margen.

-- ---------------------------------------------------------------------------
-- v_sales_margin | ingreso y costo real de cada venta, por producto
-- ---------------------------------------------------------------------------
-- El ingreso vive en `sale_items` (una o más líneas por producto) y el costo en
-- `inventory_movement_items` (una línea por cada lote consumido). Una línea de
-- venta puede cruzar varias capas de costo, así que ambos lados se agregan por
-- (venta, producto) antes de cruzarse: es el único grano en el que las dos
-- cifras son comparables.
create view public.v_sales_margin
with (security_invoker = true) as
with revenue as (
  select
    si.sale_id,
    si.product_id,
    sum(si.quantity) as quantity,
    sum(si.subtotal) as revenue,
    sum(si.tax)      as tax,
    sum(si.total)    as total
  from public.sale_items si
  group by si.sale_id, si.product_id
),
cost as (
  select
    mv.reference_id as sale_id,
    mi.product_id,
    -- Las salidas se guardan con cantidad negativa; el costo se invierte para
    -- leerlo como un valor positivo.
    sum(-mi.quantity * coalesce(mi.unit_cost, 0)) as cost
  from public.inventory_movement_items mi
  join public.inventory_movements mv on mv.id = mi.movement_id
  where mv.reference_type = 'sale'
    and mv.applied_at is not null
  group by mv.reference_id, mi.product_id
)
select
  s.id            as sale_id,
  s.date,
  s.location_id,
  s.customer_id,
  r.product_id,
  p.sku,
  p.name          as product_name,
  c.name          as category_name,
  r.quantity,
  r.revenue,
  r.tax,
  r.total,
  coalesce(k.cost, 0)               as cost,
  r.revenue - coalesce(k.cost, 0)   as profit
from public.sales s
join revenue r            on r.sale_id = s.id
join public.products p    on p.id = r.product_id
left join public.categories c on c.id = p.category_id
left join cost k          on k.sale_id = r.sale_id and k.product_id = r.product_id
-- Solo las ventas confirmadas mueven dinero e inventario. Un borrador es una
-- intención, no un resultado.
where s.status = 'confirmed';

comment on view public.v_sales_margin is
  'Ingreso, costo real (según los lotes consumidos) y ganancia de cada venta confirmada, por producto.';

-- ---------------------------------------------------------------------------
-- analytics_summary | los indicadores de cabecera de un período
-- ---------------------------------------------------------------------------
create or replace function public.analytics_summary(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  revenue          numeric,
  cost             numeric,
  profit           numeric,
  margin_pct       numeric,
  units_sold       numeric,
  sales_count      bigint,
  average_ticket   numeric,
  purchases_amount numeric,
  purchases_count  bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with sales as (
    select
      coalesce(sum(m.revenue), 0)  as revenue,
      coalesce(sum(m.cost), 0)     as cost,
      coalesce(sum(m.profit), 0)   as profit,
      coalesce(sum(m.quantity), 0) as units,
      count(distinct m.sale_id)    as sales_count
    from public.v_sales_margin m
    where m.date >= p_from and m.date < p_to
  ),
  purchases as (
    select
      coalesce(sum(p.subtotal), 0) as amount,
      count(*)                     as purchases_count
    from public.purchases p
    where p.status = 'confirmed'
      and p.date >= p_from and p.date < p_to
  )
  select
    s.revenue,
    s.cost,
    s.profit,
    -- Margen sobre ingreso, la lectura habitual del comercio. Sin ventas no hay
    -- margen que reportar: NULL, no cero, que significaría "vendí sin ganar".
    case when s.revenue > 0 then round(s.profit / s.revenue * 100, 2) end,
    s.units,
    s.sales_count,
    case when s.sales_count > 0 then round(s.revenue / s.sales_count, 2) end,
    pu.amount,
    pu.purchases_count
  from sales s cross join purchases pu;
$$;

comment on function public.analytics_summary(timestamptz, timestamptz) is
  'Ventas, costo, ganancia, margen y compras de un período. Importes sin impuestos.';

-- ---------------------------------------------------------------------------
-- analytics_timeseries | evolución dentro del período
-- ---------------------------------------------------------------------------
-- Devuelve la serie COMPLETA, incluidos los intervalos sin actividad. Un gráfico
-- que salta de un día con ventas al siguiente, omitiendo los vacíos, miente
-- sobre el ritmo del negocio.
create or replace function public.analytics_timeseries(
  p_from     timestamptz,
  p_to       timestamptz,
  p_bucket   text default 'day',
  -- Zona horaria en la que se cortan los intervalos. Sin esto, date_trunc
  -- agruparía por día UTC: una venta de las 10 de la mañana en Bogotá caería en
  -- el día anterior, y "las ventas de hoy" dejarían de ser las de hoy.
  p_timezone text default 'UTC'
)
returns table (
  bucket      timestamptz,
  revenue     numeric,
  cost        numeric,
  profit      numeric,
  purchases   numeric,
  sales_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_step interval;
begin
  v_step := case p_bucket
              when 'hour'  then interval '1 hour'
              when 'day'   then interval '1 day'
              when 'week'  then interval '1 week'
              when 'month' then interval '1 month'
              else null
            end;

  -- Lista blanca antes de que `p_bucket` llegue a date_trunc: es el único
  -- parámetro que viaja como texto libre y termina interpretándose.
  if v_step is null then
    raise exception 'Intervalo no soportado: % (usá hour, day, week o month)', p_bucket
      using errcode = 'invalid_parameter_value';
  end if;

  return query
  -- El patrón es siempre el mismo: se pasa a hora local, se corta el intervalo
  -- ahí, y se vuelve a timestamptz. Así los límites coinciden con los días
  -- naturales de quien mira el panel.
  with buckets as (
    select (generate_series(
             date_trunc(p_bucket, p_from at time zone p_timezone),
             date_trunc(p_bucket, (p_to - interval '1 microsecond') at time zone p_timezone),
             v_step
           )) at time zone p_timezone as bucket
  ),
  sales as (
    select date_trunc(p_bucket, m.date at time zone p_timezone) at time zone p_timezone as bucket,
           sum(m.revenue) as revenue,
           sum(m.cost)    as cost,
           sum(m.profit)  as profit,
           count(distinct m.sale_id) as sales_count
    from public.v_sales_margin m
    where m.date >= p_from and m.date < p_to
    group by 1
  ),
  purchases as (
    select date_trunc(p_bucket, p.date at time zone p_timezone) at time zone p_timezone as bucket,
           sum(p.subtotal) as amount
    from public.purchases p
    where p.status = 'confirmed'
      and p.date >= p_from and p.date < p_to
    group by 1
  )
  select
    b.bucket,
    coalesce(s.revenue, 0),
    coalesce(s.cost, 0),
    coalesce(s.profit, 0),
    coalesce(pu.amount, 0),
    coalesce(s.sales_count, 0)
  from buckets b
  left join sales s      on s.bucket = b.bucket
  left join purchases pu on pu.bucket = b.bucket
  order by b.bucket;
end;
$$;

comment on function public.analytics_timeseries(timestamptz, timestamptz, text, text) is
  'Serie temporal de ventas, costo, ganancia y compras por hora, día, semana o mes. Incluye los intervalos sin actividad.';

-- ---------------------------------------------------------------------------
-- analytics_product_breakdown | qué se vendió y cuánto dejó cada producto
-- ---------------------------------------------------------------------------
create or replace function public.analytics_product_breakdown(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  product_id    bigint,
  sku           text,
  product_name  text,
  category_name text,
  unit_code     text,
  units_sold    numeric,
  revenue       numeric,
  cost          numeric,
  profit        numeric,
  margin_pct    numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    m.product_id,
    m.sku,
    m.product_name,
    coalesce(m.category_name, 'Sin categoría'),
    u.code,
    sum(m.quantity),
    sum(m.revenue),
    sum(m.cost),
    sum(m.profit),
    case when sum(m.revenue) > 0
         then round(sum(m.profit) / sum(m.revenue) * 100, 2) end
  from public.v_sales_margin m
  join public.products p on p.id = m.product_id
  join public.units u    on u.id = p.unit_id
  where m.date >= p_from and m.date < p_to
  group by m.product_id, m.sku, m.product_name, m.category_name, u.code
  order by sum(m.revenue) desc;
$$;

comment on function public.analytics_product_breakdown(timestamptz, timestamptz) is
  'Unidades, ingreso, costo, ganancia y margen por producto en un período.';

-- ---------------------------------------------------------------------------
-- analytics_location_breakdown | rendimiento de cada local
-- ---------------------------------------------------------------------------
create or replace function public.analytics_location_breakdown(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  location_id   bigint,
  location_name text,
  revenue       numeric,
  cost          numeric,
  profit        numeric,
  margin_pct    numeric,
  sales_count   bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.id,
    l.name,
    coalesce(sum(m.revenue), 0),
    coalesce(sum(m.cost), 0),
    coalesce(sum(m.profit), 0),
    case when sum(m.revenue) > 0
         then round(sum(m.profit) / sum(m.revenue) * 100, 2) end,
    count(distinct m.sale_id)
  from public.locations l
  left join public.v_sales_margin m
         on m.location_id = l.id
        and m.date >= p_from and m.date < p_to
  group by l.id, l.name
  having coalesce(sum(m.revenue), 0) > 0
  order by coalesce(sum(m.revenue), 0) desc;
$$;

comment on function public.analytics_location_breakdown(timestamptz, timestamptz) is
  'Ingreso, ganancia y margen por ubicación de venta en un período.';

-- ---------------------------------------------------------------------------
-- Exposición al Data API
-- ---------------------------------------------------------------------------
-- Mismo criterio que el resto del esquema: la vista hereda las políticas RLS de
-- sus tablas base por ser security_invoker, y las funciones son SECURITY
-- INVOKER. El GRANT explícito y el REVOKE a anon son la barrera de acceso.
grant select on public.v_sales_margin to authenticated;
revoke all on public.v_sales_margin from anon;

do $$
declare
  v_signature text;
  v_functions constant text[] := array[
    'public.analytics_summary(timestamptz, timestamptz)',
    'public.analytics_timeseries(timestamptz, timestamptz, text, text)',
    'public.analytics_product_breakdown(timestamptz, timestamptz)',
    'public.analytics_location_breakdown(timestamptz, timestamptz)'
  ];
begin
  foreach v_signature in array v_functions loop
    execute format('revoke all on function %s from public, anon', v_signature);
    execute format('grant execute on function %s to authenticated', v_signature);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Índices de apoyo
-- ---------------------------------------------------------------------------
-- Toda consulta de analítica filtra ventas confirmadas por rango de fechas.
-- El índice parcial deja fuera borradores y anuladas, que nunca se consultan acá.
create index sales_confirmed_date_idx
  on public.sales (date)
  where status = 'confirmed';

create index purchases_confirmed_date_idx
  on public.purchases (date)
  where status = 'confirmed';
