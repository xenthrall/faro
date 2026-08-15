import { ArrowRight, ArrowRightLeft, Plus } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { DocumentStatus } from '@/lib/types'
import {
  ButtonLink,
  DataTable,
  Muted,
  PageHeader,
  Primary,
  StatusBadge,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'

type TransferRow = {
  id: number
  reference: string | null
  date: string
  status: DocumentStatus
  notes: string | null
  source: { name: string } | null
  destination: { name: string } | null
}

export default function TransfersPage() {
  const panel = usePanel()

  const transfers = useQuery<TransferRow[]>(
    async () =>
      unwrap(
        await supabase
          .from('inventory_transfers')
          .select(
            'id, reference, date, status, notes, source:locations!inventory_transfers_source_location_id_fkey(name), destination:locations!inventory_transfers_destination_location_id_fkey(name)',
          )
          .order('date', { ascending: false })
          .order('id', { ascending: false }),
      ) as TransferRow[],
    { tags: ['transfers'] },
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transferencias"
        description="Mover mercancía entre ubicaciones. El lote y su costo viajan con ella, así que el valor del inventario no cambia."
        actions={
          <ButtonLink to={`${panel.path}/transfers/create`}>
            <Plus className="h-4 w-4" />
            Nueva transferencia
          </ButtonLink>
        }
      />

      <DataTable
        rows={transfers.data}
        columns={[
          {
            key: 'reference',
            header: 'Documento',
            cell: (row) => (
              <div className="flex flex-col">
                <Primary>{row.reference ?? `Transferencia #${row.id}`}</Primary>
                <Muted>{formatDate(row.date)}</Muted>
              </div>
            ),
          },
          {
            key: 'route',
            header: 'Origen → destino',
            cell: (row) => (
              <span className="flex flex-wrap items-center gap-1.5 text-sm">
                <span>{row.source?.name ?? '—'}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{row.destination?.name ?? '—'}</span>
              </span>
            ),
          },
          { key: 'status', header: 'Estado', cell: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'notes',
            header: 'Notas',
            hideBelow: 'lg',
            cell: (row) => row.notes ?? <Muted>—</Muted>,
          },
        ]}
        getRowKey={(row) => row.id}
        loading={transfers.initialLoading}
        error={transfers.error}
        onRetry={transfers.refetch}
        rowHref={(row) => `${panel.path}/transfers/${row.id}`}
        searchPlaceholder="Buscar por documento o ubicación…"
        filter={(row, query) =>
          (row.reference ?? '').toLowerCase().includes(query) ||
          (row.source?.name ?? '').toLowerCase().includes(query) ||
          (row.destination?.name ?? '').toLowerCase().includes(query)
        }
        empty={{
          icon: ArrowRightLeft,
          title: 'Todavía no hay transferencias',
          description: 'Usalas para surtir la tienda desde la bodega sin alterar costos.',
          action: (
            <ButtonLink to={`${panel.path}/transfers/create`}>
              <Plus className="h-4 w-4" />
              Nueva transferencia
            </ButtonLink>
          ),
        }}
      />
    </div>
  )
}
