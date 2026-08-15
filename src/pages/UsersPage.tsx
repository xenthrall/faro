import { Users } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

export function UsersPage() {
  return (
    <div>
      <PageHeader
        icon={Users}
        title="Usuarios"
        description="Página estática de ejemplo para validar el routing del panel."
      />

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aquí vivirá la gestión de usuarios en una futura iteración.
        </p>
      </div>
    </div>
  )
}
