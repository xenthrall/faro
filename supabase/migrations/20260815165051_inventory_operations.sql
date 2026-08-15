-- Faro | Operaciones de inventario
--
-- Estas funciones son el UNICO camino previsto para modificar `inventory`.
-- Concentrar aca la escritura es lo que hace cierto el invariante del modelo:
-- toda existencia queda explicada por un movimiento.
--
-- Todas son SECURITY INVOKER a proposito: se ejecutan con los permisos de
-- quien llama, por lo que las politicas RLS siguen aplicando. Un
-- SECURITY DEFINER aca seria un bypass silencioso de RLS.

-- ---------------------------------------------------------------------------
-- allocate_stock(): de que lotes descontar una salida
-- ---------------------------------------------------------------------------
-- Politica FEFO (First Expired, First Out) con desempate FIFO:
--   1. lotes que vencen antes
--   2. entre lotes sin vencimiento, el recibido primero
-- Es la base sobre la que despues se pueden implementar FIFO puro, promedio
-- ponderado o costo especifico sin tocar el esquema.
--
-- Toma FOR UPDATE sobre las filas de inventario elegidas: dos ventas
-- simultaneas del mismo producto se serializan en vez de sobrevender.
create or replace function public.allocate_stock(
  p_product_id  bigint,
  p_location_id bigint,
  p_quantity    numeric
)
returns table (lot_id bigint, quantity numeric)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_remaining numeric := p_quantity;
  v_row       record;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'allocate_stock requiere una cantidad positiva (recibio %)', p_quantity
      using errcode = 'check_violation';
  end if;

  for v_row in
    select i.lot_id as l_id, i.quantity as available
      from public.inventory i
      left join public.inventory_lots lot on lot.id = i.lot_id
     where i.product_id = p_product_id
       and i.location_id = p_location_id
       and i.quantity > 0
     order by lot.expiration_date asc nulls last,   -- FEFO
              lot.received_at asc nulls first,      -- FIFO
              i.lot_id asc nulls first
       for update of i
  loop
    exit when v_remaining <= 0;

    lot_id   := v_row.l_id;
    quantity := least(v_remaining, v_row.available);
    v_remaining := v_remaining - quantity;
    return next;
  end loop;

  if v_remaining > 0 then
    raise exception
      'Stock insuficiente: faltan % unidades del producto % en la ubicacion %',
      v_remaining, p_product_id, p_location_id
      using errcode = 'check_violation';
  end if;
end;
$$;

comment on function public.allocate_stock(bigint, bigint, numeric) is
  'Reparte una salida entre los lotes disponibles usando FEFO con desempate FIFO.';

-- ---------------------------------------------------------------------------
-- apply_inventory_movement(): pasa el movimiento al saldo
-- ---------------------------------------------------------------------------
-- Es idempotente: un movimiento ya aplicado (applied_at no nulo) falla en vez
-- de duplicar existencias.
create or replace function public.apply_inventory_movement(p_movement_id bigint)
returns public.inventory_movements
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_movement public.inventory_movements;
begin
  select * into v_movement
    from public.inventory_movements
   where id = p_movement_id
     for update;

  if not found then
    raise exception 'No existe el movimiento %', p_movement_id
      using errcode = 'no_data_found';
  end if;

  if v_movement.applied_at is not null then
    raise exception 'El movimiento % ya fue aplicado (%)', p_movement_id, v_movement.applied_at
      using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.inventory_movement_items where movement_id = p_movement_id) then
    raise exception 'El movimiento % no tiene lineas', p_movement_id
      using errcode = 'check_violation';
  end if;

  -- Se aplica en DOS pasos, no con un unico INSERT ... ON CONFLICT DO UPDATE.
  -- Motivo: Postgres evalua los CHECK de la fila PROPUESTA antes de detectar
  -- el conflicto, asi que una linea de salida (-50) chocaria contra
  -- inventory_quantity_non_negative aunque el resultado real de la suma fuera
  -- positivo. El upsert solo funciona para deltas positivos.
  --
  -- Paso 1: garantizar que existe la fila de saldo, en cero. Se agrupa porque
  -- ON CONFLICT no puede tocar la misma fila dos veces en un mismo comando, y
  -- el ORDER BY estable reduce interbloqueos entre operaciones concurrentes.
  insert into public.inventory (product_id, location_id, lot_id, quantity)
  select mi.product_id, mi.location_id, mi.lot_id, 0
    from public.inventory_movement_items mi
   where mi.movement_id = p_movement_id
   group by mi.product_id, mi.location_id, mi.lot_id
   order by mi.product_id, mi.location_id, mi.lot_id
  on conflict (product_id, location_id, lot_id) do nothing;

  -- Paso 2: sumar el delta con signo. Aca el CHECK se evalua sobre el saldo
  -- final, que es lo correcto: si quedara negativo salta
  -- inventory_quantity_non_negative y toda la operacion se revierte. Ese CHECK
  -- es la red de seguridad final contra la sobreventa.
  with delta as (
    select mi.product_id, mi.location_id, mi.lot_id, sum(mi.quantity) as quantity
      from public.inventory_movement_items mi
     where mi.movement_id = p_movement_id
     group by mi.product_id, mi.location_id, mi.lot_id
  )
  update public.inventory inv
     set quantity = inv.quantity + d.quantity
    from delta d
   where inv.product_id  = d.product_id
     and inv.location_id = d.location_id
     and inv.lot_id is not distinct from d.lot_id;

  update public.inventory_movements
     set applied_at = now()
   where id = p_movement_id
  returning * into v_movement;

  return v_movement;
end;
$$;

comment on function public.apply_inventory_movement(bigint) is
  'Suma las lineas con signo del movimiento a inventory y lo marca como aplicado.';

-- ---------------------------------------------------------------------------
-- confirm_purchase(): compra -> lotes + entrada de inventario
-- ---------------------------------------------------------------------------
create or replace function public.confirm_purchase(p_purchase_id bigint)
returns public.inventory_movements
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_purchase public.purchases;
  v_item     public.purchase_items;
  v_lot_id   bigint;
  v_movement public.inventory_movements;
begin
  select * into v_purchase from public.purchases where id = p_purchase_id for update;

  if not found then
    raise exception 'No existe la compra %', p_purchase_id using errcode = 'no_data_found';
  end if;
  if v_purchase.status <> 'draft' then
    raise exception 'La compra % ya no es un borrador (estado %)', p_purchase_id, v_purchase.status
      using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.purchase_items where purchase_id = p_purchase_id) then
    raise exception 'La compra % no tiene lineas', p_purchase_id using errcode = 'check_violation';
  end if;

  insert into public.inventory_movements (type, reference_type, reference_id, date, notes, created_by)
  values ('purchase', 'purchase', p_purchase_id, v_purchase.date, v_purchase.notes, (select auth.uid()))
  returning * into v_movement;

  for v_item in
    select * from public.purchase_items where purchase_id = p_purchase_id order by id
  loop
    v_lot_id := v_item.lot_id;

    -- Cada linea de compra crea SU PROPIA capa de costo. Nunca se reutiliza ni
    -- se sobrescribe un lote anterior: por eso conviven $8.000 de enero y
    -- $9.500 de junio para el mismo producto.
    if v_lot_id is null then
      insert into public.inventory_lots (product_id, unit_cost, received_at)
      values (v_item.product_id, v_item.unit_cost, v_purchase.date)
      returning id into v_lot_id;
      -- Si el producto tiene track_lot / track_expiration, el trigger
      -- inventory_lots_validate_tracking aborta aca y obliga a que la linea
      -- traiga un lot_id creado con numero de lote y vencimiento.

      update public.purchase_items set lot_id = v_lot_id where id = v_item.id;
    end if;

    insert into public.inventory_movement_items
      (movement_id, product_id, location_id, lot_id, quantity, unit_cost)
    values
      (v_movement.id, v_item.product_id, v_purchase.location_id, v_lot_id,
       v_item.quantity, v_item.unit_cost);
  end loop;

  v_movement := public.apply_inventory_movement(v_movement.id);

  update public.purchases
     set status = 'confirmed', confirmed_at = now()
   where id = p_purchase_id;

  return v_movement;
end;
$$;

comment on function public.confirm_purchase(bigint) is
  'Crea las capas de costo de la compra, genera el movimiento de entrada y lo aplica.';

-- ---------------------------------------------------------------------------
-- confirm_sale(): venta -> salida de inventario
-- ---------------------------------------------------------------------------
create or replace function public.confirm_sale(p_sale_id bigint)
returns public.inventory_movements
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sale     public.sales;
  v_line     record;
  v_alloc    record;
  v_movement public.inventory_movements;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;

  if not found then
    raise exception 'No existe la venta %', p_sale_id using errcode = 'no_data_found';
  end if;
  if v_sale.status <> 'draft' then
    raise exception 'La venta % ya no es un borrador (estado %)', p_sale_id, v_sale.status
      using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.sale_items where sale_id = p_sale_id) then
    raise exception 'La venta % no tiene lineas', p_sale_id using errcode = 'check_violation';
  end if;

  insert into public.inventory_movements (type, reference_type, reference_id, date, notes, created_by)
  values ('sale', 'sale', p_sale_id, v_sale.date, v_sale.notes, (select auth.uid()))
  returning * into v_movement;

  -- Se agrupan las lineas por (producto, lote) para que dos renglones del
  -- mismo producto no pidan por separado el mismo stock disponible.
  for v_line in
    select product_id, lot_id, sum(quantity) as quantity
      from public.sale_items
     where sale_id = p_sale_id
     group by product_id, lot_id
     order by product_id, lot_id
  loop
    if v_line.lot_id is not null then
      -- Lote elegido explicitamente (costo especifico / trazabilidad).
      insert into public.inventory_movement_items
        (movement_id, product_id, location_id, lot_id, quantity, unit_cost)
      select v_movement.id, v_line.product_id, v_sale.location_id, v_line.lot_id,
             -v_line.quantity, lot.unit_cost
        from public.inventory_lots lot
       where lot.id = v_line.lot_id;
    else
      -- Sin lote indicado: FEFO/FIFO. Una linea de venta puede convertirse en
      -- varias lineas de kardex si el pedido cruza varias capas de costo.
      for v_alloc in
        select * from public.allocate_stock(v_line.product_id, v_sale.location_id, v_line.quantity)
      loop
        insert into public.inventory_movement_items
          (movement_id, product_id, location_id, lot_id, quantity, unit_cost)
        select v_movement.id, v_line.product_id, v_sale.location_id, v_alloc.lot_id,
               -v_alloc.quantity, lot.unit_cost
          from (select 1) dummy
          left join public.inventory_lots lot on lot.id = v_alloc.lot_id;
      end loop;
    end if;
  end loop;

  v_movement := public.apply_inventory_movement(v_movement.id);

  update public.sales
     set status = 'confirmed', confirmed_at = now()
   where id = p_sale_id;

  return v_movement;
end;
$$;

comment on function public.confirm_sale(bigint) is
  'Genera la salida de inventario de la venta, resolviendo lotes por FEFO/FIFO si no se indicaron.';

-- ---------------------------------------------------------------------------
-- confirm_transfer(): salida en origen + entrada en destino
-- ---------------------------------------------------------------------------
create or replace function public.confirm_transfer(p_transfer_id bigint)
returns public.inventory_movements
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_transfer public.inventory_transfers;
  v_line     record;
  v_alloc    record;
  v_cost     numeric(14,4);
  v_movement public.inventory_movements;
begin
  select * into v_transfer from public.inventory_transfers where id = p_transfer_id for update;

  if not found then
    raise exception 'No existe la transferencia %', p_transfer_id using errcode = 'no_data_found';
  end if;
  if v_transfer.status <> 'draft' then
    raise exception 'La transferencia % ya no es un borrador (estado %)',
      p_transfer_id, v_transfer.status using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.inventory_transfer_items where transfer_id = p_transfer_id) then
    raise exception 'La transferencia % no tiene lineas', p_transfer_id using errcode = 'check_violation';
  end if;

  insert into public.inventory_movements (type, reference_type, reference_id, date, notes, created_by)
  values ('transfer', 'transfer', p_transfer_id, v_transfer.date, v_transfer.notes, (select auth.uid()))
  returning * into v_movement;

  for v_line in
    select product_id, lot_id, sum(quantity) as quantity
      from public.inventory_transfer_items
     where transfer_id = p_transfer_id
     group by product_id, lot_id
     order by product_id, lot_id
  loop
    for v_alloc in
      select v_line.lot_id as lot_id, v_line.quantity as quantity
       where v_line.lot_id is not null
      union all
      select a.lot_id, a.quantity
        from public.allocate_stock(v_line.product_id, v_transfer.source_location_id, v_line.quantity) a
       where v_line.lot_id is null
    loop
      select lot.unit_cost into v_cost
        from public.inventory_lots lot where lot.id = v_alloc.lot_id;

      -- Salida del origen y entrada al destino APUNTAN AL MISMO LOTE: mover
      -- mercancia no crea una capa de costo nueva ni revaloriza nada.
      insert into public.inventory_movement_items
        (movement_id, product_id, location_id, lot_id, quantity, unit_cost)
      values
        (v_movement.id, v_line.product_id, v_transfer.source_location_id,
         v_alloc.lot_id, -v_alloc.quantity, v_cost),
        (v_movement.id, v_line.product_id, v_transfer.destination_location_id,
         v_alloc.lot_id,  v_alloc.quantity, v_cost);
    end loop;
  end loop;

  -- El costo informativo de la linea se completa con el del lote movido.
  update public.inventory_transfer_items ti
     set unit_cost = lot.unit_cost
    from public.inventory_lots lot
   where ti.transfer_id = p_transfer_id
     and ti.lot_id = lot.id
     and ti.unit_cost is null;

  v_movement := public.apply_inventory_movement(v_movement.id);

  update public.inventory_transfers
     set status = 'confirmed', confirmed_at = now()
   where id = p_transfer_id;

  return v_movement;
end;
$$;

comment on function public.confirm_transfer(bigint) is
  'Mueve existencias entre ubicaciones conservando lote y costo.';

-- ---------------------------------------------------------------------------
-- adjust_inventory(): ajustes y carga inicial
-- ---------------------------------------------------------------------------
-- Un ajuste puede aumentar o disminuir existencias. Sirve tambien para dar de
-- baja mercancia vencida: el vencimiento NO descuenta stock por si solo, se
-- retira con un ajuste explicito.
--
--   Entrada (p_quantity > 0)
--     con p_unit_cost  -> crea una capa de costo nueva
--     sin p_unit_cost  -> existencia sin costo conocido (lot_id NULL)
--   Salida (p_quantity < 0)
--     con p_lot_id     -> descuenta de ese lote
--     sin p_lot_id     -> reparte por FEFO/FIFO
create or replace function public.adjust_inventory(
  p_product_id  bigint,
  p_location_id bigint,
  p_quantity    numeric,
  p_lot_id      bigint  default null,
  p_unit_cost   numeric default null,
  p_notes       text    default null,
  p_type        public.movement_type default 'adjustment'
)
returns public.inventory_movements
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_movement public.inventory_movements;
  v_lot_id   bigint := p_lot_id;
  v_alloc    record;
begin
  if p_quantity is null or p_quantity = 0 then
    raise exception 'adjust_inventory requiere una cantidad distinta de cero'
      using errcode = 'check_violation';
  end if;
  if p_type not in ('adjustment', 'initial_stock', 'return') then
    raise exception 'adjust_inventory solo admite adjustment, initial_stock o return (recibio %)', p_type
      using errcode = 'check_violation';
  end if;

  insert into public.inventory_movements (type, reference_type, reference_id, notes, created_by)
  values (p_type, 'manual', null, p_notes, (select auth.uid()))
  returning * into v_movement;

  if p_quantity > 0 then
    if v_lot_id is null and p_unit_cost is not null then
      insert into public.inventory_lots (product_id, unit_cost)
      values (p_product_id, p_unit_cost)
      returning id into v_lot_id;
    end if;

    insert into public.inventory_movement_items
      (movement_id, product_id, location_id, lot_id, quantity, unit_cost)
    values (v_movement.id, p_product_id, p_location_id, v_lot_id, p_quantity, p_unit_cost);
  else
    for v_alloc in
      select v_lot_id as lot_id, -p_quantity as quantity where v_lot_id is not null
      union all
      select a.lot_id, a.quantity
        from public.allocate_stock(p_product_id, p_location_id, -p_quantity) a
       where v_lot_id is null
    loop
      insert into public.inventory_movement_items
        (movement_id, product_id, location_id, lot_id, quantity, unit_cost)
      select v_movement.id, p_product_id, p_location_id, v_alloc.lot_id,
             -v_alloc.quantity, coalesce(p_unit_cost, lot.unit_cost)
        from (select 1) dummy
        left join public.inventory_lots lot on lot.id = v_alloc.lot_id;
    end loop;
  end if;

  return public.apply_inventory_movement(v_movement.id);
end;
$$;

comment on function public.adjust_inventory(bigint, bigint, numeric, bigint, numeric, text, public.movement_type) is
  'Ajuste manual de existencias (aumenta o disminuye) y carga inicial de stock.';

-- ---------------------------------------------------------------------------
-- verify_inventory_integrity(): el saldo debe explicarse por el kardex
-- ---------------------------------------------------------------------------
-- Devuelve filas SOLO si el modelo se rompio. Es la prueba ejecutable del
-- invariante y sirve como chequeo periodico.
create or replace function public.verify_inventory_integrity()
returns table (
  product_id      bigint,
  location_id     bigint,
  lot_id          bigint,
  inventory_qty   numeric,
  movements_qty   numeric,
  difference      numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(i.product_id, m.product_id),
    coalesce(i.location_id, m.location_id),
    coalesce(i.lot_id, m.lot_id),
    coalesce(i.quantity, 0),
    coalesce(m.quantity, 0),
    coalesce(i.quantity, 0) - coalesce(m.quantity, 0)
  from public.inventory i
  full outer join (
    select mi.product_id, mi.location_id, mi.lot_id, sum(mi.quantity) as quantity
      from public.inventory_movement_items mi
      join public.inventory_movements mv on mv.id = mi.movement_id
     where mv.applied_at is not null
     group by mi.product_id, mi.location_id, mi.lot_id
  ) m
    -- coalesce y no IS NOT DISTINCT FROM: un FULL OUTER JOIN exige una
    -- condicion hash/merge-joinable, y `is not distinct from` no lo es.
    on  m.product_id  = i.product_id
    and m.location_id = i.location_id
    and coalesce(m.lot_id, -1) = coalesce(i.lot_id, -1)
  where coalesce(i.quantity, 0) <> coalesce(m.quantity, 0);
$$;

comment on function public.verify_inventory_integrity() is
  'Devuelve las discrepancias entre inventory y la suma del kardex. Vacio = modelo consistente.';
