import { useState } from 'react'
import { formatMoneyPrecise, formatQuantity } from '@/lib/format'
import { INVENTORY_TAGS, invalidate, unwrap, useQuery } from '@/lib/query'
import { useLocations, useProductOptions } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNullableNumber, toNumber, useForm } from '@/lib/use-form'
import type { StockByLot } from '@/lib/types'
import { Button, FieldGrid, Modal, SelectField, TextField, TextareaField } from '@/ui/components'
import { useToast } from '@/ui/toast'

const DIRECTION_OPTIONS = [
  { value: 'in', label: 'Entrada (aumenta existencias)' },
  { value: 'out', label: 'Salida (disminuye existencias)' },
]

const TYPE_OPTIONS = [
  { value: 'adjustment', label: 'Ajuste' },
  { value: 'initial_stock', label: 'Stock inicial' },
  { value: 'return', label: 'Devolución' },
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
    type: 'adjustment',
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
          p_lot_id: toNullableNumber(values.lot_id) ?? undefined,
          p_unit_cost: toNullableNumber(values.unit_cost) ?? undefined,
          p_notes: values.notes.trim() || undefined,
          p_type: values.type as 'adjustment' | 'initial_stock' | 'return',
        }),
      )

      invalidate(...INVENTORY_TAGS)
      toast.success(isOut ? 'Salida registrada.' : 'Entrada registrada.')
      form.reset({
        product_id: '',
        location_id: '',
        direction: 'in',
        type: 'adjustment',
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
      description="Registra una entrada o salida manual. Queda en el kardex como cualquier otro movimiento."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} loading={saving}>
            Registrar movimiento
          </Button>
        </>
      }
    >
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
        <SelectField label="Dirección" options={DIRECTION_OPTIONS} {...form.input('direction')} />

        <SelectField label="Motivo" options={TYPE_OPTIONS} {...form.input('type')} />
        <TextField
          label="Cantidad"
          type="number"
          step="0.0001"
          min={0}
          required
          hint="Siempre en positivo; la dirección define el signo."
          {...form.input('quantity')}
        />

        <SelectField
          label="Lote"
          options={lotOptions}
          placeholder={
            isOut ? 'Automático (FEFO: vence primero, sale primero)' : 'Crear una capa de costo nueva'
          }
          hint={
            isOut
              ? 'Si no elegís lote, el sistema descuenta del que vence antes.'
              : 'Elegí un lote existente para reingresar al mismo costo.'
          }
          className="md:col-span-2"
          {...form.input('lot_id')}
        />

        {!isOut && !values.lot_id ? (
          <TextField
            label="Costo unitario"
            type="number"
            step="0.01"
            min={0}
            hint="Crea una capa de costo nueva. Si lo dejás vacío, la existencia entra sin costo conocido."
            className="md:col-span-2"
            {...form.input('unit_cost')}
          />
        ) : null}

        <TextareaField
          label="Notas"
          placeholder="Merma detectada en conteo físico"
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
