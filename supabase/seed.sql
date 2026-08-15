-- Faro | Datos de demostración
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
-- El seed no inserta existencias a mano: las construye con las funciones
-- reales del dominio (confirm_purchase, confirm_transfer, confirm_sale,
-- adjust_inventory). Si el modelo fuera incoherente, el seed fallaría.
--
-- Escenarios que quedan armados para la demo:
--
--   * capas de costo múltiples      llanta 205/55 R16 y tornillería
--   * lote + vencimiento            fluidos automotrices y sellador
--   * lote sin vencimiento          pintura vinilo
--   * los cuatro estados de vencimiento: vencido, crítico, por vencer, vigente
--   * productos bajo mínimo         para que el dashboard muestre alertas
--   * documentos en borrador        compra y venta sin confirmar
--   * traslados bodega → ambos PDV, venta mayorista, mostrador, merma y devolución
--
-- Las fechas están ancladas a agosto de 2026: el estado de vencimiento se
-- calcula contra current_date, así que si se ejecuta mucho después habrá más
-- lotes vencidos de los previstos.

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

  -- Lotes
  v_lote_pintura bigint;
  v_lote_sellador bigint;
  v_lote_aceite_a bigint; v_lote_aceite_b bigint;
  v_lote_freno_a bigint; v_lote_freno_b bigint;
  v_lote_refri_viejo bigint; v_lote_refri_nuevo bigint;

  -- Documentos
  v_compra bigint; v_transfer bigint; v_venta bigint;
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
  -- COMPRAS
  -- ==========================================================================
  -- Todas entran a la bodega central. El orden cronológico importa: es lo que
  -- deja ver capas de costo distintas para el mismo producto.

  -- --- Febrero: surtido inicial de ferretería -------------------------------
  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_ferretera, v_bodega, 'FC-8801', '2026-02-12 08:30-05',
          'Surtido inicial de herramienta y tornillería')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate) values
    (v_compra, v_p_martillo,          40,  18500, 19),
    (v_compra, v_p_destornilladores,  30,  22000, 19),
    (v_compra, v_p_alicate,           35,  16800, 19),
    (v_compra, v_p_flexometro,        60,   9500, 19),
    (v_compra, v_p_tornillo,        2000,    340, 19),
    (v_compra, v_p_chazo,            120,   6200, 19),
    (v_compra, v_p_drywall,           60,  28000, 19);

  perform public.confirm_purchase(v_compra);

  -- --- Marzo: llantas, primera capa de costo --------------------------------
  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_llantas, v_bodega, 'FC-1001', '2026-03-05 09:00-05',
          'Compra inicial de llantas para carro')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate) values
    (v_compra, v_p_llanta_205, 100, 185000, 19),
    (v_compra, v_p_llanta_195,  80, 170000, 19);

  perform public.confirm_purchase(v_compra);

  -- --- Marzo: fluidos automotrices ------------------------------------------
  -- Los productos con track_lot exigen que el lote exista antes de confirmar:
  -- el número de lote y el vencimiento solo los conoce quien recibe la mercancía.
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
  values (v_p_aceite, 'ACE-2025-11', 49000, '2026-03-18 07:00-05', '2026-08-30')
  returning id into v_lote_aceite_a;

  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
  values (v_p_freno, 'DOT4-2026-A', 14500, '2026-03-18 07:00-05', '2026-08-20')
  returning id into v_lote_freno_a;

  -- Lote que ya venció: la mercancía sigue existiendo hasta que alguien
  -- decida darla de baja con un ajuste.
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
  values (v_p_refrigerante, 'REF-2025-09', 9000, '2026-03-18 07:00-05', '2026-07-31')
  returning id into v_lote_refri_viejo;

  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_automotriz, v_bodega, 'FA-3001', '2026-03-18 07:00-05',
          'Lubricantes y fluidos — primer trimestre')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, lot_id) values
    (v_compra, v_p_aceite,       48, 49000, 19, v_lote_aceite_a),
    (v_compra, v_p_freno,        40, 14500, 19, v_lote_freno_a),
    (v_compra, v_p_refrigerante, 36,  9000, 19, v_lote_refri_viejo);

  perform public.confirm_purchase(v_compra);

  -- --- Abril: plomería, pintura, construcción y seguridad -------------------
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at)
  values (v_p_pintura, 'VIN-2026-0412', 48000, '2026-04-18 08:00-05')
  returning id into v_lote_pintura;

  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
  values (v_p_sellador, 'SEL-2026-04', 8900, '2026-04-18 08:00-05', '2026-09-10')
  returning id into v_lote_sellador;

  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_ferretera, v_bodega, 'FC-8930', '2026-04-18 08:00-05',
          'Plomería, pintura, construcción y seguridad')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, lot_id) values
    (v_compra, v_p_tubo,     90, 12400, 19, null),
    (v_compra, v_p_codo,    400,   900, 19, null),
    (v_compra, v_p_teflon,  300,   900, 19, null),
    (v_compra, v_p_cemento, 150, 26500, 19, null),
    (v_compra, v_p_guantes,  80,  6800, 19, null),
    (v_compra, v_p_gafas,    80,  4200, 19, null),
    (v_compra, v_p_pintura,  60, 48000, 19, v_lote_pintura),
    (v_compra, v_p_sellador, 90,  8900, 19, v_lote_sellador);

  perform public.confirm_purchase(v_compra);

  -- --- Mayo: material eléctrico ---------------------------------------------
  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_electrica, v_bodega, 'FE-4410', '2026-05-08 09:15-05',
          'Material eléctrico e iluminación')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate) values
    (v_compra, v_p_cable,        1200, 2800, 19),
    (v_compra, v_p_interruptor,   150, 5400, 19),
    (v_compra, v_p_tomacorriente, 150, 7200, 19),
    (v_compra, v_p_bombillo,      240, 4900, 19);

  perform public.confirm_purchase(v_compra);

  -- --- Junio: reposición de fluidos, segunda capa de costo ------------------
  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
  values (v_p_aceite, 'ACE-2026-06', 52000, '2026-06-15 07:30-05', '2027-03-31')
  returning id into v_lote_aceite_b;

  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
  values (v_p_freno, 'DOT4-2026-B', 15200, '2026-06-15 07:30-05', '2027-01-15')
  returning id into v_lote_freno_b;

  insert into public.inventory_lots (product_id, lot_number, unit_cost, received_at, expiration_date)
  values (v_p_refrigerante, 'REF-2026-05', 9500, '2026-06-15 07:30-05', '2026-12-31')
  returning id into v_lote_refri_nuevo;

  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_automotriz, v_bodega, 'FA-3102', '2026-06-15 07:30-05',
          'Reposición de fluidos — segundo semestre')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, lot_id) values
    (v_compra, v_p_aceite,       60, 52000, 19, v_lote_aceite_b),
    (v_compra, v_p_freno,        50, 15200, 19, v_lote_freno_b),
    (v_compra, v_p_refrigerante, 48,  9500, 19, v_lote_refri_nuevo);

  perform public.confirm_purchase(v_compra);

  -- --- Julio: llantas, segunda capa de costo --------------------------------
  -- El proveedor subió el precio: la llanta 205/55 R16 queda con dos costos
  -- vivos ($185.000 de marzo y $198.000 de julio). El primero NO se sobrescribe.
  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_llantas, v_bodega, 'FC-1148', '2026-07-10 10:30-05',
          'Reposición de llantas — ajuste de precio del proveedor')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate) values
    (v_compra, v_p_llanta_205, 50, 198000, 19),
    (v_compra, v_p_moto_90,    60, 105000, 19),
    (v_compra, v_p_moto_110,   40, 135000, 19),
    (v_compra, v_p_rodamiento, 90,  16000, 19);

  perform public.confirm_purchase(v_compra);

  -- --- Agosto: reposición de ferretería, segunda capa de costo --------------
  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_ferretera, v_bodega, 'FC-9105', '2026-08-03 08:00-05',
          'Reposición de tornillería y herramienta')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate) values
    (v_compra, v_p_tornillo,  1500,    380, 19),
    (v_compra, v_p_taladro,     12, 210000, 19),
    (v_compra, v_p_pulidora,    10, 165000, 19);

  perform public.confirm_purchase(v_compra);

  -- ==========================================================================
  -- TRASLADOS A LOS PUNTOS DE VENTA
  -- ==========================================================================
  -- Surtir un local no cambia el valor del inventario: el lote y su costo
  -- viajan con la mercancía.

  -- --- Bodega → Punto de venta Centro ---------------------------------------
  insert into public.inventory_transfers (source_location_id, destination_location_id, reference, date, notes)
  values (v_bodega, v_pdv_centro, 'TR-0001', '2026-07-20 07:30-05',
          'Surtido semanal del local Centro')
  returning id into v_transfer;

  insert into public.inventory_transfer_items (transfer_id, product_id, quantity) values
    (v_transfer, v_p_llanta_205,       40),
    (v_transfer, v_p_llanta_195,       30),
    (v_transfer, v_p_moto_90,          25),
    (v_transfer, v_p_moto_110,         18),
    (v_transfer, v_p_rodamiento,       35),
    (v_transfer, v_p_aceite,           30),
    (v_transfer, v_p_freno,            30),
    (v_transfer, v_p_refrigerante,     28),
    (v_transfer, v_p_martillo,         12),
    (v_transfer, v_p_destornilladores, 10),
    (v_transfer, v_p_alicate,          12),
    (v_transfer, v_p_flexometro,       20),
    (v_transfer, v_p_tornillo,        700),
    (v_transfer, v_p_cable,           400),
    (v_transfer, v_p_bombillo,         90),
    (v_transfer, v_p_cemento,          50),
    (v_transfer, v_p_pintura,          22),
    (v_transfer, v_p_sellador,         35),
    (v_transfer, v_p_taladro,           4),
    (v_transfer, v_p_guantes,          25);

  perform public.confirm_transfer(v_transfer);

  -- --- Bodega → Punto de venta Norte ----------------------------------------
  -- El local Norte no maneja llantas de carro: solo moto y ferretería.
  insert into public.inventory_transfers (source_location_id, destination_location_id, reference, date, notes)
  values (v_bodega, v_pdv_norte, 'TR-0002', '2026-07-21 07:30-05',
          'Surtido semanal del local Norte')
  returning id into v_transfer;

  insert into public.inventory_transfer_items (transfer_id, product_id, quantity) values
    (v_transfer, v_p_moto_90,          15),
    (v_transfer, v_p_moto_110,         10),
    (v_transfer, v_p_rodamiento,       20),
    (v_transfer, v_p_freno,            15),
    (v_transfer, v_p_refrigerante,     12),
    (v_transfer, v_p_martillo,          8),
    (v_transfer, v_p_destornilladores,  8),
    (v_transfer, v_p_alicate,           8),
    (v_transfer, v_p_flexometro,       15),
    (v_transfer, v_p_tornillo,        500),
    (v_transfer, v_p_chazo,            40),
    (v_transfer, v_p_drywall,          20),
    (v_transfer, v_p_cable,           300),
    (v_transfer, v_p_interruptor,      50),
    (v_transfer, v_p_tomacorriente,    50),
    (v_transfer, v_p_bombillo,         70),
    (v_transfer, v_p_tubo,             30),
    (v_transfer, v_p_codo,            150),
    (v_transfer, v_p_teflon,          120),
    (v_transfer, v_p_gafas,            30);

  perform public.confirm_transfer(v_transfer);

  -- --- Reposición del Centro a mitad de mes ---------------------------------
  insert into public.inventory_transfers (source_location_id, destination_location_id, reference, date, notes)
  values (v_bodega, v_pdv_centro, 'TR-0003', '2026-08-05 07:30-05',
          'Reposición de mostrador')
  returning id into v_transfer;

  insert into public.inventory_transfer_items (transfer_id, product_id, quantity) values
    (v_transfer, v_p_tornillo,       400),
    (v_transfer, v_p_teflon,          80),
    (v_transfer, v_p_codo,           100),
    (v_transfer, v_p_interruptor,     40),
    (v_transfer, v_p_tomacorriente,   40),
    (v_transfer, v_p_gafas,           25);

  perform public.confirm_transfer(v_transfer);

  -- ==========================================================================
  -- VENTAS
  -- ==========================================================================

  -- --- Venta mayorista al taller (Centro) -----------------------------------
  -- Sin lote indicado: confirm_sale reparte por FEFO. Para la llanta 205, que
  -- no vence, el desempate es FIFO y sale primero la capa de $185.000.
  insert into public.sales (customer_id, location_id, reference, date, notes)
  values (v_cli_taller, v_pdv_centro, 'FV-000101', '2026-08-06 10:15-05',
          'Pedido mensual del taller')
  returning id into v_venta;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_llanta_205,  8, 225000, 19),
    (v_venta, v_p_moto_90,     6, 130000, 19),
    (v_venta, v_p_aceite,     12,  69900, 19),
    (v_venta, v_p_freno,      10,  24000, 19),
    (v_venta, v_p_rodamiento, 10,  24000, 19);

  perform public.confirm_sale(v_venta);

  -- --- Venta a constructora (Centro) ----------------------------------------
  insert into public.sales (customer_id, location_id, reference, date, notes)
  values (v_cli_constructora, v_pdv_centro, 'FV-000102', '2026-08-08 14:40-05',
          'Obra Calle 134 — material de acabados')
  returning id into v_venta;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_cemento,  35,  31900, 19),
    (v_venta, v_p_pintura,  14,  64900, 19),
    (v_venta, v_p_tornillo, 350,   550, 19),
    (v_venta, v_p_cable,    180,  3900, 19),
    (v_venta, v_p_bombillo,  40,  7200, 19);

  perform public.confirm_sale(v_venta);

  -- --- Mostrador en el Centro, sin cliente identificado ---------------------
  insert into public.sales (location_id, reference, date, notes)
  values (v_pdv_centro, 'POS-000455', '2026-08-11 11:05-05', 'Venta de mostrador')
  returning id into v_venta;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_llanta_195,  2, 230000, 19),
    (v_venta, v_p_martillo,    1,  29900, 19),
    (v_venta, v_p_flexometro,  2,  15900, 19),
    (v_venta, v_p_sellador,    3,  14900, 19);

  perform public.confirm_sale(v_venta);

  -- --- Mostrador en el Norte ------------------------------------------------
  insert into public.sales (location_id, reference, date, notes)
  values (v_pdv_norte, 'POS-000456', '2026-08-12 09:30-05', 'Venta de mostrador')
  returning id into v_venta;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_moto_110,      2, 185000, 19),
    (v_venta, v_p_tubo,          6,  19900, 19),
    (v_venta, v_p_codo,         25,   1800, 19),
    (v_venta, v_p_teflon,       20,   2000, 19),
    (v_venta, v_p_interruptor,  12,   9900, 19);

  perform public.confirm_sale(v_venta);

  -- --- Venta a mantenimiento (Norte) ----------------------------------------
  insert into public.sales (customer_id, location_id, reference, date, notes)
  values (v_cli_mantenimiento, v_pdv_norte, 'FV-000103', '2026-08-13 16:20-05',
          'Mantenimiento locativo conjunto residencial')
  returning id into v_venta;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_bombillo,       35, 8900, 19),
    (v_venta, v_p_tomacorriente,  18, 12900, 19),
    (v_venta, v_p_cable,         120,  4500, 19),
    (v_venta, v_p_gafas,           6,  8900, 19);

  perform public.confirm_sale(v_venta);

  -- ==========================================================================
  -- AJUSTES Y DEVOLUCIONES
  -- ==========================================================================

  -- Merma detectada en el conteo físico del Centro.
  perform public.adjust_inventory(
    p_product_id  => v_p_tornillo,
    p_location_id => v_pdv_centro,
    p_quantity    => -18,
    p_notes       => 'Diferencia en conteo físico del 10 de agosto'
  );

  -- Rotura de mercancía en bodega.
  perform public.adjust_inventory(
    p_product_id  => v_p_teflon,
    p_location_id => v_bodega,
    p_quantity    => -6,
    p_notes       => 'Producto averiado durante el almacenamiento'
  );

  -- Devolución de cliente: la llanta vuelve a la capa de costo de la que salió.
  perform public.adjust_inventory(
    p_product_id  => v_p_llanta_205,
    p_location_id => v_pdv_centro,
    p_quantity    => 2,
    p_lot_id      => (select id from public.inventory_lots
                       where product_id = v_p_llanta_205
                       order by received_at limit 1),
    p_notes       => 'Devolución del taller — llantas sin instalar',
    p_type        => 'return'
  );

  -- ==========================================================================
  -- DOCUMENTOS EN BORRADOR
  -- ==========================================================================
  -- Quedan sin confirmar a propósito: el dashboard los muestra como pendientes
  -- y sirven para demostrar en vivo el paso borrador → confirmar.

  insert into public.purchases (supplier_id, location_id, reference, date, notes)
  values (v_prov_llantas, v_bodega, 'FC-1190', '2026-08-14 09:00-05',
          'Pedido en tránsito — pendiente de recibir')
  returning id into v_compra;

  insert into public.purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate) values
    (v_compra, v_p_llanta_205, 40, 198000, 19),
    (v_compra, v_p_moto_90,    30, 108000, 19);

  insert into public.sales (customer_id, location_id, reference, date, notes)
  values (v_cli_constructora, v_pdv_centro, 'COT-000210', '2026-08-15 08:45-05',
          'Cotización pendiente de aprobación del cliente')
  returning id into v_venta;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, tax_rate) values
    (v_venta, v_p_cemento, 20, 31900, 19),
    (v_venta, v_p_pintura,  8, 64900, 19);

  -- ==========================================================================
  -- RESULTADO
  -- ==========================================================================
  raise notice 'Seed cargado: % productos, % ubicaciones, % movimientos aplicados.',
    (select count(*) from public.products),
    (select count(*) from public.locations),
    (select count(*) from public.inventory_movements where applied_at is not null);

  raise notice 'Verificación de integridad: % discrepancias.',
    (select count(*) from public.verify_inventory_integrity());
end $$;
