import { ShoppingCart } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'purchases',
  label: 'Compras',
  icon: ShoppingCart,
  group: 'Documentos',
  order: 20,
  pages,
})
