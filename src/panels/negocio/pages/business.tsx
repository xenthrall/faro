import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { invalidate, unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
import type { Row, Update } from '@/lib/types'
import { toNullable, useForm, type FormValues } from '@/lib/use-form'
import {
  Button,
  Card,
  ErrorState,
  FieldGrid,
  PageHeader,
  Section,
  Spinner,
  TextField,
} from '@/ui/components'
import type { PanelPageMeta } from '@/ui/panel'
import { useToast } from '@/ui/toast'

export const meta: PanelPageMeta = {
  label: 'Perfil del negocio',
  icon: Building2,
  group: 'Configuración',
  order: 37,
}

type BusinessSettings = Row<'business_settings'>

type BusinessFormValues = FormValues & {
  business_name: string
  nit: string
  address: string
  city: string
  phone: string
  email: string
}

function toFormValues(settings: BusinessSettings): BusinessFormValues {
  return {
    business_name: settings.business_name,
    nit: settings.nit ?? '',
    address: settings.address ?? '',
    city: settings.city ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
  }
}

function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const toast = useToast()
  const form = useForm<BusinessFormValues>(toFormValues(settings))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)

    try {
      const values = form.values
      const payload: Update<'business_settings'> = {
        business_name: values.business_name.trim(),
        nit: toNullable(values.nit),
        address: toNullable(values.address),
        city: toNullable(values.city),
        phone: toNullable(values.phone),
        email: toNullable(values.email),
      }

      unwrap(await supabase.from('business_settings').update(payload).eq('id', 1).select('id').single())

      invalidate('business_settings')
      toast.success('Datos del negocio actualizados.')
      form.reset(toFormValues({ ...settings, ...payload }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.')
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
        <Section
          title="Identificación"
          description="Aparece en el encabezado del panel y, más adelante, en los documentos impresos."
        >
          <FieldGrid>
            <TextField
              label="Nombre del negocio"
              required
              placeholder="Ferretería El Progreso"
              className="md:col-span-2"
              {...form.input('business_name')}
            />
            <TextField label="NIT" placeholder="900123456-7" {...form.input('nit')} />
            <TextField label="Teléfono" placeholder="(601) 222-3344" {...form.input('phone')} />
          </FieldGrid>
        </Section>
      </Card>

      <Card>
        <Section title="Ubicación y contacto">
          <FieldGrid>
            <TextField
              label="Dirección"
              placeholder="Calle 9 # 21-16"
              className="md:col-span-2"
              {...form.input('address')}
            />
            <TextField label="Ciudad" placeholder="Bogotá" {...form.input('city')} />
            <TextField
              label="Email"
              type="email"
              placeholder="contacto@negocio.co"
              {...form.input('email')}
            />
          </FieldGrid>
        </Section>
      </Card>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={saving} disabled={!form.dirty}>
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

export default function BusinessPage() {
  const query = useQuery<BusinessSettings>(
    async () =>
      unwrap(await supabase.from('business_settings').select('*').eq('id', 1).single()),
    { tags: ['business_settings'] },
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perfil del negocio"
        description="Datos del negocio que administrás en Faro."
      />

      {query.initialLoading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Spinner className="h-6 w-6" />
        </div>
      ) : query.error || !query.data ? (
        <ErrorState message={query.error ?? 'No se pudieron cargar los datos.'} onRetry={query.refetch} />
      ) : (
        <BusinessSettingsForm key={query.data.updated_at} settings={query.data} />
      )}
    </div>
  )
}
