import { Package, Plus, Trash2 } from 'lucide-react'
import { formatMoneyPrecise, formatQuantity } from '@/lib/format'
import { unwrap, useQuery } from '@/lib/query'
import type { ProductOption, Reference } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import type { StockByLot } from '@/lib/types'
import { emptyTransferLine, type TransferLine } from './transfer-lines'
import { ProductPicker } from '../../../components/ProductPicker'
import { Button, Card, EmptyState, IconButton, Muted, Section, controlClassName } from '@/ui/components'

const fieldLabelClassName = 'mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400'

export type TransferLinesEditorProps = {
  lines: TransferLine[]
  onChange: (lines: TransferLine[]) => void
  products: Reference<ProductOption>
  /** Stock is read from here, so lot options and availability match the origin. */
  sourceLocationId: number | null
}

export function TransferLinesEditor({
  lines,
  onChange,
  products,
  sourceLocationId,
}: TransferLinesEditorProps) {
  // All cost layers available at the origin, fetched once for the whole
  // editor rather than per line.
  const stock = useQuery<StockByLot[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_stock_by_lot')
          .select('*')
          .eq('location_id', sourceLocationId as number)
          .gt('quantity', 0),
      ),
    { deps: [sourceLocationId], tags: ['inventory'], enabled: sourceLocationId != null },
  )

  function update(key: string, patch: Partial<TransferLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function lotsFor(productId: string) {
    return (stock.data ?? []).filter((row) => String(row.product_id) === productId)
  }

  function availableFor(productId: string): number {
    return lotsFor(productId).reduce((sum, row) => sum + (row.quantity ?? 0), 0)
  }

  return (
    <Card>
      <Section
        title="Líneas"
        description={
          sourceLocationId == null
            ? 'Elegí primero la ubicación de origen para ver el stock disponible.'
            : 'Si no elegís lote, el sistema mueve el que vence primero (FEFO).'
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onChange([...lines, emptyTransferLine()])}
          >
            <Plus className="h-4 w-4" />
            Agregar línea
          </Button>
        }
      >
        {lines.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin líneas"
            description="Agregá al menos un producto para poder guardar la transferencia."
            action={
              <Button size="sm" onClick={() => onChange([emptyTransferLine()])}>
                <Plus className="h-4 w-4" />
                Agregar línea
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {lines.map((line, index) => {
              const available = line.product_id ? availableFor(line.product_id) : 0
              const requested = Number(line.quantity) || 0
              const short = Boolean(line.product_id) && requested > available

              return (
                <div
                  key={line.key}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-6 w-5 shrink-0 text-xs text-gray-400">{index + 1}</span>

                    <div className="min-w-0 flex-1">
                      <div>
                        <span className={fieldLabelClassName}>Producto</span>
                        <ProductPicker
                          products={products}
                          value={line.product_id}
                          onChange={(productId) =>
                            update(line.key, { product_id: productId, lot_id: '' })
                          }
                          ariaLabel={`Producto de la línea ${index + 1}`}
                        />
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-[1fr_140px]">
                        <div>
                          <span className={fieldLabelClassName}>Lote</span>
                          <select
                            value={line.lot_id}
                            onChange={(event) => update(line.key, { lot_id: event.target.value })}
                            aria-label={`Lote de la línea ${index + 1}`}
                            disabled={!line.product_id}
                            className={controlClassName}
                          >
                            <option value="">Automático (FEFO)</option>
                            {lotsFor(line.product_id).map((lot) => (
                              <option key={lot.lot_id ?? 'none'} value={lot.lot_id ?? ''}>
                                {lot.lot_number ?? 'Sin número'} · {formatQuantity(lot.quantity)} disp. ·{' '}
                                {formatMoneyPrecise(lot.unit_cost)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span className={fieldLabelClassName}>Cantidad</span>
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={line.quantity}
                            onChange={(event) => update(line.key, { quantity: event.target.value })}
                            aria-label={`Cantidad de la línea ${index + 1}`}
                            className={controlClassName}
                          />
                        </div>
                      </div>
                    </div>

                    <IconButton
                      label={`Quitar línea ${index + 1}`}
                      className="mt-6"
                      onClick={() => onChange(lines.filter((item) => item.key !== line.key))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>

                  {line.product_id ? (
                    <p className="mt-2 pl-7 text-xs">
                      {short ? (
                        <span className="text-red-600 dark:text-red-400">
                          Solo hay {formatQuantity(available)} disponibles en el origen.
                        </span>
                      ) : (
                        <Muted>{formatQuantity(available)} disponibles en el origen.</Muted>
                      )}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </Card>
  )
}
