import { createPanel } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'
import { FaroWordmark } from '@/ui/components/FaroWordmark'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export const hubPanel = createPanel({
  id: 'hub',
  path: '/app',
  name: 'Faro',
  logo: FaroWordmark,
  requiresAuth: true,
  userMenu: true,
  pages,
})
