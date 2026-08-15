import { Settings } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import type { PanelPageMeta } from '@/panel'

export const meta: PanelPageMeta = {
  label: 'Configuración',
  icon: Settings,
  order: 20,
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Configuración"
        description="Página estática de ejemplo para validar el routing del panel."
      />

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aquí vivirán las preferencias del panel en una futura iteración.
        </p>
      </div>
    </div>
  )
}
