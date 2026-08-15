import { PageHeader } from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'
import { ProductForm } from '../components/ProductForm'

export const meta: PanelPageMeta = {
  label: 'Nuevo producto',
  path: '/create',
}

export default function CreateProductPage() {
  const panel = usePanel()
  const list = `${panel.path}/products`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuevo producto"
        backTo={{ to: list, label: 'Productos' }}
        description="Definís qué es el producto. Las existencias entran después, con una compra o un ajuste."
      />
      <ProductForm returnTo={list} />
    </div>
  )
}
