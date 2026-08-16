-- Faro | Datos del negocio
--
-- Fila unica con la identidad del negocio (nombre, NIT, direccion, contacto)
-- que corre esta instancia. Igual que el resto del esquema, no es
-- multi-tenant: no hay una fila por negocio, hay una fila, punto (ver
-- "MODELO DE INSTANCIA" en la migracion de RLS).

create table public.business_settings (
  -- El check(id = 1) es lo que hace la tabla singleton: ningun insert con
  -- otro id puede pasar la constraint, asi que solo puede existir esta fila.
  id            smallint    primary key default 1,
  business_name text        not null default 'Mi negocio',
  nit           text,
  address       text,
  city          text,
  phone         text,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint business_settings_singleton check (id = 1),
  constraint business_settings_name_not_blank check (length(btrim(business_name)) > 0)
);

comment on table public.business_settings is
  'Identidad del negocio que corre esta instancia (nombre, NIT, direccion, contacto). Fila unica.';

-- La fila se crea aca, no desde la aplicacion: asi toda instalacion --
-- incluida una nueva contra el proyecto hospedado, donde no corre seed.sql --
-- arranca con la fila ya presente y el panel puede leerla con
-- `.eq('id', 1).single()` sin manejar el caso "todavia no existe".
insert into public.business_settings (id) values (1);

create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Solo select/update a authenticated. A diferencia del resto de las tablas
-- (que llevan las cuatro politicas select/insert/update/delete, ver
-- rls_policies.sql), esta fila la crea unicamente esta migracion: no tiene
-- sentido que la aplicacion pueda insertar una segunda fila (la constraint
-- ya lo impide) ni borrar la unica que existe.
alter table public.business_settings enable row level security;

create policy business_settings_select on public.business_settings
  for select to authenticated using (true);

create policy business_settings_update on public.business_settings
  for update to authenticated using (true) with check (true);

grant select, update on public.business_settings to authenticated;
revoke all on public.business_settings from anon;
