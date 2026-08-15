import { Truck } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'suppliers',
  label: 'Proveedores',
  icon: Truck,
  group: 'Terceros',
  order: 40,
  pages,
})
