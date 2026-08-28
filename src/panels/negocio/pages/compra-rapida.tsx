import { CheckCircle2, Minus, Package, PackagePlus, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatMoney, formatMoneyPrecise } from '@/lib/format'
import { INVENTORY_TAGS, invalidate, unwrap, useQuery } from '@/lib/query'
import {
  defaultLocationId,
  useLocations,
  useProductOptions,
  useSuppliers,
  type ProductOption,
} from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNumber } from '@/lib/use-form'
import type { Insert, ProductStock } from '@/lib/types'
import { Button, Card, EmptyState, IconButton, PageHeader, SelectField, controlClassName } from '@/ui/components'
import type { PanelPageMeta } from '@/ui/panel'
import { useToast } from '@/ui/toast'
import { documentTotals, lineTotals, type DocumentLine } from '../components/document-lines'
import { ProductSearchBar } from '../components/ProductSearchBar'

export const meta: PanelPageMeta = {
  label: 'Compra rápida',
  icon: PackagePlus,
  order: -1,
}

/** A purchase line plus the lot info a `track_lot` product needs — captured up front, not as a surprise after saving. */
type PurchaseLine = DocumentLine & { lot_number: string; expiration_date: string }

function emptyPurchaseLine(product: ProductOption): PurchaseLine {
  return {
    key: `line-${product.id}-${Math.random().toString(36).slice(2)}`,
    product_id: String(product.id),
    quantity: '1',
    price: '',
    tax_rate: String(product.tax_rate),
    lot_number: '',
    expiration_date: '',
  }
}

/** Turns the raw Postgres message from `confirm_purchase` into something the owner can act on. */
function friendlyError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : 'No se pudo registrar la compra.'
  const missing = message.match(/El producto "(.+)" controla (lotes|vencimiento)/)
  if (missing) {
    const what = missing[2] === 'lotes' ? 'un número de lote' : 'una fecha de vencimiento'
    return `Falta ${what} para "${missing[1]}" — completalo en esa línea antes de guardar.`
  }
  return message
}

export default function QuickPurchasePage() {
  const toast = useToast()
  const locations = useLocations()
  const suppliers = useSuppliers()
  const products = useProductOptions()

  const [locationId, setLocationId] = useState('')
  const effectiveLocationId = locationId || defaultLocationId(locations.rows)
  const [supplierId, setSupplierId] = useState('')

  const [cart, setCart] = useState<PurchaseLine[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastCosts = useQuery<ProductStock[]>(
    async () => unwrap(await supabase.from('v_product_stock').select('*')),
    { tags: ['inventory', 'products'] },
  )
  const lastCostByProduct = useMemo(
    () => new Map((lastCosts.data ?? []).map((row) => [row.product_id, row.weighted_average_cost])),
    [lastCosts.data],
  )

  function addProduct(product: ProductOption) {
    const existing = cart.find((line) => line.product_id === String(product.id))
    if (existing) {
      updateLine(existing.key, { quantity: String(toNumber(existing.quantity) + 1) })
    } else {
      setCart((current) => [...current, emptyPurchaseLine(product)])
    }
  }

  function updateLine(key: string, patch: Partial<PurchaseLine>) {
    setCart((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function removeLine(key: string) {
    setCart((current) => current.filter((line) => line.key !== key))
  }

  function decrementLine(line: PurchaseLine) {
    const next = toNumber(line.quantity) - 1
    if (next <= 0) {
      removeLine(line.key)
    } else {
      updateLine(line.key, { quantity: String(next) })
    }
  }

  const totals = documentTotals(cart)

  // Cada línea se valida por separado: cantidad y costo positivos, y — si el
  // producto controla lotes — el número de lote (y el vencimiento, si aplica)
  // completos. Nada de esto se descubre recién al guardar.
  const lineIssues = useMemo(() => {
    const issues = new Map<string, string>()
    for (const line of cart) {
      const product = products.byId.get(Number(line.product_id))
      if (toNumber(line.quantity) <= 0) {
        issues.set(line.key, 'Cantidad inválida')
      } else if (toNumber(line.price) <= 0) {
        issues.set(line.key, 'Falta el costo')
      } else if (product?.track_lot && !line.lot_number.trim()) {
        issues.set(line.key, 'Falta el número de lote')
      } else if (product?.track_expiration && !line.expiration_date) {
        issues.set(line.key, 'Falta la fecha de vencimiento')
      }
    }
    return issues
  }, [cart, products.byId])

  async function checkout() {
    setSaving(true)
    setError(null)
    let purchaseId: number | null = null

    try {
      if (cart.length === 0) throw new Error('Agregá al menos un producto.')
      if (!effectiveLocationId) throw new Error('Elegí dónde entra la mercancía.')
      if (lineIssues.size > 0) throw new Error('Completá los datos marcados en rojo antes de guardar.')

      const header: Insert<'purchases'> = {
        location_id: Number(effectiveLocationId),
        supplier_id: supplierId ? Number(supplierId) : null,
      }
      const created = unwrap(await supabase.from('purchases').insert(header).select('id').single())
      purchaseId = created.id

      const items: Insert<'purchase_items'>[] = cart.map((line) => ({
        purchase_id: created.id,
        product_id: Number(line.product_id),
        quantity: toNumber(line.quantity),
        unit_cost: toNumber(line.price),
        tax_rate: toNumber(line.tax_rate),
      }))
      const createdItems = unwrap(
        await supabase.from('purchase_items').insert(items).select('id, product_id'),
      )

      // Un producto aparece una sola vez en el carrito, así que el product_id
      // alcanza para volver a encontrar la línea recién creada.
      const itemIdByProduct = new Map(createdItems.map((item) => [item.product_id, item.id]))

      const lotLines = cart.filter((line) => line.lot_number.trim() || line.expiration_date)
      for (const line of lotLines) {
        const itemId = itemIdByProduct.get(Number(line.product_id))
        if (itemId == null) continue

        const lot = unwrap(
          await supabase
            .from('inventory_lots')
            .insert({
              product_id: Number(line.product_id),
              lot_number: line.lot_number.trim() || null,
              unit_cost: toNumber(line.price),
              expiration_date: line.expiration_date || null,
            })
            .select('id')
            .single(),
        )
        unwrap(await supabase.from('purchase_items').update({ lot_id: lot.id }).eq('id', itemId))
      }

      unwrap(await supabase.rpc('confirm_purchase', { p_purchase_id: created.id }))

      invalidate('purchases', 'products', ...INVENTORY_TAGS)
      toast.success(`Compra registrada por ${formatMoney(totals.total)}.`)
      setCart([])
    } catch (cause) {
      if (purchaseId != null) {
        await supabase.from('purchases').delete().eq('id', purchaseId)
      }
      setError(friendlyError(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compra rápida"
        description="Registrá lo que compraste y entra directo al inventario."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <SelectField
              label="Proveedor"
              options={suppliers.options}
              placeholder="Sin proveedor"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="w-48"
            />
            {locations.rows.length > 1 ? (
              <SelectField
                label="Ubicación"
                options={locations.options}
                value={effectiveLocationId}
                onChange={(event) => setLocationId(event.target.value)}
                className="w-48"
              />
            ) : null}
          </div>
        }
      />

      <ProductSearchBar
        products={products}
        onPick={addProduct}
        placeholder="Buscar por nombre, código o escanear código de barras…"
        renderMeta={(option) => {
          const lastCost = lastCostByProduct.get(option.id)
          return lastCost != null ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              últ. costo {formatMoneyPrecise(lastCost)}
            </span>
          ) : null
        }}
      />

      {cart.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Todavía no agregaste productos"
          description="Buscá un producto arriba para agregarlo a la compra."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {cart.map((line) => {
            const product = products.byId.get(Number(line.product_id))
            const issue = lineIssues.get(line.key)
            const total = lineTotals(line).total

            return (
              <Card key={line.key} className={issue ? 'border-red-300 dark:border-red-900' : ''}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {product?.name ?? '—'}
                      </p>
                      <p
                        className={`text-xs ${issue ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {issue ?? product?.sku}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <IconButton label="Restar" onClick={() => decrementLine(line)}>
                        <Minus className="h-4 w-4" />
                      </IconButton>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={line.quantity}
                        onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                        aria-label={`Cantidad de ${product?.name ?? 'producto'}`}
                        className={`${controlClassName} w-16 text-center`}
                      />
                      <IconButton
                        label="Sumar"
                        onClick={() =>
                          updateLine(line.key, { quantity: String(toNumber(line.quantity) + 1) })
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </IconButton>
                      {product?.units?.code ? (
                        <span className="w-8 shrink-0 text-xs text-gray-400">{product.units.code}</span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.price}
                        onChange={(event) => updateLine(line.key, { price: event.target.value })}
                        placeholder="Costo"
                        aria-label={`Costo de ${product?.name ?? 'producto'}`}
                        className={`${controlClassName} w-24 text-right`}
                      />
                      <span className="w-24 shrink-0 text-right font-semibold text-gray-900 dark:text-white">
                        {formatMoney(total)}
                      </span>
                      <IconButton label={`Quitar ${product?.name ?? 'producto'}`} onClick={() => removeLine(line.key)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>

                  {product?.track_lot ? (
                    <div className="ml-1 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <div className="min-w-40 flex-1">
                        <span className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                          Número de lote
                        </span>
                        <input
                          type="text"
                          placeholder="Ej: el que trae la factura"
                          value={line.lot_number}
                          onChange={(event) => updateLine(line.key, { lot_number: event.target.value })}
                          aria-label={`Número de lote de ${product?.name ?? 'producto'}`}
                          className={controlClassName}
                        />
                      </div>
                      {product.track_expiration ? (
                        <div className="min-w-40 flex-1">
                          <span className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            Vencimiento
                          </span>
                          <input
                            type="date"
                            value={line.expiration_date}
                            onChange={(event) =>
                              updateLine(line.key, { expiration_date: event.target.value })
                            }
                            aria-label={`Vencimiento de ${product?.name ?? 'producto'}`}
                            className={controlClassName}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          <dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-right text-sm">
            <div className="flex justify-between gap-6 text-gray-600 dark:text-gray-400">
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-6 text-gray-600 dark:text-gray-400">
              <dt>Impuestos</dt>
              <dd>{formatMoney(totals.tax)}</dd>
            </div>
            <div className="flex justify-between gap-6 text-lg font-semibold text-gray-900 dark:text-white">
              <dt>Total</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
          </dl>

          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <Button
            onClick={() => void checkout()}
            loading={saving}
            disabled={cart.length === 0 || lineIssues.size > 0}
            className="w-full justify-center py-3 text-base"
          >
            <CheckCircle2 className="h-5 w-5" />
            Guardar compra {formatMoney(totals.total)}
          </Button>
        </div>
      </Card>
    </div>
  )
}
