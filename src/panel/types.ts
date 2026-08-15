import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * A single page registered within a Panel.
 *
 * `path` is always relative to the Panel's own `path`. Use `/` to designate
 * the Panel's index page (e.g. the dashboard shown at the Panel's root).
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
}

/** Declarative input accepted by `createPanel`. */
export type PanelConfig = {
  /** Unique identifier for the panel. */
  id: string
  /** Base path the panel is mounted at, e.g. `/admin`. */
  path: string
  /** Display name shown in the panel header. */
  name: string
  pages: PanelPageConfig[]
}

/**
 * The resolved runtime representation of a panel, as returned by
 * `createPanel`. Kept distinct from `PanelConfig` so that future
 * normalization (e.g. resolving navigation groups, resources, plugins)
 * doesn't change the shape consumers pass in.
 */
export type Panel = PanelConfig
