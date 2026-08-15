-- Faro | Catalogos base: unidades de medida y categorias jerarquicas

-- ---------------------------------------------------------------------------
-- units
-- ---------------------------------------------------------------------------
-- Catalogo normalizado de unidades de medida. Los productos referencian una
-- unidad en vez de repetir texto libre ("kg", "Kg", "kilo", ...).
create table public.units (
  id                bigint generated always as identity primary key,
  code              text        not null,
  name              text        not null,
  -- Indica si la unidad admite cantidades fraccionarias.
  -- 'Unidad' o 'Caja' -> false ; 'Kilogramo' o 'Metro' -> true.
  -- Hoy es informativo (lo consume la UI); queda disponible para validar
  -- cantidades mas adelante sin migrar datos.
  allows_fractions  boolean     not null default true,
  active            boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint units_code_not_blank check (length(btrim(code)) > 0),
  constraint units_name_not_blank check (length(btrim(name)) > 0)
);

-- Una sola instancia = un solo negocio, por lo que el codigo es unico global.
create unique index units_code_key on public.units (lower(code));

create trigger units_set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

comment on table public.units is
  'Catalogo de unidades de medida referenciado por products.unit_id.';

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
-- Arbol de categorias mediante adjacency list (parent_id). Se prefiere sobre
-- ltree/closure table porque la profundidad real de un catalogo comercial es
-- baja y el arbol se lee completo de una sola vez en la UI.
create table public.categories (
  id          bigint generated always as identity primary key,
  parent_id   bigint      references public.categories (id) on delete restrict,
  name        text        not null,
  description text,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint categories_name_not_blank check (length(btrim(name)) > 0),
  constraint categories_not_self_parent check (parent_id is distinct from id)
);

-- Nombre unico entre hermanos. Se usan dos indices parciales porque el nivel
-- raiz tiene parent_id NULL y en un unique tradicional los NULL no colisionan.
create unique index categories_root_name_key
  on public.categories (lower(name))
  where parent_id is null;

create unique index categories_sibling_name_key
  on public.categories (parent_id, lower(name))
  where parent_id is not null;

-- FK indexada: acelera el armado del arbol y el ON DELETE RESTRICT.
create index categories_parent_id_idx on public.categories (parent_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Un adjacency list no puede impedir ciclos con un CHECK: `categories_not_self_parent`
-- solo cubre el ciclo de longitud 1. Este trigger cubre A -> B -> C -> A.
create or replace function public.categories_prevent_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ancestor bigint := new.parent_id;
  v_depth    int    := 0;
begin
  while v_ancestor is not null loop
    if v_ancestor = new.id then
      raise exception 'La categoria % no puede ser descendiente de si misma', new.id
        using errcode = 'check_violation';
    end if;

    v_depth := v_depth + 1;
    if v_depth > 32 then
      raise exception 'Jerarquia de categorias demasiado profunda o corrupta'
        using errcode = 'check_violation';
    end if;

    select parent_id into v_ancestor
      from public.categories
     where id = v_ancestor;
  end loop;

  return new;
end;
$$;

create trigger categories_prevent_cycle
  before insert or update of parent_id on public.categories
  for each row when (new.parent_id is not null)
  execute function public.categories_prevent_cycle();

comment on table public.categories is
  'Categorias jerarquicas (adjacency list). parent_id NULL = categoria raiz.';
