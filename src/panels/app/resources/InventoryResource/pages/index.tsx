import { Boxes, Layers, MapPin, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  formatDateOnly,
  formatMoney,
  formatMoneyPrecise,
  formatQuantity,
} from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import { useLocations } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import type { StockByLot } from '@/lib/types'
import {
  Badge,
  Button,
  DataTable,
  Mono,
  Muted,
  PageHeader,
  Primary,
  Stat,
  StatGrid,
  controlClassName,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'
import { AdjustStockModal } from '../components/AdjustStockModal'

export default function InventoryPage() {
  const panel = usePanel()
  const locations = useLocations()
  const [locationFilter, setLocationFilter] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const stock = useQuery<StockByLot[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_stock_by_lot')
          .select('*')
          .gt('quantity', 0)
          .order('product_name'),
      ),
    { tags: ['inventory', 'inventory_lots'] },
  )

  const rows = useMemo(() => {
    const all = stock.data ?? []
    if (!locationFilter) return all
    return all.filter((row) => String(row.location_id) === locationFilter)
  }, [stock.data, locationFilter])

  const totalValue = rows.reduce((sum, row) => sum + (row.stock_value ?? 0), 0)
  const distinctProducts = new Set(rows.map((row) => row.product_id)).size
  const distinctLots = rows.length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Existencias"
        description="Cuánto hay, dónde está y a qué costo entró. Cada fila es una capa de costo en una ubicación."
        actions={
          <Button onClick={() => setAdjusting(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            Ajustar existencias
          </Button>
        }
      />

      <StatGrid>
        <Stat
          label="Valor del inventario"
          value={formatMoney(totalValue)}
          icon={Layers}
          loading={stock.initialLoading}
          detail={locationFilter ? 'en la ubicación seleccionada' : 'en todas las ubicaciones'}
        />
        <Stat
          label="Productos con stock"
          value={distinctProducts}
          icon={Boxes}
          loading={stock.initialLoading}
        />
        <Stat
          label="Capas de costo"
          value={distinctLots}
          icon={Layers}
          loading={stock.initialLoading}
          detail="lotes con existencias"
        />
        <Stat
          label="Ubicaciones"
          value={locations.rows.length}
          icon={MapPin}
          loading={locations.loading}
          to={`${panel.path}/locations`}
        />
      </StatGrid>

      <DataTable
        rows={rows}
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
            key: 'location',
            header: 'Ubicación',
            cell: (row) => <Badge>{row.location_name}</Badge>,
          },
          {
            key: 'lot',
            header: 'Lote',
            hideBelow: 'md',
            cell: (row) => (
              <div className="flex flex-col">
                {row.lot_number ? <Mono>{row.lot_number}</Mono> : <Muted>Sin lote</Muted>}
                {row.expiration_date ? (
                  <Muted>vence {formatDateOnly(row.expiration_date)}</Muted>
                ) : null}
              </div>
            ),
          },
          {
            key: 'unit_cost',
            header: 'Costo unit.',
            align: 'right',
            hideBelow: 'lg',
            cell: (row) => formatMoneyPrecise(row.unit_cost),
          },
          {
            key: 'quantity',
            header: 'Cantidad',
            align: 'right',
            cell: (row) => (
              <Primary>
                {formatQuantity(row.quantity)} <Muted>{row.unit_code}</Muted>
              </Primary>
            ),
          },
          {
            key: 'value',
            header: 'Valor',
            align: 'right',
            hideBelow: 'sm',
            cell: (row) => formatMoney(row.stock_value),
          },
        ]}
        getRowKey={(row) => row.inventory_id ?? 0}
        loading={stock.initialLoading}
        error={stock.error}
        onRetry={stock.refetch}
        rowHref={(row) => `${panel.path}/products/${row.product_id}`}
        searchPlaceholder="Buscar por producto, SKU o lote…"
        filter={(row, query) =>
          (row.product_name ?? '').toLowerCase().includes(query) ||
          (row.sku ?? '').toLowerCase().includes(query) ||
          (row.lot_number ?? '').toLowerCase().includes(query)
        }
        toolbar={
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            aria-label="Filtrar por ubicación"
            className={`${controlClassName} sm:w-56`}
          >
            <option value="">Todas las ubicaciones</option>
            {locations.rows.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        }
        empty={{
          icon: Boxes,
          title: 'Sin existencias',
          description:
            'El inventario se llena confirmando una compra o registrando un ajuste de entrada.',
          action: <Button onClick={() => setAdjusting(true)}>Ajustar existencias</Button>,
        }}
        footer={
          <tr>
            <td
              className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white"
              colSpan={2}
            >
              Total {locationFilter ? 'de la ubicación' : 'general'}
            </td>
            <td className="hidden px-4 py-2.5 md:table-cell" />
            <td className="hidden px-4 py-2.5 lg:table-cell" />
            <td className="px-4 py-2.5" />
            <td className="hidden px-4 py-2.5 text-right text-sm font-semibold text-gray-900 sm:table-cell dark:text-white">
              {formatMoney(totalValue)}
            </td>
          </tr>
        }
      />

      <AdjustStockModal open={adjusting} onClose={() => setAdjusting(false)} />
    </div>
  )
}
