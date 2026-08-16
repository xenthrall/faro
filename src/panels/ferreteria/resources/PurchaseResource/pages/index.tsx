import { Plus, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDate, formatMoney } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import { DOCUMENT_STATUS_LABELS, type DocumentStatus } from '@/lib/types'
import {
  ButtonLink,
  DataTable,
  Mono,
  Muted,
  PageHeader,
  Primary,
  StatusBadge,
  controlClassName,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'

type PurchaseRow = {
  id: number
  reference: string | null
  date: string
  status: DocumentStatus
  total: number
  subtotal: number
  location_id: number
  suppliers: { name: string } | null
  locations: { name: string } | null
}

export default function PurchasesPage() {
  const panel = usePanel()
  const [statusFilter, setStatusFilter] = useState('')

  const purchases = useQuery<PurchaseRow[]>(
    async () =>
      unwrap(
        await supabase
          .from('purchases')
          .select(
            'id, reference, date, status, total, subtotal, location_id, suppliers(name), locations(name)',
          )
          .order('date', { ascending: false })
          .order('id', { ascending: false }),
      ) as PurchaseRow[],
    { tags: ['purchases'] },
  )

  const rows = useMemo(() => {
    const all = purchases.data ?? []
    return statusFilter ? all.filter((row) => row.status === statusFilter) : all
  }, [purchases.data, statusFilter])

  const draftCount = (purchases.data ?? []).filter((row) => row.status === 'draft').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compras"
        description={
          draftCount > 0
            ? `Tenés ${draftCount} borrador${draftCount === 1 ? '' : 'es'} sin confirmar. Un borrador todavía no afecta el inventario.`
            : 'Registrás la compra como borrador y, al confirmarla, entra al inventario con su costo.'
        }
        actions={
          <ButtonLink to={`${panel.path}/purchases/create`}>
            <Plus className="h-4 w-4" />
            Nueva compra
          </ButtonLink>
        }
      />

      <DataTable
        rows={rows}
        columns={[
          {
            key: 'reference',
            header: 'Documento',
            cell: (row) => (
              <div className="flex flex-col">
                <Primary>{row.reference ?? `Compra #${row.id}`}</Primary>
                <Muted>{formatDate(row.date)}</Muted>
              </div>
            ),
          },
          {
            key: 'supplier',
            header: 'Proveedor',
            cell: (row) => row.suppliers?.name ?? <Muted>Sin proveedor</Muted>,
          },
          {
            key: 'location',
            header: 'Ubicación',
            hideBelow: 'md',
            cell: (row) => row.locations?.name ?? '—',
          },
          {
            key: 'status',
            header: 'Estado',
            cell: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'total',
            header: 'Total',
            align: 'right',
            cell: (row) => (
              <div className="flex flex-col items-end">
                <Primary>{formatMoney(row.total)}</Primary>
                <Muted>base {formatMoney(row.subtotal)}</Muted>
              </div>
            ),
          },
          {
            key: 'id',
            header: '#',
            align: 'right',
            hideBelow: 'lg',
            cell: (row) => <Mono>{row.id}</Mono>,
          },
        ]}
        getRowKey={(row) => row.id}
        loading={purchases.initialLoading}
        error={purchases.error}
        onRetry={purchases.refetch}
        rowHref={(row) => `${panel.path}/purchases/${row.id}`}
        searchPlaceholder="Buscar por documento o proveedor…"
        filter={(row, query) =>
          (row.reference ?? '').toLowerCase().includes(query) ||
          (row.suppliers?.name ?? '').toLowerCase().includes(query) ||
          String(row.id).includes(query)
        }
        toolbar={
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrar por estado"
            className={`${controlClassName} sm:w-44`}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(DOCUMENT_STATUS_LABELS) as DocumentStatus[]).map((status) => (
              <option key={status} value={status}>
                {DOCUMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        }
        empty={{
          icon: ShoppingCart,
          title: 'Todavía no hay compras',
          description:
            'Una compra confirmada es la forma normal de que entre mercancía con su costo al inventario.',
          action: (
            <ButtonLink to={`${panel.path}/purchases/create`}>
              <Plus className="h-4 w-4" />
              Nueva compra
            </ButtonLink>
          ),
        }}
      />
    </div>
  )
}
