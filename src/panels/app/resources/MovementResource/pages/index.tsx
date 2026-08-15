import { ArrowLeftRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDateTime, formatMoney, formatMoneyPrecise, formatQuantity } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import {
  MOVEMENT_TYPE_LABELS,
  type LedgerEntry,
  type MovementType,
} from '@/lib/types'
import {
  Badge,
  DataTable,
  Mono,
  Muted,
  PageHeader,
  Primary,
  controlClassName,
  type BadgeTone,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'

const TYPE_TONES: Record<MovementType, BadgeTone> = {
  initial_stock: 'info',
  purchase: 'success',
  sale: 'warning',
  transfer: 'info',
  adjustment: 'neutral',
  return: 'neutral',
}

/** Where a movement's source document lives, so the row can link back to it. */
const DOCUMENT_ROUTES: Record<string, string> = {
  purchase: 'purchases',
  sale: 'sales',
  transfer: 'transfers',
}

export default function MovementsPage() {
  const panel = usePanel()
  const [typeFilter, setTypeFilter] = useState('')

  // The ledger is append-only and grows without bound, so this is capped and
  // ordered newest-first: the panel shows recent activity, and a specific
  // product's full history is reachable from its own page.
  const ledger = useQuery<LedgerEntry[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_inventory_ledger')
          .select('*')
          .order('date', { ascending: false })
          .order('item_id', { ascending: false })
          .limit(500),
      ),
    { tags: ['inventory_movements'] },
  )

  const rows = useMemo(() => {
    const all = ledger.data ?? []
    if (!typeFilter) return all
    return all.filter((row) => row.movement_type === typeFilter)
  }, [ledger.data, typeFilter])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimientos"
        description="El kardex: toda existencia se explica por estas líneas. Positivo entra, negativo sale."
      />

      <DataTable
        rows={rows}
        columns={[
          {
            key: 'date',
            header: 'Fecha',
            cell: (row) => (
              <div className="flex flex-col">
                <span className="whitespace-nowrap">{formatDateTime(row.date)}</span>
                <Muted>#{row.movement_id}</Muted>
              </div>
            ),
          },
          {
            key: 'type',
            header: 'Tipo',
            cell: (row) => (
              <Badge tone={TYPE_TONES[row.movement_type as MovementType] ?? 'neutral'}>
                {MOVEMENT_TYPE_LABELS[row.movement_type as MovementType] ?? row.movement_type}
              </Badge>
            ),
          },
          {
            key: 'product',
            header: 'Producto',
            cell: (row) => (
              <div className="flex flex-col">
                <Primary>{row.product_name}</Primary>
                <Muted>
                  {row.sku}
                  {row.lot_number ? ` · lote ${row.lot_number}` : ''}
                </Muted>
              </div>
            ),
          },
          {
            key: 'location',
            header: 'Ubicación',
            hideBelow: 'md',
            cell: (row) => row.location_name,
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
          {
            key: 'unit_cost',
            header: 'Costo unit.',
            align: 'right',
            hideBelow: 'lg',
            cell: (row) => formatMoneyPrecise(row.unit_cost),
          },
          {
            key: 'value',
            header: 'Impacto',
            align: 'right',
            hideBelow: 'sm',
            cell: (row) => formatMoney(row.value_change),
          },
          {
            key: 'reference',
            header: 'Documento',
            hideBelow: 'lg',
            cell: (row) =>
              row.reference_type && row.reference_id ? (
                <Mono>
                  {row.reference_type}#{row.reference_id}
                </Mono>
              ) : (
                <Muted>Manual</Muted>
              ),
          },
        ]}
        getRowKey={(row) => row.item_id ?? 0}
        loading={ledger.initialLoading}
        error={ledger.error}
        onRetry={ledger.refetch}
        pageSize={30}
        rowHref={(row) => {
          const route = row.reference_type ? DOCUMENT_ROUTES[row.reference_type] : undefined
          return route && row.reference_id
            ? `${panel.path}/${route}/${row.reference_id}`
            : `${panel.path}/products/${row.product_id}`
        }}
        searchPlaceholder="Buscar por producto, SKU, lote o ubicación…"
        filter={(row, query) =>
          (row.product_name ?? '').toLowerCase().includes(query) ||
          (row.sku ?? '').toLowerCase().includes(query) ||
          (row.lot_number ?? '').toLowerCase().includes(query) ||
          (row.location_name ?? '').toLowerCase().includes(query)
        }
        toolbar={
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filtrar por tipo de movimiento"
            className={`${controlClassName} sm:w-48`}
          >
            <option value="">Todos los tipos</option>
            {(Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]).map((type) => (
              <option key={type} value={type}>
                {MOVEMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        }
        empty={{
          icon: ArrowLeftRight,
          title: 'Todavía no hay movimientos',
          description:
            'Confirmá una compra, una venta o un ajuste y aparecerá acá con su impacto en existencias.',
        }}
      />
    </div>
  )
}
