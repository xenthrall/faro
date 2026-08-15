import { Users } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'customers',
  label: 'Clientes',
  icon: Users,
  group: 'Terceros',
  order: 41,
  pages,
})
