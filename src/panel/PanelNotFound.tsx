import { SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { usePanel } from './panel-context'

/**
 * Built-in fallback for unmatched sub-paths within a panel. Panels can
 * override it via `notFoundComponent` in their config.
 */
export function PanelNotFound() {
  const panel = usePanel()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
        <SearchX className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Página no encontrada
      </h1>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        La ruta que buscás no existe dentro de {panel.name}.
      </p>
      <Link
        to={panel.path}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
