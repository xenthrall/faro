import { Star, Warehouse } from 'lucide-react'
import { LOCATION_TYPE_LABELS, type Location, type LocationType } from '@/lib/types'
import { Badge, Mono, Primary } from '@/ui/components'
import { CrudPage, type CrudConfig } from '@/ui/crud'

const TYPE_OPTIONS = (Object.keys(LOCATION_TYPE_LABELS) as LocationType[]).map((type) => ({
  value: type,
  label: LOCATION_TYPE_LABELS[type],
}))

const config: CrudConfig<Location> = {
  table: 'locations',
  tag: 'locations',
  title: 'Ubicaciones',
  description:
    'Cualquier lugar donde puede existir inventario. Un producto puede estar en varias a la vez.',
  singular: 'ubicación',
  gender: 'f',
  icon: Warehouse,
  orderBy: 'code',
  searchPlaceholder: 'Buscar por código o nombre…',
  emptyDescription: 'Creá al menos una bodega para poder registrar compras y existencias.',
  filter: (location, query) =>
    location.code.toLowerCase().includes(query) || location.name.toLowerCase().includes(query),
  columns: [
    {
      key: 'code',
      header: 'Código',
      width: 'w-32',
      cell: (location) => <Mono>{location.code}</Mono>,
    },
    {
      key: 'name',
      header: 'Nombre',
      cell: (location) => (
        <span className="flex items-center gap-2">
          <Primary>{location.name}</Primary>
          {location.is_default ? (
            <Badge tone="info">
              <Star className="h-3 w-3" />
              Por defecto
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      hideBelow: 'sm',
      cell: (location) => <Badge>{LOCATION_TYPE_LABELS[location.type]}</Badge>,
    },
    {
      key: 'active',
      header: 'Estado',
      hideBelow: 'md',
      cell: (location) =>
        location.active ? <Badge tone="success">Activa</Badge> : <Badge>Inactiva</Badge>,
    },
  ],
  fields: [
    { name: 'code', label: 'Código', required: true, placeholder: 'BOD-01' },
    { name: 'name', label: 'Nombre', required: true, placeholder: 'Bodega principal' },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: TYPE_OPTIONS,
      defaultValue: 'warehouse',
    },
    { name: 'description', label: 'Descripción', type: 'textarea', wide: true },
    {
      name: 'is_default',
      label: 'Ubicación por defecto',
      type: 'checkbox',
      hint: 'Se preselecciona al crear compras y ventas. Solo puede haber una.',
    },
    { name: 'active', label: 'Activa', type: 'checkbox', defaultValue: true },
  ],
}

export default function LocationsPage() {
  return <CrudPage config={config} />
}
