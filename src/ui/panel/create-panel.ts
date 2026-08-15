import { discoverPages } from './discover-pages'
import { discoverResources, resolveResourcePages } from './discover-resources'
import type { Panel, PanelConfig, PanelPageConfig } from './types'

function byOrder(a: PanelPageConfig, b: PanelPageConfig): number {
  return (a.order ?? 0) - (b.order ?? 0)
}

/**
 * Builds a Panel from a declarative configuration object. This is the single
 * entry point consumers use to describe an admin panel; `PanelProvider` then
 * turns the result into layout, navigation and routes.
 */
export function createPanel(config: PanelConfig): Panel {
  const discovered = Array.isArray(config.pages)
    ? { pages: [...config.pages], notFoundComponent: undefined }
    : discoverPages(config.pages)

  const resourcePages = !config.resources
    ? []
    : Array.isArray(config.resources)
      ? config.resources.flatMap((resource) => resolveResourcePages(resource))
      : discoverResources(config.resources)

  const pages = [...discovered.pages, ...resourcePages].sort(byOrder)
  const notFoundComponent = config.notFoundComponent ?? discovered.notFoundComponent

  if (import.meta.env.DEV) {
    const seen = new Set<string>()
    for (const page of pages) {
      if (seen.has(page.name)) {
        console.warn(
          `[panel:${config.id}] Duplicate page name "${page.name}". Page (and resource) names must be unique within a panel.`,
        )
      }
      seen.add(page.name)
    }

    // "login" and "account" are reserved page names: PanelProvider generates
    // routes for them when requiresAuth/userMenu are enabled, and a
    // same-named page would silently collide with that generated route.
    if (config.requiresAuth && seen.has('login')) {
      console.warn(
        `[panel:${config.id}] A page named "login" collides with the auto-generated login route (requiresAuth is enabled). Rename it.`,
      )
    }
    if (config.requiresAuth && config.userMenu && seen.has('account')) {
      console.warn(
        `[panel:${config.id}] A page named "account" collides with the auto-generated account route (userMenu is enabled). Rename it.`,
      )
    }
  }

  const { resources: _resources, pages: _pages, ...rest } = config
  return { ...rest, pages, notFoundComponent }
}
