import { useState } from 'react'
import { invalidate, unwrap } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import { toNullable, useForm } from '@/lib/use-form'
import type { Insert } from '@/lib/types'
import { Button, FieldGrid, Modal, TextField } from '@/ui/components'
import { useToast } from '@/ui/toast'

export type LotModalProps = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  purchaseItemId: number
  productId: number
  productName: string
  unitCost: number
  receivedAt: string
  requiresLotNumber: boolean
  requiresExpiration: boolean
}

/**
 * Creates the cost layer for one purchase line and links it back to that line.
 *
 * Confirming a purchase normally creates lots automatically, but a product
 * with `track_lot` needs a manufacturer lot number — and one with
 * `track_expiration` needs a date — which only the user can supply. Capturing
 * them here, before confirming, is what lets the food-distributor case go
 * through the same purchase flow as the hardware-store one.
 */
export function LotModal({
  open,
  onClose,
  onSaved,
  purchaseItemId,
  productId,
  productName,
  unitCost,
  receivedAt,
  requiresLotNumber,
  requiresExpiration,
}: LotModalProps) {
  const toast = useToast()
  const form = useForm({ lot_number: '', expiration_date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)

    try {
      const lot: Insert<'inventory_lots'> = {
        product_id: productId,
        lot_number: toNullable(form.values.lot_number),
        unit_cost: unitCost,
        received_at: receivedAt,
        expiration_date: toNullable(form.values.expiration_date),
      }

      const created = unwrap(
        await supabase.from('inventory_lots').insert(lot).select('id').single(),
      )

      unwrap(
        await supabase
          .from('purchase_items')
          .update({ lot_id: created.id })
          .eq('id', purchaseItemId)
          .select('id')
          .single(),
      )

      invalidate('inventory_lots', 'purchases')
      toast.success('Lote asignado a la línea.')
      form.reset({ lot_number: '', expiration_date: '' })
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el lote.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Definir lote"
      description={`${productName} · el costo del lote es el de la línea de compra.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            Crear lote
          </Button>
        </>
      }
    >
      <FieldGrid>
        <TextField
          label="Número de lote"
          required={requiresLotNumber}
          placeholder="A-2026-03"
          className="md:col-span-2"
          hint={
            requiresLotNumber
              ? 'Obligatorio: este producto controla lotes.'
              : 'Opcional para este producto.'
          }
          {...form.input('lot_number')}
        />
        <TextField
          label="Fecha de vencimiento"
          type="date"
          required={requiresExpiration}
          className="md:col-span-2"
          hint={
            requiresExpiration
              ? 'Obligatoria: este producto controla vencimiento.'
              : 'Opcional. El vencimiento no descuenta stock por sí solo.'
          }
          {...form.input('expiration_date')}
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
