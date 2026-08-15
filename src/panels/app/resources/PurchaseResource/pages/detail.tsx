import { CheckCircle2, Package, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatMoney,
  formatMoneyPrecise,
  formatPercent,
  formatQuantity,
} from '@/lib/format'
import { INVENTORY_TAGS, invalidate, unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { DocumentStatus } from '@/lib/types'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  ErrorState,
  Mono,
  Muted,
  PageHeader,
  Primary,
  Spinner,
  StatusBadge,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'
import { useToast } from '@/ui/toast'
import { LotModal } from '../components/LotModal'

export const meta: PanelPageMeta = {
  label: 'Compra',
  path: '/:purchaseId',
}

type PurchaseDetail = {
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
  suppliers: { name: string; tax_id: string | null } | null
  locations: { name: string } | null
}

type PurchaseItemRow = {
  id: number
  quantity: number
  unit_cost: number
  tax_rate: number
  subtotal: number | null
  tax: number | null
  total: number | null
  lot_id: number | null
  product_id: number
  products: {
    name: string
    sku: string
    track_lot: boolean
    track_expiration: boolean
    units: { code: string } | null
  } | null
  inventory_lots: { lot_number: string | null; expiration_date: string | null } | null
}

export default function PurchaseDetailPage() {
  const panel = usePanel()
  const navigate = useNavigate()
  const toast = useToast()
  const { purchaseId } = useParams()
  const id = Number(purchaseId)

  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lotFor, setLotFor] = useState<PurchaseItemRow | null>(null)

  const purchase = useQuery<PurchaseDetail>(
    async () =>
      unwrap(
        await supabase
          .from('purchases')
          .select(
            'id, reference, date, status, subtotal, tax, total, notes, confirmed_at, created_at, suppliers(name, tax_id), locations(name)',
          )
          .eq('id', id)
          .single(),
      ) as PurchaseDetail,
    { deps: [id], tags: ['purchases'] },
  )

  const items = useQuery<PurchaseItemRow[]>(
    async () =>
      unwrap(
        await supabase
          .from('purchase_items')
          .select(
            'id, quantity, unit_cost, tax_rate, subtotal, tax, total, lot_id, product_id, products(name, sku, track_lot, track_expiration, units(code)), inventory_lots(lot_number, expiration_date)',
          )
          .eq('purchase_id', id)
          .order('id'),
      ) as PurchaseItemRow[],
    { deps: [id], tags: ['purchases', 'inventory_lots'] },
  )

  const movement = useQuery(
    async () =>
      unwrap(
        await supabase
          .from('inventory_movements')
          .select('id, applied_at')
          .eq('reference_type', 'purchase')
          .eq('reference_id', id)
          .limit(1),
      ),
    { deps: [id], tags: ['inventory_movements'] },
  )

  if (purchase.initialLoading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (purchase.error || !purchase.data) {
    return <ErrorState message={purchase.error ?? 'Compra no encontrada.'} onRetry={purchase.refetch} />
  }

  const doc = purchase.data
  const rows = items.data ?? []
  const isDraft = doc.status === 'draft'

  // A product that tracks lots cannot get an auto-created cost layer: the lot
  // number has to come from the user. Surfacing it here turns what would be a
  // confirmation failure into an obvious pending step.
  const missingLots = rows.filter((row) => row.products?.track_lot && row.lot_id == null)

  async function confirmPurchase() {
    setWorking(true)
    setConfirmError(null)
    try {
      // One RPC call: creates the cost layers, writes the movement, applies it
      // to inventory and flips the status — all in a single transaction.
      unwrap(await supabase.rpc('confirm_purchase', { p_purchase_id: id }))
      invalidate('purchases', 'products', ...INVENTORY_TAGS)
      toast.success('Compra confirmada. La mercancía ya está en inventario.')
      setConfirming(false)
      purchase.refetch()
      items.refetch()
      movement.refetch()
    } catch (cause) {
      setConfirmError(cause instanceof Error ? cause.message : 'No se pudo confirmar la compra.')
    } finally {
      setWorking(false)
    }
  }

  async function deleteDraft() {
    setWorking(true)
    try {
      unwrap(await supabase.from('purchases').delete().eq('id', id).select('id'))
      invalidate('purchases')
      toast.success('Borrador eliminado.')
      void navigate(`${panel.path}/purchases`)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'No se pudo eliminar el borrador.')
      setWorking(false)
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={doc.reference ?? `Compra #${doc.id}`}
        backTo={{ to: `${panel.path}/purchases`, label: 'Compras' }}
        badge={<StatusBadge status={doc.status} />}
        description={
          isDraft
            ? 'Borrador: todavía no afecta el inventario. Podés asignar lotes o eliminarla antes de confirmar.'
            : 'Confirmada: generó una entrada de inventario trazable en el kardex.'
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
                Confirmar compra
              </Button>
            </>
          ) : movement.data?.[0] ? (
            <ButtonLink variant="secondary" to={`${panel.path}/movements`}>
              Ver en el kardex
            </ButtonLink>
          ) : null
        }
      />

      {isDraft && missingLots.length > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
            {missingLots.length} línea{missingLots.length === 1 ? '' : 's'} necesita
            {missingLots.length === 1 ? '' : 'n'} un lote antes de confirmar
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
            Estos productos controlan lotes, así que el número de lote (y el vencimiento, si
            corresponde) tiene que cargarse a mano. Usá “Definir lote” en cada línea.
          </p>
        </div>
      ) : null}

      <Card>
        <DescriptionList
          items={[
            { label: 'Proveedor', value: doc.suppliers?.name ?? 'Sin proveedor' },
            { label: 'NIT', value: doc.suppliers?.tax_id ?? '—' },
            { label: 'Ubicación de entrada', value: doc.locations?.name ?? '—' },
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
            key: 'lot',
            header: 'Lote',
            cell: (row) =>
              row.lot_id ? (
                <div className="flex flex-col">
                  <Mono>{row.inventory_lots?.lot_number ?? `#${row.lot_id}`}</Mono>
                  {row.inventory_lots?.expiration_date ? (
                    <Muted>vence {formatDateOnly(row.inventory_lots.expiration_date)}</Muted>
                  ) : null}
                </div>
              ) : row.products?.track_lot ? (
                isDraft ? (
                  <Button size="sm" variant="secondary" onClick={() => setLotFor(row)}>
                    <Tag className="h-3.5 w-3.5" />
                    Definir lote
                  </Button>
                ) : (
                  <Badge tone="danger">Falta lote</Badge>
                )
              ) : (
                <Muted>Se crea al confirmar</Muted>
              ),
          },
          {
            key: 'quantity',
            header: 'Cantidad',
            align: 'right',
            cell: (row) => (
              <span>
                {formatQuantity(row.quantity)}{' '}
                <Muted>{row.products?.units?.code ?? ''}</Muted>
              </span>
            ),
          },
          {
            key: 'unit_cost',
            header: 'Costo unit.',
            align: 'right',
            hideBelow: 'sm',
            cell: (row) => formatMoneyPrecise(row.unit_cost),
          },
          {
            key: 'tax',
            header: 'Imp.',
            align: 'right',
            hideBelow: 'lg',
            cell: (row) => formatPercent(row.tax_rate),
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
        empty={{
          icon: Package,
          title: 'Sin líneas',
          description: 'Esta compra no tiene productos cargados.',
        }}
        footer={
          <>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                Subtotal
              </td>
              <td className="hidden px-4 py-2 lg:table-cell" />
              <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                {formatMoney(doc.subtotal)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                Impuestos
              </td>
              <td className="hidden px-4 py-2 lg:table-cell" />
              <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                {formatMoney(doc.tax)}
              </td>
            </tr>
            <tr>
              <td
                className="px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white"
                colSpan={4}
              >
                Total
              </td>
              <td className="hidden px-4 py-2.5 lg:table-cell" />
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {formatMoney(doc.total)}
              </td>
            </tr>
          </>
        }
      />

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void confirmPurchase()}
        loading={working}
        error={confirmError}
        confirmLabel="Confirmar compra"
        title="Confirmar compra"
        description="Se crearán las capas de costo, entrará la mercancía al inventario y el documento quedará inmutable. Para revertirlo después hay que registrar un ajuste."
      />

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => void deleteDraft()}
        loading={working}
        destructive
        confirmLabel="Eliminar borrador"
        title="Eliminar borrador"
        description="Se eliminarán la compra y sus líneas. Como todavía no fue confirmada, el inventario no cambia."
      />

      {lotFor ? (
        <LotModal
          open
          onClose={() => setLotFor(null)}
          onSaved={() => {
            setLotFor(null)
            items.refetch()
          }}
          purchaseItemId={lotFor.id}
          productId={lotFor.product_id}
          productName={lotFor.products?.name ?? ''}
          unitCost={lotFor.unit_cost}
          receivedAt={doc.date}
          requiresLotNumber={lotFor.products?.track_lot ?? false}
          requiresExpiration={lotFor.products?.track_expiration ?? false}
        />
      ) : null}
    </div>
  )
}
