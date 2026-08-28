-- Faro | Datos de catálogo (sin operaciones)
--
-- Negocio: "Ferretería y Llantas El Yunque" — ferretería de barrio con línea
-- automotriz fuerte. Bogotá, pesos colombianos, IVA 19%.
--
-- Tres ubicaciones:
--
--   BOD-01  Bodega central          almacena el grueso del inventario
--   PDV-01  Punto de venta Centro   local principal, atiende mostrador y taller
--   PDV-02  Punto de venta Norte    local secundario, surtido más liviano
--
-- Catálogo de productos reducido a 5 ítems (para testeo manual sencillo),
-- representativos de una ferretería: herramienta manual, herramienta
-- eléctrica, tornillería, electricidad (venta por metro) y uno con control
-- de vencimiento (sellador acrílico, track_lot + track_expiration).
--
-- Este seed solo carga catálogo: unidades, categorías, listas de precio,
-- ubicaciones, proveedores, clientes, productos y sus precios de venta.
-- Deliberadamente NO crea compras, traslados, ventas, ajustes ni inventario
-- — el objetivo es poder validar manualmente, desde cero, el flujo operativo
-- completo (compra → definir lotes → confirmar → traslado → confirmar →
-- venta → confirmar → ajuste) contra datos de catálogo realistas, sin que una
-- operación de la demo se mezcle con la que se está probando a mano.
--
-- Después de correr el seed, todos los productos existen pero con stock 0 en
-- las tres ubicaciones: el primer movimiento de cada uno lo genera quien
-- prueba el flujo desde el panel.

do $$
declare
  -- Unidades
  v_un bigint; v_m bigint; v_caja bigint;

  -- Categorías
  v_cat_ferreteria bigint;
  v_cat_herramientas bigint; v_cat_herr_manual bigint; v_cat_herr_electrica bigint;
  v_cat_tornilleria bigint; v_cat_electricidad bigint; v_cat_pinturas bigint;

  -- Listas de precio
  v_pl_minorista bigint; v_pl_mayorista bigint;

  -- Ubicaciones
  v_bodega bigint; v_pdv_centro bigint; v_pdv_norte bigint;

  -- Proveedores
  v_prov_ferretera bigint; v_prov_electrica bigint;

  -- Clientes
  v_cli_taller bigint; v_cli_constructora bigint; v_cli_mantenimiento bigint;

  -- Productos
  v_p_martillo bigint; v_p_taladro bigint;
  v_p_drywall bigint; v_p_cable bigint; v_p_sellador bigint;
begin
  if exists (select 1 from public.products limit 1) then
    raise notice 'Seed omitido: ya hay datos cargados.';
    return;
  end if;

  -- ==========================================================================
  -- UNIDADES
  -- ==========================================================================
  insert into public.units (code, name, allows_fractions) values
    ('UN',   'Unidad',  false),
    ('M',    'Metro',   true),
    ('CAJA', 'Caja',    false);

  select id into v_un   from public.units where code = 'UN';
  select id into v_m    from public.units where code = 'M';
  select id into v_caja from public.units where code = 'CAJA';

  -- ==========================================================================
  -- CATEGORÍAS
  -- ==========================================================================
  insert into public.categories (name) values ('Ferretería') returning id into v_cat_ferreteria;

  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Herramientas')
    returning id into v_cat_herramientas;
  insert into public.categories (parent_id, name) values (v_cat_herramientas, 'Herramienta manual')
    returning id into v_cat_herr_manual;
  insert into public.categories (parent_id, name) values (v_cat_herramientas, 'Herramienta eléctrica')
    returning id into v_cat_herr_electrica;

  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Tornillería y fijación')
    returning id into v_cat_tornilleria;
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Electricidad')
    returning id into v_cat_electricidad;
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Pinturas y adhesivos')
    returning id into v_cat_pinturas;

  -- ==========================================================================
  -- LISTAS DE PRECIO
  -- ==========================================================================
  insert into public.price_lists (code, name, is_default) values ('MINORISTA', 'Minorista', true)
    returning id into v_pl_minorista;
  insert into public.price_lists (code, name) values ('MAYORISTA', 'Mayorista')
    returning id into v_pl_mayorista;

  -- ==========================================================================
  -- UBICACIONES
  -- ==========================================================================
  insert into public.locations (code, name, type, description, is_default) values
    ('BOD-01', 'Bodega central', 'warehouse',
     'Almacena el grueso del inventario y recibe todas las compras.', true)
    returning id into v_bodega;

  insert into public.locations (code, name, type, description) values
    ('PDV-01', 'Punto de venta Centro', 'pos',
     'Local principal. Atiende mostrador, taller y venta mayorista.')
    returning id into v_pdv_centro;

  insert into public.locations (code, name, type, description) values
    ('PDV-02', 'Punto de venta Norte', 'pos',
     'Local secundario. Surtido más liviano.')
    returning id into v_pdv_norte;

  -- ==========================================================================
  -- PROVEEDORES
  -- ==========================================================================
  insert into public.suppliers (name, tax_id, phone, email, address) values
    ('Comercializadora Ferretera Bogotá SAS', '900987654-3', '6012223344',
     'pedidos@ferreterabogota.co', 'Calle 9 # 21-16, Bogotá')
    returning id into v_prov_ferretera;

  insert into public.suppliers (name, tax_id, phone) values
    ('Eléctricos y Redes del Norte Ltda', '830112233-4', '6017778811')
    returning id into v_prov_electrica;

  -- ==========================================================================
  -- CLIENTES
  -- ==========================================================================
  insert into public.customers (name, tax_id, phone, email, price_list_id) values
    ('Taller Automotriz El Pistón', '901111222-3', '3105551010',
     'contacto@elpiston.co', v_pl_mayorista)
    returning id into v_cli_taller;

  insert into public.customers (name, tax_id, phone, price_list_id) values
    ('Constructora Andina SAS', '901333444-5', '3208889090', v_pl_mayorista)
    returning id into v_cli_constructora;

  insert into public.customers (name, tax_id, phone) values
    ('Mantenimiento Integral JR', '79885544-1', '3159994422')
    returning id into v_cli_mantenimiento;

  insert into public.customers (name) values ('Cliente mostrador');

  -- ==========================================================================
  -- PRODUCTOS
  -- ==========================================================================
  -- Cinco productos típicos de ferretería, uno de ellos con control de
  -- vencimiento (track_lot + track_expiration).

  -- --- Herramienta manual ---------------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_herr_manual, v_un, 'HER-MAR-16', '7701001000015', 'Martillo de uña 16 oz mango fibra', 19, 15)
    returning id into v_p_martillo;

  -- --- Herramienta eléctrica ------------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, description, tax_rate, min_stock) values
    (v_cat_herr_electrica, v_un, 'HER-TAL-750', '7701001000053', 'Taladro percutor 1/2" 750 W',
     'Incluye maletín y juego de brocas.', 19, 8)
    returning id into v_p_taladro;

  -- --- Tornillería ------------------------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_tornilleria, v_caja, 'TOR-DRY-61', '7701001000084', 'Tornillo drywall 6 x 1" caja x 1000', 19, 20)
    returning id into v_p_drywall;

  -- --- Electricidad -----------------------------------------------------------
  -- Se vende por metro: la unidad admite fracciones.
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_electricidad, v_m, 'ELE-CAB-12', 'Cable THHN calibre 12 AWG', 19, 300)
    returning id into v_p_cable;

  -- --- Pinturas y adhesivos (lote + vencimiento) -------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, track_lot, track_expiration, min_stock) values
    (v_cat_pinturas, v_un, 'PIN-SEL-280', '7701001000145', 'Sellador acrílico blanco 280 ml',
     19, true, true, 30)
    returning id into v_p_sellador;

  -- ==========================================================================
  -- PRECIOS DE VENTA
  -- ==========================================================================
  -- Se fijan con set_product_price para que quede historial desde el inicio.
  perform public.set_product_price(v_p_martillo,          29900, v_pl_minorista);
  perform public.set_product_price(v_p_taladro,          319900, v_pl_minorista);
  perform public.set_product_price(v_p_taladro,          289000, v_pl_mayorista);
  perform public.set_product_price(v_p_drywall,           44900, v_pl_minorista);
  perform public.set_product_price(v_p_drywall,           39900, v_pl_mayorista);
  perform public.set_product_price(v_p_cable,              4500, v_pl_minorista);
  perform public.set_product_price(v_p_cable,              3900, v_pl_mayorista);
  perform public.set_product_price(v_p_sellador,          14900, v_pl_minorista);

  -- ==========================================================================
  -- RESULTADO
  -- ==========================================================================
  raise notice 'Seed de catálogo cargado: % productos, % categorías, % ubicaciones, % proveedores, % clientes. Sin compras, traslados ni ventas — el flujo operativo queda para probar a mano.',
    (select count(*) from public.products),
    (select count(*) from public.categories),
    (select count(*) from public.locations),
    (select count(*) from public.suppliers),
    (select count(*) from public.customers);
end $$;

-- Datos del negocio de la demo. La fila ya existe (la crea la migración de
-- business_settings), así que esto es un update, no un insert.
update public.business_settings
set business_name = 'Ferretería y Llantas El Yunque',
    nit            = '901234567-8',
    address        = 'Calle 9 # 21-16',
    city           = 'Bogotá',
    phone          = '(601) 222-3344',
    email          = 'contacto@elyunque.co'
where id = 1;
