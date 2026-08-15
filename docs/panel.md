# Faro — Panel de administración

El panel `/app` es la interfaz sobre el modelo descrito en [`database.md`](./database.md).
Este documento explica cómo está armado, para que agregar una pantalla nueva no
requiera releer todo el código.

---

## 1. Cómo se registra una pantalla

El panel ya existía como framework (inspirado en Filament): las páginas y los
recursos se **descubren por archivo**, no se importan a mano.

```
src/panels/app/
├── index.ts                    createPanel + import.meta.glob
├── pages/                      páginas sueltas del panel
│   ├── index.tsx               → /app          (Dashboard)
│   ├── reports.tsx             → /app/reports
│   └── users.tsx               → /app/users
├── components/                 componentes compartidos entre recursos
└── resources/
    └── <Nombre>Resource/
        ├── index.ts            createResource: name, label, icon, group, order
        ├── components/         componentes propios del recurso
        └── pages/
            ├── index.tsx       → /app/<name>
            ├── create.tsx      → /app/<name>/create
            ├── detail.tsx      → /app/<name>/:id      (meta.path)
            └── edit.tsx        → /app/<name>/:id/edit
```

Cada página exporta un componente por defecto y, opcionalmente, un `meta`:

```ts
export const meta: PanelPageMeta = {
  label: 'Reportes',
  icon: BarChart3,
  group: 'Inventario',   // sección del sidebar
  order: 12,             // orden dentro del grupo
  path: '/:productId',   // ruta con parámetro; se lee con useParams()
}
```

Solo la página índice de un recurso aparece en el sidebar; las demás se navegan
desde ella.

### Grupos de navegación

Con 15 entradas un sidebar plano deja de ser usable, así que se agregó `group`
a `PanelPageMeta` y a `ResourceConfig`. `buildNavigation()`
(`src/ui/panel/navigation.ts`) arma las secciones; el orden de un grupo es el de
su primera página, así que mover una sección entera es cambiar un `order`.

```
(sin grupo)   Dashboard
INVENTARIO    Existencias · Movimientos · Reportes
DOCUMENTOS    Compras · Ventas · Transferencias
CATÁLOGO      Productos · Categorías · Unidades · Listas de precio · Ubicaciones
TERCEROS      Proveedores · Clientes
SISTEMA       Usuarios
```

---

## 2. Capa de datos

`src/lib/query.ts` — deliberadamente pequeña, sin dependencias nuevas.

```ts
const products = useQuery(
  async () => unwrap(await supabase.from('products').select('*')),
  { tags: ['products'], deps: [id], enabled: id != null },
)
// → { data, error, loading, initialLoading, refetch }
```

Lo que hace que el panel se sienta **una aplicación** y no una colección de
pantallas es la **invalidación por tags**:

```ts
invalidate('purchases', ...INVENTORY_TAGS)
```

Confirmar una compra toca `purchases`, `inventory`, `inventory_lots` e
`inventory_movements` a la vez. Cualquier pantalla montada suscrita a esos tags
se refresca sola, sin saber quién causó el cambio. El dashboard, la lista de
existencias y el kardex se actualizan aunque la acción haya ocurrido en otra
ruta.

Detalles de implementación que importan:

- **`unwrap()` es genérico sobre la respuesta completa**, no sobre `data`. La
  respuesta de PostgREST es una unión (`{data, error: null}` |
  `{data: null, error}`); declarar el parámetro como `{ data: T | null }` hace
  que TypeScript infiera `T` desde ambas ramas y colapse a `never` cada vez que
  la llamada se escribe en línea como `unwrap(await …)`.
- **`loading` es derivado**, no estado propio: se compara la clave de la última
  petición resuelta contra la actual. Así nada se escribe sincrónicamente desde
  un efecto.
- Los datos anteriores **siguen visibles** mientras se recarga, para que las
  tablas no queden en blanco al invalidar.

`src/lib/references.ts` expone los catálogos que llenan los `<select>`
(`useUnits`, `useLocations`, `useProductOptions`, …). Comparten los tags de las
pantallas de catálogo, así que crear una ubicación en una pantalla actualiza el
selector de ubicación en otra.

---

## 3. Kit de UI

`src/ui/components/` — todo lo visual sale de acá, para que una pantalla nueva
se vea igual que las existentes sin decidir nada.

| Componente | Para qué |
|---|---|
| `PageHeader` | Título, descripción, back link, acciones. Toda página abre con uno. |
| `Card` / `Section` | Superficie y bloque titulado. |
| `DataTable` | Tabla con búsqueda, filtros, paginación, estados de carga/error/vacío y filas clicables. |
| `Stat` / `StatGrid` | Tiles de KPI, opcionalmente enlazados a la pantalla que explica el número. |
| `TextField` / `SelectField` / `TextareaField` / `CheckboxField` | Controles de formulario. |
| `Modal` / `ConfirmDialog` | Diálogos; `ConfirmDialog` se usa para toda acción irreversible. |
| `Badge` / `StatusBadge` / `ExpirationBadge` | Estados de documento y de vencimiento, con los mismos colores en todas partes. |
| `DescriptionList` | Pares clave/valor de las fichas de detalle. |
| `EmptyState` / `ErrorState` | Vacíos y errores. |

`src/ui/toast/` da el feedback de las escrituras. Importa sobre todo para las
acciones cuyo efecto visible ocurre en **otra** pantalla: confirmar una compra
cambia el inventario, no la compra.

`src/lib/format.ts` centraliza el formato de dinero, cantidades, porcentajes y
fechas (es-CO). Detalle no obvio: una columna `date` (`2026-09-01`) se formatea
leyendo sus partes, porque `new Date('2026-09-01')` la interpreta como UTC y
muestra el día anterior en cualquier huso al oeste de Greenwich.

---

## 4. `CrudPage`: los catálogos son un objeto de configuración

Seis recursos (unidades, categorías, ubicaciones, listas de precio,
proveedores, clientes) son el mismo CRUD. En vez de seis páginas casi idénticas
hay una configuración declarativa cada uno:

```tsx
const config: CrudConfig<Unit> = {
  table: 'units', tag: 'units',
  title: 'Unidades de medida', singular: 'unidad', gender: 'f',
  columns: [ { key: 'code', header: 'Código', cell: (u) => <Mono>{u.code}</Mono> }, … ],
  fields:  [ { name: 'code', label: 'Código', required: true }, … ],
}

export default function UnitsPage() {
  return <CrudPage config={config} />
}
```

`CrudPage` arma la tabla, el modal de alta/edición, la confirmación de borrado y
el feedback. Un arreglo a ese comportamiento llega a los seis a la vez.

Los recursos que **no** son CRUD simple tienen páginas propias: productos
(ficha con existencias, lotes e historial de precios) y los tres documentos
(compras, ventas, transferencias), que necesitan el flujo borrador → confirmar.

`src/ui/crud/crud-client.ts` es el único lugar donde el cliente tipado se
ensancha a propósito, porque `CrudPage` elige la tabla en tiempo de ejecución y
TypeScript colapsaría una unión de seis formas de tabla a `never`. Está acotado
a las cuatro operaciones que realiza y documentado ahí mismo.

---

## 5. El flujo de extremo a extremo

```
Login
  └─ Dashboard ──────────────── KPIs, borradores pendientes, actividad, alertas
       ├─ Catálogo
       │    ├─ Unidades / Categorías / Ubicaciones / Listas de precio
       │    └─ Productos ─── ficha: existencias por lote · precios · historial
       ├─ Documentos
       │    ├─ Compra   borrador → [definir lotes] → confirmar → entra al stock
       │    ├─ Venta    borrador → confirmar → sale por FEFO
       │    └─ Transf.  borrador → confirmar → mueve lote y costo
       └─ Inventario
            ├─ Existencias ── por producto/ubicación/lote + ajuste manual
            ├─ Movimientos ─ kardex con signo, enlazado a su documento
            └─ Reportes ──── vencimientos, valorización, bajo mínimo, consistencia
```

Decisiones de producto que reflejan el modelo:

- **Un borrador no afecta el inventario.** Se puede editar y borrar; al
  confirmar, el documento queda inmutable y el cambio queda en el kardex.
- **Confirmar es una sola llamada RPC** (`confirm_purchase`, `confirm_sale`,
  `confirm_transfer`). Crea lotes, escribe el movimiento, lo aplica y cambia el
  estado en una transacción. Si algo falla, no queda nada a medias.
- **La compra avisa qué líneas necesitan lote** antes de confirmar. Un producto
  con `track_lot` no puede tener capa de costo automática: el número de lote lo
  pone el usuario. Eso convierte un fallo de confirmación en un paso pendiente
  evidente.
- **La venta avisa si falta stock** comparando contra las existencias de su
  ubicación, y muestra después qué lotes consumió FEFO.
- **La transferencia muestra el disponible en el origen** por lote.
- **El vencimiento no descuenta stock.** Los reportes lo marcan; retirarlo es un
  ajuste explícito.
- **Los importes los calcula la base de datos.** Las líneas usan columnas
  generadas y las cabeceras un trigger; el panel solo previsualiza el total con
  la misma fórmula, y nunca lo guarda.

---

## 6. Desarrollo

```bash
npm run db:start     # levanta Supabase local (Docker)
npm run db:reset     # recrea el esquema + seed
npm run db:types     # regenera src/lib/database.types.ts
npm run dev
npm run lint
npm run build
```

**Regenerá los tipos después de cada migración.** Todo el panel está tipado
contra `database.types.ts`: un `select` con una columna que no existe, o un RPC
con el argumento equivocado, falla en compilación y no en producción.

### A qué Supabase apunta el panel

`.env.local` define `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Para
trabajar contra el stack local, los valores son los que imprime
`npx supabase status`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY de supabase status>
```

Para trabajar contra el proyecto hospedado, primero hay que aplicarle el
esquema:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```
