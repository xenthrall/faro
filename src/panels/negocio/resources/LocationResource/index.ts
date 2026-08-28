import { Warehouse } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'locations',
  label: 'Ubicaciones',
  icon: Warehouse,
  group: 'Configuración',
  order: 34,
  pages,
})
