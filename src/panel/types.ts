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
}

/** Shape a page file is expected to export when discovered from a directory. */
export type PanelPageModule = {
  default: ComponentType
  meta?: PanelPageMeta
}

/**
 * A single page registered within a Panel, fully resolved — `name`, `label`
 * and `path` are always present regardless of whether the page came from a
 * manual `pages` array or was discovered from a pages directory.
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
   * Either a manually assembled list of pages, or the result of
   * `import.meta.glob('./pages/*.tsx', { eager: true })` pointed at the
   * panel's pages directory — so pages don't need to be imported and listed
   * one by one. Vite requires the glob call itself to live in the panel's
   * own file (its pattern must be a static string literal), so `createPanel`
   * takes the already-resolved module map rather than a directory string.
   */
  pages: PanelPageConfig[] | Record<string, PanelPageModule>
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
}

/**
 * The resolved runtime representation of a panel, as returned by
 * `createPanel`. `pages` is always a sorted array here, regardless of
 * whether the input was a manual list or discovered from a directory.
 */
export type Panel = Omit<PanelConfig, 'pages'> & {
  pages: PanelPageConfig[]
}
