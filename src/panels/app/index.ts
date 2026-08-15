import { createPanel } from '@/panel'
import type { PanelPageModule } from '@/panel'

// Vite requires glob patterns to be static string literals, so this call has
// to live here rather than inside `createPanel` — but it's the only line
// that needs to change (or stay untouched) as pages are added or removed.
const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export const appPanel = createPanel({
  id: 'app',
  path: '/app',
  name: 'Faro',
  requiresAuth: true,
  userMenu: true,
  pages,
})
