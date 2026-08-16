import { Boxes } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'inventory',
  label: 'Existencias',
  icon: Boxes,
  group: 'Inventario',
  order: 10,
  pages,
})
