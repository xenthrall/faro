-- Faro | Usuario de demostración
--
-- Crea la cuenta pública con la que viene precargado el login (ver
-- src/auth/demo-user.ts y docs/demo-user.md). Corre en cada `db reset` y se
-- puede correr suelto contra el proyecto vinculado:
--
--   npm run db:seed-demo
--
-- Es idempotente: si la cuenta ya existe, no hace nada.
--
-- Se inserta directo en auth.users + auth.identities, que es lo mismo que
-- hace el dashboard. Las columnas de tokens van en '' y no en NULL porque
-- Auth no tolera NULL en ellas al leer el usuario (falla el login con
-- "Database error querying schema").
do $$
declare
  v_email    constant text := 'demo@faro.app';
  v_password constant text := 'faro-demo';
  v_name     constant text := 'Usuario demo';
  v_user_id  uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = v_email) then
    raise notice 'Usuario demo omitido: % ya existe.', v_email;
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token,
    reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', v_name, 'email_verified', true),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_user_id::text, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  raise notice 'Usuario demo creado: %', v_email;
end;
$$;
