import { useState } from 'react'
import { useNavigate } from 'react-router'
import { dateInputToTimestamp, todayInputValue } from '@/lib/format'
import { invalidate, unwrap } from '@/lib/query'
import { defaultLocationId, useLocations, useProductOptions, useSuppliers } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNullable, toNumber, useForm } from '@/lib/use-form'
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
import { DocumentLinesEditor } from '../../../components/DocumentLinesEditor'
import { emptyLine, type DocumentLine } from '../../../components/document-lines'

export const meta: PanelPageMeta = {
  label: 'Nueva compra',
  path: '/create',
}

export default function CreatePurchasePage() {
  const panel = usePanel()
  const navigate = useNavigate()
  const toast = useToast()

  const suppliers = useSuppliers()
  const locations = useLocations()
  const products = useProductOptions()

  const form = useForm({
    supplier_id: '',
    location_id: '',
    reference: '',
    date: todayInputValue(),
    notes: '',
  })

  const [lines, setLines] = useState<DocumentLine[]>([emptyLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preselect the default location once the catalogue has loaded, without
  // overriding a choice the user already made.
  const locationValue = form.values.location_id || defaultLocationId(locations.rows)

  const validLines = lines.filter((line) => line.product_id && toNumber(line.quantity) > 0)

  async function save() {
    setSaving(true)
    setError(null)

    let purchaseId: number | null = null

    try {
      if (validLines.length === 0) {
        throw new Error('Agregá al menos una línea con producto y cantidad.')
      }
      if (!locationValue) {
        throw new Error('Elegí la ubicación donde entra la mercancía.')
      }

      const header: Insert<'purchases'> = {
        supplier_id: form.values.supplier_id ? toNumber(form.values.supplier_id) : null,
        location_id: Number(locationValue),
        reference: toNullable(form.values.reference),
        date: dateInputToTimestamp(form.values.date),
        notes: toNullable(form.values.notes),
      }

      const created = unwrap(
        await supabase.from('purchases').insert(header).select('id').single(),
      )
      purchaseId = created.id

      const items: Insert<'purchase_items'>[] = validLines.map((line) => ({
        purchase_id: created.id,
        product_id: Number(line.product_id),
        quantity: toNumber(line.quantity),
        unit_cost: toNumber(line.price),
        tax_rate: toNumber(line.tax_rate),
      }))

      unwrap(await supabase.from('purchase_items').insert(items).select('id'))

      invalidate('purchases')
      toast.success('Compra guardada como borrador.')
      void navigate(`${panel.path}/purchases/${created.id}`)
    } catch (cause) {
      // The header inserts before its lines do, so a failure here would leave
      // an empty draft behind. Removing it keeps the list free of documents
      // the user never actually created.
      if (purchaseId != null) {
        await supabase.from('purchases').delete().eq('id', purchaseId)
      }
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la compra.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nueva compra"
        backTo={{ to: `${panel.path}/purchases`, label: 'Compras' }}
        description="Se guarda como borrador. El inventario cambia recién cuando la confirmes."
      />

      <Card>
        <Section title="Datos del documento">
          <FieldGrid>
            <SelectField
              label="Proveedor"
              options={suppliers.options}
              placeholder="Sin proveedor"
              hint="Opcional para compras menores."
              {...form.input('supplier_id')}
            />
            <SelectField
              label="Ubicación de entrada"
              required
              options={locations.options}
              placeholder="Seleccioná una ubicación"
              value={locationValue}
              onChange={(event) => form.set('location_id', event.target.value)}
            />
            <TextField
              label="Factura del proveedor"
              placeholder="FV-1001"
              hint="No puede repetirse para el mismo proveedor."
              {...form.input('reference')}
            />
            <TextField label="Fecha" type="date" required {...form.input('date')} />
            <TextareaField label="Notas" className="md:col-span-2" {...form.input('notes')} />
          </FieldGrid>
        </Section>
      </Card>

      <DocumentLinesEditor
        lines={lines}
        onChange={setLines}
        products={products}
        priceLabel="Costo unitario"
        description="Cada línea creará su propia capa de costo al confirmar la compra."
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => void navigate(`${panel.path}/purchases`)}
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
