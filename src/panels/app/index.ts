import { createPanel } from '@/ui/panel'
import type { PanelPageModule, ResourceModule } from '@/ui/panel'
import { FaroWordmark } from '@/ui/components/FaroWordmark'

// Vite requires glob patterns to be static string literals, so these calls
// have to live here rather than inside `createPanel` — but they're the only
// lines that need to change (or stay untouched) as pages/resources are
// added or removed.
const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })
const resources = import.meta.glob<ResourceModule>('./resources/*/index.ts', { eager: true })

export const appPanel = createPanel({
  id: 'app',
  path: '/app',
  name: 'Faro',
  logo: FaroWordmark,
  requiresAuth: true,
  userMenu: true,
  pages,
  resources,
})
