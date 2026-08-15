import { SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { usePanel } from '@/panel'

export default function NotFoundPage() {
  const panel = usePanel()

  return (
    <div>
      <PageHeader
        icon={SearchX}
        title="Página no encontrada"
        description="La ruta que buscás no existe o fue movida."
      />

      <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Verificá la URL o volvé al inicio del panel.
        </p>
        <Link
          to={panel.path}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
