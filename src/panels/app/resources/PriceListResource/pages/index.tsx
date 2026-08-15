import { Star, Tags } from 'lucide-react'
import type { PriceList } from '@/lib/types'
import { Badge, Mono, Primary } from '@/ui/components'
import { CrudPage, type CrudConfig } from '@/ui/crud'

const config: CrudConfig<PriceList> = {
  table: 'price_lists',
  tag: 'price_lists',
  title: 'Listas de precio',
  description:
    'Cada producto puede tener un precio vigente por lista. Sirven para separar minorista de mayorista, y para asignar precios preferentes a un cliente.',
  singular: 'lista',
  gender: 'f',
  icon: Tags,
  orderBy: 'code',
  searchPlaceholder: 'Buscar lista…',
  emptyDescription:
    'Creá al menos una lista por defecto; es la que se usa cuando la venta no indica otra.',
  filter: (list, query) =>
    list.code.toLowerCase().includes(query) || list.name.toLowerCase().includes(query),
  columns: [
    { key: 'code', header: 'Código', width: 'w-40', cell: (list) => <Mono>{list.code}</Mono> },
    {
      key: 'name',
      header: 'Nombre',
      cell: (list) => (
        <span className="flex items-center gap-2">
          <Primary>{list.name}</Primary>
          {list.is_default ? (
            <Badge tone="info">
              <Star className="h-3 w-3" />
              Por defecto
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Estado',
      hideBelow: 'sm',
      cell: (list) => (list.active ? <Badge tone="success">Activa</Badge> : <Badge>Inactiva</Badge>),
    },
  ],
  fields: [
    { name: 'code', label: 'Código', required: true, placeholder: 'MINORISTA' },
    { name: 'name', label: 'Nombre', required: true, placeholder: 'Minorista' },
    {
      name: 'is_default',
      label: 'Lista por defecto',
      type: 'checkbox',
      hint: 'Se usa cuando el cliente no tiene una lista asignada. Solo puede haber una.',
    },
    { name: 'active', label: 'Activa', type: 'checkbox', defaultValue: true },
  ],
}

export default function PriceListsPage() {
  return <CrudPage config={config} />
}
