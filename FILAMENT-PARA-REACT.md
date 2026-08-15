# Filament → React: Guía de arquitectura para construir capacidades equivalentes

> **Propósito:** Este documento resume la arquitectura del monorepo **Filament** (framework full-stack para Laravel + Livewire, v6, PHP 8.2+, Livewire 4). Se escribió investigando el código fuente para servir de referencia al **desarrollar capacidades equivalentes en React** (formularios reactivos, tablas de datos, acciones con modales, widgets y notificaciones).
>
> El objetivo **no es portar** Filament, sino entender **qué problema resuelve cada pieza y con qué patrón**, para recrear esas capacidades con idioms React.

---

## 1. Resumen del proyecto

| Aspecto | Detalle |
|---|---|
| Qué es | Colección de componentes full-stack para Laravel: admin panels, forms, tables, infolists, notifications, actions, widgets |
| Stack | PHP 8.2+ · Laravel 11+ · Livewire 4 · Alpine.js 3 · Tailwind CSS 4 · Chart.js 4 · TipTap 3 (editor) · esbuild/Vite |
| Forma | Monorepo con paquetes en `packages/` (16 paquetes) |
| Licencia | MIT |

### Paquetes y su capa (dependencia → de arriba hacia abajo)

```
support  (utilidades base: closures, componentes, assets, colores)
   │
   ▼
schemas  (sistema de UI declarativa: Schema, Component, layouts, estado, validación)
   │
   ├─► forms         (campos de entrada reactivos)
   ├─► infolists     (vistas de solo lectura)
   ├─► tables        (tablas de datos, filtros, columnas, bulk)
   ├─► actions       (acciones con modales)
   ├─► notifications (sistema de notificaciones)
   ├─► widgets       (widgets de dashboard)
   │
   ▼
panels   (framework completo de admin panel: recursos CRUD, páginas, auth, navegación)
```

Otros: `query-builder`, `upgrade`, plugins de Spatie (`media-library`, `settings`, `tags`, `google-fonts`), `spark-billing-provider`.

### Anatomía de cada paquete

Todos los paquetes comparten la misma estructura:

```
packages/<pkg>/
├── src/                     # PHP: componentes, concerns (traits), contracts, commands
├── resources/views/         # Vistas Blade (layout / envoltorios)
├── resources/css/           # CSS por componente (clases hook fi-*) + index.css
├── resources/js/            # JS: Alpine components, index.js
├── resources/lang/<locale>/ # Traducciones
├── dist/                    # JS/CSS compilados por esbuild (los registra el ServiceProvider)
├── stubs/                   # Plantillas para comandos make:*
└── <Pkg>ServiceProvider.php # Registra vistas, traducciones, comandos, assets y componentes Livewire
```

---

## 2. Patrones de diseño fundamentales

Estos son los **5 patrones que definen TODO Filament**. Reconocerlos es clave para traducirlos a React.

### 2.1 `make()` → `configure()` → `setUp()` (factory fluido)

Todo componente se crea con un factory estático que usa el contenedor de Laravel (`app()`) para permitir que el usuario reemplace implementaciones. Luego `configure()` corre `setUp()` (defaults) + cualquier configuración global registrada.

```php
// packages/schemas/src/Schema.php:64
public static function make(?HasSchemas $livewire = null): static
{
    $static = app(static::class, ['livewire' => $livewire]); // DI resuelve el constructor
    $static->configure();

    return $static;
}
```

**En React:** los componentes son funciones/JSX. El equivalente al "config object" declarativo es pasar `props` o un árbol de configuración. El `setUp()` (defaults) es un `defaultProps` / destructuring con valores por defecto / un `useSchemaBuilder` hook.

### 2.2 API fluida + propiedades nullable `T | Closure | null`

Cada opción configurable es una propiedad nullable (para poder "deshacerla" pasando `null`) y el setter fluido devuelve `$this`.

```php
// packages/schemas/src/Components/Concerns/CanBeDisabled.php:18-30
protected bool | Closure $isDisabled = false;

public function disabled(bool | Closure $condition = true): static
{
    $this->isDisabled = $condition;
    $this->saved(fn (Component $component): bool => ! $component->evaluate($condition));
    return $this;
}

public function isDisabled(): bool
{
    return (bool) $this->evaluate($this->isDisabled);
}
```

**En React:** el "conditional/prop que puede ser función" se traduce a props que aceptan `boolean | () => boolean`. Los getters `isX()/getX()` se convierten en `useMemo`/funciones derivadas que resuelven closures.

### 2.3 `evaluate()` — closures con inyección de dependencias por nombre y por tipo

Es el motor más importante: un closure recibe **automáticamente** el contexto (`$state`, `$record`, `$livewire`, `$get`, `$set`, `$model`, `$component`) resolviendo parámetros por **nombre** y por **tipo** mediante reflexión.

```php
// packages/support/src/Concerns/EvaluatesClosures.php
public function evaluate(Closure | null $value, array $namedInjections = [], array $typedInjections = []): mixed
{
    if (! $value instanceof Closure) return $value;
    // ReflectionFunction → resuelve cada parámetro del closure por nombre/tipo
}
```

Uso típico (por eso los closures son tan limpios):

```php
->hidden(fn (Get $get): bool => ! $get('other_field'))          // inyección por tipo
->placeholder(static fn (Select $component): ?string => ...)      // inyección del propio componente
->visible(fn (): bool => $this->canView())                       // $this = el Livewire component
```

**En React:** esto es equivalente a funciones que reciben un **context object** (`({ state, record, get, set, component }) => ...`) o a hooks que leen de un store/context (`useFormField(name)`). El "inyectado por nombre/tipo" de PHP se vuelve explícito: un único argumento de contexto desestructurable.

### 2.4 Composición por traits (`Concerns/`) en vez de herencia profunda

Un componente se arma **sumando traits** que aportan capacidades (nunca herencia profunda):

```php
// packages/forms/src/Components/TextInput.php:18-32
class TextInput extends Field implements CanHaveNumericState, Contracts\CanBeLengthConstrained, Contracts\HasAffixes, HasEmbeddedView
{
    use CanStripCharactersFromState, CanTrimState;
    use Concerns\CanBeAutocapitalized, CanBeAutocompleted, CanBeLengthConstrained,
        CanBeReadOnly, HasAffixes, HasDatalistOptions, HasExtraInputAttributes,
        HasInputMode, HasPlaceholder, HasStep;
    use HasExtraAlpineAttributes;
}
```

**En React:** los traits → **hooks de composición** (`useFieldState`, `useLabel`, `useValidation`) y **composición de componentes** (wrapper HOC / context providers). El equivalente a `Field` es un `FieldProvider`/`FieldContext` con hooks consumidores.

### 2.5 Estado: `statePath` absoluto + "form store" único

Todo campo vive en un árbol con una **ruta de estado absoluta** (`getStatePath()`, cacheada) que apunta dentro del estado del Livewire component. Soportan rutas relativas (`../`, `./`, `/absolutas`) resueltas contra el contenedor.

```php
// packages/schemas/src/Components/Concerns/HasState.php:719
public function getStatePath(): string
{
    // containerPath . ownPath (cacheado)
}
```

`Get`/`Set` (`packages/schemas/src/Components/Utilities/`) resuelven rutas relativas y leen/escriben el estado de cualquier campo hermano. Esto es lo que permite `fn (Get $get) => $get('other_field')`.

**En React:** el estado del formulario es un **store global único** (React Context + `useReducer` / Zustand). Las rutas relativas (`../`, `../`) se pueden implementar tal cual sobre un árbol de nombres. El equivalente de `Get`/`Set` es un par de helpers `getFieldValue(path)` / `setFieldValue(path, value)` expuestos por el store.

---

## 3. Cómo se serializa un esquema PHP → HTML → (React: props → árbol)

Filament hace render del lado servidor y usa Livewire para reactividad. El flujo:

```
Livewire component (HasSchemas)
  └─ getSchema('form') → Schema::make($livewire)->key('form')
       └─ Schema::toEmbeddedHtml()   [schema.php:146]
            └─ renderEmbeddedHtml()  [Schema.php:151]  → <div wire:partial x-data="filamentSchema(...)">
                 └─ por cada componente: Component::toSchemaHtml()  [Component.php:137]
                      └─ <div x-data="filamentSchemaComponent({path, containerPath, $wire})">
                           └─ $component->toHtml()
                                └─ toEmbeddedHtml()  ← HTML del control (generado en PHP, sin Blade)
```

Puntos clave de la serialización:

- **El wrapper de cada componente** (`toSchemaHtml()`) inyecta `x-data="filamentSchemaComponent({ path, containerPath, $wire })"` → todo componente del lado JS tiene `$get()`, `$set()`, `$state`.
- **Los ocultos se renderizan igual** con `class="fi-hidden"` (para no romper el DOM diffing de Livewire). → En React: `display:none` manteniendo montado (`keepMounted`).
- **Los campos con JS pesado** (Select, DateTimePicker, RichEditor…) usan `x-load-src` + `x-data` con config serializada a JSON vía `Js::from()`.
- **RPC al backend:** `Livewire.fireAction($wire, 'callSchemaComponentMethod', [key, method, args])` → métodos PHP marcados `#[ExposedLivewireMethod]`. Ej. opciones dinámicas de un `Select`.
- **Render parcial:** `wire:partial="schema-component::KEY"` → Livewire 4 re-renderiza solo ese nodo.

### Mapa conceptual → React

| Capa Filament (PHP/Blade/Alpine) | Equivalente en React |
|---|---|
| `Schema::make()->schema([...])` (árbol declarativo PHP) | Árbol declarativo de nodos (JSX / config objects) |
| `Schema` + `parentComponent`/`container` | Context de "form store" (Provider) |
| `HasChildComponents` (sub-esquemas nombrados: `default`, `footer`, `after_header`) | Componentes compuestos / slots nombrados |
| `statePath` + `data_set()` en el Livewire | Ruta de campo en el store global (`useField(name)`) |
| `applyStateBindingModifiers('wire:model')` → `.live`, `.blur`, `.debounce` | `value` + `onChange` con normalización de timing |
| `Js::from()` vuelca config al `x-data` | props serializadas al montar el componente |
| `Livewire.fireAction(...)` → `#[ExposedLivewireMethod]` | Server actions / RPC (server functions, tRPC, fetch) |
| `wire:partial` (render parcial Livewire 4) | React Server Components / re-render selectivo |
| `hiddenJs`/`visibleJs` + `fi-hidden` | `hidden` prop con `keepMounted` |
| `getValidationRules()` → validador de Laravel | Schema de validación derivado del árbol (zod/yup) |
| Hooks de ciclo (`afterStateHydrated`, `afterStateUpdated`, `beforeStateDehydrated`) | `onMount`, `onChange`, `onSubmit`, transform |
| `StateCast` (`set()`/`get()` PHP↔JS) | Normalizadores de campo entrada/salida |

---

## 4. Ciclo de vida del estado de un campo

`packages/schemas/src/Components/Concerns/HasState.php` (por componente) y `packages/schemas/src/Concerns/HasState.php` (por contenedor `Schema`).

Ciclo completo de un estado:

1. **`fill()`** — el contenedor rellena el estado inicial (defaults + datos del modelo).
2. **`hydrateState()`** — al montar: aplica los `StateCast::set()` (PHP→frontend) y dispara `afterStateHydrated()`.
3. **`getState()` / `rawState()`** — lecturas/escrituras durante la interacción; escribir limpia la caché de child schemas.
4. **`dehydrateState()`** — al enviar: aplica `dehydrateStateUsing()`, `beforeStateDehydrated()`, `StateCast::get()` (frontend→PHP).
5. **`mutateDehydratedState()`** — transforma el resultado final.

Hooks configurables que el usuario puede enganchar: `afterStateHydrated()`, `afterStateUpdated()`, `beforeStateDehydrated()`, `dehydrateStateUsing()`, `mutateDehydratedStateUsing()`, `default()`, `dehydrated()`, `saved()`.

> **Para React:** implementa el ciclo como hooks del campo: `useFieldState({ path, defaultValue, castIn, castOut, onHydrate, onChange, onDehydrate })`. El "transform de entrada/salida" (`StateCast`) es un par de funciones `normalizeIn`/`normalizeOut`.

### Child schemas dinámicos (Repeater/Builder)

El caso más complejo de estado→esquemas: `Repeater` convierte su raw state en items con **UUID como key**, y cada item genera su propio `childSchema`. `areCachedDefaultChildSchemasFresh()` invalida la caché comparando un snapshot del estado.

```php
// packages/forms/src/Components/Repeater.php
hydrateItems(): $items[$uuid] = $itemData   // raw state → items keyed by UUID
getChildSchema($uuid)                        // genera el esquema por item
getAddAction() → rawState(+newUuid) → fill() → afterStateUpdated() → partiallyRender()
```

> **Para React:** array de items con key UUID, cada item = componente `<RepeaterItem>` que recibe su propio store/context. El equivalente a "invalidar caché de child schemas" es simplemente re-render (React ya lo hace por inmutabilidad).

---

## 5. Capacidades por paquete

### 5.1 `forms` — Formularios reactivos

**Base:** `src/Components/Field.php` (base de todos los campos) → extiende el `Component` de schemas. `Field::make($name)` establece `name()` **y** `statePath($name)` automáticamente (el nombre ES la ruta).

**Composición de un campo:** `Field` + traits → subclase concreta (`TextInput`, `Select`, `Checkbox`, `Toggle`, `Repeater`, `Builder`, `RichEditor`, `FileUpload`, `DateTimePicker`, `ColorPicker`, `KeyValue`, `TagsInput`, `Slider`, `CodeEditor`, `MarkdownEditor`, `OneTimeCodeInput`, `TableSelect`, `ModalTableSelect`, `LivewireField`, etc.).

**Campos canónicos a leer como referencia:**
- `TextInput.php:309` `toEmbeddedHtml()` — genera el HTML embebido + `wire:model` + `wrapInputHtml()` (afijos/iconos) + `wrapEmbeddedHtml()` (label + errores).
- `Select.php:1824` — patrón "JS pesado": render nativo si no necesita search; si no, `x-load-src` + Alpine component + **RPC** (`getSearchResultsForJs`) + `state: $wire.$entangle('path')` + `wire:ignore`.
- `Repeater.php:1526` — child schemas dinámicos por estado.

**Validación declarativa:** `Concerns/CanBeValidated.php` (~1060 líneas) — `rule()`, `required()`, `email()`, `unique()`, `exists()`, `requiredIf()`, `distinct()`… Todo se guarda como pares `[$rule, $condition]`, se evalúa en `getValidationRules()` y se **deshidrata** a reglas de Laravel en `dehydrateValidationRules()/Messages()/Attributes()`.

> **Para React:** cada campo expone reglas declarativas; deriva un schema de validación del árbol de campos (`required`, `email`, `min`, `unique`, etc.) — concepto idéntico a zod/yup, pero generado desde la declaración del formulario.

### 5.2 `tables` — Tablas de datos

**Estructura:**
- `src/Table.php` — objeto de configuración fluido (view `filament-tables::index`, ~44 traits: `HasColumns`, `HasFilters`, `HasQuery`, `CanSearchRecords`, `CanSortRecords`, `CanPaginateRecords`, `CanGroupRecords`, `CanReorderRecords`, `CanSummarizeRecords`, `HasActions`, `HasBulkActions`).
- `src/TableComponent.php` — componente Livewire que une `InteractsWithTable` + `InteractsWithActions` + `InteractsWithSchemas`.
- `src/Concerns/HasRecords.php` — `getFilteredTableQuery()`: aplica filtros + búsqueda + eager loading + aggregates por columna.
- `src/Columns/` — `Column` (base) + `TextColumn`, `BadgeColumn`, `BooleanColumn`, `CheckboxColumn`, `ColorColumn`, `IconColumn`, `TextInputColumn`, `ToggleColumn`, `ColumnGroup`, `Layout` (Split/Stack).
- `src/Filters/` — `BaseFilter`, `Filter` (checkbox/toggle), `SelectFilter`, `MultiSelectFilter`, `TernaryFilter`, `TrashedFilter`, `QueryBuilder`.

**Comportamientos clave:**
- Búsqueda global, ordenación, paginación, agrupación colapsable, reordenación (`x-sortable`), selección con checkbox + **selección de todos** (`getAllSelectableTableRecordKeys()`) + soporte `BelongsToMany` y deselección con seguimiento.
- Estado de tabla sincronizado con URL vía atributos `#[Url]` (`tableSearch`, `tableSortColumn`, `tableSortDirection`, `tableFilters`, `activeTab`).
- Columnas editables inline (`TextInputColumn`, `ToggleColumn`, `SelectColumn`) → son campos de forms embebidos en celdas.
- Filtros montados como un schema de formulario oculto (`filtersFormSchema`).
- Cabecera con contador `aria-live` de resultados.

> **Para React:** tablas = datos del servidor (paginación/búsqueda en el backend o en memoria) + componentes de columna declarativos (`column={{ type: 'text', label, sortable }}`). El estado de tabla (sort, filters, page, search) es un único objeto que puedes serializar a la URL para deep-linking — replicando `#[Url]`.

### 5.3 `actions` — Acciones con modales

**Base:** `src/Action.php` (extends `ViewComponent` + `HasEmbeddedView`). Variantes: `ActionGroup`, `BulkAction`, `BulkActionGroup`, `DeleteAction` (ejemplo con `setUp()`: `requiresConfirmation()`, `keyBindings(['mod+d'])`), `AttachAction`, `AssociateAction`, `ButtonAction`.

**Motor Livewire:** `src/Concerns/InteractsWithActions.php` (~906 líneas):
- Estado: `mountedActions` (pila de modales anidados), `cachedActions`, `mountedActionShouldOpenModal()`.
- Flujo: `mountAction()` → resuelve acción → `callMountedAction()` (transacción BD + validación de schema + hooks `callBefore/After` + notificaciones success/failure + redirects) → `unmountAction()`.
- Resolución: `resolveAction()` busca el método `*Action()` en el componente; `resolveTableAction()` usa `getTable()->getAction()/getBulkAction()`.
- Modales anidados: `getMountedActionSchema()` con `statePath("mountedActions.{index}.data")` → cada modal apilado tiene su propio "form store" por índice.
- Concerns: `CanOpenModal` (width, alignment, slide-over), `CanRequireConfirmation`, `CanNotify`, `CanGenerateHtml`.

**JS:** `resources/js/components/modals.js` — `filamentActionModals`: pila por `actionNestingIndex`, gestión de foco, eventos DOM `open-modal`/`close-modal-quietly`/`sync-action-modals`.

> **Para React:** acciones = funciones declaradas + tipos de UI (`modal`, `slideOver`, `confirm`). Un sistema de modales con **pila de anidamiento** (cada modal abre el siguiente) es directamente un stack de context providers. El form del modal es un store propio por índice (como `mountedActions.{index}.data`). Acciones como "eliminar" usan `confirm` nativo o modal custom.

### 5.4 `widgets` — Widgets de dashboard

- `src/Widget.php` — componente Livewire base: `canView()`, `getColumnSpan()`, `render()`, `make()` → `WidgetConfiguration`. Traits `CanAuthorizeAccess`, `CanBeLazy`.
- `src/ChartWidget.php` — `getType()` abstracto; subtipos `LineChartWidget`, `BarChartWidget`, `PieChartWidget`, `DoughnutChartWidget`, `PolarAreaChartWidget`, `RadarChartWidget`, `ScatterChartWidget`, `BubbleChartWidget`. Usa Chart.js + `wire:poll` → `updateChartData()`; `$dataChecksum` (`#[Locked]` = md5) para evitar re-render si los datos no cambian.
- `src/StatsOverviewWidget.php` — `Stat` (`make($label, $value)`, `chart`, `icon`, `descriptionIcon`).
- `src/TableWidget.php` — tabla embebida con `PaginationMode::Simple`.
- `src/Concerns/CanPoll.php` — `$pollingInterval = '5s'`.

> **Para React:** widgets = componentes autocontenidos con su propio data-fetching (`useEffect` + polling/interval). El checksum de datos es `useMemo`/`useSyncExternalStore`. Stats = lista declarativa de tarjetas con valor + icono + sparkline.

### 5.5 `notifications` — Notificaciones

Multi-transporte:
- `src/Notification.php` — API fluida `make(?id)` → `send()` (push a sesión), `broadcast()` (por usuario), `sendToDatabase()`. `fromArray()/toArray()` para transporte. `safeViews()` (whitelist de vistas por seguridad).
- `src/Livewire/Notifications.php` — receptor global que lee `filament.notifications` de la sesión (eventos `notificationsSent`/`notificationSent`).
- `src/Livewire/DatabaseNotifications.php` — campana/modal con polling 30s, `markAllNotificationsAsRead`, `clearNotifications`.
- `resources/js/Notification.js` — clase fluida JS para disparar notificaciones desde el frontend (`window.FilamentNotification`).
- Broadcast con Echo (channels privados) para notificaciones en tiempo real.

Comportamiento UI: `notificationComponent` Alpine — transiciones, auto-cierre por duración (respeta `:hover`), animación FLIP de reordenamiento, `role="status"` + `aria-atomic="false"` para accesibilidad.

> **Para React:** notificaciones = API imperativa global (`notify.success('x')`) + un `<NotificationProvider>` con cola y auto-dismiss. Tipos (success/error/warning/info) con iconos y colores. Persistencia opcional (DB) + tiempo real (WebSocket) como capas opcionales sobre el mismo componente UI.

### 5.6 `panels` — El admin panel completo

**`Panel.php`** — objeto de configuración compuesto por ~30 traits: `HasAuth`, `HasRoutes`, `HasNavigation`, `HasComponents`, `HasAssets`, `HasDarkMode`, `HasSidebar`, `HasTopbar`, `HasBrandLogo`, `HasBrandName`, `HasFont`, `HasColors`, `HasTenancy`, `HasGlobalSearch`, `HasPlugins`, `HasRenderHooks`, `HasMiddleware`, `HasNotifications`, `HasSpaMode`, `HasUnsavedChangesAlerts`, `HasBreadcrumbs`, `HasIcons`, `HasMaxContentWidth`, `HasDatabaseTransactions`, `HasAvatar`, `HasSubNavigation`, `HasUserMenu`.

```php
// packages/panels/src/PanelProvider.php — lo que define el usuario
public function panel(Panel $panel): Panel
{
    return $panel
        ->default()
        ->id('admin')
        ->path('admin')
        ->login()
        ->resources([...])
        ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources');
}
```

**Recursos CRUD** (`src/Resources/Resource.php`): clase abstracta donde el usuario declara `form()`, `table()`, `getPages()` (registro de rutas: list/create/edit/view). Páginas concretas:
- `ListRecords` — tabla + tabs, estado `#[Url]`.
- `CreateRecord` — `create()`: mutación + `saveRelationships()` + evento `RecordCreated`.
- `EditRecord` — `mount($record)`, `HasRelationManagers`, alerta de cambios sin guardar.
- `ViewRecord` — infolist en vez de form.

**Navegación** (`src/Navigation/`): `NavigationManager`, `NavigationItem` (label, icon, url, group, sort, badge, `isActive` por ruta), `NavigationGroup`, `NavigationBuilder` (API fluida).

**Global Search** (`src/GlobalSearch/`): recorre los recursos, filtra `canGloballySearch()`, agrupa por `getPluralModelLabel()`.

**Sistema de rutas:** `routes/web.php` — grupo `filament.*`; cada página se registra con `Route::get(path, Page::class)->middleware(...)->name("filament.{panel}.pages.{slug}")`. Middleware del panel: `Authenticate`, `SetUpPanel` (fija el panel actual), `IdentifyTenant`, `DispatchServingFilamentEvent`.

> **Para React:** el panel = **layout shell** (sidebar + topbar + contenido) con sistema de rutas anidadas (react-router). "Resource" = un conjunto declarativo de rutas CRUD generadas a partir de una configuración (equivalente a un registro de rutas + un layout por recurso). La navegación se deriva de los recursos registrados (labels, iconos, grupos, badges). Las páginas CRUD genéricas (`ListRecords`, `CreateRecord`, etc.) son **componentes genéricos** que reciben la configuración del resource.

---

## 6. Frontend: JS y CSS

### 6.1 JS

- **Alpine.js** es el motor de interactividad ligero (en lugar de un framework). Cada feature "pesada" es un `Alpine.data()` registrado: `filamentSchemaComponent`, `filamentTable`, `filamentActionModals`, `filamentModal`, `filamentDropdown`, `chart`, `notificationComponent`, `selectFormComponent`, etc.
- Los componentes se cargan **bajo demanda** con `x-load` + `x-load-src` (el servicio de assets sirve `js/{package}/components/{id}.js`).
- Livewire conecta servidor↔cliente: `wire:model`, `wire:click`, `wire:poll`, `wire:partial`, `$wire.$entangle()`.
- Stores Alpine de panel: `$store.theme` (dark mode), `$store.sidebar` (persistido en localStorage).
- `packages/panels/resources/js/dark-mode.js` — tema light/dark/system con `localStorage` + `prefers-color-scheme` + clase `.dark` en `<html>`.

### 6.2 CSS — sistema de hooks

**Regla de oro (ver CLAUDE.md): nunca usar clases Tailwind en Blade; todo Tailwind va en CSS con `@apply`.**

- Naming de hooks: `fi-` + código de paquete + abreviatura.
  - `fi-fo-` forms · `fi-ta-` tables · `fi-ac-` actions · `fi-in-` infolists · `fi-no-` notifications · `fi-sc-` schemas · `fi-wi-` widgets · layout del panel sin sufijo.
- Ejemplo: `packages/support/resources/css/components/button.css`:
  ```css
  .fi-btn { @apply relative grid shrink-0 grid-flow-col items-center justify-center gap-[0.5rem] rounded-lg font-semibold outline-none transition duration-75 focus-visible:ring-2 ring-offset-1; }
  .fi-btn.fi-size-md { @apply h-10 px-3.5 text-sm; }
  .fi-btn.fi-color-danger { @apply bg-danger-600 hover:bg-danger-500; }
  ```
- **Colores del tema** (`ColorManager`): 6 colores base (danger=Red, gray=Zinc, info=Blue, primary=Amber, success=Green, warning=Amber), cada uno con paletas `50..950`. Se exponen como **CSS custom properties** `--danger-500` etc. y clases `.fi-color-danger` que mapean `--color-{n} → var(--danger-{n})`.
- Tailwind v4: `@layer base, utilities, components`; dark mode con `@variant dark (&:where(.dark, .dark *))`; `@theme inline` para fuentes.

> **Para React:** adopta el mismo enfoque de **design tokens** (CSS variables por color) + un sistema de clases de hook propias (`fi-*`). Dark mode = `[data-theme]`/`.dark` en la raíz + variables CSS que cambian. Evita Tailwind inline en componentes; centralízalo en tu CSS.

---

## 7. Assets y build

- Cada paquete registra sus assets compilados en su ServiceProvider: `FilamentAsset::register([...], package: 'filament/<pkg>')` con `Js::make()`, `AlpineComponent::make()`, `Css::make()`, `Theme::make()`, `Font::make()`.
- `AssetManager` (`packages/support/src/Assets/AssetManager.php`) — `register()`, `getJsAssets()`, `getCssAssets()`, `getTheme()`.
- Build: `node bin/build.js` usa **esbuild** para compilar cada `resources/js/index.js` a `dist/js/{package}/index.js` y cada AlpineComponent a `dist/js/{package}/components/*.js`. CSS de panels: `tailwindcss -i packages/panels/resources/css/theme.css -o dist/theme.css`.
- El CSS base de cada paquete se compila con `@tailwindcss/cli` a `dist/index.css`.
- `config/filament.php`: `broadcasting` (presence channels), `default_filesystem_disk`, `assets_path`.

---

## 8. Accesibilidad (patrones a replicar)

- Tablas: `aria-live` para recuento de resultados, checkboxes con label explícito, ordenación accesible.
- Modales: gestión de foco (`$focus.focused()`), bloqueo de scroll con contador, `aria-hidden` al resto de la página.
- Notificaciones: `role="status"` + `aria-atomic="false"`, respeto de `prefers-reduced-motion` (en el tool de screenshots de docs, `prefers-reduced-motion: reduce`).
- `fi-sr-only` para skip-links.
- Colores con contraste garantizado por las paletas 50-950.

---

## 9. Glosario de archivos clave para leer (en orden)

1. `packages/support/src/Components/Component.php` — base de todo componente (traits core).
2. `packages/support/src/Components/ViewComponent.php` — `toHtml()`, render de vistas, `HasEmbeddedView`.
3. `packages/support/src/Concerns/EvaluatesClosures.php` — el motor `evaluate()`.
4. `packages/schemas/src/Schema.php` — contenedor raíz + `renderEmbeddedHtml()`.
5. `packages/schemas/src/Components/Component.php` — `toSchemaHtml()` (serialización por componente).
6. `packages/schemas/src/Concerns/InteractsWithSchemas.php` — descubrimiento de esquemas + RPC + validación.
7. `packages/schemas/src/Components/Concerns/HasState.php` — ciclo de vida del estado de campo.
8. `packages/schemas/src/Concerns/HasState.php` — ciclo de vida del estado del contenedor.
9. `packages/schemas/src/Components/Concerns/HasChildComponents.php` — sub-esquemas nombrados.
10. `packages/forms/src/Components/Field.php` — base de campos + `wrapEmbeddedHtml()`/`wrapInputHtml()`.
11. `packages/forms/src/Components/TextInput.php` — campo canónico (HTML embebido + state binding).
12. `packages/forms/src/Components/Select.php` — patrón "JS pesado" + RPC.
13. `packages/forms/src/Components/Repeater.php` — child schemas dinámicos por estado (UUID).
14. `packages/tables/src/Table.php` — objeto tabla (~44 concerns).
15. `packages/tables/src/Concerns/InteractsWithTable.php` + `HasRecords.php` — motor de datos.
16. `packages/actions/src/Concerns/InteractsWithActions.php` — máquina de modales de acciones.
17. `packages/actions/resources/js/components/modals.js` — pila de modales en el cliente.
18. `packages/notifications/src/Notification.php` — API de notificaciones multi-transporte.
19. `packages/panels/src/Panel.php` — configuración del panel completo.
20. `packages/panels/src/Resources/Resource.php` — declaración de un recurso CRUD.

---

## 10. Checklist de capacidades para implementar en React

| Capacidad | Referencia Filament | Patrón React sugerido |
|---|---|---|
| Form store global con rutas de campo | `statePath`, `Get`/`Set` | React Context + reducer (o Zustand) + `useField(path)` |
| Closures con contexto (en vez de `evaluate`) | `evaluate()` + inyección | Funciones que reciben `{ state, record, get, set, ... }` |
| Campos declarativos reactivos | `forms/src/Components/*` | Componentes con `name` que se auto-registran en el store |
| Validación declarativa derivada del árbol | `CanBeValidated` | Schema zod/yup generado desde la declaración |
| Transform de entrada/salida por campo | `StateCast` | `normalizeIn`/`normalizeOut` en el campo |
| Hooks de ciclo del campo | `afterStateHydrated/Updated`, `dehydrate*` | `useEffect`/callbacks de `useField` |
| Tabla con sort/filter/paginate/group | `tables/src/Table.php` | Estado de tabla en un hook `useTableState` + serializable a URL |
| Selección con "select all" y bulk | `HasBulkActions` | Store de selección (`Set` de ids + modo deselección) |
| Columnas declarativas (text/badge/boolean/…) | `tables/src/Columns/` | Config object `{ type, label, sortable }` → componente |
| Filtros como formulario oculto | `filtersFormSchema` | Campos renderizados en un popover que escriben al mismo store |
| Acciones con modales apilables | `InteractsWithActions` | Pila de `ModalProvider` (stack de contexts) + foco + bloqueo scroll |
| Acción con confirmación | `requiresConfirmation()` | `confirm()` o modal custom de confirmación |
| Notificaciones imperativas | `Notification::send()` | `notify.success/error/info()` + `<NotificationProvider>` |
| Notificaciones con auto-dismiss + pausa en hover | `notification.js` | Timers por notificación + `onMouseEnter` pause |
| Widgets con polling | `CanPoll`, `wire:poll` | `usePolling(interval)` + re-fetch |
| Stats overview | `StatsOverviewWidget`/`Stat` | Lista declarativa de tarjetas con icono/color/chart |
| Dark mode (light/dark/system) | `dark-mode.js` + `$store.theme` | `ThemeProvider` + CSS variables + `localStorage` |
| Sistema de tokens de color | `ColorManager` (paletas 50-950) | CSS custom properties `--<color>-500` |
| Layout shell del panel (sidebar/topbar) | `panels` layout | Layouts anidados de react-router + store de sidebar |
| Rutas CRUD generadas por recurso | `Resource::getPages()` | Config → `<Route>` map (list/create/edit/view) |
| Estado sincronizado con URL (deep-linking) | `#[Url]` | `useSearchParams`/`serializeQuery` para sort/filter/page |
| Render de campos ocultos sin desmontar | `fi-hidden` | `hidden` con `keepMounted` |
| RPC de opciones dinámicas | `#[ExposedLivewireMethod]` | Server action / `fetch` + debounce en `Select` |

---

## 11. Comandos de desarrollo del repo (referencia)

```bash
composer test           # SQLite + serial + PHPStan
composer test:sqlite    # Pest + SQLite (paralelo)
composer test:phpstan   # análisis estático
composer cs             # Rector + Pint + Prettier (formato)
npm run build           # esbuild JS + Tailwind CSS de todos los paquetes
npm run dev             # watch de JS y CSS
```

Convenciones del repo: **nunca** nombres de variables abreviados (`$exception`, no `$e`); tests Pest con backticks y `()` en los nombres; todo componente nuevo con `make()` fluido y propiedades nullable; nunca `final`/`readonly` (los usuarios extienden); `app()` en vez de `new` para permitir reemplazo; closures `static fn` cuando no usan `$this`.

---

*Documento generado investigando el código fuente del monorepo Filament en `packages/`. Version: Filament 6.x (rama `6.x`), Laravel 11+, Livewire 4.*
