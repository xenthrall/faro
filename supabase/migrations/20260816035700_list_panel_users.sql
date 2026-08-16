-- Faro | Listado de usuarios del panel
--
-- auth.users no es accesible directo desde el cliente: authenticated no
-- tiene (ni deberia tener) SELECT sobre esa tabla, porque ahi tambien viven
-- hashes de contrasena, tokens de confirmacion, etc. Esta funcion expone
-- unicamente las columnas que hacen falta para listar "quien tiene acceso
-- al panel", corriendo con privilegios elevados (SECURITY DEFINER) para leer
-- auth.users por dentro sin ampliar los privilegios del rol que la llama.
--
-- Que cualquier autenticado pueda ver este listado es correcto en este
-- modelo de instancia: la base entera es un solo negocio (ver
-- rls_policies.sql), asi que todo autenticado ya es alguien con acceso al
-- panel de ese negocio -- no hay clientes ni terceros con cuenta propia.
create or replace function public.list_panel_users()
returns table (
  id               uuid,
  email            text,
  full_name        text,
  created_at       timestamptz,
  last_sign_in_at  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    u.raw_user_meta_data ->> 'full_name' as full_name,
    u.created_at,
    u.last_sign_in_at
  from auth.users u
  order by u.created_at;
$$;

comment on function public.list_panel_users() is
  'Lista los usuarios con acceso al panel (id, email, nombre, fechas). SECURITY DEFINER: authenticated no tiene SELECT sobre auth.users.';

revoke all on function public.list_panel_users() from public, anon;
grant execute on function public.list_panel_users() to authenticated;
