import { Package } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

// Same convention as a panel's own pages: one glob call here, pages
// discovered from ./pages without importing/listing each one by hand.
const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'products',
  label: 'Productos',
  icon: Package,
  group: 'Catálogo',
  order: 30,
  pages,
})
