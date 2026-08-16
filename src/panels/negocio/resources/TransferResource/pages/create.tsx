import { useState } from 'react'
import { useNavigate } from 'react-router'
import { dateInputToTimestamp, todayInputValue } from '@/lib/format'
import { invalidate, unwrap } from '@/lib/query'
import { useLocations, useProductOptions } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNullable, toNullableNumber, toNumber, useForm } from '@/lib/use-form'
import type { Insert } from '@/lib/types'
import {
  Button,
  Card,
  FieldGrid,
  PageHeader,
  SelectField,
  Section,
  TextField,
  TextareaField,
} from '@/ui/components'
import { usePanel } from '@/ui/panel'
import type { PanelPageMeta } from '@/ui/panel'
import { useToast } from '@/ui/toast'
import { TransferLinesEditor } from '../components/TransferLinesEditor'
import { emptyTransferLine, type TransferLine } from '../components/transfer-lines'

export const meta: PanelPageMeta = {
  label: 'Nueva transferencia',
  path: '/create',
}

export default function CreateTransferPage() {
  const panel = usePanel()
  const navigate = useNavigate()
  const toast = useToast()

  const locations = useLocations()
  const products = useProductOptions()

  const form = useForm({
    source_location_id: '',
    destination_location_id: '',
    reference: '',
    date: todayInputValue(),
    notes: '',
  })

  const [lines, setLines] = useState<TransferLine[]>([emptyTransferLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sourceId = toNullableNumber(form.values.source_location_id)
  const validLines = lines.filter((line) => line.product_id && toNumber(line.quantity) > 0)

  // The database rejects a transfer to the same place
  // (`inventory_transfers_distinct_locations`); filtering the options means
  // the user never gets to pick it.
  const destinationOptions = locations.options.filter(
    (option) => String(option.value) !== form.values.source_location_id,
  )

  async function save() {
    setSaving(true)
    setError(null)

    let transferId: number | null = null

    try {
      if (!form.values.source_location_id || !form.values.destination_location_id) {
        throw new Error('Elegí la ubicación de origen y la de destino.')
      }
      if (validLines.length === 0) {
        throw new Error('Agregá al menos una línea con producto y cantidad.')
      }

      const header: Insert<'inventory_transfers'> = {
        source_location_id: toNumber(form.values.source_location_id),
        destination_location_id: toNumber(form.values.destination_location_id),
        reference: toNullable(form.values.reference),
        date: dateInputToTimestamp(form.values.date),
        notes: toNullable(form.values.notes),
      }

      const created = unwrap(
        await supabase.from('inventory_transfers').insert(header).select('id').single(),
      )
      transferId = created.id

      const items: Insert<'inventory_transfer_items'>[] = validLines.map((line) => ({
        transfer_id: created.id,
        product_id: Number(line.product_id),
        quantity: toNumber(line.quantity),
        lot_id: toNullableNumber(line.lot_id),
      }))

      unwrap(await supabase.from('inventory_transfer_items').insert(items).select('id'))

      invalidate('transfers')
      toast.success('Transferencia guardada como borrador.')
      void navigate(`${panel.path}/transfers/${created.id}`)
    } catch (cause) {
      if (transferId != null) {
        await supabase.from('inventory_transfers').delete().eq('id', transferId)
      }
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la transferencia.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nueva transferencia"
        backTo={{ to: `${panel.path}/transfers`, label: 'Transferencias' }}
        description="Se guarda como borrador. Al confirmarla, la mercancía sale del origen y entra al destino conservando su lote y su costo."
      />

      <Card>
        <Section title="Datos del documento">
          <FieldGrid>
            <SelectField
              label="Origen"
              required
              options={locations.options}
              placeholder="Seleccioná el origen"
              {...form.input('source_location_id')}
            />
            <SelectField
              label="Destino"
              required
              options={destinationOptions}
              placeholder="Seleccioná el destino"
              {...form.input('destination_location_id')}
            />
            <TextField label="Referencia" placeholder="TR-0001" {...form.input('reference')} />
            <TextField label="Fecha" type="date" required {...form.input('date')} />
            <TextareaField label="Notas" className="md:col-span-2" {...form.input('notes')} />
          </FieldGrid>
        </Section>
      </Card>

      <TransferLinesEditor
        lines={lines}
        onChange={setLines}
        products={products}
        sourceLocationId={sourceId}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => void navigate(`${panel.path}/transfers`)}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button onClick={() => void save()} loading={saving}>
          Guardar borrador
        </Button>
      </div>
    </div>
  )
}
