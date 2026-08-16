import { CheckCircle2, Package, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyPrecise,
  formatPercent,
  formatQuantity,
} from '@/lib/format'
import { INVENTORY_TAGS, invalidate, unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { DocumentStatus, LedgerEntry, StockByLocation } from '@/lib/types'
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  ErrorState,
  Mono,
  Muted,
  PageHeader,
  Primary,
  Section,
  Spinner,
  StatusBadge,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'
import { useToast } from '@/ui/toast'

export const meta: PanelPageMeta = {
  label: 'Venta',
  path: '/:saleId',
}

type SaleDetail = {
  id: number
  reference: string | null
  date: string
  status: DocumentStatus
  subtotal: number
  tax: number
  total: number
  notes: string | null
  confirmed_at: string | null
  created_at: string
  location_id: number
  customers: { name: string; tax_id: string | null } | null
  locations: { name: string } | null
}

type SaleItemRow = {
  id: number
  quantity: number
  unit_price: number
  tax_rate: number
  total: number | null
  product_id: number
  lot_id: number | null
  products: { name: string; sku: string; units: { code: string } | null } | null
}

export default function SaleDetailPage() {
  const panel = usePanel()
  const navigate = useNavigate()
  const toast = useToast()
  const { saleId } = useParams()
  const id = Number(saleId)

  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const sale = useQuery<SaleDetail>(
    async () =>
      unwrap(
        await supabase
          .from('sales')
          .select(
            'id, reference, date, status, subtotal, tax, total, notes, confirmed_at, created_at, location_id, customers(name, tax_id), locations(name)',
          )
          .eq('id', id)
          .single(),
      ) as SaleDetail,
    { deps: [id], tags: ['sales'] },
  )

  const items = useQuery<SaleItemRow[]>(
    async () =>
      unwrap(
        await supabase
          .from('sale_items')
          .select(
            'id, quantity, unit_price, tax_rate, total, product_id, lot_id, products(name, sku, units(code))',
          )
          .eq('sale_id', id)
          .order('id'),
      ) as SaleItemRow[],
    { deps: [id], tags: ['sales'] },
  )

  const locationId = sale.data?.location_id
  const isDraft = sale.data?.status === 'draft'

  // Availability at the sale's location, so a draft can warn about a shortage
  // before `confirm_sale` refuses it.
  const stock = useQuery<StockByLocation[]>(
    async () =>
      unwrap(
        await supabase.from('v_stock_by_location').select('*').eq('location_id', locationId as number),
      ),
    { deps: [locationId], tags: ['inventory'], enabled: locationId != null && isDraft },
  )

  // Once confirmed, the ledger shows exactly which cost layers FEFO consumed —
  // one sale line can span several lots.
  const ledger = useQuery<LedgerEntry[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_inventory_ledger')
          .select('*')
          .eq('reference_type', 'sale')
          .eq('reference_id', id),
      ),
    { deps: [id], tags: ['inventory_movements'], enabled: sale.data?.status === 'confirmed' },
  )

  const availableByProduct = useMemo(
    () => new Map((stock.data ?? []).map((row) => [row.product_id, row.quantity ?? 0])),
    [stock.data],
  )

  const shortages = useMemo(() => {
    if (!isDraft) return []
    return (items.data ?? []).filter(
      (item) => (availableByProduct.get(item.product_id) ?? 0) < item.quantity,
    )
  }, [items.data, availableByProduct, isDraft])

  if (sale.initialLoading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (sale.error || !sale.data) {
    return <ErrorState message={sale.error ?? 'Venta no encontrada.'} onRetry={sale.refetch} />
  }

  const doc = sale.data
  const rows = items.data ?? []

  async function confirmSale() {
    setWorking(true)
    setConfirmError(null)
    try {
      unwrap(await supabase.rpc('confirm_sale', { p_sale_id: id }))
      invalidate('sales', ...INVENTORY_TAGS)
      toast.success('Venta confirmada. El stock ya fue descontado.')
      setConfirming(false)
      sale.refetch()
      ledger.refetch()
    } catch (cause) {
      setConfirmError(cause instanceof Error ? cause.message : 'No se pudo confirmar la venta.')
    } finally {
      setWorking(false)
    }
  }

  async function deleteDraft() {
    setWorking(true)
    try {
      unwrap(await supabase.from('sales').delete().eq('id', id).select('id'))
      invalidate('sales')
      toast.success('Borrador eliminado.')
      void navigate(`${panel.path}/sales`)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'No se pudo eliminar el borrador.')
      setWorking(false)
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={doc.reference ?? `Venta #${doc.id}`}
        backTo={{ to: `${panel.path}/sales`, label: 'Ventas' }}
        badge={<StatusBadge status={doc.status} />}
        description={
          isDraft
            ? 'Borrador: el stock todavía no se descontó.'
            : 'Confirmada: generó la salida de inventario correspondiente.'
        }
        actions={
          isDraft ? (
            <>
              <Button variant="secondary" onClick={() => setDeleting(true)} disabled={working}>
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
              <Button onClick={() => setConfirming(true)} disabled={rows.length === 0}>
                <CheckCircle2 className="h-4 w-4" />
                Confirmar venta
              </Button>
            </>
          ) : null
        }
      />

      {shortages.length > 0 ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <p className="text-sm font-medium text-red-900 dark:text-red-300">
            Stock insuficiente en {doc.locations?.name}
          </p>
          <ul className="mt-1.5 flex flex-col gap-0.5 text-sm text-red-800 dark:text-red-400">
            {shortages.map((item) => (
              <li key={item.id}>
                {item.products?.name}: se piden {formatQuantity(item.quantity)} y hay{' '}
                {formatQuantity(availableByProduct.get(item.product_id) ?? 0)}.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-red-800 dark:text-red-400">
            Confirmar fallará. Registrá una compra o una transferencia hacia esta ubicación primero.
          </p>
        </div>
      ) : null}

      <Card>
        <DescriptionList
          items={[
            { label: 'Cliente', value: doc.customers?.name ?? 'Mostrador' },
            { label: 'NIT / Cédula', value: doc.customers?.tax_id ?? '—' },
            { label: 'Ubicación de salida', value: doc.locations?.name ?? '—' },
            { label: 'Fecha', value: formatDate(doc.date) },
            {
              label: 'Confirmada',
              value: doc.confirmed_at ? formatDateTime(doc.confirmed_at) : '—',
            },
            { label: 'Creada', value: formatDateTime(doc.created_at) },
            ...(doc.notes ? [{ label: 'Notas', value: doc.notes, wide: true }] : []),
          ]}
        />
      </Card>

      <DataTable
        rows={rows}
        columns={[
          {
            key: 'product',
            header: 'Producto',
            cell: (row) => (
              <div className="flex flex-col">
                <Primary>{row.products?.name ?? '—'}</Primary>
                <Muted>{row.products?.sku}</Muted>
              </div>
            ),
          },
          {
            key: 'quantity',
            header: 'Cantidad',
            align: 'right',
            cell: (row) => (
              <div className="flex flex-col items-end">
                <span>
                  {formatQuantity(row.quantity)} <Muted>{row.products?.units?.code ?? ''}</Muted>
                </span>
                {isDraft ? (
                  <Muted>
                    disp. {formatQuantity(availableByProduct.get(row.product_id) ?? 0)}
                  </Muted>
                ) : null}
              </div>
            ),
          },
          {
            key: 'unit_price',
            header: 'Precio unit.',
            align: 'right',
            hideBelow: 'sm',
            cell: (row) => formatMoneyPrecise(row.unit_price),
          },
          {
            key: 'tax',
            header: 'Imp.',
            align: 'right',
            hideBelow: 'lg',
            cell: (row) => formatPercent(row.tax_rate),
          },
          {
            key: 'lot',
            header: 'Lote',
            hideBelow: 'lg',
            cell: (row) =>
              row.lot_id ? <Mono>#{row.lot_id}</Mono> : <Muted>FEFO automático</Muted>,
          },
          {
            key: 'total',
            header: 'Total',
            align: 'right',
            cell: (row) => <Primary>{formatMoney(row.total)}</Primary>,
          },
        ]}
        getRowKey={(row) => row.id}
        loading={items.initialLoading}
        error={items.error}
        onRetry={items.refetch}
        empty={{ icon: Package, title: 'Sin líneas', description: 'Esta venta no tiene productos.' }}
        footer={
          <tr>
            <td
              className="px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white"
              colSpan={2}
            >
              Total · base {formatMoney(doc.subtotal)} + imp. {formatMoney(doc.tax)}
            </td>
            <td className="hidden px-4 py-2.5 sm:table-cell" />
            <td className="hidden px-4 py-2.5 lg:table-cell" />
            <td className="hidden px-4 py-2.5 lg:table-cell" />
            <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
              {formatMoney(doc.total)}
            </td>
          </tr>
        }
      />

      {doc.status === 'confirmed' && (ledger.data?.length ?? 0) > 0 ? (
        <Section
          title="Lotes descargados"
          description="Qué capas de costo consumió la venta. Una línea puede cruzar varios lotes si el pedido supera uno."
        >
          <DataTable
            rows={ledger.data}
            columns={[
              {
                key: 'product',
                header: 'Producto',
                cell: (row) => <Primary>{row.product_name}</Primary>,
              },
              {
                key: 'lot',
                header: 'Lote',
                cell: (row) =>
                  row.lot_number ? <Mono>{row.lot_number}</Mono> : <Muted>Sin número</Muted>,
              },
              {
                key: 'quantity',
                header: 'Cantidad',
                align: 'right',
                cell: (row) => formatQuantity(Math.abs(row.quantity ?? 0)),
              },
              {
                key: 'cost',
                header: 'Costo unit.',
                align: 'right',
                hideBelow: 'sm',
                cell: (row) => formatMoneyPrecise(row.unit_cost),
              },
              {
                key: 'value',
                header: 'Costo total',
                align: 'right',
                cell: (row) => formatMoney(Math.abs(row.value_change ?? 0)),
              },
            ]}
            getRowKey={(row) => row.item_id ?? 0}
            loading={ledger.initialLoading}
            empty={{ title: 'Sin líneas de kardex' }}
          />
        </Section>
      ) : null}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void confirmSale()}
        loading={working}
        error={confirmError}
        confirmLabel="Confirmar venta"
        title="Confirmar venta"
        description="Se descontará el stock por FEFO (vence primero, sale primero) y el documento quedará inmutable. Si no alcanza el inventario, la operación se revierte completa."
      />

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => void deleteDraft()}
        loading={working}
        destructive
        confirmLabel="Eliminar borrador"
        title="Eliminar borrador"
        description="Se eliminarán la venta y sus líneas. Como todavía no fue confirmada, el inventario no cambia."
      />
    </div>
  )
}
