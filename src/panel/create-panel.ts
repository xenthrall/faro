import { discoverPages } from './discover-pages'
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
    ? { pages: [...config.pages].sort(byOrder), notFoundComponent: undefined }
    : discoverPages(config.pages)

  const pages = discovered.pages
  const notFoundComponent = config.notFoundComponent ?? discovered.notFoundComponent

  if (import.meta.env.DEV) {
    const seen = new Set<string>()
    for (const page of pages) {
      if (seen.has(page.name)) {
        console.warn(
          `[panel:${config.id}] Duplicate page name "${page.name}". Page names must be unique within a panel.`,
        )
      }
      seen.add(page.name)
    }
  }

  return { ...config, pages, notFoundComponent }
}
