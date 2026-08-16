import { Receipt } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'sales',
  label: 'Ventas',
  icon: Receipt,
  group: 'Documentos',
  order: 21,
  pages,
})
