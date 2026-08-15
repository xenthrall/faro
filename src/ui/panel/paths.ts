import type { Panel, PanelPageConfig } from './types'

/** Absolute URL for a page, relative to the app root (e.g. `/admin/settings`). */
export function resolvePagePath(panel: Panel, page: PanelPageConfig): string {
  const base = panel.path.replace(/\/$/, '')
  if (page.path === '/') return base || '/'
  const relative = page.path.startsWith('/') ? page.path : `/${page.path}`
  return `${base}${relative}`
}

/** Path for a page's `<Route>`, relative to the panel's own route. */
export function relativePagePath(page: PanelPageConfig): string | undefined {
  if (page.path === '/') return undefined
  return page.path.replace(/^\//, '')
}
