-- Faro | Extensiones y helpers transversales
--
-- Convenciones del esquema (aplican a todas las migraciones siguientes):
--   * Identificadores en minuscula/snake_case.
--   * PK: `bigint generated always as identity` (instancia unica por negocio,
--     no hay generacion distribuida de ids, y da mejor localidad de indice).
--   * Timestamps: `timestamptz` siempre.
--   * Dinero/cantidades: `numeric` exacto, nunca float.
--   * Cantidades: numeric(18,4) -> admite kg, litros, metros fraccionados.
--   * Precios/costos unitarios: numeric(14,4).
--   * Importes de documento: numeric(14,2).
--   * tax_rate se guarda como PORCENTAJE (19 = 19%), no como fraccion.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at automatico
-- ---------------------------------------------------------------------------
-- Es un trigger genuinamente necesario: un DEFAULT no puede reaccionar a UPDATE
-- y no queremos depender de que el cliente envie el campo.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: mantiene updated_at sincronizado.';
