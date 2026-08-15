# Faro — Modelo de datos

Motor de inventario, compras y ventas sobre Supabase + PostgreSQL 17.

El modelo es **genérico a propósito**. El primer caso de uso es una ferretería,
pero nada en el esquema es específico de ferretería: las mismas tablas soportan
tiendas, minoristas, distribuidores, negocios de alimentos y operaciones con
varias bodegas.

---

## 1. Las cuatro ideas que sostienen el modelo

### 1.1 El producto no pertenece a una ubicación

No existe `products.location_id`. Un producto existe simultáneamente en varias
ubicaciones, y esa relación vive en `inventory`.

```
products ──┐
           ├──> inventory <──┐
locations ─┘                 │
                       inventory_lots
```

### 1.2 Producto y existencia son cosas distintas

| Tabla | Responde |
|---|---|
| `products` | qué es el producto |
| `inventory` | cuánto hay y dónde |
| `inventory_lots` | a qué costo entró |
| `product_prices` | a cuánto se vende |
| `inventory_movement_items` | por qué cambió |

### 1.3 Un lote es una capa de costo, no solo un lote del fabricante

Este es el punto más importante y el que más se malinterpreta.

`inventory_lots` representa **una entrada de producto con costo propio**. Se
crea una fila en cada entrada, aunque el producto no maneje lotes del
fabricante.

```
Ferretería — Rodamiento 6204 (track_lot = false)
  lote #1   lot_number NULL   100 u a $8.000    recibido 2026-01-15
  lote #2   lot_number NULL    50 u a $9.500    recibido 2026-06-10

Alimentos — Aceite 1L (track_lot = true, track_expiration = true)
  lote #3   'A-2026-03'       100 u a $4.000    vence 2026-09-01
  lote #4   'B-2026-05'       200 u a $4.300    vence 2026-11-15
```

Consecuencia directa: **una compra nueva nunca sobrescribe el costo anterior**.
Los dos costos conviven, y por eso el sistema puede valorizar el inventario de
verdad y más adelante implementar FIFO, FEFO, promedio ponderado o costo
específico sin cambiar el esquema.

Por la misma razón **no hay unique sobre `lot_number`**: recibir dos veces el
mismo lote del fabricante a costos distintos debe producir dos capas de costo.
Para ver el lote físico agregado se agrupa por `(product_id, lot_number)`.

`inventory_lots` **no tiene columna `quantity`**: la cantidad depende de la
ubicación y es un dato vivo. Vive en `inventory` y se deriva del kardex.

### 1.4 El inventario se explica por movimientos

```
inventory.quantity
  = SUM(inventory_movement_items.quantity)
    de los movimientos aplicados, agrupado por (product, location, lot)
```

Las cantidades del kardex **llevan signo**: positiva entra, negativa sale. Por
eso una transferencia es *un solo* movimiento (líneas negativas en el origen,
positivas en el destino) y el saldo se obtiene con un `SUM`.

La función `verify_inventory_integrity()` devuelve las discrepancias. Si
devuelve cero filas, el invariante se cumple.

---

## 2. Diagrama de relaciones

```
                    ┌──────────────┐
                    │    units     │
                    └──────┬───────┘
                           │ unit_id
┌──────────────┐           │
│  categories  │◄──────────┤ category_id
│  (parent_id  │           │
│   → self)    │      ┌────▼─────────┐        ┌──────────────┐
└──────────────┘      │   products   │───────►│ price_lists  │
                      └────┬─────────┘        └──────▲───────┘
                           │                         │ price_list_id
       ┌───────────────────┼──────────────────┐      │
       │ product_id        │ product_id       │ ┌────┴──────────┐
       │                   │                  └─│product_prices │
┌──────▼─────────┐  ┌──────▼──────┐             └───────────────┘
│ inventory_lots │  │  inventory  │
│  unit_cost     │◄─┤  quantity   │──────┐
│  lot_number?   │  │  lot_id?    │      │ location_id
│  expiration?   │  └─────────────┘      │
└──────┬─────────┘                 ┌─────▼────────┐
       │ (lot_id, product_id)      │  locations   │
       │  FK compuesta             │  type        │
       │                           └─────▲────────┘
       │                                 │
┌──────▼──────────────────────┐          │
│ inventory_movement_items    │          │ location_id
│  quantity CON SIGNO         │──────────┘
│  lot_id?  unit_cost?        │
└──────┬──────────────────────┘
       │ movement_id
┌──────▼──────────────────────┐
│ inventory_movements         │   reference_type + reference_id
│  type   applied_at          │────────────┐  (referencia débil)
└─────────────────────────────┘            │
                                           │
       ┌───────────────────────────────────┼───────────────────────────┐
       │                                   │                           │
┌──────▼───────┐                   ┌───────▼──────┐          ┌─────────▼──────────┐
│  purchases   │                   │    sales     │          │inventory_transfers │
│  status      │                   │  status      │          │  source_location   │
│  subtotal    │                   │  subtotal    │          │  destination_loc.  │
│  tax  total  │                   │  tax  total  │          │  status            │
└──────┬───────┘                   └───────┬──────┘          └─────────┬──────────┘
       │ purchase_id                       │ sale_id                   │ transfer_id
┌──────▼───────────┐             ┌─────────▼────────┐   ┌──────────────▼────────────┐
│ purchase_items   │             │   sale_items     │   │ inventory_transfer_items  │
│  unit_cost       │             │   unit_price     │   │   lot_id?  unit_cost      │
│  lot_id ─────────┼─► lote      │   lot_id? ───────┼─► │   quantity                │
│  subtotal/tax/   │   creado    │   subtotal/tax/  │   └───────────────────────────┘
│  total GENERADOS │             │   total GENERADOS│
└──────────────────┘             └──────────────────┘

┌──────────────┐                  ┌──────────────┐
│  suppliers   │─► purchases      │  customers   │─► sales
└──────────────┘                  │ price_list_id│
                                  └──────────────┘
```

`?` = columna nullable. La flecha `reference_type + reference_id` es una
referencia **débil** (polimórfica): PostgreSQL no puede expresar una FK a tres
tablas distintas. La integridad efectiva la da que solo las funciones
`confirm_*` escriben esos campos.

---

## 3. Tablas

### Catálogos

| Tabla | Notas |
|---|---|
| `units` | Catálogo normalizado de unidades. `allows_fractions` distingue *Unidad* de *Kilogramo*. |
| `categories` | Jerárquica vía `parent_id`. Nombre único entre hermanos. Un trigger impide ciclos. |
| `locations` | Cualquier lugar con inventario. `type`: `warehouse`, `store`, `pos`, `dispatch`, `production`, `other`. Máximo una `is_default`. |
| `price_lists` | Minorista, mayorista, … Máximo una `is_default`. |

### Producto y precio

`products` guarda identidad y configuración. **No** tiene `sale_price`, **no**
tiene `cost`, **no** tiene `location_id`.

- `sku` obligatorio y único (case-insensitive). Una instancia = un negocio.
- `barcode` opcional; si existe no se repite (índice único parcial). No todos
  los negocios usan código de barras.
- `tax_rate` en **porcentaje** (19 = 19 %), no fracción.
- `track_lot` / `track_expiration`: banderas de comportamiento. `track_expiration`
  exige `track_lot` (la fecha de vencimiento es atributo del lote).

El precio vive en `product_prices (product_id, price_list_id, price, valid_from,
valid_to)`. **Precio vigente = `valid_to IS NULL`**, garantizado único por un
índice parcial. Con esto ya están cubiertos, sin migraciones destructivas:

- historial de precios → filas con `valid_to` no nulo;
- listas minorista/mayorista → filas en `price_lists`;
- precio por cliente → `customers.price_list_id`.

`sale_price_with_tax` **no existe**: es derivable y almacenarlo permitiría que
quedara desincronizado. La vista `v_current_prices` lo calcula.

### Inventario

| Tabla | Notas |
|---|---|
| `inventory_lots` | Capa de costo. `lot_number` y `expiration_date` opcionales. |
| `inventory` | Saldo por `(product, location, lot)`. `quantity >= 0`. |
| `inventory_movements` | Cabecera del kardex. `applied_at` NULL = borrador. |
| `inventory_movement_items` | Líneas con signo. |

### Documentos

`purchases` / `purchase_items`, `sales` / `sale_items`,
`inventory_transfers` / `inventory_transfer_items`.

Estados (`document_status`): `draft` → `confirmed` → (`cancelled`).
Mientras esté en `draft` el documento **no toca el inventario** y es editable.
Al confirmarlo queda congelado.

---

## 4. Decisiones de diseño que conviene conocer

### 4.1 Unicidad de `inventory` con `lot_id` NULL

Un `UNIQUE (product_id, location_id, lot_id)` tradicional **no sirve**: en
PostgreSQL los NULL son distintos entre sí, así que `(1, 1, NULL)` y
`(1, 1, NULL)` convivirían y el stock quedaría partido en dos filas.

La solución es `NULLS NOT DISTINCT` (PostgreSQL 15+):

```sql
create unique index inventory_product_location_lot_key
  on public.inventory (product_id, location_id, lot_id)
  nulls not distinct;
```

Frente a la alternativa clásica (dos índices parciales, uno
`where lot_id is null` y otro `where lot_id is not null`) tiene una ventaja
práctica: es un solo índice y `ON CONFLICT (product_id, location_id, lot_id)`
funciona igual con lote y sin lote.

### 4.2 El lote siempre pertenece al producto correcto

`inventory_lots` lleva `UNIQUE (id, product_id)` — redundante en apariencia —
para poder declarar FKs compuestas desde `inventory`,
`inventory_movement_items`, `purchase_items`, `sale_items` y
`inventory_transfer_items`:

```sql
foreign key (lot_id, product_id) references inventory_lots (id, product_id)
```

Así la base impide, **declarativamente y sin triggers**, que se asocie un lote
al producto equivocado. Con `MATCH SIMPLE` (el default) la FK no se evalúa si
`lot_id` es NULL, que es justo lo que hace falta para los productos sin lote.

### 4.3 Importes de línea como columnas generadas

`subtotal`, `tax` y `total` de las líneas son `GENERATED ALWAYS AS ... STORED`.
No son escribibles y no pueden desincronizarse de `quantity`, `unit_cost` y
`tax_rate`. El cálculo del dinero no depende del frontend.

Los totales de cabecera sí se almacenan y los mantiene un trigger: son la cifra
que se imprime y se concilia, y deben quedar congeladas.

### 4.4 Por qué `apply_inventory_movement` no usa un solo upsert

PostgreSQL evalúa los `CHECK` de la fila **propuesta** *antes* de resolver el
`ON CONFLICT`. Una línea de salida (`-50`) chocaría contra
`inventory_quantity_non_negative` aunque el saldo final fuera positivo. Por eso
la aplicación es en dos pasos: primero `INSERT ... ON CONFLICT DO NOTHING` con
cantidad 0 para asegurar que la fila existe, después un `UPDATE` que suma el
delta. Ahí el `CHECK` se evalúa sobre el saldo final, que es lo correcto.

### 4.5 Enums nativos

Se usan enums nativos y no `text + check` porque `supabase gen types typescript`
los exporta como uniones de literales, dándole tipado real al frontend sin
duplicar constantes. Agregar valores después es
`alter type ... add value 'x'` en su propia migración.

---

## 5. Cómo cada operación afecta las tablas

### 5.1 Compra

```
1. INSERT purchases (status = 'draft')
2. INSERT purchase_items          → subtotal/tax/total se calculan solos
                                  → trigger actualiza los totales de purchases
3. confirm_purchase(id)
     ├─ por cada línea sin lot_id:
     │    INSERT inventory_lots (product_id, unit_cost, received_at = purchase.date)
     │    UPDATE purchase_items SET lot_id = <nuevo lote>
     ├─ INSERT inventory_movements (type='purchase', reference='purchase'/id)
     ├─ INSERT inventory_movement_items (+quantity, location = purchase.location_id)
     ├─ apply_inventory_movement()  → sube inventory.quantity
     └─ UPDATE purchases SET status='confirmed', confirmed_at=now()
```

Si el producto tiene `track_lot` / `track_expiration`, el lote debe crearse
**antes** y enlazarse a la línea; si no, el trigger
`inventory_lots_validate_tracking` aborta la confirmación.

### 5.2 Venta

```
1. INSERT sales (status = 'draft')
2. INSERT sale_items
3. confirm_sale(id)
     ├─ INSERT inventory_movements (type='sale', reference='sale'/id)
     ├─ por cada línea:
     │    lot_id informado  → una línea de kardex contra ese lote
     │    lot_id NULL       → allocate_stock() reparte por FEFO/FIFO;
     │                        una línea de venta puede producir VARIAS
     │                        líneas de kardex si cruza capas de costo
     ├─ INSERT inventory_movement_items (-quantity)
     ├─ apply_inventory_movement()  → baja inventory.quantity
     └─ UPDATE sales SET status='confirmed'
```

Si no hay stock, `allocate_stock` levanta `Stock insuficiente` y **toda la
transacción se revierte**.

### 5.3 Transferencia

```
1. INSERT inventory_transfers (source, destination, status='draft')
2. INSERT inventory_transfer_items
3. confirm_transfer(id)
     ├─ INSERT inventory_movements (type='transfer', reference='transfer'/id)
     ├─ por cada línea, resolviendo lote (explícito o FEFO/FIFO):
     │    INSERT inventory_movement_items (source,      -quantity, lot_id)
     │    INSERT inventory_movement_items (destination, +quantity, lot_id)  ← MISMO lote
     ├─ apply_inventory_movement()
     └─ UPDATE inventory_transfers SET status='confirmed'
```

El destino apunta al **mismo** `inventory_lot` que el origen: mover mercancía
no crea una capa de costo nueva ni revaloriza nada.

### 5.4 Entrada y salida manual, ajuste, stock inicial

```
adjust_inventory(product, location, quantity, [lot], [unit_cost], [notes], [type])
```

- `quantity > 0` con `unit_cost` → crea una capa de costo nueva y suma.
- `quantity > 0` sin `unit_cost` → suma sin costo conocido (`lot_id` NULL).
- `quantity < 0` con `lot_id` → descuenta de ese lote.
- `quantity < 0` sin `lot_id` → reparte la baja por FEFO/FIFO.
- `type` acepta `adjustment` (default), `initial_stock` y `return`.

Genera un `inventory_movement` con `reference_type = 'manual'` y lo aplica.

### 5.5 Vencimiento

**El vencimiento no descuenta stock.** La mercancía vencida sigue existiendo
físicamente y el modelo lo refleja. `v_expiring_stock` la marca como `expired`;
retirarla del inventario comercializable es una decisión del usuario que se
ejecuta con `adjust_inventory(..., -cantidad, lot_id => <lote vencido>)`.

---

## 6. Consultas importantes

### Stock total de un producto

```sql
select total_quantity, total_value, weighted_average_cost
from v_product_stock
where sku = 'ROD-6204';
```

O directo sobre las tablas:

```sql
select sum(i.quantity) as stock_total
from inventory i
join products p on p.id = i.product_id
where p.sku = 'ROD-6204';
```

### Stock por ubicación

```sql
select location_name, quantity, stock_value
from v_stock_by_location
where sku = 'TOR-014'
order by location_name;
```

### Stock por lote

```sql
select location_name, lot_number, unit_cost, expiration_date, quantity, stock_value
from v_stock_by_lot
where sku = 'ACE-1L'
order by expiration_date nulls last;
```

Agrupado por lote físico del fabricante (varias capas de costo con el mismo
`lot_number`):

```sql
select lot.lot_number,
       sum(i.quantity)                     as cantidad,
       sum(i.quantity * lot.unit_cost)     as valor
from inventory i
join inventory_lots lot on lot.id = i.lot_id
join products p         on p.id  = i.product_id
where p.sku = 'ACE-1L'
group by lot.lot_number;
```

### Productos próximos a vencer

```sql
-- Próximos 30 días (cambiar el intervalo para 15 o 7)
select product_name, lot_number, expiration_date, days_to_expiration,
       location_name, quantity
from v_expiring_stock
where expiration_date between current_date and current_date + 30
order by expiration_date;
```

Por tramos, en una sola consulta:

```sql
select expiration_status, count(*) as lotes, sum(quantity) as unidades
from v_expiring_stock
group by expiration_status;
```

### Productos vencidos

```sql
select product_name, lot_number, expiration_date, quantity, location_name, stock_value
from v_expiring_stock
where expiration_status = 'expired'
order by expiration_date;
```

### Valor del inventario por costo de lote

```sql
-- Total del negocio
select round(sum(i.quantity * lot.unit_cost), 2) as valor_inventario
from inventory i
join inventory_lots lot on lot.id = i.lot_id;

-- Desglosado por producto y capa de costo
select p.sku, p.name, lot.id as lote, lot.unit_cost, sum(i.quantity) as cantidad,
       round(sum(i.quantity * lot.unit_cost), 2) as valor
from inventory i
join inventory_lots lot on lot.id = i.lot_id
join products p         on p.id  = i.product_id
group by p.sku, p.name, lot.id, lot.unit_cost
order by p.sku, lot.id;

-- Por ubicación
select location_name, round(sum(stock_value), 2) as valor
from v_stock_by_location
group by location_name;
```

### Kardex de un producto

```sql
select date, movement_type, location_name, lot_number, quantity, unit_cost
from v_inventory_ledger
where sku = 'ROD-6204'
order by date, movement_id;
```

### Productos bajo mínimo

```sql
select sku, product_name, total_quantity, min_stock
from v_product_stock
where below_min_stock;
```

### Precio de venta vigente

```sql
select sku, product_name, price_list_code, price, tax_rate, price_with_tax
from v_current_prices
where is_default_list;
```

### Verificar la integridad del modelo

```sql
select * from verify_inventory_integrity();  -- 0 filas = todo consistente
```

---

## 7. Vistas

Todas se crean con `security_invoker = true`. Sin esa opción una vista se
ejecuta con los permisos de su dueño y sería un bypass de RLS.

| Vista | Para qué |
|---|---|
| `v_stock_by_lot` | Existencias al máximo detalle: producto + ubicación + lote. |
| `v_stock_by_location` | Cuánto hay de cada producto en cada ubicación. |
| `v_product_stock` | Total, valorización, costo promedio ponderado, bajo mínimo. |
| `v_expiring_stock` | Vencimientos con estado `expired`/`critical`/`warning`/`upcoming`/`ok`. |
| `v_current_prices` | Precio vigente por lista, con y sin impuesto. |
| `v_inventory_ledger` | Kardex legible. |

El costo promedio de `v_product_stock` es **ponderado por cantidad**, no
promedio simple de los lotes: 100 u a $8.000 y 50 u a $9.500 dan $8.500, no
$8.750.

---

## 8. Seguridad

### Modelo de instancia

**Cada instalación de Faro es un negocio con su propio proyecto de Supabase.**
No hay multi-tenancy: no existe `business_id`, `organization_id` ni `tenant_id`,
y no debe agregarse.

### Regla actual

```
        ¿autenticado?
             │
        ┌────┴────┐
       sí         no
        │          │
   SELECT/INSERT/  denegado
   UPDATE/DELETE
```

- RLS habilitada en las 18 tablas de negocio.
- Cuatro políticas por tabla (`_select`, `_insert`, `_update`, `_delete`),
  todas `TO authenticated`.
- `GRANT` explícito a `authenticated`, `REVOKE ALL` a `anon` sobre tablas,
  vistas y funciones. Doble barrera: sin `GRANT`, una política permisiva creada
  por error ni siquiera se evalúa.

Sobre `using (true)`: en un esquema multi-tenant sería una vulnerabilidad
(autenticación sin autorización). Aquí es la regla de negocio correcta,
precisamente porque la base entera pertenece a un solo negocio y no hay filas de
terceros que aislar. El linter de Supabase reporta 54 `WARN` de
`rls_policy_always_true` — son esperadas y deliberadas en esta etapa.

No se usa `auth.role() = 'authenticated'`: está deprecado, y además los usuarios
anónimos de Supabase también llevan el rol `authenticated`, así que pasarían el
chequeo. La cláusula `TO authenticated` es lo correcto.

### Preparación para permisos futuros

Dos decisiones tomadas hoy hacen barata la capa de autorización de mañana:

1. **Cuatro políticas separadas por tabla** en vez de una sola `FOR ALL`.
   Restringir una operación será reemplazar la expresión de una política
   concreta — por ejemplo `inventory_delete` — sin tocar el resto.
2. **`created_by uuid default auth.uid()`** en `purchases`, `sales`,
   `inventory_transfers` e `inventory_movements`. Es el dato que necesitará una
   política del tipo *"el vendedor solo edita sus propias ventas"*.

Cuando llegue el modelo de roles (administrador / vendedor / bodeguero), el
patrón recomendado es una función `SECURITY DEFINER` en un esquema **no
expuesto**, con `EXECUTE` revocado a `anon`, invocada como
`using ((select private.has_permission('inventory.write')))`. El `select`
envolvente hace que se evalúe una sola vez por consulta en lugar de una vez por
fila.

### Funciones

Todas las funciones de operación son **`SECURITY INVOKER`**: se ejecutan con los
permisos de quien llama, así que las políticas RLS siguen aplicando. Un
`SECURITY DEFINER` aquí sería un bypass silencioso de RLS.

Las funciones de trigger tienen `EXECUTE` revocado a todos los roles: no son
parte de la API. Los triggers se disparan igual, porque PostgreSQL no verifica
`EXECUTE` del rol que ejecuta la sentencia.

---

## 9. Trabajar con el esquema

```bash
npx supabase start          # levanta el stack local
npx supabase db reset       # recrea desde migraciones + seed
npx supabase db advisors --local
npx supabase migration new <nombre>
npx supabase gen types typescript --local > src/lib/database.types.ts
```

Para aplicar en el proyecto hospedado:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Toda la estructura vive en `supabase/migrations/`. **No hacer cambios desde el
dashboard de Supabase**: quedarían fuera del control de versiones y el siguiente
`db push` divergiría.

### Orden de las migraciones

| Archivo | Contenido |
|---|---|
| `..._extensions_and_helpers.sql` | `pg_trgm`, `set_updated_at()`, convenciones |
| `..._enums.sql` | `location_type`, `movement_type`, `document_type`, `document_status` |
| `..._units_and_categories.sql` | catálogos base, anti-ciclos en categorías |
| `..._locations.sql` | ubicaciones |
| `..._products.sql` | productos |
| `..._price_lists.sql` | listas de precio, historial, `set_product_price()` |
| `..._suppliers_and_customers.sql` | terceros |
| `..._inventory_lots.sql` | capas de costo |
| `..._inventory.sql` | saldos |
| `..._inventory_movements.sql` | kardex y sus guardas |
| `..._purchases.sql` | compras + helpers de documento |
| `..._sales.sql` | ventas |
| `..._inventory_transfers.sql` | transferencias |
| `..._inventory_operations.sql` | `allocate_stock`, `apply_inventory_movement`, `confirm_*`, `adjust_inventory`, `verify_inventory_integrity` |
| `..._reporting_views.sql` | vistas |
| `..._rls_policies.sql` | RLS, grants, revokes |

---

## 10. Datos de prueba

`supabase/seed.sql` no es solo un catálogo: **construye los dos casos de negocio
usando las funciones de operación**, así que si el modelo fuera incoherente el
seed fallaría.

Incluye 8 unidades, 10 categorías en dos árboles, 3 ubicaciones, 2 listas de
precio, 2 proveedores, 2 clientes y 6 productos que cubren las tres
combinaciones exigidas:

| Producto | `track_lot` | `track_expiration` |
|---|---|---|
| Tornillo 1/4, Rodamiento 6204, Cable THHN #12, Agua 600ml | false | false |
| Arroz 500g | true | false |
| Aceite 1L | true | true |

Estado resultante tras las compras, transferencias, ventas y ajustes del seed:

```
Rodamiento 6204   Bodega principal   42 @ $8.000  +  50 @ $9.500
                  Tienda             50 @ $8.000
                  ─────────────────────────────────────────────
                  total 142 u — $1.211.000 — costo prom. pond. $8.528,17

Tornillo 1/4      Bodega principal  500
                  Bodega secundaria 100
                  Tienda             28

Aceite 1L         Bodega principal   70 lote A-2026-03 @ $4.000  vence 2026-09-01
                  Bodega principal  200 lote B-2026-05 @ $4.300  vence 2026-11-15
                  Bodega secundaria  24 lote C-2025-11 @ $3.800  VENCIDO 2026-08-01
```

El lote A del aceite quedó en 70 porque la venta `POS-000001` descargó 30
unidades y FEFO eligió el lote que vence antes. El rodamiento quedó en 42 en la
bodega porque se vendieron 10 (FIFO, de la capa de enero) y volvieron 2 por
devolución.

---

## 11. Qué falta (fuera del alcance de esta etapa)

- **Anulación de documentos confirmados.** El estado `cancelled` existe en el
  enum pero hoy solo es alcanzable en `draft`. Anular un documento confirmado
  debe generar un movimiento inverso, no editar la historia; el kardex es
  inmutable por diseño (`inventory_movements_guard`).
- **Métodos de costeo.** El modelo conserva el costo de cada entrada, que es lo
  que hace posible FIFO, FEFO, promedio ponderado y costo específico.
  `allocate_stock` ya implementa FEFO con desempate FIFO.
- **Roles y permisos.** Ver §8.
- **Devoluciones como documento propio.** Hoy se registran con
  `adjust_inventory(..., p_type => 'return')`.
- **Descuentos por línea.** Habría que ampliar la expresión de las columnas
  generadas.
- **Stock negativo permitido.** Si algún negocio necesita sobrevender, se
  elimina `inventory_quantity_non_negative`.
