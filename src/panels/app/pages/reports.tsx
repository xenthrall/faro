import { BarChart3, CalendarClock, CheckCircle2, MapPin, TrendingDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  formatDateOnly,
  formatDaysToExpiration,
  formatMoney,
  formatQuantity,
} from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { ExpiringStock, ProductStock, StockByLocation } from '@/lib/types'
import {
  Badge,
  Card,
  DataTable,
  ExpirationBadge,
  Mono,
  Muted,
  PageHeader,
  Primary,
  Section,
  Stat,
  StatGrid,
  controlClassName,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Reportes',
  icon: BarChart3,
  group: 'Inventario',
  order: 12,
}

/** Matches the horizons the database model was designed to answer. */
const HORIZONS = [
  { value: '7', label: 'Próximos 7 días' },
  { value: '15', label: 'Próximos 15 días' },
  { value: '30', label: 'Próximos 30 días' },
  { value: 'expired', label: 'Solo vencidos' },
  { value: 'all', label: 'Todos los lotes con vencimiento' },
]

export default function ReportsPage() {
  const panel = usePanel()
  const [horizon, setHorizon] = useState('30')

  const expiring = useQuery<ExpiringStock[]>(
    async () =>
      unwrap(await supabase.from('v_expiring_stock').select('*').order('expiration_date')),
    { tags: ['inventory', 'inventory_lots'] },
  )

  const byLocation = useQuery<StockByLocation[]>(
    async () => unwrap(await supabase.from('v_stock_by_location').select('*')),
    { tags: ['inventory'] },
  )

  const products = useQuery<ProductStock[]>(
    async () => unwrap(await supabase.from('v_product_stock').select('*')),
    { tags: ['inventory', 'products'] },
  )

  // The database's own consistency check: inventory must equal the sum of the
  // applied ledger. Surfacing it here means the invariant is verifiable from
  // the product, not only from psql.
  const integrity = useQuery(
    async () => unwrap(await supabase.rpc('verify_inventory_integrity')),
    { tags: ['inventory', 'inventory_movements'] },
  )

  const expiringRows = useMemo(() => {
    const all = expiring.data ?? []
    if (horizon === 'all') return all
    if (horizon === 'expired') return all.filter((row) => (row.days_to_expiration ?? 0) < 0)
    const days = Number(horizon)
    return all.filter(
      (row) => (row.days_to_expiration ?? 0) >= 0 && (row.days_to_expiration ?? 0) <= days,
    )
  }, [expiring.data, horizon])

  const locationTotals = useMemo(() => {
    const map = new Map<number, { name: string; value: number; products: number }>()
    for (const row of byLocation.data ?? []) {
      const current = map.get(row.location_id ?? 0) ?? {
        name: row.location_name ?? '—',
        value: 0,
        products: 0,
      }
      current.value += row.stock_value ?? 0
      current.products += (row.quantity ?? 0) > 0 ? 1 : 0
      map.set(row.location_id ?? 0, current)
    }
    return [...map.entries()].map(([id, data]) => ({ id, ...data }))
  }, [byLocation.data])

  const lowStock = (products.data ?? []).filter((row) => row.below_min_stock)
  const expiredValue = (expiring.data ?? [])
    .filter((row) => (row.days_to_expiration ?? 0) < 0)
    .reduce((sum, row) => sum + (row.stock_value ?? 0), 0)
  const totalValue = locationTotals.reduce((sum, row) => sum + row.value, 0)
  const discrepancies = integrity.data?.length ?? 0

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reportes"
        description="Vencimientos, valorización y control de consistencia del inventario."
      />

      <StatGrid>
        <Stat
          label="Valor total"
          value={formatMoney(totalValue)}
          icon={BarChart3}
          loading={byLocation.initialLoading}
        />
        <Stat
          label="Valor vencido"
          value={formatMoney(expiredValue)}
          icon={CalendarClock}
          loading={expiring.initialLoading}
          tone={expiredValue > 0 ? 'danger' : 'neutral'}
          detail="sigue contando como existencia hasta que lo des de baja"
        />
        <Stat
          label="Productos bajo mínimo"
          value={lowStock.length}
          icon={TrendingDown}
          loading={products.initialLoading}
          tone={lowStock.length > 0 ? 'warning' : 'neutral'}
        />
        <Stat
          label="Consistencia"
          value={discrepancies === 0 ? 'Correcta' : `${discrepancies} diferencias`}
          icon={CheckCircle2}
          loading={integrity.initialLoading}
          tone={discrepancies === 0 ? 'neutral' : 'danger'}
          detail="existencias vs. suma del kardex"
        />
      </StatGrid>

      <Section
        title="Vencimientos"
        description="El vencimiento no descuenta stock: la mercancía sigue existiendo hasta que la retires con un ajuste."
      >
        <DataTable
          rows={expiringRows}
          columns={[
            {
              key: 'product',
              header: 'Producto',
              cell: (row) => (
                <div className="flex flex-col">
                  <Primary>{row.product_name}</Primary>
                  <Muted>{row.sku}</Muted>
                </div>
              ),
            },
            {
              key: 'lot',
              header: 'Lote',
              cell: (row) => (
                <div className="flex flex-col">
                  <span>{row.lot_number ?? '—'}</span>
                  <Muted>{row.location_name}</Muted>
                </div>
              ),
            },
            {
              key: 'expiration',
              header: 'Vencimiento',
              cell: (row) => (
                <div className="flex flex-col">
                  <span>{formatDateOnly(row.expiration_date)}</span>
                  <Muted>{formatDaysToExpiration(row.days_to_expiration)}</Muted>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado',
              cell: (row) => <ExpirationBadge status={row.expiration_status} />,
            },
            {
              key: 'quantity',
              header: 'Cantidad',
              align: 'right',
              cell: (row) => formatQuantity(row.quantity),
            },
            {
              key: 'value',
              header: 'Valor',
              align: 'right',
              hideBelow: 'sm',
              cell: (row) => formatMoney(row.stock_value),
            },
          ]}
          getRowKey={(row) => row.lot_id ?? 0}
          loading={expiring.initialLoading}
          error={expiring.error}
          onRetry={expiring.refetch}
          rowHref={(row) => `${panel.path}/products/${row.product_id}`}
          toolbar={
            <select
              value={horizon}
              onChange={(event) => setHorizon(event.target.value)}
              aria-label="Horizonte de vencimiento"
              className={`${controlClassName} sm:w-64`}
            >
              {HORIZONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          }
          empty={{
            icon: CalendarClock,
            title: 'Nada en este horizonte',
            description:
              'Solo aparecen productos que controlan vencimiento y tienen existencias.',
          }}
        />
      </Section>

      <Section
        title="Valorización por ubicación"
        description="Cuánto vale el inventario en cada lugar, al costo de entrada de cada lote."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locationTotals.map((location) => (
            <Card key={location.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {location.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {location.products} producto{location.products === 1 ? '' : 's'} con stock
                  </p>
                </div>
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
              </div>
              <p className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
                {formatMoney(location.value)}
              </p>
              {totalValue > 0 ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gray-900 dark:bg-white"
                    style={{ width: `${Math.round((location.value / totalValue) * 100)}%` }}
                  />
                </div>
              ) : null}
            </Card>
          ))}
          {locationTotals.length === 0 && !byLocation.initialLoading ? (
            <Card className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Todavía no hay existencias en ninguna ubicación.
              </p>
            </Card>
          ) : null}
        </div>
      </Section>

      <Section
        title="Productos bajo mínimo"
        description="Su stock total está en o por debajo del mínimo configurado."
      >
        <DataTable
          rows={lowStock}
          columns={[
            {
              key: 'product',
              header: 'Producto',
              cell: (row) => (
                <div className="flex flex-col">
                  <Primary>{row.product_name}</Primary>
                  <Muted>
                    {row.sku}
                    {row.category_name ? ` · ${row.category_name}` : ''}
                  </Muted>
                </div>
              ),
            },
            {
              key: 'quantity',
              header: 'Existencias',
              align: 'right',
              cell: (row) => (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {formatQuantity(row.total_quantity)} {row.unit_code}
                </span>
              ),
            },
            {
              key: 'min',
              header: 'Mínimo',
              align: 'right',
              cell: (row) => formatQuantity(row.min_stock),
            },
            {
              key: 'value',
              header: 'Valor',
              align: 'right',
              hideBelow: 'sm',
              cell: (row) => formatMoney(row.total_value),
            },
          ]}
          getRowKey={(row) => row.product_id ?? 0}
          loading={products.initialLoading}
          error={products.error}
          onRetry={products.refetch}
          rowHref={(row) => `${panel.path}/products/${row.product_id}`}
          empty={{
            icon: TrendingDown,
            title: 'Nada bajo mínimo',
            description:
              'Ningún producto con stock mínimo configurado está por debajo del umbral.',
          }}
        />
      </Section>

      <Section
        title="Consistencia del inventario"
        description="Las existencias deben coincidir exactamente con la suma de los movimientos aplicados."
      >
        {discrepancies === 0 ? (
          <Card>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Sin diferencias
                </p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Cada existencia se explica por su historial de movimientos.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <DataTable
            rows={integrity.data}
            columns={[
              { key: 'product', header: 'Producto', cell: (row) => <Mono>#{row.product_id}</Mono> },
              { key: 'location', header: 'Ubicación', cell: (row) => <Mono>#{row.location_id}</Mono> },
              { key: 'lot', header: 'Lote', cell: (row) => <Mono>#{row.lot_id ?? '—'}</Mono> },
              {
                key: 'inventory',
                header: 'Existencias',
                align: 'right',
                cell: (row) => formatQuantity(row.inventory_qty),
              },
              {
                key: 'movements',
                header: 'Kardex',
                align: 'right',
                cell: (row) => formatQuantity(row.movements_qty),
              },
              {
                key: 'difference',
                header: 'Diferencia',
                align: 'right',
                cell: (row) => <Badge tone="danger">{formatQuantity(row.difference)}</Badge>,
              },
            ]}
            getRowKey={(row) => `${row.product_id}-${row.location_id}-${row.lot_id}`}
            loading={integrity.initialLoading}
            empty={{ title: 'Sin diferencias' }}
          />
        )}
      </Section>
    </div>
  )
}
