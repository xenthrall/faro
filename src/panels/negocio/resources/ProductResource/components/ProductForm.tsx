import { useNavigate } from 'react-router'
import { useCategories, usePriceLists, useUnits } from '@/lib/references'
import { unwrap } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import { toNullable, toNullableNumber, toNumber, useForm, type FormValues } from '@/lib/use-form'
import type { Insert, Product } from '@/lib/types'
import {
  Button,
  Card,
  CheckboxField,
  FieldGrid,
  SelectField,
  Section,
  TextField,
  TextareaField,
} from '@/ui/components'
import { invalidate } from '@/lib/query'
import { useToast } from '@/ui/toast'
import { useState } from 'react'

// Palabras de relleno sin valor distintivo, para que el código sugerido no
// se llene de "DE", "PARA", etc.
const SKU_STOPWORDS = new Set([
  'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'CON', 'PARA', 'SIN', 'EN', 'UN', 'UNA',
])

/** Sugerencia de SKU a partir del nombre — un punto de partida editable, no un código definitivo. */
function suggestSku(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
  const words = normalized.split(/\s+/).filter((word) => word && !SKU_STOPWORDS.has(word))
  return words.slice(0, 3).join('-').slice(0, 24)
}

type ProductFormValues = FormValues & {
  category_id: string
  unit_id: string
  sku: string
  barcode: string
  name: string
  description: string
  tax_rate: string
  track_lot: boolean
  track_expiration: boolean
  min_stock: string
  active: boolean
  /** Only used when creating — set through `set_product_price`, not a column. */
  initial_price: string
  price_list_id: string
}

function toFormValues(product?: Product): ProductFormValues {
  return {
    category_id: product?.category_id != null ? String(product.category_id) : '',
    unit_id: product?.unit_id != null ? String(product.unit_id) : '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    tax_rate: product ? String(product.tax_rate) : '19',
    track_lot: product?.track_lot ?? false,
    track_expiration: product?.track_expiration ?? false,
    min_stock: product?.min_stock != null ? String(product.min_stock) : '',
    active: product?.active ?? true,
    initial_price: '',
    price_list_id: '',
  }
}

export type ProductFormProps = {
  /** Omit to create a new product. */
  product?: Product
  /** Where to go after saving. */
  returnTo: string
}

export function ProductForm({ product, returnTo }: ProductFormProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const categories = useCategories()
  const units = useUnits()
  const priceLists = usePriceLists()

  const form = useForm<ProductFormValues>(toFormValues(product))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mientras el usuario no toque el SKU a mano, se recalcula solo desde el
  // nombre — apenas lo edita una vez, dejamos de tocarlo por él.
  const [skuEdited, setSkuEdited] = useState(product !== undefined)

  const isEdit = product !== undefined
  const values = form.values

  function handleNameChange(value: string) {
    form.set('name', value)
    if (!isEdit && !skuEdited) {
      form.set('sku', suggestSku(value))
    }
  }

  async function save() {
    setSaving(true)
    setError(null)

    try {
      // Annotated rather than inferred: a mismatch then surfaces here, against
      // the generated column types, instead of collapsing the query builder's
      // return type further down.
      const payload: Insert<'products'> = {
        category_id: toNullableNumber(values.category_id),
        unit_id: toNumber(values.unit_id),
        sku: values.sku.trim(),
        barcode: toNullable(values.barcode),
        name: values.name.trim(),
        description: toNullable(values.description),
        tax_rate: toNumber(values.tax_rate),
        track_lot: values.track_lot,
        // The database rejects tracking expiry without tracking lots
        // (`products_expiration_requires_lot`). Mirroring that here keeps the
        // form from submitting a combination that can only fail.
        track_expiration: values.track_lot && values.track_expiration,
        min_stock: toNullableNumber(values.min_stock),
        active: values.active,
      }

      let productId: number
      if (product) {
        const updated = unwrap(
          await supabase.from('products').update(payload).eq('id', product.id).select('id').single(),
        )
        productId = updated.id
      } else {
        const created = unwrap(
          await supabase.from('products').insert(payload).select('id').single(),
        )
        productId = created.id
      }

      const initialPrice = toNullableNumber(values.initial_price)
      if (!isEdit && initialPrice != null) {
        unwrap(
          await supabase.rpc('set_product_price', {
            p_product_id: productId,
            p_price: initialPrice,
            p_price_list_id: toNullableNumber(values.price_list_id) ?? undefined,
          }),
        )
      }

      invalidate('products', 'product_prices')
      toast.success(isEdit ? 'Producto actualizado.' : 'Producto creado.')
      void navigate(returnTo)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
      className="flex flex-col gap-6"
    >
      <Card>
        <Section title="Identificación">
          <FieldGrid>
            <TextField
              label="Nombre"
              required
              placeholder="Tornillo 1/4"
              className="md:col-span-2"
              name="name"
              value={values.name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
            <TextField
              label="SKU"
              required
              placeholder="Se completa solo al escribir el nombre"
              hint="Código interno para identificar el producto. Se sugiere solo — podés cambiarlo."
              name="sku"
              value={values.sku}
              onChange={(event) => {
                setSkuEdited(true)
                form.set('sku', event.target.value)
              }}
            />
            <TextField
              label="Código de barras"
              placeholder="7701234567890"
              hint="Opcional. Si lo cargás, no puede repetirse."
              {...form.input('barcode')}
            />
            <SelectField
              label="Categoría"
              options={categories.options}
              placeholder="Sin categoría"
              {...form.input('category_id')}
            />
            <SelectField
              label="Unidad de medida"
              required
              options={units.options}
              placeholder="Seleccioná una unidad"
              {...form.input('unit_id')}
            />
            <TextareaField label="Descripción" className="md:col-span-2" {...form.input('description')} />
          </FieldGrid>
        </Section>
      </Card>

      <Card>
        <Section
          title="Comportamiento de inventario"
          description="Controla qué datos se le piden al usuario en cada entrada de mercancía."
        >
          <FieldGrid>
            <TextField
              label="Impuesto (%)"
              type="number"
              step="0.001"
              min={0}
              max={100}
              required
              hint="Se guarda como porcentaje: 19 significa 19%."
              {...form.input('tax_rate')}
            />
            <TextField
              label="Stock mínimo"
              type="number"
              step="0.0001"
              min={0}
              hint="Opcional. El panel avisa cuando el stock total cae a este valor."
              {...form.input('min_stock')}
            />

            <CheckboxField
              label="Controla lotes"
              hint="Exige el número de lote del fabricante en cada entrada."
              {...form.checkbox('track_lot')}
            />
            <CheckboxField
              label="Controla vencimiento"
              hint={
                values.track_lot
                  ? 'Exige fecha de vencimiento en cada entrada.'
                  : 'Requiere activar “Controla lotes” primero: el vencimiento es un atributo del lote.'
              }
              disabled={!values.track_lot}
              {...form.checkbox('track_expiration')}
            />
          </FieldGrid>
        </Section>
      </Card>

      {!isEdit ? (
        <Card>
          <Section
            title="Precio de venta inicial"
            description="Opcional. Después podés cambiarlo desde la ficha del producto, conservando el historial."
          >
            <FieldGrid>
              <TextField
                label="Precio"
                type="number"
                step="0.01"
                min={0}
                placeholder="0"
                {...form.input('initial_price')}
              />
              <SelectField
                label="Lista de precios"
                options={priceLists.options}
                placeholder="Lista por defecto"
                {...form.input('price_list_id')}
              />
            </FieldGrid>
          </Section>
        </Card>
      ) : null}

      <Card>
        <CheckboxField
          label="Producto activo"
          hint="Los inactivos no aparecen al crear compras, ventas ni transferencias."
          {...form.checkbox('active')}
        />
      </Card>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => void navigate(returnTo)} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}
