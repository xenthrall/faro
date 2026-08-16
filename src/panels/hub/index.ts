import { createPanel } from '@/ui/panel'
import type { PanelPageModule, ResourceModule } from '@/ui/panel'
import { FaroWordmark } from '@/ui/components/FaroWordmark'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })
const resources = import.meta.glob<ResourceModule>('./resources/*/index.ts', { eager: true })

export const hubPanel = createPanel({
  id: 'hub',
  path: '/app',
  name: 'Faro',
  logo: FaroWordmark,
  requiresAuth: true,
  userMenu: true,
  pages,
  resources,
})
