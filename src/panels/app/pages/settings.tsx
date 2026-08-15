import { Settings } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Configuración',
  icon: Settings,
  order: 20,
}

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Configuración</h1>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aquí vivirán las preferencias del panel en una futura iteración.
        </p>
      </div>
    </div>
  )
}
