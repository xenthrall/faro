import { Package, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { formatMoney, formatPercent, formatQuantity } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { ProductStock } from '@/lib/types'
import { usePanel } from '@/ui/panel'
import {
  Badge,
  ButtonLink,
  DataTable,
  Mono,
  Muted,
  PageHeader,
  Primary,
  type Column,
} from '@/ui/components'

type ProductRow = {
  id: number
  sku: string
  name: string
  active: boolean
  tax_rate: number
  track_lot: boolean
  track_expiration: boolean
  min_stock: number | null
  categories: { name: string } | null
  units: { code: string } | null
}

type Listed = ProductRow & { stock: ProductStock | undefined }

export default function ProductsPage() {
  const panel = usePanel()

  const products = useQuery<ProductRow[]>(
    async () =>
      unwrap(
        await supabase
          .from('products')
          .select(
            'id, sku, name, active, tax_rate, track_lot, track_expiration, min_stock, categories(name), units(code)',
          )
          .order('name'),
      ) as ProductRow[],
    { tags: ['products'] },
  )

  // Stock lives in a view that already aggregates across locations and lots.
  // Joining it here client-side keeps the list to two small queries instead of
  // one per product.
  const stock = useQuery<ProductStock[]>(
    async () => unwrap(await supabase.from('v_product_stock').select('*')),
    { tags: ['inventory', 'products'] },
  )

  const rows = useMemo<Listed[]>(() => {
    const byId = new Map((stock.data ?? []).map((row) => [row.product_id, row]))
    return (products.data ?? []).map((product) => ({ ...product, stock: byId.get(product.id) }))
  }, [products.data, stock.data])

  const columns: Column<Listed>[] = [
    {
      key: 'name',
      header: 'Producto',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="flex items-center gap-2">
            <Primary>{row.name}</Primary>
            {!row.active ? <Badge>Inactivo</Badge> : null}
          </span>
          <Muted>
            {row.categories?.name ?? 'Sin categoría'}
            {row.track_lot ? ' · controla lotes' : ''}
            {row.track_expiration ? ' y vencimiento' : ''}
          </Muted>
        </div>
      ),
    },
    { key: 'sku', header: 'SKU', hideBelow: 'sm', cell: (row) => <Mono>{row.sku}</Mono> },
    {
      key: 'stock',
      header: 'Existencias',
      align: 'right',
      cell: (row) => {
        const quantity = row.stock?.total_quantity ?? 0
        const below = row.stock?.below_min_stock ?? false
        return (
          <div className="flex flex-col items-end">
            <span
              className={
                below
                  ? 'font-medium text-amber-700 dark:text-amber-400'
                  : 'font-medium text-gray-900 dark:text-white'
              }
            >
              {formatQuantity(quantity)} {row.units?.code ?? ''}
            </span>
            {below ? <Muted>mínimo {formatQuantity(row.min_stock)}</Muted> : null}
          </div>
        )
      },
    },
    {
      key: 'value',
      header: 'Valor',
      align: 'right',
      hideBelow: 'md',
      cell: (row) => formatMoney(row.stock?.total_value ?? 0),
    },
    {
      key: 'tax',
      header: 'Impuesto',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => formatPercent(row.tax_rate),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Productos"
        description="Qué vendés. Las existencias y los costos viven en inventario, no acá."
        actions={
          <ButtonLink to={`${panel.path}/products/create`}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </ButtonLink>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={products.initialLoading}
        error={products.error ?? stock.error}
        onRetry={() => {
          products.refetch()
          stock.refetch()
        }}
        rowHref={(row) => `${panel.path}/products/${row.id}`}
        searchPlaceholder="Buscar por nombre, SKU o categoría…"
        filter={(row, query) =>
          row.name.toLowerCase().includes(query) ||
          row.sku.toLowerCase().includes(query) ||
          (row.categories?.name ?? '').toLowerCase().includes(query)
        }
        empty={{
          icon: Package,
          title: 'Todavía no hay productos',
          description:
            'Antes de crear el primero, asegurate de tener al menos una unidad de medida cargada.',
          action: (
            <ButtonLink to={`${panel.path}/products/create`}>
              <Plus className="h-4 w-4" />
              Nuevo producto
            </ButtonLink>
          ),
        }}
      />
    </div>
  )
}
