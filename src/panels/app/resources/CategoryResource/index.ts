import { FolderTree } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'categories',
  label: 'Categorías',
  icon: FolderTree,
  group: 'Catálogo',
  order: 31,
  pages,
})
