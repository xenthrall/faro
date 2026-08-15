import { Tags } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'price-lists',
  label: 'Listas de precio',
  icon: Tags,
  group: 'Catálogo',
  order: 33,
  pages,
})
