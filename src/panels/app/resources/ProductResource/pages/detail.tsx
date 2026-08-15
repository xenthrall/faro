import { Boxes, Layers, Pencil, Tag } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import {
  formatDateOnly,
  formatDateTime,
  formatMoney,
  formatMoneyPrecise,
  formatPercent,
  formatQuantity,
} from '@/lib/format'
import { invalidate, unwrap, useQuery } from '@/lib/query'
import { usePriceLists } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNullableNumber, toNumber, useForm } from '@/lib/use-form'
import type { CurrentPrice, StockByLot } from '@/lib/types'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  DataTable,
  DescriptionList,
  ErrorState,
  Modal,
  Mono,
  Muted,
  PageHeader,
  Primary,
  SelectField,
  Section,
  Spinner,
  StatGrid,
  Stat,
  TextField,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'
import { useToast } from '@/ui/toast'

export const meta: PanelPageMeta = {
  label: 'Producto',
  path: '/:productId',
}

type ProductDetail = {
  id: number
  sku: string
  barcode: string | null
  name: string
  description: string | null
  tax_rate: number
  track_lot: boolean
  track_expiration: boolean
  min_stock: number | null
  active: boolean
  created_at: string
  categories: { name: string } | null
  units: { code: string; name: string } | null
}

export default function ProductDetailPage() {
  const panel = usePanel()
  const toast = useToast()
  const { productId } = useParams()
  const id = Number(productId)
  const priceLists = usePriceLists()

  const [pricingOpen, setPricingOpen] = useState(false)

  const product = useQuery<ProductDetail>(
    async () =>
      unwrap(
        await supabase
          .from('products')
          .select(
            'id, sku, barcode, name, description, tax_rate, track_lot, track_expiration, min_stock, active, created_at, categories(name), units(code, name)',
          )
          .eq('id', id)
          .single(),
      ) as ProductDetail,
    { deps: [id], tags: ['products'] },
  )

  const stock = useQuery<StockByLot[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_stock_by_lot')
          .select('*')
          .eq('product_id', id)
          .order('location_name'),
      ),
    { deps: [id], tags: ['inventory', 'inventory_lots'] },
  )

  const prices = useQuery<CurrentPrice[]>(
    async () => unwrap(await supabase.from('v_current_prices').select('*').eq('product_id', id)),
    { deps: [id], tags: ['product_prices'] },
  )

  if (product.initialLoading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (product.error || !product.data) {
    return (
      <ErrorState message={product.error ?? 'Producto no encontrado.'} onRetry={product.refetch} />
    )
  }

  const item = product.data
  const rows = stock.data ?? []
  const totalQuantity = rows.reduce((sum, row) => sum + (row.quantity ?? 0), 0)
  const totalValue = rows.reduce((sum, row) => sum + (row.stock_value ?? 0), 0)
  const locations = new Set(rows.filter((row) => (row.quantity ?? 0) > 0).map((row) => row.location_id))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        backTo={{ to: `${panel.path}/products`, label: 'Productos' }}
        description={item.description ?? undefined}
        badge={
          <>
            <Mono>{item.sku}</Mono>
            {!item.active ? <Badge>Inactivo</Badge> : null}
            {item.track_lot ? <Badge tone="info">Controla lotes</Badge> : null}
            {item.track_expiration ? <Badge tone="warning">Controla vencimiento</Badge> : null}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setPricingOpen(true)}>
              <Tag className="h-4 w-4" />
              Cambiar precio
            </Button>
            <ButtonLink to={`${panel.path}/products/${item.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Editar
            </ButtonLink>
          </>
        }
      />

      <StatGrid>
        <Stat
          label="Existencias totales"
          value={`${formatQuantity(totalQuantity)} ${item.units?.code ?? ''}`}
          icon={Boxes}
          loading={stock.initialLoading}
          detail={`en ${locations.size} ubicación${locations.size === 1 ? '' : 'es'}`}
          tone={
            item.min_stock != null && totalQuantity <= item.min_stock ? 'warning' : 'neutral'
          }
        />
        <Stat
          label="Valor del inventario"
          value={formatMoney(totalValue)}
          icon={Layers}
          loading={stock.initialLoading}
          detail="valorizado al costo de cada lote"
        />
        <Stat
          label="Costo promedio"
          value={totalQuantity > 0 ? formatMoneyPrecise(totalValue / totalQuantity) : '—'}
          loading={stock.initialLoading}
          detail="ponderado por cantidad"
        />
        <Stat
          label="Impuesto"
          value={formatPercent(item.tax_rate)}
          detail={`Unidad: ${item.units?.name ?? '—'}`}
        />
      </StatGrid>

      <Card>
        <DescriptionList
          items={[
            { label: 'Categoría', value: item.categories?.name ?? '—' },
            { label: 'Unidad de medida', value: item.units ? `${item.units.name} (${item.units.code})` : '—' },
            { label: 'Código de barras', value: item.barcode ? <Mono>{item.barcode}</Mono> : '—' },
            {
              label: 'Stock mínimo',
              value: item.min_stock != null ? formatQuantity(item.min_stock) : 'Sin definir',
            },
            { label: 'Creado', value: formatDateTime(item.created_at) },
            {
              label: 'Estado',
              value: item.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge>,
            },
          ]}
        />
      </Card>

      <Section
        title="Existencias por ubicación y lote"
        description="Cada fila es una capa de costo. Dos compras del mismo producto a precios distintos aparecen por separado."
      >
        <DataTable
          rows={rows}
          columns={[
            {
              key: 'location',
              header: 'Ubicación',
              cell: (row) => <Primary>{row.location_name}</Primary>,
            },
            {
              key: 'lot',
              header: 'Lote',
              cell: (row) => (
                <div className="flex flex-col">
                  {row.lot_number ? <Mono>{row.lot_number}</Mono> : <Muted>Sin número de lote</Muted>}
                  {row.expiration_date ? (
                    <Muted>vence {formatDateOnly(row.expiration_date)}</Muted>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'unit_cost',
              header: 'Costo unitario',
              align: 'right',
              hideBelow: 'sm',
              cell: (row) => formatMoneyPrecise(row.unit_cost),
            },
            {
              key: 'quantity',
              header: 'Cantidad',
              align: 'right',
              cell: (row) => <Primary>{formatQuantity(row.quantity)}</Primary>,
            },
            {
              key: 'value',
              header: 'Valor',
              align: 'right',
              hideBelow: 'md',
              cell: (row) => formatMoney(row.stock_value),
            },
          ]}
          getRowKey={(row) => row.inventory_id ?? 0}
          loading={stock.initialLoading}
          error={stock.error}
          onRetry={stock.refetch}
          empty={{
            icon: Boxes,
            title: 'Sin existencias',
            description: 'Registrá una compra o un ajuste para que este producto tenga stock.',
          }}
          footer={
            <tr>
              <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white" colSpan={2}>
                Total
              </td>
              <td className="hidden px-4 py-2.5 sm:table-cell" />
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {formatQuantity(totalQuantity)}
              </td>
              <td className="hidden px-4 py-2.5 text-right text-sm font-semibold text-gray-900 md:table-cell dark:text-white">
                {formatMoney(totalValue)}
              </td>
            </tr>
          }
        />
      </Section>

      <Section
        title="Precios de venta vigentes"
        description="Un precio por lista. Cambiarlo cierra el anterior y conserva el historial."
      >
        <DataTable
          rows={prices.data}
          columns={[
            {
              key: 'list',
              header: 'Lista',
              cell: (row) => (
                <span className="flex items-center gap-2">
                  <Primary>{row.price_list_code}</Primary>
                  {row.is_default_list ? <Badge tone="info">Por defecto</Badge> : null}
                </span>
              ),
            },
            {
              key: 'price',
              header: 'Precio',
              align: 'right',
              cell: (row) => formatMoneyPrecise(row.price),
            },
            {
              key: 'with_tax',
              header: 'Con impuesto',
              align: 'right',
              hideBelow: 'sm',
              cell: (row) => (
                <div className="flex flex-col items-end">
                  <span>{formatMoney(row.price_with_tax)}</span>
                  <Muted>{formatPercent(row.tax_rate)}</Muted>
                </div>
              ),
            },
            {
              key: 'from',
              header: 'Vigente desde',
              align: 'right',
              hideBelow: 'md',
              cell: (row) => formatDateTime(row.valid_from),
            },
          ]}
          getRowKey={(row) => `${row.product_id}-${row.price_list_id}`}
          loading={prices.initialLoading}
          error={prices.error}
          onRetry={prices.refetch}
          empty={{
            icon: Tag,
            title: 'Sin precio de venta',
            description: 'Asignale un precio para poder venderlo.',
            action: <Button onClick={() => setPricingOpen(true)}>Definir precio</Button>,
          }}
        />
      </Section>

      <PriceModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        productId={item.id}
        priceListOptions={priceLists.options}
        onSaved={() => {
          toast.success('Precio actualizado.')
          setPricingOpen(false)
          prices.refetch()
        }}
      />
    </div>
  )
}

type PriceModalProps = {
  open: boolean
  onClose: () => void
  productId: number
  priceListOptions: { value: string | number; label: string }[]
  onSaved: () => void
}

function PriceModal({ open, onClose, productId, priceListOptions, onSaved }: PriceModalProps) {
  const form = useForm({ price: '', price_list_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      // `set_product_price` closes the current price and opens a new one in a
      // single transaction, so the history can never end up with two rows
      // marked as current.
      unwrap(
        await supabase.rpc('set_product_price', {
          p_product_id: productId,
          p_price: toNumber(form.values.price),
          p_price_list_id: toNullableNumber(form.values.price_list_id) ?? undefined,
        }),
      )
      invalidate('product_prices')
      form.reset({ price: '', price_list_id: '' })
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el precio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cambiar precio de venta"
      description="El precio anterior queda archivado con su fecha de vigencia."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            Guardar precio
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Nuevo precio"
          type="number"
          step="0.01"
          min={0}
          required
          autoFocus
          {...form.input('price')}
        />
        <SelectField
          label="Lista de precios"
          options={priceListOptions}
          placeholder="Lista por defecto"
          {...form.input('price_list_id')}
        />
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
