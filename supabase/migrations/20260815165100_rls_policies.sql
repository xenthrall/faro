-- Faro | Row Level Security
--
-- MODELO DE INSTANCIA
-- Cada instalacion de Faro es UN negocio con SU propio proyecto de Supabase.
-- No hay multi-tenancy: no existe business_id, organization_id ni tenant_id, y
-- no debe agregarse. Todos los datos de esta base pertenecen a ese unico
-- negocio.
--
-- REGLA DE ESTA ETAPA
--   autenticado    -> SELECT / INSERT / UPDATE / DELETE
--   no autenticado -> nada
--
-- Sobre el uso de `to authenticated` con `using (true)`: en un esquema
-- multi-tenant esto seria una vulnerabilidad (autenticacion sin autorizacion,
-- BOLA). Aca es la regla de negocio correcta, precisamente porque la base
-- entera pertenece a un solo negocio y no hay filas de terceros que aislar.
--
-- PREPARACION PARA PERMISOS FUTUROS
-- Se crean CUATRO politicas separadas por tabla en lugar de una sola FOR ALL.
-- Cuando llegue el modelo de roles (administrador / vendedor / bodeguero),
-- restringir una operacion sera reemplazar la expresion de una politica
-- concreta -- por ejemplo `inventory_delete` -- sin tocar el resto ni
-- reestructurar nada. Con una unica politica FOR ALL habria que desarmarla
-- primero.
--
-- Las tablas ya traen `created_by` en los documentos operativos, que es el dato
-- que necesitara una politica del tipo "el vendedor solo edita sus ventas".
--
-- NO se usa `auth.role() = 'authenticated'`: esta deprecado y ademas los
-- usuarios anonimos de Supabase tambien llevan el rol `authenticated`, asi que
-- pasaria el chequeo. La clausula `TO authenticated` es lo correcto.

do $$
declare
  v_table text;
  v_tables constant text[] := array[
    'units',
    'categories',
    'locations',
    'products',
    'price_lists',
    'product_prices',
    'suppliers',
    'customers',
    'inventory_lots',
    'inventory',
    'inventory_movements',
    'inventory_movement_items',
    'purchases',
    'purchase_items',
    'sales',
    'sale_items',
    'inventory_transfers',
    'inventory_transfer_items'
  ];
begin
  foreach v_table in array v_tables loop
    execute format('alter table public.%I enable row level security', v_table);

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      v_table || '_select', v_table);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      v_table || '_insert', v_table);

    -- UPDATE lleva USING y WITH CHECK: el primero decide que filas se pueden
    -- tocar, el segundo como pueden quedar despues. Omitir WITH CHECK deja
    -- abierta la puerta a que un UPDATE mueva una fila fuera del alcance
    -- permitido cuando la politica deje de ser `true`.
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      v_table || '_update', v_table);

    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      v_table || '_delete', v_table);

    -- Exposicion explicita al Data API. No se confia en los privilegios por
    -- defecto del esquema public: si manana cambian, el esquema sigue siendo
    -- correcto por si mismo.
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', v_table);

    -- El rol anonimo no tiene ni privilegio de tabla ni politica. Doble
    -- barrera: aunque alguien cree por error una politica permisiva para
    -- `anon`, sin GRANT no llega a evaluarse.
    execute format('revoke all on public.%I from anon', v_table);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------------
-- Son security_invoker, asi que heredan las politicas de las tablas base. Aun
-- asi hace falta el privilegio de lectura sobre la vista misma.
do $$
declare
  v_view text;
  v_views constant text[] := array[
    'v_stock_by_lot',
    'v_stock_by_location',
    'v_product_stock',
    'v_expiring_stock',
    'v_current_prices',
    'v_inventory_ledger'
  ];
begin
  foreach v_view in array v_views loop
    execute format('grant select on public.%I to authenticated', v_view);
    execute format('revoke all on public.%I from anon', v_view);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------
-- Postgres concede EXECUTE a PUBLIC en toda funcion nueva, y anon hereda de
-- PUBLIC. Hay que revocarlo explicitamente.
--
-- Las funciones de operacion son SECURITY INVOKER: incluso pudiendo llamarlas,
-- un usuario sin politicas RLS no lograria escribir nada. El revoke es defensa
-- en profundidad.
do $$
declare
  v_signature text;
  v_functions constant text[] := array[
    'public.allocate_stock(bigint, bigint, numeric)',
    'public.apply_inventory_movement(bigint)',
    'public.confirm_purchase(bigint)',
    'public.confirm_sale(bigint)',
    'public.confirm_transfer(bigint)',
    'public.adjust_inventory(bigint, bigint, numeric, bigint, numeric, text, public.movement_type)',
    'public.set_product_price(bigint, numeric, bigint)',
    'public.verify_inventory_integrity()'
  ];
begin
  foreach v_signature in array v_functions loop
    execute format('revoke all on function %s from public, anon', v_signature);
    execute format('grant execute on function %s to authenticated', v_signature);
  end loop;
end $$;

-- Las funciones de trigger no son parte de la API: nadie debe poder invocarlas
-- directamente. Postgres las ejecuta igual porque los triggers no verifican
-- EXECUTE del rol que dispara la sentencia.
do $$
declare
  v_signature text;
  v_functions constant text[] := array[
    'public.set_updated_at()',
    'public.categories_prevent_cycle()',
    'public.inventory_lots_validate_tracking()',
    'public.inventory_movement_items_guard()',
    'public.inventory_movements_guard()',
    'public.recalculate_document_totals()',
    'public.document_items_require_draft()'
  ];
begin
  foreach v_signature in array v_functions loop
    execute format('revoke all on function %s from public, anon, authenticated', v_signature);
  end loop;
end $$;
