import { ArrowLeftRight } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'movements',
  label: 'Movimientos',
  icon: ArrowLeftRight,
  group: 'Inventario',
  order: 11,
  pages,
})
