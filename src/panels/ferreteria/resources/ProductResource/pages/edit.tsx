import { useParams } from 'react-router'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { ErrorState, PageHeader, Spinner } from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'
import { ProductForm } from '../components/ProductForm'

export const meta: PanelPageMeta = {
  label: 'Editar producto',
  path: '/:productId/edit',
}

export default function EditProductPage() {
  const panel = usePanel()
  const { productId } = useParams()

  const query = useQuery<Product>(
    async () =>
      unwrap(await supabase.from('products').select('*').eq('id', Number(productId)).single()),
    { deps: [productId], tags: ['products'] },
  )

  const detail = `${panel.path}/products/${productId}`

  if (query.initialLoading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (query.error || !query.data) {
    return <ErrorState message={query.error ?? 'Producto no encontrado.'} onRetry={query.refetch} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar ${query.data.name}`}
        backTo={{ to: detail, label: 'Volver al producto' }}
      />
      {/* `key` remounts the form when navigating between products, so the
          field state is rebuilt from the newly loaded record. */}
      <ProductForm key={query.data.id} product={query.data} returnTo={detail} />
    </div>
  )
}
