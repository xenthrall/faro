import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { dateInputToTimestamp, todayInputValue } from '@/lib/format'
import { invalidate, unwrap, useQuery } from '@/lib/query'
import { defaultLocationId, useCustomers, useLocations, useProductOptions } from '@/lib/references'
import { supabase } from '@/lib/supabase'
import { toNullable, toNumber, useForm } from '@/lib/use-form'
import type { CurrentPrice, Insert } from '@/lib/types'
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
  label: 'Nueva venta',
  path: '/create',
}

export default function CreateSalePage() {
  const panel = usePanel()
  const navigate = useNavigate()
  const toast = useToast()

  const customers = useCustomers()
  const locations = useLocations()
  const products = useProductOptions()

  const form = useForm({
    customer_id: '',
    location_id: '',
    reference: '',
    date: todayInputValue(),
    notes: '',
  })

  const [lines, setLines] = useState<DocumentLine[]>([emptyLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prices = useQuery<CurrentPrice[]>(
    async () => unwrap(await supabase.from('v_current_prices').select('*')),
    { tags: ['product_prices'] },
  )

  const locationValue = form.values.location_id || defaultLocationId(locations.rows)

  // The customer can carry a preferred price list; without one the default
  // list applies. Resolving it here is what makes picking a product prefill
  // the right price for that customer.
  const customerPriceListId = form.values.customer_id
    ? (customers.byId.get(Number(form.values.customer_id))?.price_list_id ?? null)
    : null

  const priceFor = useMemo(() => {
    const all = prices.data ?? []
    return (productId: number): string => {
      const forProduct = all.filter((price) => price.product_id === productId)
      const match =
        (customerPriceListId != null
          ? forProduct.find((price) => price.price_list_id === customerPriceListId)
          : undefined) ?? forProduct.find((price) => price.is_default_list) ?? forProduct[0]
      return match?.price != null ? String(match.price) : ''
    }
  }, [prices.data, customerPriceListId])

  const validLines = lines.filter((line) => line.product_id && toNumber(line.quantity) > 0)

  async function save() {
    setSaving(true)
    setError(null)

    let saleId: number | null = null

    try {
      if (validLines.length === 0) {
        throw new Error('Agregá al menos una línea con producto y cantidad.')
      }
      if (!locationValue) {
        throw new Error('Elegí la ubicación desde la que sale la mercancía.')
      }

      const header: Insert<'sales'> = {
        customer_id: form.values.customer_id ? toNumber(form.values.customer_id) : null,
        location_id: Number(locationValue),
        reference: toNullable(form.values.reference),
        date: dateInputToTimestamp(form.values.date),
        notes: toNullable(form.values.notes),
      }

      const created = unwrap(await supabase.from('sales').insert(header).select('id').single())
      saleId = created.id

      const items: Insert<'sale_items'>[] = validLines.map((line) => ({
        sale_id: created.id,
        product_id: Number(line.product_id),
        quantity: toNumber(line.quantity),
        unit_price: toNumber(line.price),
        tax_rate: toNumber(line.tax_rate),
      }))

      unwrap(await supabase.from('sale_items').insert(items).select('id'))

      invalidate('sales')
      toast.success('Venta guardada como borrador.')
      void navigate(`${panel.path}/sales/${created.id}`)
    } catch (cause) {
      if (saleId != null) {
        await supabase.from('sales').delete().eq('id', saleId)
      }
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la venta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nueva venta"
        backTo={{ to: `${panel.path}/sales`, label: 'Ventas' }}
        description="Se guarda como borrador. Al confirmarla se descuenta el stock del lote que vence primero."
      />

      <Card>
        <Section title="Datos del documento">
          <FieldGrid>
            <SelectField
              label="Cliente"
              options={customers.options}
              placeholder="Mostrador (sin cliente)"
              hint="Si el cliente tiene lista de precios, los precios se ajustan solos."
              {...form.input('customer_id')}
            />
            <SelectField
              label="Ubicación de salida"
              required
              options={locations.options}
              placeholder="Seleccioná una ubicación"
              value={locationValue}
              onChange={(event) => form.set('location_id', event.target.value)}
            />
            <TextField
              label="Número de venta"
              placeholder="POS-000001"
              hint="Opcional, pero no puede repetirse."
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
        priceLabel="Precio unitario"
        description="El precio se toma del vigente para la lista del cliente; podés cambiarlo por línea."
        onProductPicked={(product) => ({
          price: priceFor(product.id),
          tax_rate: String(product.tax_rate),
        })}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => void navigate(`${panel.path}/sales`)}
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
