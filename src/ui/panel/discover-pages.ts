import type { ComponentType } from 'react'
import type { PanelPageConfig, PanelPageModule } from './types'

function fileNameFromGlobKey(key: string): string {
  const base = key.split('/').pop() ?? key
  return base.replace(/\.[^./]+$/, '')
}

function humanize(fileName: string): string {
  return fileName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export type DiscoveredPages = {
  pages: PanelPageConfig[]
  notFoundComponent?: ComponentType
}

/**
 * Turns the result of `import.meta.glob('./pages/*.tsx', { eager: true })`
 * into resolved, sorted panel pages.
 *
 * Conventions:
 * - The file name becomes the page's `name`, and its default `path` (`index`
 *   maps to the panel's root `/`). Both can be overridden via the file's
 *   `meta` export.
 * - A file named `_404` becomes the panel's not-found page instead of a
 *   regular page. Other file names starting with `_` are skipped, reserved
 *   for future special files.
 */
export function discoverPages(modules: Record<string, PanelPageModule>): DiscoveredPages {
  const pages: PanelPageConfig[] = []
  let notFoundComponent: ComponentType | undefined

  for (const [key, mod] of Object.entries(modules)) {
    const fileName = fileNameFromGlobKey(key)

    if (fileName === '_404') {
      notFoundComponent = mod.default
      continue
    }
    if (fileName.startsWith('_')) continue

    const meta = mod.meta ?? {}
    pages.push({
      name: fileName,
      label: meta.label ?? humanize(fileName),
      path: meta.path ?? (fileName === 'index' ? '/' : `/${fileName}`),
      component: mod.default,
      icon: meta.icon,
      order: meta.order ?? 0,
      hidden: meta.hidden ?? false,
      group: meta.group,
    })
  }

  pages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return { pages, notFoundComponent }
}
