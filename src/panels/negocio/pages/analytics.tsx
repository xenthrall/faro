import { Coins, Receipt, ShoppingCart, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  bucketFor,
  bucketLabel,
  deltaPercent,
  describeRange,
  formatBucket,
  formatBucketLong,
  previousRange,
  RANGE_PRESETS,
  resolveRange,
  todayIso,
  type RangePresetId,
} from '@/lib/date-ranges'
import { EMPTY_SUMMARY, type Summary } from '@/lib/analytics'
import { formatMoney, formatPercent, formatQuantity } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import {
  Card,
  DataTable,
  ErrorState,
  Muted,
  PageHeader,
  Primary,
  Section,
  Stat,
  StatGrid,
  type Column,
} from '@/ui/components'
import { BarList, ColumnChart, ShareBar, type ChartSeries } from '@/ui/charts'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'
import { RangeFilter } from '../components/RangeFilter'

export const meta: PanelPageMeta = {
  label: 'Ventas y ganancia',
  icon: TrendingUp,
  order: 1,
}

type Point = {
  bucket: string
  revenue: number
  cost: number
  profit: number
  purchases: number
  sales_count: number
}

type ProductRow = {
  product_id: number
  sku: string
  product_name: string
  category_name: string
  unit_code: string
  units_sold: number
  revenue: number
  cost: number
  profit: number
  margin_pct: number | null
}

type LocationRow = {
  location_id: number
  location_name: string
  revenue: number
  cost: number
  profit: number
  margin_pct: number | null
  sales_count: number
}

// Costo primero, ganancia arriba: la parte que el negocio se queda cierra la
// columna, que es donde el ojo la encuentra al comparar intervalos.
const MARGIN_SERIES: ChartSeries[] = [
  { key: 'cost', label: 'Costo', color: 'var(--viz-1)' },
  { key: 'profit', label: 'Ganancia', color: 'var(--viz-2)' },
]

export default function AnalyticsPage() {
  const panel = usePanel()
  const [preset, setPreset] = useState<RangePresetId>('today')
  const [custom, setCustom] = useState({ from: todayIso(-29), to: todayIso() })

  const range = useMemo(() => resolveRange(preset, custom), [preset, custom])
  const comparison = useMemo(() => previousRange(range, preset), [range, preset])
  const bucket = bucketFor(range)

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const from = range.from.toISOString()
  const to = range.to.toISOString()

  const summary = useQuery<Summary>(
    async () => {
      const rows = unwrap(await supabase.rpc('analytics_summary', { p_from: from, p_to: to }))
      return (rows[0] as Summary) ?? EMPTY_SUMMARY
    },
    { deps: [from, to], tags: ['sales', 'purchases', 'inventory_movements'] },
  )

  // El período previo solo alimenta los deltas; si falla, la pantalla sigue
  // siendo útil sin ellos.
  const previous = useQuery<Summary>(
    async () => {
      const rows = unwrap(
        await supabase.rpc('analytics_summary', {
          p_from: comparison.from.toISOString(),
          p_to: comparison.to.toISOString(),
        }),
      )
      return (rows[0] as Summary) ?? EMPTY_SUMMARY
    },
    {
      deps: [comparison.from.toISOString(), comparison.to.toISOString(), preset],
      tags: ['sales', 'purchases'],
      enabled: preset !== 'all',
    },
  )

  const series = useQuery<Point[]>(
    async () =>
      unwrap(
        await supabase.rpc('analytics_timeseries', {
          p_from: from,
          p_to: to,
          p_bucket: bucket,
          // Los intervalos se cortan en la zona del usuario, no en UTC: si no,
          // una venta de la mañana aparecería en la columna del día anterior.
          p_timezone: timeZone,
        }),
      ) as Point[],
    { deps: [from, to, bucket, timeZone], tags: ['sales', 'purchases', 'inventory_movements'] },
  )

  const products = useQuery<ProductRow[]>(
    async () =>
      unwrap(
        await supabase.rpc('analytics_product_breakdown', { p_from: from, p_to: to }),
      ) as ProductRow[],
    { deps: [from, to], tags: ['sales', 'inventory_movements'] },
  )

  const locations = useQuery<LocationRow[]>(
    async () =>
      unwrap(
        await supabase.rpc('analytics_location_breakdown', { p_from: from, p_to: to }),
      ) as LocationRow[],
    { deps: [from, to], tags: ['sales', 'inventory_movements'] },
  )

  const data = summary.data ?? EMPTY_SUMMARY
  const prev = previous.data
  const presetMeta = RANGE_PRESETS.find((item) => item.id === preset)
  const comparisonLabel = presetMeta?.comparisonLabel ?? 'vs. período previo'
  const showDeltas = preset !== 'all' && prev !== undefined

  const chartRows = useMemo(
    () =>
      (series.data ?? []).map((point) => ({
        label: formatBucket(point.bucket, bucket),
        fullLabel: formatBucketLong(point.bucket, bucket),
        values: {
          cost: Number(point.cost),
          profit: Number(point.profit),
          purchases: Number(point.purchases),
          sales_count: Number(point.sales_count),
        },
      })),
    [series.data, bucket],
  )

  const topProducts = useMemo(
    () =>
      (products.data ?? []).slice(0, 8).map((row) => ({
        id: row.product_id,
        label: row.product_name,
        caption: `${formatQuantity(row.units_sold)} ${row.unit_code} · ${row.category_name}`,
        value: Number(row.revenue),
        detail: [
          { label: 'Ganancia', value: formatMoney(row.profit) },
          { label: 'Margen', value: row.margin_pct != null ? formatPercent(row.margin_pct) : '—' },
        ],
      })),
    [products.data],
  )

  const locationSegments = useMemo(
    () =>
      (locations.data ?? []).map((row, index) => ({
        id: row.location_id,
        label: row.location_name,
        caption: `${row.sales_count} venta${row.sales_count === 1 ? '' : 's'} · margen ${
          row.margin_pct != null ? formatPercent(row.margin_pct) : '—'
        }`,
        value: Number(row.revenue),
        // Solo dos matices validados: a partir del tercer local se reutiliza el
        // primero. Cada segmento lleva su etiqueta, así que la identidad no
        // depende del color.
        color: index % 2 === 0 ? 'var(--viz-1)' : 'var(--viz-2)',
      })),
    [locations.data],
  )

  const productColumns: Column<ProductRow>[] = [
    {
      key: 'product',
      header: 'Producto',
      cell: (row) => (
        <div className="flex flex-col">
          <Primary>{row.product_name}</Primary>
          <Muted>
            {row.sku} · {row.category_name}
          </Muted>
        </div>
      ),
    },
    {
      key: 'units',
      header: 'Unidades',
      align: 'right',
      cell: (row) => (
        <span>
          {formatQuantity(row.units_sold)} <Muted>{row.unit_code}</Muted>
        </span>
      ),
    },
    {
      key: 'revenue',
      header: 'Ingreso',
      align: 'right',
      cell: (row) => <Primary>{formatMoney(row.revenue)}</Primary>,
    },
    {
      key: 'cost',
      header: 'Costo',
      align: 'right',
      hideBelow: 'md',
      cell: (row) => formatMoney(row.cost),
    },
    {
      key: 'profit',
      header: 'Ganancia',
      align: 'right',
      cell: (row) => (
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          {formatMoney(row.profit)}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'Margen',
      align: 'right',
      hideBelow: 'sm',
      cell: (row) => (row.margin_pct != null ? formatPercent(row.margin_pct) : '—'),
    },
  ]

  const anyError = summary.error ?? series.error ?? products.error

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ventas y ganancia"
        description={`Cuánto entró, cuánto costó y cuánto quedó. Importes sin impuestos · ${describeRange(range)}.`}
      />

      <RangeFilter
        preset={preset}
        onPresetChange={setPreset}
        custom={custom}
        onCustomChange={setCustom}
        range={range}
      />

      {anyError ? <ErrorState message={anyError} onRetry={summary.refetch} /> : null}

      <Stat
        label="Tu ganancia"
        value={formatMoney(data.profit)}
        icon={TrendingUp}
        size="lg"
        loading={summary.initialLoading}
        tone={data.profit < 0 ? 'danger' : 'neutral'}
        delta={
          showDeltas
            ? { percent: deltaPercent(data.profit, prev.profit), label: comparisonLabel }
            : undefined
        }
        detail={
          showDeltas
            ? undefined
            : `Vendiste ${formatMoney(data.revenue)} y la mercancía te costó ${formatMoney(data.cost)}`
        }
      />

      <StatGrid>
        <Stat
          label="Vendiste"
          value={formatMoney(data.revenue)}
          icon={Receipt}
          loading={summary.initialLoading}
          detail={`${data.sales_count} venta${data.sales_count === 1 ? '' : 's'} · ${formatQuantity(data.units_sold)} unidades`}
        />
        <Stat
          label="Gastaste en mercancía"
          value={formatMoney(data.purchases_amount)}
          icon={ShoppingCart}
          loading={summary.initialLoading}
          detail={`${data.purchases_count} compra${data.purchases_count === 1 ? '' : 's'} confirmada${data.purchases_count === 1 ? '' : 's'}`}
        />
        <Stat
          label="Margen"
          value={data.margin_pct != null ? formatPercent(data.margin_pct) : '—'}
          icon={Coins}
          loading={summary.initialLoading}
          detail="Qué parte de cada venta te queda como ganancia"
        />
      </StatGrid>

      <Card>
        <Section
          title="Evolución de ventas y ganancia"
          description={`El alto de cada columna es la venta del intervalo, partida en lo que costó la mercancía y lo que quedó de ganancia · ${bucketLabel(bucket)}.`}
        >
          {series.initialLoading ? (
            <div className="h-60 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ) : (
            <ColumnChart
              rows={chartRows}
              series={MARGIN_SERIES}
              formatValue={formatMoney}
              tooltipFooter={(row) => {
                const sales = row.values.sales_count ?? 0
                const purchases = row.values.purchases ?? 0
                const parts = [`${sales} venta${sales === 1 ? '' : 's'}`]
                if (purchases > 0) parts.push(`compras ${formatMoney(purchases)}`)
                return parts.join(' · ')
              }}
              emptyMessage="No hubo ventas confirmadas en este período."
            />
          )}
        </Section>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <Section
            title="Productos más vendidos"
            description="Ordenados por ingreso. Pasá el mouse para ver ganancia y margen."
          >
            {products.initialLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ) : (
              <BarList
                items={topProducts}
                formatValue={formatMoney}
                valueLabel="Ingreso"
                emptyMessage="No hubo ventas confirmadas en este período."
              />
            )}
          </Section>
        </Card>

        <Card>
          <Section title="Ventas por local" description="Participación de cada punto de venta.">
            {locations.initialLoading ? (
              <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ) : (
              <ShareBar
                segments={locationSegments}
                formatValue={formatMoney}
                emptyMessage="Sin ventas en este período."
              />
            )}
          </Section>
        </Card>
      </div>

      <Section
        title="Detalle por producto"
        description="La misma información de los gráficos, en tabla y con todas las cifras."
      >
        <DataTable
          rows={products.data}
          columns={productColumns}
          getRowKey={(row) => row.product_id}
          loading={products.initialLoading}
          error={products.error}
          onRetry={products.refetch}
          rowHref={(row) => `${panel.path}/products/${row.product_id}`}
          searchPlaceholder="Buscar producto o categoría…"
          filter={(row, query) =>
            row.product_name.toLowerCase().includes(query) ||
            row.sku.toLowerCase().includes(query) ||
            row.category_name.toLowerCase().includes(query)
          }
          empty={{
            icon: Receipt,
            title: 'Sin ventas en el período',
            description: 'Probá con un rango más amplio o confirmá alguna venta.',
          }}
          footer={
            <tr>
              <td className="px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white">
                Total del período
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900 tabular-nums dark:text-white">
                {formatQuantity(data.units_sold)}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900 tabular-nums dark:text-white">
                {formatMoney(data.revenue)}
              </td>
              <td className="hidden px-4 py-2.5 text-right text-sm font-semibold text-gray-900 tabular-nums md:table-cell dark:text-white">
                {formatMoney(data.cost)}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">
                {formatMoney(data.profit)}
              </td>
              <td className="hidden px-4 py-2.5 text-right text-sm font-semibold text-gray-900 tabular-nums sm:table-cell dark:text-white">
                {data.margin_pct != null ? formatPercent(data.margin_pct) : '—'}
              </td>
            </tr>
          }
        />
      </Section>
    </div>
  )
}
