import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { usePanel } from '@/ui/panel'

export default function ProductsPage() {
  const panel = usePanel()

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Productos</h1>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aquí vivirá la tabla de productos en una futura iteración.
        </p>
        <Link
          to={`${panel.path}/products/create`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Link>
      </div>
    </div>
  )
}
