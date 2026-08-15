-- Faro | Datos de prueba
--
-- Se ejecuta automaticamente con `supabase db reset`.
--
-- No es solo un catalogo de ejemplo: monta los dos casos de negocio que el
-- modelo debe soportar y los construye USANDO las funciones de operacion
-- (confirm_purchase, confirm_transfer, confirm_sale, adjust_inventory), de modo
-- que si el modelo fuera incoherente el seed fallaria.
--
--   Caso A - Ferreteria: mismo producto comprado a dos costos distintos y
--            repartido entre bodega y tienda.
--   Caso B - Alimentos:  mismo producto con lotes y vencimientos distintos,
--            incluido un lote ya vencido.
--
-- Se envuelve en un DO block porque necesitamos capturar los ids generados.

do $$
declare
  -- unidades
  v_un    bigint; v_kg  bigint; v_g   bigint; v_l   bigint;
  v_m     bigint; v_caja bigint; v_paq bigint; v_doc bigint;

  -- categorias
  v_cat_ferreteria bigint; v_cat_tornilleria bigint; v_cat_tornillos bigint;
  v_cat_tuercas    bigint; v_cat_arandelas   bigint; v_cat_herramientas bigint;
  v_cat_electricidad bigint;
  v_cat_alimentos  bigint; v_cat_bebidas bigint; v_cat_granos bigint;

  -- listas de precio
  v_pl_minorista bigint; v_pl_mayorista bigint;

  -- ubicaciones
  v_bod_principal bigint; v_bod_secundaria bigint; v_tienda bigint;

  -- terceros
  v_prov_tornillos bigint; v_prov_alimentos bigint;
  v_cli_constructora bigint;

  -- productos
  v_p_tornillo bigint; v_p_rodamiento bigint; v_p_cable bigint;
  v_p_aceite   bigint; v_p_arroz bigint; v_p_agua bigint;

  -- documentos
  v_compra bigint; v_transfer bigint; v_venta bigint;
  v_lote_a bigint; v_lote_b bigint; v_lote_c bigint; v_lote_arroz bigint;
begin
  if exists (select 1 from public.products limit 1) then
    raise notice 'Seed omitido: ya hay datos cargados.';
    return;
  end if;

  -- =========================================================================
  -- Catalogos
  -- =========================================================================
  insert into public.units (code, name, allows_fractions) values
    ('UN',   'Unidad',     false),
    ('KG',   'Kilogramo',  true),
    ('G',    'Gramo',      true),
    ('L',    'Litro',      true),
    ('M',    'Metro',      true),
    ('CAJA', 'Caja',       false),
    ('PAQ',  'Paquete',    false),
    ('DOC',  'Docena',     false);

  select id into v_un   from public.units where code = 'UN';
  select id into v_l    from public.units where code = 'L';
  select id into v_m    from public.units where code = 'M';
  select id into v_paq  from public.units where code = 'PAQ';

  -- Categorias jerarquicas
  insert into public.categories (name) values ('Ferreteria') returning id into v_cat_ferreteria;
  insert into public.categories (name) values ('Alimentos')  returning id into v_cat_alimentos;

  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Tornilleria')
    returning id into v_cat_tornilleria;
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Herramientas')
    returning id into v_cat_herramientas;
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Electricidad')
    returning id into v_cat_electricidad;

  insert into public.categories (parent_id, name) values (v_cat_tornilleria, 'Tornillos')
    returning id into v_cat_tornillos;
  insert into public.categories (parent_id, name) values (v_cat_tornilleria, 'Tuercas')
    returning id into v_cat_tuercas;
  insert into public.categories (parent_id, name) values (v_cat_tornilleria, 'Arandelas')
    returning id into v_cat_arandelas;

  insert into public.categories (parent_id, name) values (v_cat_alimentos, 'Bebidas')
    returning id into v_cat_bebidas;
  insert into public.categories (parent_id, name) values (v_cat_alimentos, 'Granos')
    returning id into v_cat_granos;

  -- Listas de precio
  insert into public.price_lists (code, name, is_default) values ('MINORISTA', 'Minorista', true)
    returning id into v_pl_minorista;
  insert into public.price_lists (code, name) values ('MAYORISTA', 'Mayorista')
    returning id into v_pl_mayorista;

  -- Ubicaciones: tres tipos distintos, para probar que el inventario no vive
  -- en una sola bodega.
  insert into public.locations (code, name, type, is_default)
    values ('BOD-01', 'Bodega principal', 'warehouse', true)
    returning id into v_bod_principal;
  insert into public.locations (code, name, type)
    values ('BOD-02', 'Bodega secundaria', 'warehouse')
    returning id into v_bod_secundaria;
  insert into public.locations (code, name, type)
    values ('TDA-01', 'Tienda', 'store')
    returning id into v_tienda;

  -- Terceros
  insert into public.suppliers (name, tax_id, phone, email)
    values ('Distribuidora Tornillos SAS', '900123456-1', '3001112233', 'ventas@tornillos.co')
    returning id into v_prov_tornillos;
  insert into public.suppliers (name, tax_id)
    values ('Alimentos del Valle Ltda', '830998877-4')
    returning id into v_prov_alimentos;

  insert into public.customers (name, tax_id, price_list_id)
    values ('Constructora Andina', '901555444-2', v_pl_mayorista)
    returning id into v_cli_constructora;
  insert into public.customers (name) values ('Cliente mostrador');

  -- =========================================================================
  -- Productos
  -- =========================================================================
  -- Sin lote ni vencimiento (ferreteria)
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock)
    values (v_cat_tornillos, v_un, 'TOR-014', '7701234567890', 'Tornillo 1/4', 19, 100)
    returning id into v_p_tornillo;

  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock)
    values (v_cat_herramientas, v_un, 'ROD-6204', 'Rodamiento 6204', 19, 20)
    returning id into v_p_rodamiento;

  -- Unidad fraccionable: se vende por metro
  insert into public.products (category_id, unit_id, sku, name, tax_rate)
    values (v_cat_electricidad, v_m, 'CAB-THHN12', 'Cable THHN #12', 19)
    returning id into v_p_cable;

  -- Con lote pero SIN vencimiento
  insert into public.products (category_id, unit_id, sku, name, tax_rate, track_lot)
    values (v_cat_granos, v_paq, 'ARR-500', 'Arroz 500g', 5, true)
    returning id into v_p_arroz;

  -- Con lote Y vencimiento (alimentos)
  insert into public.products
    (category_id, unit_id, sku, barcode, name, tax_rate, track_lot, track_expiration)
    values (v_cat_alimentos, v_l, 'ACE-1L', '7709876543210', 'Aceite 1L', 19, true, true)
    returning id into v_p_aceite;

  insert into public.products (category_id, unit_id, sku, name, tax_rate)
    values (v_cat_bebidas, v_un, 'AGU-600', 'Agua 600ml', 0)
    returning id into v_p_agua;

  -- Precios de venta vigentes (via la funcion, para que quede historial limpio)
  perform public.set_product_price(v_p_tornillo,   350,   v_pl_minorista);
  perform public.set_product_price(v_p_tornillo,   280,   v_pl_mayorista);
  perform public.set_product_price(v_p_rodamiento, 14000, v_pl_minorista);
  perform public.set_product_price(v_p_rodamiento, 11500, v_pl_mayorista);
  perform public.set_product_price(v_p_cable,      2800,  v_pl_minorista);
  perform public.set_product_price(v_p_arroz,      2600,  v_pl_minorista);
  perform public.set_product_price(v_p_aceite,     6500,  v_pl_minorista);
  perform public.set_product_price(v_p_agua,       1500,  v_pl_minorista);

  -- =========================================================================
  -- CASO A | Ferreteria: dos compras del mismo producto a costos distintos
  -- =========================================================================
  -- Enero: 100 unidades a $8.000
  insert into public.purchases (supplier_id, location_id, reference, date, notes)
    values (v_prov_tornillos, v_bod_principal, 'FV-1001', '2026-01-15 10:00-05', 'Compra enero')
    returning id into v_compra;
  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate)
    values (v_compra, v_p_rodamiento, 100, 8000, 19);
  perform public.confirm_purchase(v_compra);

  -- Junio: 50 unidades a $9.500. NO sobrescribe el costo de enero: crea una
  -- segunda capa de costo.
  insert into public.purchases (supplier_id, location_id, reference, date, notes)
    values (v_prov_tornillos, v_bod_principal, 'FV-1042', '2026-06-10 09:30-05', 'Compra junio')
    returning id into v_compra;
  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate)
    values (v_compra, v_p_rodamiento, 50, 9500, 19);
  perform public.confirm_purchase(v_compra);

  -- Tornillos y cable, una sola compra a la bodega principal
  insert into public.purchases (supplier_id, location_id, reference, date)
    values (v_prov_tornillos, v_bod_principal, 'FV-1043', '2026-06-11 08:00-05')
    returning id into v_compra;
  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate) values
    (v_compra, v_p_tornillo, 650, 180,  19),
    (v_compra, v_p_cable,    500, 1900, 19);
  perform public.confirm_purchase(v_compra);

  -- Reparto entre ubicaciones. El lote y el costo viajan con la mercancia:
  -- transferir no revaloriza nada.
  -- 50 rodamientos a la tienda -> FEFO/FIFO toma la capa de enero ($8.000).
  insert into public.inventory_transfers (source_location_id, destination_location_id, date, notes)
    values (v_bod_principal, v_tienda, '2026-07-01 08:00-05', 'Surtido tienda')
    returning id into v_transfer;
  insert into public.inventory_transfer_items (transfer_id, product_id, quantity) values
    (v_transfer, v_p_rodamiento, 50),
    (v_transfer, v_p_tornillo,   50);
  perform public.confirm_transfer(v_transfer);

  -- 100 tornillos a la bodega secundaria
  insert into public.inventory_transfers (source_location_id, destination_location_id, date)
    values (v_bod_principal, v_bod_secundaria, '2026-07-01 09:00-05')
    returning id into v_transfer;
  insert into public.inventory_transfer_items (transfer_id, product_id, quantity)
    values (v_transfer, v_p_tornillo, 100);
  perform public.confirm_transfer(v_transfer);

  -- Resultado esperado
  --   Rodamiento 6204 -> Bodega principal 100 (50 a $8.000 + 50 a $9.500)
  --                      Tienda            50 (a $8.000)
  --   Tornillo 1/4    -> Bodega principal 500, Bodega secundaria 100, Tienda 50

  -- =========================================================================
  -- CASO B | Alimentos: lotes con vencimiento
  -- =========================================================================
  -- El producto tiene track_lot y track_expiration, asi que los lotes se crean
  -- ANTES de confirmar la compra y se enlazan a cada linea. Si se omitieran,
  -- confirm_purchase fallaria por el trigger inventory_lots_validate_tracking.
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
    values (v_p_aceite, 'A-2026-03', 4000, '2026-03-05 07:00-05', '2026-09-01')
    returning id into v_lote_a;
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
    values (v_p_aceite, 'B-2026-05', 4300, '2026-05-20 07:00-05', '2026-11-15')
    returning id into v_lote_b;

  insert into public.purchases (supplier_id, location_id, reference, date)
    values (v_prov_alimentos, v_bod_principal, 'FA-5501', '2026-05-20 07:00-05')
    returning id into v_compra;
  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, lot_id) values
    (v_compra, v_p_aceite, 100, 4000, 19, v_lote_a),
    (v_compra, v_p_aceite, 200, 4300, 19, v_lote_b);
  perform public.confirm_purchase(v_compra);

  -- Lote ya vencido, en la bodega secundaria. Sigue existiendo fisicamente:
  -- el vencimiento no descuenta stock por si solo.
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
    values (v_p_aceite, 'C-2025-11', 3800, '2025-11-10 07:00-05', '2026-08-01')
    returning id into v_lote_c;

  insert into public.purchases (supplier_id, location_id, reference, date)
    values (v_prov_alimentos, v_bod_secundaria, 'FA-5210', '2025-11-10 07:00-05')
    returning id into v_compra;
  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, lot_id)
    values (v_compra, v_p_aceite, 24, 3800, 19, v_lote_c);
  perform public.confirm_purchase(v_compra);

  -- Arroz: controla lote pero NO vencimiento
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at)
    values (v_p_arroz, 'ARZ-778', 1900, '2026-06-01 07:00-05')
    returning id into v_lote_arroz;

  insert into public.purchases (supplier_id, location_id, reference, date)
    values (v_prov_alimentos, v_bod_principal, 'FA-5610', '2026-06-01 07:00-05')
    returning id into v_compra;
  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, lot_id)
    values (v_compra, v_p_arroz, 300, 1900, 5, v_lote_arroz);
  perform public.confirm_purchase(v_compra);

  -- Agua: sin lote ni vencimiento, directo a la tienda
  insert into public.purchases (supplier_id, location_id, reference, date)
    values (v_prov_alimentos, v_tienda, 'FA-5611', '2026-06-01 07:00-05')
    returning id into v_compra;
  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate)
    values (v_compra, v_p_agua, 240, 900, 0);
  perform public.confirm_purchase(v_compra);

  -- =========================================================================
  -- Ventas
  -- =========================================================================
  -- Venta mayorista desde la bodega principal. Sin lot_id: confirm_sale asigna
  -- por FEFO (el aceite sale del lote que vence antes) y por FIFO el resto.
  insert into public.sales (customer_id, location_id, reference, date)
    values (v_cli_constructora, v_bod_principal, 'POS-000001', '2026-08-10 15:20-05')
    returning id into v_venta;
  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_rodamiento, 10, 11500, 19),
    (v_venta, v_p_aceite,     30,  6500, 19),
    (v_venta, v_p_cable,      25,  2800, 19);
  perform public.confirm_sale(v_venta);

  -- Venta de mostrador en la tienda, sin cliente
  insert into public.sales (location_id, reference, date)
    values (v_tienda, 'POS-000002', '2026-08-12 11:05-05')
    returning id into v_venta;
  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_tornillo, 20,  350, 19),
    (v_venta, v_p_agua,      6, 1500, 0);
  perform public.confirm_sale(v_venta);

  -- =========================================================================
  -- Ajustes
  -- =========================================================================
  -- Merma detectada en conteo fisico: disminuye inventario.
  perform public.adjust_inventory(
    p_product_id  => v_p_tornillo,
    p_location_id => v_tienda,
    p_quantity    => -2,
    p_notes       => 'Merma detectada en conteo fisico'
  );

  -- Devolucion de cliente: aumenta inventario reingresando al lote original.
  perform public.adjust_inventory(
    p_product_id  => v_p_rodamiento,
    p_location_id => v_bod_principal,
    p_quantity    => 2,
    p_lot_id      => (select id from public.inventory_lots
                       where product_id = v_p_rodamiento order by received_at limit 1),
    p_notes       => 'Devolucion de cliente',
    p_type        => 'return'
  );

  raise notice 'Seed cargado. Verificacion de integridad: % discrepancias',
    (select count(*) from public.verify_inventory_integrity());
end $$;
