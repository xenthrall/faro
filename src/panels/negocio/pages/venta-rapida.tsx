import { CheckCircle2, Minus, Package, Plus, Search, ShieldAlert, Trash2, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { formatMoney } from '@/lib/format'
import { INVENTORY_TAGS, invalidate, unwrap, useQuery } from '@/lib/query'
import {
  defaultLocationId,
  useLocations,
  useProductOptions,
  type ProductOption,
} from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNumber } from '@/lib/use-form'
import type { CurrentPrice, Insert, StockByLocation } from '@/lib/types'
import { Button, Card, EmptyState, IconButton, PageHeader, SelectField, controlClassName } from '@/ui/components'
import type { PanelPageMeta } from '@/ui/panel'
import { useToast } from '@/ui/toast'
import { documentTotals, lineTotals, type DocumentLine } from '../components/document-lines'

export const meta: PanelPageMeta = {
  label: 'Venta rápida',
  icon: Zap,
  order: -1,
}

/** All query words must appear somewhere in name, SKU or barcode — order-independent. */
function matchesQuery(option: ProductOption, query: string): boolean {
  const haystack = `${option.name} ${option.sku} ${option.barcode ?? ''}`.toLowerCase()
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

/** Turns the raw Postgres message from `confirm_sale` into something a cashier can act on. */
function friendlyError(cause: unknown, products: ReturnType<typeof useProductOptions>): string {
  const message = cause instanceof Error ? cause.message : 'No se pudo registrar la venta.'
  const shortage = message.match(/Stock insuficiente: faltan (\S+) unidades del producto (\d+)/)
  if (shortage) {
    const product = products.byId.get(Number(shortage[2]))
    return `No hay suficiente stock de "${product?.name ?? 'este producto'}". Faltan ${shortage[1]} unidades — revisá el inventario antes de cobrar.`
  }
  return message
}

export default function QuickSalePage() {
  const toast = useToast()
  const locations = useLocations()
  const products = useProductOptions()

  const [locationId, setLocationId] = useState('')
  const effectiveLocationId = locationId || defaultLocationId(locations.rows)

  const [cart, setCart] = useState<DocumentLine[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [cashReceived, setCashReceived] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const prices = useQuery<CurrentPrice[]>(
    async () =>
      unwrap(await supabase.from('v_current_prices').select('*').eq('is_default_list', true)),
    { tags: ['product_prices'] },
  )

  const stock = useQuery<StockByLocation[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_stock_by_location')
          .select('*')
          .eq('location_id', Number(effectiveLocationId)),
      ),
    { deps: [effectiveLocationId], tags: ['inventory'], enabled: effectiveLocationId !== '' },
  )

  const priceByProduct = useMemo(
    () => new Map((prices.data ?? []).map((row) => [row.product_id, row.price])),
    [prices.data],
  )
  const stockByProduct = useMemo(
    () => new Map((stock.data ?? []).map((row) => [row.product_id, row.quantity ?? 0])),
    [stock.data],
  )

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return []
    return products.rows.filter((option) => matchesQuery(option, trimmed)).slice(0, 8)
  }, [products.rows, query])

  function handleQueryChange(value: string) {
    setQuery(value)
    setOpen(value.trim().length > 0)
    setHighlighted(0)
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function addProduct(product: ProductOption) {
    const existing = cart.find((line) => line.product_id === String(product.id))
    if (existing) {
      updateLine(existing.key, { quantity: String(toNumber(existing.quantity) + 1) })
    } else {
      const price = priceByProduct.get(product.id)
      setCart((current) => [
        ...current,
        {
          key: `line-${product.id}-${Math.random().toString(36).slice(2)}`,
          product_id: String(product.id),
          quantity: '1',
          price: price != null ? String(price) : '0',
          tax_rate: String(product.tax_rate),
        },
      ])
    }
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function updateLine(key: string, patch: Partial<DocumentLine>) {
    setCart((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function removeLine(key: string) {
    setCart((current) => current.filter((line) => line.key !== key))
  }

  function decrementLine(line: DocumentLine) {
    const next = toNumber(line.quantity) - 1
    if (next <= 0) {
      removeLine(line.key)
    } else {
      updateLine(line.key, { quantity: String(next) })
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((index) => Math.min(index + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      // A barcode scanner types the code and sends Enter — an exact match
      // should add instantly even if the dropdown never opened.
      const trimmed = query.trim().toLowerCase()
      const exactBarcode = products.rows.find(
        (option) => option.barcode && option.barcode.toLowerCase() === trimmed,
      )
      const pick = exactBarcode ?? filtered[highlighted]
      if (pick) addProduct(pick)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const totals = documentTotals(cart)
  const received = toNumber(cashReceived)
  const change = received - totals.total

  const shortages = cart.filter(
    (line) => toNumber(line.quantity) > (stockByProduct.get(Number(line.product_id)) ?? 0),
  )

  async function checkout() {
    setSaving(true)
    setError(null)
    let saleId: number | null = null

    try {
      if (cart.length === 0) throw new Error('Agregá al menos un producto para cobrar.')
      if (!effectiveLocationId) throw new Error('Elegí desde dónde sale la mercancía.')
      if (shortages.length > 0) {
        throw new Error('Hay productos sin stock suficiente — ajustá la cantidad antes de cobrar.')
      }

      const header: Insert<'sales'> = {
        location_id: Number(effectiveLocationId),
      }
      const created = unwrap(await supabase.from('sales').insert(header).select('id').single())
      saleId = created.id

      const items: Insert<'sale_items'>[] = cart.map((line) => ({
        sale_id: created.id,
        product_id: Number(line.product_id),
        quantity: toNumber(line.quantity),
        unit_price: toNumber(line.price),
        tax_rate: toNumber(line.tax_rate),
      }))
      unwrap(await supabase.from('sale_items').insert(items).select('id'))
      unwrap(await supabase.rpc('confirm_sale', { p_sale_id: created.id }))

      invalidate('sales', ...INVENTORY_TAGS)
      toast.success(`Venta cobrada por ${formatMoney(totals.total)}.`)
      setCart([])
      setCashReceived('')
    } catch (cause) {
      if (saleId != null) {
        await supabase.from('sales').delete().eq('id', saleId)
      }
      setError(friendlyError(cause, products))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Venta rápida"
        description="Buscá el producto, ajustá la cantidad y cobrá. El stock se descuenta al instante."
        actions={
          locations.rows.length > 1 ? (
            <SelectField
              label="Ubicación"
              options={locations.options}
              value={effectiveLocationId}
              onChange={(event) => setLocationId(event.target.value)}
              className="w-48"
            />
          ) : null
        }
      />

      <div ref={containerRef} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setOpen(query.trim().length > 0)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Buscar por nombre, código o escanear código de barras…"
          aria-label="Buscar producto"
          autoFocus
          className={`${controlClassName} h-14 pl-12 text-base`}
        />

        {open ? (
          <div className="absolute top-full left-0 z-40 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                Sin resultados.
              </p>
            ) : (
              <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
                {filtered.map((option, index) => {
                  const available = stockByProduct.get(option.id) ?? 0
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === highlighted}
                        onMouseEnter={() => setHighlighted(index)}
                        onClick={() => addProduct(option)}
                        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                          index === highlighted
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900 dark:text-white">
                            {option.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{option.sku}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={`text-xs ${available > 0 ? 'text-gray-500 dark:text-gray-400' : 'font-medium text-red-600 dark:text-red-400'}`}
                          >
                            {available > 0 ? `disp. ${available}` : 'sin stock'}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatMoney(priceByProduct.get(option.id) ?? 0)}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {cart.length === 0 ? (
        <EmptyState
          icon={Package}
          title="El carrito está vacío"
          description="Buscá un producto arriba para agregarlo a la venta."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {cart.map((line) => {
            const product = products.byId.get(Number(line.product_id))
            const available = stockByProduct.get(Number(line.product_id)) ?? 0
            const short = toNumber(line.quantity) > available
            const total = lineTotals(line).total

            return (
              <Card key={line.key} className={short ? 'border-red-300 dark:border-red-900' : ''}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {product?.name ?? '—'}
                    </p>
                    <p
                      className={`text-xs ${short ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      {short ? `Solo hay ${available} disponibles` : `${product?.sku ?? ''}`}
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
                      aria-label={`Precio de ${product?.name ?? 'producto'}`}
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
              </Card>
            )
          })}
        </div>
      )}

      {shortages.length > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Ajustá la cantidad de los productos marcados en rojo — no hay stock suficiente.</p>
        </div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Efectivo recibido (opcional)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(event) => setCashReceived(event.target.value)}
                placeholder={formatMoney(totals.total)}
                aria-label="Efectivo recibido"
                className={`${controlClassName} w-40`}
              />
              {cashReceived.trim() !== '' ? (
                <span
                  className={`text-sm font-medium ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {change >= 0 ? `Cambio: ${formatMoney(change)}` : `Faltan ${formatMoney(-change)}`}
                </span>
              ) : null}
            </div>

            <dl className="flex flex-col gap-1 text-right text-sm">
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
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <Button
            onClick={() => void checkout()}
            loading={saving}
            disabled={cart.length === 0 || shortages.length > 0}
            className="w-full justify-center py-3 text-base"
          >
            <CheckCircle2 className="h-5 w-5" />
            Cobrar {formatMoney(totals.total)}
          </Button>
        </div>
      </Card>
    </div>
  )
}
