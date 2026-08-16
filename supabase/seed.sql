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
  v_un bigint; v_m bigint; v_l bigint; v_kg bigint;
  v_caja bigint; v_paq bigint; v_gal bigint;

  -- Categorías — ferretería
  v_cat_ferreteria bigint;
  v_cat_herramientas bigint; v_cat_herr_manual bigint; v_cat_herr_electrica bigint;
  v_cat_tornilleria bigint; v_cat_electricidad bigint; v_cat_plomeria bigint;
  v_cat_pinturas bigint; v_cat_construccion bigint; v_cat_seguridad bigint;

  -- Categorías — automotriz
  v_cat_automotriz bigint;
  v_cat_llantas bigint; v_cat_llantas_carro bigint; v_cat_llantas_moto bigint;
  v_cat_fluidos bigint; v_cat_repuestos bigint;

  -- Listas de precio
  v_pl_minorista bigint; v_pl_mayorista bigint;

  -- Ubicaciones
  v_bodega bigint; v_pdv_centro bigint; v_pdv_norte bigint;

  -- Proveedores
  v_prov_llantas bigint; v_prov_automotriz bigint;
  v_prov_ferretera bigint; v_prov_electrica bigint;

  -- Clientes
  v_cli_taller bigint; v_cli_constructora bigint; v_cli_mantenimiento bigint;

  -- Productos — herramientas
  v_p_martillo bigint; v_p_destornilladores bigint; v_p_alicate bigint;
  v_p_flexometro bigint; v_p_taladro bigint; v_p_pulidora bigint;

  -- Productos — tornillería
  v_p_tornillo bigint; v_p_chazo bigint; v_p_drywall bigint;

  -- Productos — electricidad
  v_p_cable bigint; v_p_interruptor bigint; v_p_tomacorriente bigint; v_p_bombillo bigint;

  -- Productos — plomería
  v_p_tubo bigint; v_p_codo bigint; v_p_teflon bigint;

  -- Productos — pinturas, construcción, seguridad
  v_p_pintura bigint; v_p_sellador bigint; v_p_cemento bigint;
  v_p_guantes bigint; v_p_gafas bigint;

  -- Productos — automotriz
  v_p_llanta_205 bigint; v_p_llanta_195 bigint;
  v_p_moto_90 bigint; v_p_moto_110 bigint;
  v_p_aceite bigint; v_p_freno bigint; v_p_refrigerante bigint; v_p_rodamiento bigint;
begin
  if exists (select 1 from public.products limit 1) then
    raise notice 'Seed omitido: ya hay datos cargados.';
    return;
  end if;

  -- ==========================================================================
  -- UNIDADES
  -- ==========================================================================
  insert into public.units (code, name, allows_fractions) values
    ('UN',   'Unidad',   false),
    ('M',    'Metro',    true),
    ('L',    'Litro',    true),
    ('KG',   'Kilogramo', true),
    ('GAL',  'Galón',    true),
    ('CAJA', 'Caja',     false),
    ('PAQ',  'Paquete',  false);

  select id into v_un   from public.units where code = 'UN';
  select id into v_m    from public.units where code = 'M';
  select id into v_l    from public.units where code = 'L';
  select id into v_kg   from public.units where code = 'KG';
  select id into v_gal  from public.units where code = 'GAL';
  select id into v_caja from public.units where code = 'CAJA';
  select id into v_paq  from public.units where code = 'PAQ';

  -- ==========================================================================
  -- CATEGORÍAS
  -- ==========================================================================
  -- Dos raíces: la ferretería tradicional y la línea automotriz. El árbol
  -- llega a tres niveles para ejercitar la jerarquía.
  insert into public.categories (name) values ('Ferretería') returning id into v_cat_ferreteria;
  insert into public.categories (name) values ('Automotriz')  returning id into v_cat_automotriz;

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
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Plomería')
    returning id into v_cat_plomeria;
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Pinturas y adhesivos')
    returning id into v_cat_pinturas;
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Construcción')
    returning id into v_cat_construccion;
  insert into public.categories (parent_id, name) values (v_cat_ferreteria, 'Seguridad industrial')
    returning id into v_cat_seguridad;

  insert into public.categories (parent_id, name) values (v_cat_automotriz, 'Llantas')
    returning id into v_cat_llantas;
  insert into public.categories (parent_id, name) values (v_cat_llantas, 'Llantas para carro')
    returning id into v_cat_llantas_carro;
  insert into public.categories (parent_id, name) values (v_cat_llantas, 'Llantas para moto')
    returning id into v_cat_llantas_moto;
  insert into public.categories (parent_id, name) values (v_cat_automotriz, 'Lubricantes y fluidos')
    returning id into v_cat_fluidos;
  insert into public.categories (parent_id, name) values (v_cat_automotriz, 'Repuestos')
    returning id into v_cat_repuestos;

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
     'Local secundario. Surtido más liviano, sin línea de llantas de carro.')
    returning id into v_pdv_norte;

  -- ==========================================================================
  -- PROVEEDORES
  -- ==========================================================================
  insert into public.suppliers (name, tax_id, phone, email, address) values
    ('Distribuidora Nacional de Llantas SAS', '900456789-1', '6015551122',
     'ventas@dnllantas.co', 'Calle 13 # 68-95, Bogotá')
    returning id into v_prov_llantas;

  insert into public.suppliers (name, tax_id, phone, email, address) values
    ('Suministros Automotrices Colombia SAS', '901234567-8', '6014448899',
     'comercial@sumiauto.co', 'Carrera 30 # 12-40, Bogotá')
    returning id into v_prov_automotriz;

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
  -- Los márgenes siguen lo típico del sector: ~55-65% sobre costo en ferretería
  -- y ~25-30% en llantas, donde el ticket es alto y la rotación menor.

  -- --- Herramienta manual ---------------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_herr_manual, v_un, 'HER-MAR-16', '7701001000015', 'Martillo de uña 16 oz mango fibra', 19, 15)
    returning id into v_p_martillo;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_herr_manual, v_un, 'HER-DES-06', '7701001000022', 'Juego de destornilladores 6 piezas', 19, 30)
    returning id into v_p_destornilladores;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_herr_manual, v_un, 'HER-ALI-08', '7701001000039', 'Alicate universal 8"', 19, 15)
    returning id into v_p_alicate;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_herr_manual, v_un, 'HER-FLE-05', '7701001000046', 'Flexómetro 5 m x 19 mm', 19, 25)
    returning id into v_p_flexometro;

  -- --- Herramienta eléctrica ------------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, description, tax_rate, min_stock) values
    (v_cat_herr_electrica, v_un, 'HER-TAL-750', '7701001000053', 'Taladro percutor 1/2" 750 W',
     'Incluye maletín y juego de brocas.', 19, 8)
    returning id into v_p_taladro;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_herr_electrica, v_un, 'HER-PUL-820', '7701001000060', 'Pulidora angular 4 1/2" 820 W', 19, 12)
    returning id into v_p_pulidora;

  -- --- Tornillería ----------------------------------------------------------
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_tornilleria, v_un, 'TOR-HEX-14', 'Tornillo hexagonal 1/4" x 2"', 19, 800)
    returning id into v_p_tornillo;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_tornilleria, v_paq, 'TOR-CHZ-08', '7701001000077', 'Chazo plástico #8 paquete x 100', 19, 40)
    returning id into v_p_chazo;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_tornilleria, v_caja, 'TOR-DRY-61', '7701001000084', 'Tornillo drywall 6 x 1" caja x 1000', 19, 20)
    returning id into v_p_drywall;

  -- --- Electricidad ---------------------------------------------------------
  -- Se vende por metro: la unidad admite fracciones.
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_electricidad, v_m, 'ELE-CAB-12', 'Cable THHN calibre 12 AWG', 19, 300)
    returning id into v_p_cable;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_electricidad, v_un, 'ELE-INT-01', '7701001000091', 'Interruptor sencillo blanco', 19, 60)
    returning id into v_p_interruptor;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_electricidad, v_un, 'ELE-TOM-02', '7701001000107', 'Tomacorriente doble con polo a tierra', 19, 60)
    returning id into v_p_tomacorriente;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_electricidad, v_un, 'ELE-BOM-09', '7701001000114', 'Bombillo LED 9 W luz fría E27', 19, 90)
    returning id into v_p_bombillo;

  -- --- Plomería -------------------------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_plomeria, v_un, 'PLO-TUB-12', '7701001000121', 'Tubo PVC presión 1/2" x 6 m', 19, 30)
    returning id into v_p_tubo;
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_plomeria, v_un, 'PLO-COD-12', 'Codo PVC presión 1/2" x 90°', 19, 150)
    returning id into v_p_codo;
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_plomeria, v_un, 'PLO-TEF-10', 'Cinta teflón 1/2" x 10 m', 19, 120)
    returning id into v_p_teflon;

  -- --- Pinturas y adhesivos -------------------------------------------------
  -- La pintura maneja lote de fabricación (para reclamos de tono) pero no
  -- vencimiento: es el caso track_lot = true, track_expiration = false.
  insert into public.products (category_id, unit_id, sku, barcode, name, description, tax_rate, track_lot, min_stock) values
    (v_cat_pinturas, v_gal, 'PIN-VIN-BL', '7701001000138', 'Pintura vinilo tipo 1 blanco galón',
     'El lote de fabricación importa: dos lotes distintos pueden variar de tono.', 19, true, 20)
    returning id into v_p_pintura;

  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, track_lot, track_expiration, min_stock) values
    (v_cat_pinturas, v_un, 'PIN-SEL-280', '7701001000145', 'Sellador acrílico blanco 280 ml',
     19, true, true, 30)
    returning id into v_p_sellador;

  -- --- Construcción y seguridad --------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_construccion, v_un, 'CON-CEM-50', '7701001000152', 'Cemento gris uso general bulto 50 kg', 19, 60)
    returning id into v_p_cemento;
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_seguridad, v_un, 'SEG-GUA-CA', 'Guantes de carnaza reforzados par', 19, 30)
    returning id into v_p_guantes;
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_seguridad, v_un, 'SEG-GAF-CL', 'Gafas de seguridad lente claro', 19, 30)
    returning id into v_p_gafas;

  -- --- Llantas --------------------------------------------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_llantas_carro, v_un, 'LLA-2055516', '7701002000014', 'Llanta 205/55 R16 91V', 19, 40)
    returning id into v_p_llanta_205;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_llantas_carro, v_un, 'LLA-1956515', '7701002000021', 'Llanta 195/65 R15 91H', 19, 30)
    returning id into v_p_llanta_195;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_llantas_moto, v_un, 'MOT-9090-18', '7701002000038', 'Llanta moto 90/90-18', 19, 25)
    returning id into v_p_moto_90;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, min_stock) values
    (v_cat_llantas_moto, v_un, 'MOT-11070-17', '7701002000045', 'Llanta moto 110/70-17', 19, 40)
    returning id into v_p_moto_110;

  -- --- Fluidos automotrices (lote + vencimiento) ----------------------------
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, track_lot, track_expiration, min_stock) values
    (v_cat_fluidos, v_gal, 'LUB-2050-GA', '7701002000052', 'Aceite motor 20W-50 mineral galón',
     19, true, true, 30)
    returning id into v_p_aceite;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, track_lot, track_expiration, min_stock) values
    (v_cat_fluidos, v_un, 'LUB-DOT4-500', '7701002000069', 'Líquido de frenos DOT 4 500 ml',
     19, true, true, 30)
    returning id into v_p_freno;
  insert into public.products (category_id, unit_id, sku, barcode, name, tax_rate, track_lot, track_expiration, min_stock) values
    (v_cat_fluidos, v_un, 'LUB-REF-1L', '7701002000076', 'Refrigerante orgánico listo para usar 1 L',
     19, true, true, 30)
    returning id into v_p_refrigerante;

  -- --- Repuestos ------------------------------------------------------------
  insert into public.products (category_id, unit_id, sku, name, tax_rate, min_stock) values
    (v_cat_repuestos, v_un, 'REP-ROD-6204', 'Rodamiento rígido de bolas 6204 2RS', 19, 40)
    returning id into v_p_rodamiento;

  -- ==========================================================================
  -- PRECIOS DE VENTA
  -- ==========================================================================
  -- Se fijan con set_product_price para que quede historial desde el inicio.
  perform public.set_product_price(v_p_martillo,          29900, v_pl_minorista);
  perform public.set_product_price(v_p_destornilladores,  34900, v_pl_minorista);
  perform public.set_product_price(v_p_alicate,           26900, v_pl_minorista);
  perform public.set_product_price(v_p_flexometro,        15900, v_pl_minorista);
  perform public.set_product_price(v_p_taladro,          319900, v_pl_minorista);
  perform public.set_product_price(v_p_taladro,          289000, v_pl_mayorista);
  perform public.set_product_price(v_p_pulidora,         259900, v_pl_minorista);

  perform public.set_product_price(v_p_tornillo,            700, v_pl_minorista);
  perform public.set_product_price(v_p_tornillo,            550, v_pl_mayorista);
  perform public.set_product_price(v_p_chazo,             10500, v_pl_minorista);
  perform public.set_product_price(v_p_drywall,           44900, v_pl_minorista);
  perform public.set_product_price(v_p_drywall,           39900, v_pl_mayorista);

  perform public.set_product_price(v_p_cable,              4500, v_pl_minorista);
  perform public.set_product_price(v_p_cable,              3900, v_pl_mayorista);
  perform public.set_product_price(v_p_interruptor,        9900, v_pl_minorista);
  perform public.set_product_price(v_p_tomacorriente,     12900, v_pl_minorista);
  perform public.set_product_price(v_p_bombillo,           8900, v_pl_minorista);
  perform public.set_product_price(v_p_bombillo,           7200, v_pl_mayorista);

  perform public.set_product_price(v_p_tubo,              19900, v_pl_minorista);
  perform public.set_product_price(v_p_codo,               1800, v_pl_minorista);
  perform public.set_product_price(v_p_teflon,             2000, v_pl_minorista);

  perform public.set_product_price(v_p_pintura,           72900, v_pl_minorista);
  perform public.set_product_price(v_p_pintura,           64900, v_pl_mayorista);
  perform public.set_product_price(v_p_sellador,          14900, v_pl_minorista);
  perform public.set_product_price(v_p_cemento,           34900, v_pl_minorista);
  perform public.set_product_price(v_p_cemento,           31900, v_pl_mayorista);
  perform public.set_product_price(v_p_guantes,           11900, v_pl_minorista);
  perform public.set_product_price(v_p_gafas,              8900, v_pl_minorista);

  perform public.set_product_price(v_p_llanta_205,       245000, v_pl_minorista);
  perform public.set_product_price(v_p_llanta_205,       225000, v_pl_mayorista);
  perform public.set_product_price(v_p_llanta_195,       230000, v_pl_minorista);
  perform public.set_product_price(v_p_llanta_195,       210000, v_pl_mayorista);
  perform public.set_product_price(v_p_moto_90,          145000, v_pl_minorista);
  perform public.set_product_price(v_p_moto_90,          130000, v_pl_mayorista);
  perform public.set_product_price(v_p_moto_110,         185000, v_pl_minorista);
  perform public.set_product_price(v_p_moto_110,         165000, v_pl_mayorista);

  perform public.set_product_price(v_p_aceite,            78900, v_pl_minorista);
  perform public.set_product_price(v_p_aceite,            69900, v_pl_mayorista);
  perform public.set_product_price(v_p_freno,             24000, v_pl_minorista);
  perform public.set_product_price(v_p_refrigerante,      18000, v_pl_minorista);
  perform public.set_product_price(v_p_rodamiento,        28000, v_pl_minorista);
  perform public.set_product_price(v_p_rodamiento,        24000, v_pl_mayorista);

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
