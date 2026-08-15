import type { Resource, ResourceConfig } from './types'

/**
 * Builds a Resource from a declarative configuration object. This is the
 * entry point a domain's `resources/<Name>/index.ts` file uses to register
 * its pages with a panel; `createPanel` (via `discoverResources`) then folds
 * the resulting pages into the panel's own page list.
 */
export function createResource(config: ResourceConfig): Resource {
  return config
}
