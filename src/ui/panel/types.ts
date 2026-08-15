import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * Metadata a page file exports (as `meta`) to configure how it plugs into
 * its panel, when discovered from a pages directory. Everything is
 * optional — omitted fields fall back to a convention derived from the
 * file name.
 */
export type PanelPageMeta = {
  /** Sidebar label. Defaults to a capitalized version of the file name. */
  label?: string
  /** Path relative to the panel. Defaults to the file name (`index` → `/`). */
  path?: string
  /** Icon shown next to the label in the sidebar navigation. */
  icon?: LucideIcon
  /** Lower numbers sort first in the sidebar. Defaults to `0`. */
  order?: number
  /** Excludes the page from the sidebar while keeping its route. Defaults to `false`. */
  hidden?: boolean
  /**
   * Sidebar section this page belongs to, e.g. `'Catálogo'`. Pages sharing a
   * group are listed under one heading, in `order`; groups themselves are
   * ordered by the lowest `order` among their pages. Ungrouped pages sit at
   * the top, above every heading.
   */
  group?: string
}

/** Shape a page file is expected to export when discovered from a directory. */
export type PanelPageModule = {
  default: ComponentType
  meta?: PanelPageMeta
}

/**
 * A single page registered within a Panel, fully resolved — `name`, `label`
 * and `path` are always present regardless of whether the page came from a
 * manual `pages` array, a pages directory, or a resource.
 */
export type PanelPageConfig = {
  /** Stable identifier for the page within its panel. */
  name: string
  /** Label shown in the sidebar navigation. */
  label: string
  /** Path relative to the panel's base path. `/` marks the panel's index page. */
  path: string
  component: ComponentType
  /** Icon shown next to the label in the sidebar navigation. */
  icon?: LucideIcon
  /** Lower numbers sort first in the sidebar. Defaults to `0`. */
  order?: number
  /** Excludes the page from the sidebar while keeping its route. Defaults to `false`. */
  hidden?: boolean
  /** Sidebar section this page is listed under. */
  group?: string
}

/**
 * Declarative input accepted by `createResource`. A resource groups the
 * pages of one domain (e.g. "Products") behind a single sidebar entry.
 */
export type ResourceConfig = {
  /** Unique identifier and URL segment, e.g. `'products'` → mounted at `${panel.path}/products`. */
  name: string
  /** Label used for the resource's sidebar entry. */
  label: string
  /** Icon used for the resource's sidebar entry. */
  icon?: LucideIcon
  /** Lower numbers sort first in the sidebar, alongside regular pages. Defaults to `0`. */
  order?: number
  /** Sidebar section the resource's entry is listed under, e.g. `'Catálogo'`. */
  group?: string
  /**
   * Either a manually assembled list of pages, or the result of
   * `import.meta.glob('./pages/*.tsx', { eager: true })` pointed at the
   * resource's pages directory — same convention as a panel's own pages.
   * The page that resolves to `/` becomes the resource's index and is the
   * only one that gets a sidebar entry (using the resource's own label and
   * icon); every other page is reachable by route but hidden from the
   * sidebar, since it's meant to be linked to from the index page.
   */
  pages: PanelPageConfig[] | Record<string, PanelPageModule>
}

/** The resolved runtime representation of a resource, as returned by `createResource`. */
export type Resource = ResourceConfig

/** Shape a resource's `index.ts` is expected to export when discovered from a `resources/` directory. */
export type ResourceModule = {
  default: Resource
}

/** Declarative input accepted by `createPanel`. */
export type PanelConfig = {
  /** Unique identifier for the panel. */
  id: string
  /** Base path the panel is mounted at, e.g. `/admin`. */
  path: string
  /** Display name shown in the panel header. */
  name: string
  /**
   * Rendered in the header instead of `name` when set — e.g. a logo
   * component. Receives a `className` for sizing.
   */
  logo?: ComponentType<{ className?: string }>
  /**
   * Either a manually assembled list of pages, or the result of
   * `import.meta.glob('./pages/*.tsx', { eager: true })` pointed at the
   * panel's pages directory — so pages don't need to be imported and listed
   * one by one. Vite requires the glob call itself to live in the panel's
   * own file (its pattern must be a static string literal), so `createPanel`
   * takes the already-resolved module map rather than a directory string.
   */
  pages: PanelPageConfig[] | Record<string, PanelPageModule>
  /**
   * Either a manually assembled list of resources, or the result of
   * `import.meta.glob('./resources/<name>/index.ts', { eager: true })` pointed
   * at the panel's resources directory. Each resource's pages are merged
   * into the panel's page list (namespaced and path-prefixed by the
   * resource's `name`), so they route and sort exactly like regular pages.
   */
  resources?: Resource[] | Record<string, ResourceModule>
  /**
   * Rendered inside the panel layout for any unmatched sub-path. Falls back
   * to a built-in page when omitted, or to a page named `_404` discovered
   * from the pages directory.
   */
  notFoundComponent?: ComponentType
  /**
   * When `true`, every page in this panel requires an authenticated Supabase
   * session. Unauthenticated visitors are redirected to a login page
   * generated at `${path}/login`. Defaults to `false`.
   */
  requiresAuth?: boolean
  /**
   * When `true` (and `requiresAuth` is also `true`), shows a user menu in
   * the header with the signed-in user's avatar, a link to a self-service
   * account page generated at `${path}/account`, and sign out. Defaults to
   * `false`.
   */
  userMenu?: boolean
}

/**
 * The resolved runtime representation of a panel, as returned by
 * `createPanel`. `pages` is always a sorted, flat array here — resource
 * pages included — regardless of how each input was supplied.
 */
export type Panel = Omit<PanelConfig, 'pages' | 'resources'> & {
  pages: PanelPageConfig[]
}
