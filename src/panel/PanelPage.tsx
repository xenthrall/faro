import { useEffect } from 'react'
import { usePanel } from './panel-context'
import type { PanelPageConfig } from './types'

export type PanelPageProps = {
  page: PanelPageConfig
}

/**
 * Renders a registered page's component. Kept as its own indirection point
 * so future concerns (breadcrumbs, permissions, per-page actions) can hook
 * in here without touching `PanelProvider`'s route generation.
 */
export function PanelPage({ page }: PanelPageProps) {
  const panel = usePanel()
  const Component = page.component

  useEffect(() => {
    document.title = `${page.label} · ${panel.name}`
  }, [page.label, panel.name])

  return <Component />
}
