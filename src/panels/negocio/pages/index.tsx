import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  CalendarClock,
  LayoutDashboard,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react'
import { formatDateTime, formatMoney, formatQuantity } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import {
  MOVEMENT_TYPE_LABELS,
  type ExpiringStock,
  type LedgerEntry,
  type MovementType,
  type ProductStock,
} from '@/lib/types'
import {
  Badge,
  ButtonLink,
  Card,
  DataTable,
  ExpirationBadge,
  Muted,
  PageHeader,
  Primary,
  Section,
  Stat,
  StatGrid,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Dashboard',
  icon: LayoutDashboard,
  order: 0,
}

export default function DashboardPage() {
  const panel = usePanel()

  const stock = useQuery<ProductStock[]>(
    async () => unwrap(await supabase.from('v_product_stock').select('*')),
    { tags: ['inventory', 'products'] },
  )

  const expiring = useQuery<ExpiringStock[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_expiring_stock')
          .select('*')
          .neq('expiration_status', 'ok')
          .order('expiration_date'),
      ),
    { tags: ['inventory', 'inventory_lots'] },
  )

  const recent = useQuery<LedgerEntry[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_inventory_ledger')
          .select('*')
          .order('date', { ascending: false })
          .order('item_id', { ascending: false })
          .limit(8),
      ),
    { tags: ['inventory_movements'] },
  )

  const drafts = useQuery(
    async () => {
      const [purchases, sales, transfers] = await Promise.all([
        supabase.from('purchases').select('id').eq('status', 'draft'),
        supabase.from('sales').select('id').eq('status', 'draft'),
        supabase.from('inventory_transfers').select('id').eq('status', 'draft'),
      ])
      return {
        purchases: unwrap(purchases).length,
        sales: unwrap(sales).length,
        transfers: unwrap(transfers).length,
      }
    },
    { tags: ['purchases', 'sales', 'transfers'] },
  )

  const rows = stock.data ?? []
  const totalValue = rows.reduce((sum, row) => sum + (row.total_value ?? 0), 0)
  const withStock = rows.filter((row) => (row.total_quantity ?? 0) > 0).length
  const lowStock = rows.filter((row) => row.below_min_stock)
  const expiringRows = expiring.data ?? []
  const expiredCount = expiringRows.filter((row) => row.expiration_status === 'expired').length
  const pendingDrafts =
    (drafts.data?.purchases ?? 0) + (drafts.data?.sales ?? 0) + (drafts.data?.transfers ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Estado del inventario y accesos a lo que se usa todos los días."
        actions={
          <>
            <ButtonLink variant="secondary" to={`${panel.path}/purchases/create`}>
              <ShoppingCart className="h-4 w-4" />
              Compra
            </ButtonLink>
            <ButtonLink to={`${panel.path}/sales/create`}>
              <Plus className="h-4 w-4" />
              Venta
            </ButtonLink>
          </>
        }
      />

      <StatGrid>
        <Stat
          label="Valor del inventario"
          value={formatMoney(totalValue)}
          icon={Boxes}
          loading={stock.initialLoading}
          detail="valorizado al costo de cada lote"
          to={`${panel.path}/inventory`}
        />
        <Stat
          label="Productos con stock"
          value={`${withStock} / ${rows.length}`}
          icon={Package}
          loading={stock.initialLoading}
          detail={`${rows.length} productos en el catálogo`}
          to={`${panel.path}/products`}
        />
        <Stat
          label="Bajo mínimo"
          value={lowStock.length}
          icon={TrendingDown}
          loading={stock.initialLoading}
          tone={lowStock.length > 0 ? 'warning' : 'neutral'}
          detail={lowStock.length > 0 ? 'necesitan reposición' : 'todo por encima del mínimo'}
          to={`${panel.path}/reports`}
        />
        <Stat
          label="Lotes por vencer"
          value={expiringRows.length}
          icon={CalendarClock}
          loading={expiring.initialLoading}
          tone={expiredCount > 0 ? 'danger' : expiringRows.length > 0 ? 'warning' : 'neutral'}
          detail={expiredCount > 0 ? `${expiredCount} ya vencido${expiredCount === 1 ? '' : 's'}` : 'próximos 30 días'}
          to={`${panel.path}/reports`}
        />
      </StatGrid>

      {pendingDrafts > 0 ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {pendingDrafts} documento{pendingDrafts === 1 ? '' : 's'} sin confirmar
                </p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Un borrador no afecta el inventario hasta que lo confirmes.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(drafts.data?.purchases ?? 0) > 0 ? (
                <ButtonLink size="sm" variant="secondary" to={`${panel.path}/purchases`}>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {drafts.data?.purchases} compra{drafts.data?.purchases === 1 ? '' : 's'}
                </ButtonLink>
              ) : null}
              {(drafts.data?.sales ?? 0) > 0 ? (
                <ButtonLink size="sm" variant="secondary" to={`${panel.path}/sales`}>
                  <Receipt className="h-3.5 w-3.5" />
                  {drafts.data?.sales} venta{drafts.data?.sales === 1 ? '' : 's'}
                </ButtonLink>
              ) : null}
              {(drafts.data?.transfers ?? 0) > 0 ? (
                <ButtonLink size="sm" variant="secondary" to={`${panel.path}/transfers`}>
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  {drafts.data?.transfers} transferencia
                  {drafts.data?.transfers === 1 ? '' : 's'}
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Actividad reciente"
          description="Las últimas líneas del kardex."
          actions={
            <ButtonLink size="sm" variant="ghost" to={`${panel.path}/movements`}>
              Ver todo
            </ButtonLink>
          }
        >
          <DataTable
            rows={recent.data}
            columns={[
              {
                key: 'product',
                header: 'Producto',
                cell: (row) => (
                  <div className="flex flex-col">
                    <Primary>{row.product_name}</Primary>
                    <Muted>
                      {MOVEMENT_TYPE_LABELS[row.movement_type as MovementType] ??
                        row.movement_type}{' '}
                      · {formatDateTime(row.date)}
                    </Muted>
                  </div>
                ),
              },
              {
                key: 'location',
                header: 'Ubicación',
                hideBelow: 'sm',
                cell: (row) => <Badge>{row.location_name}</Badge>,
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
            loading={recent.initialLoading}
            error={recent.error}
            onRetry={recent.refetch}
            pageSize={8}
            empty={{
              icon: ArrowRightLeft,
              title: 'Sin movimientos',
              description: 'Confirmá una compra para que el inventario empiece a moverse.',
              action: (
                <ButtonLink to={`${panel.path}/purchases/create`}>Registrar compra</ButtonLink>
              ),
            }}
          />
        </Section>

        <Section
          title="Requiere atención"
          description="Lotes vencidos o próximos a vencer."
          actions={
            <ButtonLink size="sm" variant="ghost" to={`${panel.path}/reports`}>
              Ver reportes
            </ButtonLink>
          }
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
                    <Muted>
                      {row.lot_number ?? 'sin lote'} · {row.location_name}
                    </Muted>
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
            ]}
            // Un mismo lote aparece una vez por ubicación, así que el lote
            // solo no identifica la fila.
            getRowKey={(row) => `${row.lot_id}-${row.location_id}`}
            loading={expiring.initialLoading}
            error={expiring.error}
            onRetry={expiring.refetch}
            pageSize={8}
            empty={{
              icon: CalendarClock,
              title: 'Nada por vencer',
              description: 'Ningún lote vence en los próximos 30 días.',
            }}
          />
        </Section>
      </div>
    </div>
  )
}
