import { createPanel } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export const publicPanel = createPanel({
  id: 'public',
  path: '/public',
  name: 'Faro',
  pages,
})
