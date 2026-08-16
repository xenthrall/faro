import { GraduationCap } from 'lucide-react'
import { createResource } from '@/ui/panel'
import type { PanelPageModule } from '@/ui/panel'

const pages = import.meta.glob<PanelPageModule>('./pages/*.tsx', { eager: true })

export default createResource({
  name: 'aprender',
  label: 'Centro de aprendizaje',
  icon: GraduationCap,
  order: 20,
  pages,
})
