import { Plus, Receipt } from 'lucide-react'
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

type SaleRow = {
  id: number
  reference: string | null
  date: string
  status: DocumentStatus
  subtotal: number
  total: number
  customers: { name: string } | null
  locations: { name: string } | null
}

export default function SalesPage() {
  const panel = usePanel()
  const [statusFilter, setStatusFilter] = useState('')

  const sales = useQuery<SaleRow[]>(
    async () =>
      unwrap(
        await supabase
          .from('sales')
          .select('id, reference, date, status, subtotal, total, customers(name), locations(name)')
          .order('date', { ascending: false })
          .order('id', { ascending: false }),
      ) as SaleRow[],
    { tags: ['sales'] },
  )

  const rows = useMemo(() => {
    const all = sales.data ?? []
    return statusFilter ? all.filter((row) => row.status === statusFilter) : all
  }, [sales.data, statusFilter])

  const confirmedTotal = (sales.data ?? [])
    .filter((row) => row.status === 'confirmed')
    .reduce((sum, row) => sum + row.total, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ventas"
        description={`Ventas confirmadas por ${formatMoney(confirmedTotal)}. Confirmar una venta descuenta el stock por FEFO.`}
        actions={
          <ButtonLink to={`${panel.path}/sales/create`}>
            <Plus className="h-4 w-4" />
            Nueva venta
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
                <Primary>{row.reference ?? `Venta #${row.id}`}</Primary>
                <Muted>{formatDate(row.date)}</Muted>
              </div>
            ),
          },
          {
            key: 'customer',
            header: 'Cliente',
            cell: (row) => row.customers?.name ?? <Muted>Mostrador</Muted>,
          },
          {
            key: 'location',
            header: 'Ubicación',
            hideBelow: 'md',
            cell: (row) => row.locations?.name ?? '—',
          },
          { key: 'status', header: 'Estado', cell: (row) => <StatusBadge status={row.status} /> },
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
        loading={sales.initialLoading}
        error={sales.error}
        onRetry={sales.refetch}
        rowHref={(row) => `${panel.path}/sales/${row.id}`}
        searchPlaceholder="Buscar por documento o cliente…"
        filter={(row, query) =>
          (row.reference ?? '').toLowerCase().includes(query) ||
          (row.customers?.name ?? '').toLowerCase().includes(query) ||
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
          icon: Receipt,
          title: 'Todavía no hay ventas',
          description: 'Necesitás productos con existencias para poder registrar la primera.',
          action: (
            <ButtonLink to={`${panel.path}/sales/create`}>
              <Plus className="h-4 w-4" />
              Nueva venta
            </ButtonLink>
          ),
        }}
      />
    </div>
  )
}
