import { Link } from 'react-router'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Nuevo producto',
  path: '/create',
}

export default function CreateProductPage() {
  const panel = usePanel()

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Nuevo producto</h1>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aquí vivirá el formulario de creación en una futura iteración.
        </p>
        <Link
          to={`${panel.path}/products`}
          className="text-sm font-medium text-gray-700 underline-offset-4 hover:underline dark:text-gray-300"
        >
          Volver a productos
        </Link>
      </div>
    </div>
  )
}
