import { ArrowRightLeft } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'transfers',
  label: 'Transferencias',
  icon: ArrowRightLeft,
  group: 'Documentos',
  order: 22,
  pages,
})
