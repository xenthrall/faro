-- Faro | Bloqueo de la cuenta demo
--
-- Faro se publica con una cuenta de demostración cuyas credenciales están en
-- el login (ver src/auth/demo-user.ts y docs/demo-user.md). La clave
-- publicable es pública, así que cualquiera puede llamar a la API de Auth
-- (`auth.updateUser`) con la sesión demo y cambiarle el email o la
-- contraseña, dejando a todos los demás afuera. Ocultar los formularios en el
-- panel no alcanza: el bloqueo tiene que estar en la base.
--
-- Supabase Auth no tiene un hook "antes de actualizar usuario", así que se usa
-- un trigger BEFORE UPDATE sobre auth.users que rechaza cambios a las
-- columnas de credenciales e identidad de esa cuenta. El resto de las
-- columnas (last_sign_in_at, updated_at, tokens de sesión, etc.) se dejan
-- pasar porque Auth las actualiza en cada login.
--
-- Solo se bloquea cuando el UPDATE lo hace el servicio de Auth
-- (supabase_auth_admin), que es el camino tanto de la API pública como del
-- dashboard. Desde el SQL Editor (rol postgres) se puede seguir modificando
-- la cuenta a propósito, por ejemplo para cambiarle la contraseña.
create or replace function public.prevent_demo_user_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.email is distinct from 'demo@faro.app' or current_user <> 'supabase_auth_admin' then
    return new;
  end if;

  if new.email is distinct from old.email
    or new.encrypted_password is distinct from old.encrypted_password
    or new.phone is distinct from old.phone
    or coalesce(new.email_change, '') <> coalesce(old.email_change, '')
    or coalesce(new.phone_change, '') <> coalesce(old.phone_change, '')
    or new.raw_user_meta_data -> 'full_name' is distinct from old.raw_user_meta_data -> 'full_name'
  then
    raise exception 'La cuenta demo no se puede modificar.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

comment on function public.prevent_demo_user_changes() is
  'Trigger BEFORE UPDATE en auth.users: impide cambiar email, contraseña, teléfono o nombre de la cuenta demo pública.';

revoke all on function public.prevent_demo_user_changes() from public, anon, authenticated;
grant execute on function public.prevent_demo_user_changes() to supabase_auth_admin;

drop trigger if exists prevent_demo_user_changes on auth.users;
create trigger prevent_demo_user_changes
  before update on auth.users
  for each row
  execute function public.prevent_demo_user_changes();
