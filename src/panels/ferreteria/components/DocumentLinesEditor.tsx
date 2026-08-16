import { Package, Plus, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { documentTotals, emptyLine, lineTotals, type DocumentLine } from './document-lines'
import { ProductPicker } from './ProductPicker'
import type { ProductOption, Reference } from '@/lib/references'
import { Button, Card, EmptyState, IconButton, Section, controlClassName } from '@/ui/components'

const fieldLabelClassName = 'mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400'

export type DocumentLinesEditorProps = {
  lines: DocumentLine[]
  onChange: (lines: DocumentLine[]) => void
  products: Reference<ProductOption>
  /** "Costo unitario" for purchases, "Precio unitario" for sales. */
  priceLabel: string
  /**
   * Called when a product is picked, to prefill price and tax. Purchases
   * prefill only the tax rate; sales also look up the current sale price.
   */
  onProductPicked?: (product: ProductOption) => { price?: string; tax_rate?: string }
  description?: string
}

export function DocumentLinesEditor({
  lines,
  onChange,
  products,
  priceLabel,
  onProductPicked,
  description,
}: DocumentLinesEditorProps) {
  function update(key: string, patch: Partial<DocumentLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function pickProduct(key: string, productId: string) {
    const product = products.byId.get(Number(productId))
    const prefill = product && onProductPicked ? onProductPicked(product) : {}
    update(key, {
      product_id: productId,
      tax_rate: prefill.tax_rate ?? (product ? String(product.tax_rate) : ''),
      ...(prefill.price !== undefined ? { price: prefill.price } : {}),
    })
  }

  const totals = documentTotals(lines)

  return (
    <Card>
      <Section
        title="Líneas"
        description={description}
        actions={
          <Button size="sm" variant="secondary" onClick={() => onChange([...lines, emptyLine()])}>
            <Plus className="h-4 w-4" />
            Agregar línea
          </Button>
        }
      >
        {lines.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin líneas"
            description="Agregá al menos un producto para poder guardar el documento."
            action={
              <Button size="sm" onClick={() => onChange([emptyLine()])}>
                <Plus className="h-4 w-4" />
                Agregar línea
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {lines.map((line, index) => {
              const lineTotal = lineTotals(line)
              const product = products.byId.get(Number(line.product_id))

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
                          onChange={(productId) => pickProduct(line.key, productId)}
                          ariaLabel={`Producto de la línea ${index + 1}`}
                        />
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-[1fr_1fr_110px_140px]">
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

                        <div>
                          <span className={fieldLabelClassName}>{priceLabel}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.price}
                            onChange={(event) => update(line.key, { price: event.target.value })}
                            aria-label={`${priceLabel} de la línea ${index + 1}`}
                            className={controlClassName}
                          />
                        </div>

                        <div>
                          <span className={fieldLabelClassName}>Impuesto %</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            max="100"
                            value={line.tax_rate}
                            onChange={(event) => update(line.key, { tax_rate: event.target.value })}
                            placeholder="0"
                            aria-label={`Impuesto de la línea ${index + 1}`}
                            className={controlClassName}
                          />
                        </div>

                        <div className="flex flex-col items-end">
                          <span className={`${fieldLabelClassName} self-start lg:self-end`}>
                            Total línea
                          </span>
                          <span className="pt-2 text-sm font-semibold text-gray-900 dark:text-white">
                            {formatMoney(lineTotal.total)}
                          </span>
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

                  {product ? (
                    <p className="mt-2 pl-7 text-xs text-gray-500 dark:text-gray-400">
                      {product.units?.code ? `Unidad: ${product.units.code}. ` : ''}
                      {product.track_lot
                        ? 'Controla lotes: al confirmar deberá existir un lote con número.'
                        : 'Cada línea crea su propia capa de costo al confirmar.'}
                    </p>
                  ) : null}
                </div>
              )
            })}

            <dl className="ml-7 flex flex-col gap-1 border-t border-gray-200 pt-3 text-sm dark:border-gray-800">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>Subtotal</dt>
                <dd>{formatMoney(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <dt>Impuestos</dt>
                <dd>{formatMoney(totals.tax)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Section>
    </Card>
  )
}
