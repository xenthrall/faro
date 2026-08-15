import type { PanelPageConfig } from './types'

export type NavigationGroup = {
  /** `null` for the leading, unlabelled group of pages without a `group`. */
  label: string | null
  pages: PanelPageConfig[]
}

/**
 * Turns a panel's flat page list into the sidebar's sections.
 *
 * Pages keep the order `createPanel` already sorted them into. A group's
 * position is the position of its first page, so a resource can move its
 * whole section by changing one `order` — the same knob that orders pages
 * within it.
 */
export function buildNavigation(pages: PanelPageConfig[]): NavigationGroup[] {
  const groups: NavigationGroup[] = []
  const byLabel = new Map<string | null, NavigationGroup>()

  for (const page of pages) {
    if (page.hidden) continue

    const label = page.group ?? null
    let group = byLabel.get(label)

    if (!group) {
      group = { label, pages: [] }
      byLabel.set(label, group)
      groups.push(group)
    }

    group.pages.push(page)
  }

  return groups
}
