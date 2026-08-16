import { ArrowRight, CheckCircle2, Package, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { formatDate, formatDateTime, formatMoneyPrecise, formatQuantity } from '@/lib/format'
import { INVENTORY_TAGS, invalidate, unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { DocumentStatus, LedgerEntry } from '@/lib/types'
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
  label: 'Transferencia',
  path: '/:transferId',
}

type TransferDetail = {
  id: number
  reference: string | null
  date: string
  status: DocumentStatus
  notes: string | null
  confirmed_at: string | null
  created_at: string
  source: { name: string } | null
  destination: { name: string } | null
}

type TransferItemRow = {
  id: number
  quantity: number
  unit_cost: number | null
  lot_id: number | null
  products: { name: string; sku: string; units: { code: string } | null } | null
  inventory_lots: { lot_number: string | null } | null
}

export default function TransferDetailPage() {
  const panel = usePanel()
  const navigate = useNavigate()
  const toast = useToast()
  const { transferId } = useParams()
  const id = Number(transferId)

  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const transfer = useQuery<TransferDetail>(
    async () =>
      unwrap(
        await supabase
          .from('inventory_transfers')
          .select(
            'id, reference, date, status, notes, confirmed_at, created_at, source:locations!inventory_transfers_source_location_id_fkey(name), destination:locations!inventory_transfers_destination_location_id_fkey(name)',
          )
          .eq('id', id)
          .single(),
      ) as TransferDetail,
    { deps: [id], tags: ['transfers'] },
  )

  const items = useQuery<TransferItemRow[]>(
    async () =>
      unwrap(
        await supabase
          .from('inventory_transfer_items')
          .select(
            'id, quantity, unit_cost, lot_id, products(name, sku, units(code)), inventory_lots(lot_number)',
          )
          .eq('transfer_id', id)
          .order('id'),
      ) as TransferItemRow[],
    { deps: [id], tags: ['transfers', 'inventory_lots'] },
  )

  const ledger = useQuery<LedgerEntry[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_inventory_ledger')
          .select('*')
          .eq('reference_type', 'transfer')
          .eq('reference_id', id)
          .order('item_id'),
      ),
    {
      deps: [id],
      tags: ['inventory_movements'],
      enabled: transfer.data?.status === 'confirmed',
    },
  )

  if (transfer.initialLoading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (transfer.error || !transfer.data) {
    return (
      <ErrorState
        message={transfer.error ?? 'Transferencia no encontrada.'}
        onRetry={transfer.refetch}
      />
    )
  }

  const doc = transfer.data
  const rows = items.data ?? []
  const isDraft = doc.status === 'draft'

  async function confirmTransfer() {
    setWorking(true)
    setConfirmError(null)
    try {
      unwrap(await supabase.rpc('confirm_transfer', { p_transfer_id: id }))
      invalidate('transfers', ...INVENTORY_TAGS)
      toast.success('Transferencia confirmada. La mercancía ya está en el destino.')
      setConfirming(false)
      transfer.refetch()
      items.refetch()
      ledger.refetch()
    } catch (cause) {
      setConfirmError(
        cause instanceof Error ? cause.message : 'No se pudo confirmar la transferencia.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function deleteDraft() {
    setWorking(true)
    try {
      unwrap(await supabase.from('inventory_transfers').delete().eq('id', id).select('id'))
      invalidate('transfers')
      toast.success('Borrador eliminado.')
      void navigate(`${panel.path}/transfers`)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'No se pudo eliminar el borrador.')
      setWorking(false)
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={doc.reference ?? `Transferencia #${doc.id}`}
        backTo={{ to: `${panel.path}/transfers`, label: 'Transferencias' }}
        badge={<StatusBadge status={doc.status} />}
        description={
          isDraft
            ? 'Borrador: la mercancía todavía no se movió.'
            : 'Confirmada: la salida y la entrada quedaron registradas contra el mismo lote.'
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
                Confirmar transferencia
              </Button>
            </>
          ) : null
        }
      />

      <Card>
        <DescriptionList
          columns={2}
          items={[
            {
              label: 'Ruta',
              value: (
                <span className="flex flex-wrap items-center gap-1.5">
                  {doc.source?.name ?? '—'}
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  {doc.destination?.name ?? '—'}
                </span>
              ),
            },
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
                <Mono>{row.inventory_lots?.lot_number ?? `#${row.lot_id}`}</Mono>
              ) : (
                <Muted>Automático (FEFO)</Muted>
              ),
          },
          {
            key: 'unit_cost',
            header: 'Costo unit.',
            align: 'right',
            hideBelow: 'sm',
            cell: (row) =>
              row.unit_cost != null ? (
                formatMoneyPrecise(row.unit_cost)
              ) : (
                <Muted>se toma del lote</Muted>
              ),
          },
          {
            key: 'quantity',
            header: 'Cantidad',
            align: 'right',
            cell: (row) => (
              <Primary>
                {formatQuantity(row.quantity)} <Muted>{row.products?.units?.code ?? ''}</Muted>
              </Primary>
            ),
          },
        ]}
        getRowKey={(row) => row.id}
        loading={items.initialLoading}
        error={items.error}
        onRetry={items.refetch}
        empty={{
          icon: Package,
          title: 'Sin líneas',
          description: 'Esta transferencia no tiene productos.',
        }}
      />

      {doc.status === 'confirmed' && (ledger.data?.length ?? 0) > 0 ? (
        <Section
          title="Impacto en el kardex"
          description="Una salida y una entrada por cada lote movido, apuntando a la misma capa de costo."
        >
          <DataTable
            rows={ledger.data}
            columns={[
              {
                key: 'product',
                header: 'Producto',
                cell: (row) => <Primary>{row.product_name}</Primary>,
              },
              { key: 'location', header: 'Ubicación', cell: (row) => row.location_name },
              {
                key: 'lot',
                header: 'Lote',
                hideBelow: 'sm',
                cell: (row) =>
                  row.lot_number ? <Mono>{row.lot_number}</Mono> : <Muted>Sin número</Muted>,
              },
              {
                key: 'quantity',
                header: 'Cantidad',
                align: 'right',
                cell: (row) => {
                  const quantity = row.quantity ?? 0
                  return (
                    <span
                      className={
                        quantity < 0
                          ? 'font-medium text-red-600 dark:text-red-400'
                          : 'font-medium text-emerald-700 dark:text-emerald-400'
                      }
                    >
                      {quantity > 0 ? '+' : ''}
                      {formatQuantity(quantity)}
                    </span>
                  )
                },
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
        onConfirm={() => void confirmTransfer()}
        loading={working}
        error={confirmError}
        confirmLabel="Confirmar transferencia"
        title="Confirmar transferencia"
        description="La mercancía saldrá del origen y entrará al destino con el mismo lote y costo. Si no hay stock suficiente, la operación se revierte completa."
      />

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => void deleteDraft()}
        loading={working}
        destructive
        confirmLabel="Eliminar borrador"
        title="Eliminar borrador"
        description="Se eliminarán la transferencia y sus líneas. Como todavía no fue confirmada, el inventario no cambia."
      />
    </div>
  )
}
