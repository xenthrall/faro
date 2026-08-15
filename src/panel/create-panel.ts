import type { Panel, PanelConfig } from './types'

/**
 * Builds a Panel from a declarative configuration object. This is the single
 * entry point consumers use to describe an admin panel; `PanelProvider` then
 * turns the result into layout, navigation and routes.
 */
export function createPanel(config: PanelConfig): Panel {
  if (import.meta.env.DEV) {
    const seen = new Set<string>()
    for (const page of config.pages) {
      if (seen.has(page.name)) {
        console.warn(
          `[panel:${config.id}] Duplicate page name "${page.name}". Page names must be unique within a panel.`,
        )
      }
      seen.add(page.name)
    }
  }

  return config
}
