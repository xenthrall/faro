import { discoverPages } from './discover-pages'
import type { PanelPageConfig, Resource, ResourceModule } from './types'

/**
 * Resolves one resource's pages into panel pages: namespaced (`products`,
 * `products.create`) and path-prefixed (`/products`, `/products/create`) by
 * the resource's `name`. Only the index page (the one resolving to `/`)
 * inherits the resource's own label/icon/order and stays visible in the
 * sidebar — every other page keeps its own label but is hidden, since it's
 * meant to be reached from the index page (e.g. a "New" button) rather than
 * cluttering the main navigation with one entry per CRUD page.
 */
export function resolveResourcePages(resource: Resource): PanelPageConfig[] {
  const { pages } = Array.isArray(resource.pages)
    ? { pages: resource.pages }
    : discoverPages(resource.pages)

  if (import.meta.env.DEV && !pages.some((page) => page.path === '/')) {
    console.warn(
      `[resource:${resource.name}] No index page (a page resolving to "/") was found, so it won't get a sidebar entry.`,
    )
  }

  return pages.map((page) => {
    const isIndex = page.path === '/'
    return {
      ...page,
      name: `${resource.name}.${page.name}`,
      path: isIndex ? `/${resource.name}` : `/${resource.name}${page.path}`,
      label: isIndex ? resource.label : page.label,
      icon: isIndex ? (resource.icon ?? page.icon) : page.icon,
      order: isIndex ? (resource.order ?? page.order) : page.order,
      hidden: isIndex ? page.hidden : true,
      group: isIndex ? (resource.group ?? page.group) : page.group,
    }
  })
}

/**
 * Turns the result of `import.meta.glob('./resources/<name>/index.ts', { eager: true })`
 * into resolved panel pages, ready to merge alongside a panel's own pages.
 */
export function discoverResources(modules: Record<string, ResourceModule>): PanelPageConfig[] {
  return Object.values(modules).flatMap((mod) => resolveResourcePages(mod.default))
}
