import { PackagePlus, PackageMinus } from 'lucide-react'
import { useState } from 'react'
import { formatMoneyPrecise, formatQuantity } from '@/lib/format'
import { INVENTORY_TAGS, invalidate, unwrap, useQuery } from '@/lib/query'
import { useLocations, useProductOptions } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNullableNumber, toNumber, useForm } from '@/lib/use-form'
import type { StockByLot } from '@/lib/types'
import { Button, FieldGrid, Modal, SelectField, TextField, TextareaField } from '@/ui/components'
import { useToast } from '@/ui/toast'

const DIRECTION_CHOICES = [
  {
    value: 'in' as const,
    label: 'Agregué stock',
    hint: 'Sin factura, o encontraste mercancía de más al contar.',
    icon: PackagePlus,
  },
  {
    value: 'out' as const,
    label: 'Se dañó, perdió o venció',
    hint: 'Se descuenta de tus existencias.',
    icon: PackageMinus,
  },
]

export type AdjustStockModalProps = {
  open: boolean
  onClose: () => void
  /** Preselects the product, e.g. when opened from a product's page. */
  productId?: number
  locationId?: number
}

/**
 * Manual inventory movements. Everything here goes through `adjust_inventory`,
 * which writes a movement and applies it in one transaction — so an adjustment
 * is as traceable as a purchase, and expired stock is only removed when
 * somebody explicitly decides to.
 */
export function AdjustStockModal({ open, onClose, productId, locationId }: AdjustStockModalProps) {
  const toast = useToast()
  const products = useProductOptions()
  const locations = useLocations()

  const form = useForm({
    product_id: productId ? String(productId) : '',
    location_id: locationId ? String(locationId) : '',
    direction: 'in',
    quantity: '',
    lot_id: '',
    unit_cost: '',
    notes: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const values = form.values
  const selectedProduct = toNullableNumber(values.product_id)
  const selectedLocation = toNullableNumber(values.location_id)
  const isOut = values.direction === 'out'

  // Existing cost layers at the chosen location. On the way out they are the
  // options to draw from; on the way in they let stock be added back to the
  // exact layer it came from.
  const lots = useQuery<StockByLot[]>(
    async () =>
      unwrap(
        await supabase
          .from('v_stock_by_lot')
          .select('*')
          .eq('product_id', selectedProduct as number)
          .eq('location_id', selectedLocation as number)
          .gt('quantity', 0),
      ),
    {
      deps: [selectedProduct, selectedLocation],
      tags: ['inventory'],
      enabled: selectedProduct != null && selectedLocation != null,
    },
  )

  const lotOptions = (lots.data ?? []).map((lot) => ({
    value: lot.lot_id ?? '',
    label: [
      lot.lot_number ?? 'Sin número de lote',
      `${formatQuantity(lot.quantity)} disp.`,
      formatMoneyPrecise(lot.unit_cost),
      lot.expiration_date ? `vence ${lot.expiration_date}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }))

  async function submit() {
    setSaving(true)
    setError(null)

    try {
      const quantity = Math.abs(toNumber(values.quantity))
      if (quantity === 0) throw new Error('Indicá una cantidad distinta de cero.')

      unwrap(
        await supabase.rpc('adjust_inventory', {
          p_product_id: toNumber(values.product_id),
          p_location_id: toNumber(values.location_id),
          // The sign is what the database reads as direction; the two-field
          // split here only exists so the user never has to type a minus.
          p_quantity: isOut ? -quantity : quantity,
          // Cada campo solo se muestra para una dirección — el otro nunca se
          // manda, aunque haya quedado un valor viejo en el formulario al
          // cambiar de "Agregué stock" a "Se dañó, perdió o venció" (o viceversa).
          p_lot_id: isOut ? (toNullableNumber(values.lot_id) ?? undefined) : undefined,
          p_unit_cost: isOut ? undefined : (toNullableNumber(values.unit_cost) ?? undefined),
          p_notes: values.notes.trim() || undefined,
          // El motivo detallado (ajuste/stock inicial/devolución) es solo una
          // etiqueta de reporte, no cambia el cálculo — no hace falta pedírselo
          // al usuario en cada movimiento manual.
          p_type: 'adjustment',
        }),
      )

      invalidate(...INVENTORY_TAGS)
      toast.success(isOut ? 'Salida registrada.' : 'Entrada registrada.')
      form.reset({
        product_id: '',
        location_id: '',
        direction: 'in',
        quantity: '',
        lot_id: '',
        unit_cost: '',
        notes: '',
      })
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el movimiento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar existencias"
      description="Para corregir el stock a mano, sin pasar por una compra o una venta."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} loading={saving}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DIRECTION_CHOICES.map((choice) => {
          const Icon = choice.icon
          const selected = values.direction === choice.value
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => form.set('direction', choice.value)}
              aria-pressed={selected}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60'
              }`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {choice.label}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  {choice.hint}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <FieldGrid>
        <SelectField
          label="Producto"
          required
          options={products.options}
          placeholder="Seleccioná un producto"
          className="md:col-span-2"
          {...form.input('product_id')}
        />
        <SelectField
          label="Ubicación"
          required
          options={locations.options}
          placeholder="Seleccioná una ubicación"
          {...form.input('location_id')}
        />
        <TextField
          label="Cantidad"
          type="number"
          step="0.0001"
          min={0}
          required
          {...form.input('quantity')}
        />

        {isOut ? (
          <SelectField
            label="¿De qué lote sale?"
            options={lotOptions}
            placeholder="No lo sé — que el sistema elija"
            hint="Si no elegís, se descuenta primero del que está más cerca de vencer."
            className="md:col-span-2"
            {...form.input('lot_id')}
          />
        ) : (
          <TextField
            label="¿Cuánto te costó? (opcional)"
            type="number"
            step="0.01"
            min={0}
            hint="Si no lo sabés todavía, dejalo vacío y lo completás más adelante."
            className="md:col-span-2"
            {...form.input('unit_cost')}
          />
        )}

        <TextareaField
          label="Notas"
          placeholder="Ej: merma detectada al contar, producto vencido, etc."
          className="md:col-span-2"
          {...form.input('notes')}
        />
      </FieldGrid>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </Modal>
  )
}
