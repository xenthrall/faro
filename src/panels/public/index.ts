import { createPanel } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'
import { FaroWordmark } from '@/ui/components/FaroWordmark'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export const publicPanel = createPanel({
  id: 'public',
  path: '/public',
  name: 'Faro',
  logo: FaroWordmark,
  pages,
})
