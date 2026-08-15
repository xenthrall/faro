-- Faro | Precios de venta
--
-- Decision de diseno: NO existe `products.sale_price`.
--
-- Un precio no es un atributo del producto, es un atributo de la relacion
-- (producto, lista de precios, momento). Modelarlo asi desde el inicio nos deja
-- llegar sin migraciones destructivas a:
--   * historial de precios          -> filas con valid_to no nulo
--   * listas minorista / mayorista  -> filas en price_lists
--   * precio por cliente            -> customers.price_list_id
--
-- Tampoco se guarda `sale_price_with_tax`: es derivable
-- (price * (1 + tax_rate/100)) y almacenarlo abriria la puerta a que quede
-- desincronizado del tax_rate del producto.

-- ---------------------------------------------------------------------------
-- price_lists
-- ---------------------------------------------------------------------------
create table public.price_lists (
  id         bigint generated always as identity primary key,
  code       text        not null,
  name       text        not null,
  -- Lista usada cuando la venta o el cliente no indican otra.
  is_default boolean     not null default false,
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint price_lists_code_not_blank check (length(btrim(code)) > 0),
  constraint price_lists_name_not_blank check (length(btrim(name)) > 0)
);

create unique index price_lists_code_key on public.price_lists (lower(code));

create unique index price_lists_single_default_key
  on public.price_lists ((true))
  where is_default;

create trigger price_lists_set_updated_at
  before update on public.price_lists
  for each row execute function public.set_updated_at();

comment on table public.price_lists is
  'Listas de precios (minorista, mayorista, ...). Una sola puede ser is_default.';

-- ---------------------------------------------------------------------------
-- product_prices
-- ---------------------------------------------------------------------------
-- Precio vigente  = fila con valid_to IS NULL.
-- Precio historico = fila con valid_to NOT NULL.
create table public.product_prices (
  id            bigint generated always as identity primary key,
  product_id    bigint not null references public.products (id)    on delete cascade,
  price_list_id bigint not null references public.price_lists (id) on delete restrict,

  price         numeric(14,4) not null,
  valid_from    timestamptz   not null default now(),
  valid_to      timestamptz,

  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),

  constraint product_prices_price_non_negative check (price >= 0),
  constraint product_prices_range_valid
    check (valid_to is null or valid_to > valid_from)
);

-- Exactamente un precio vigente por (producto, lista).
create unique index product_prices_current_key
  on public.product_prices (product_id, price_list_id)
  where valid_to is null;

-- Lecturas del historial de un producto, mas reciente primero.
create index product_prices_product_history_idx
  on public.product_prices (product_id, price_list_id, valid_from desc);

create index product_prices_price_list_id_idx
  on public.product_prices (price_list_id);

create trigger product_prices_set_updated_at
  before update on public.product_prices
  for each row execute function public.set_updated_at();

comment on table public.product_prices is
  'Precio de venta por producto y lista. valid_to IS NULL = precio vigente.';

-- ---------------------------------------------------------------------------
-- set_product_price(): cierra el precio vigente y abre uno nuevo
-- ---------------------------------------------------------------------------
-- Hacerlo en una funcion evita que el cliente tenga que ejecutar dos escrituras
-- y garantiza que el historial quede sin huecos ni solapamientos.
create or replace function public.set_product_price(
  p_product_id    bigint,
  p_price         numeric,
  p_price_list_id bigint default null
)
returns public.product_prices
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_list_id bigint := p_price_list_id;
  v_now     timestamptz := now();
  v_row     public.product_prices;
begin
  if v_list_id is null then
    select id into v_list_id from public.price_lists where is_default limit 1;
    if v_list_id is null then
      raise exception 'No hay lista de precios por defecto; indique p_price_list_id'
        using errcode = 'no_data_found';
    end if;
  end if;

  update public.product_prices
     set valid_to = v_now
   where product_id = p_product_id
     and price_list_id = v_list_id
     and valid_to is null
     -- Evita violar product_prices_range_valid si se fija dos veces el mismo
     -- precio dentro de la misma transaccion (now() es constante en ella).
     and valid_from < v_now;

  delete from public.product_prices
   where product_id = p_product_id
     and price_list_id = v_list_id
     and valid_to is null
     and valid_from >= v_now;

  insert into public.product_prices (product_id, price_list_id, price, valid_from)
  values (p_product_id, v_list_id, p_price, v_now)
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.set_product_price(bigint, numeric, bigint) is
  'Cierra el precio vigente y registra uno nuevo, conservando el historial.';
