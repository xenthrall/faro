import { Ruler } from 'lucide-react'
import type { Unit } from '@/lib/types'
import { Badge, Mono, Primary } from '@/ui/components'
import { CrudPage, type CrudConfig } from '@/ui/crud'

const config: CrudConfig<Unit> = {
  table: 'units',
  tag: 'units',
  title: 'Unidades de medida',
  description:
    'Catálogo normalizado que los productos referencian. Evita guardar “kg”, “Kg” y “kilo” como textos distintos.',
  singular: 'unidad',
  gender: 'f',
  icon: Ruler,
  orderBy: 'code',
  searchPlaceholder: 'Buscar por código o nombre…',
  emptyDescription: 'Creá las unidades con las que vendés: unidad, kilogramo, metro, caja…',
  filter: (unit, query) =>
    unit.code.toLowerCase().includes(query) || unit.name.toLowerCase().includes(query),
  columns: [
    { key: 'code', header: 'Código', width: 'w-32', cell: (unit) => <Mono>{unit.code}</Mono> },
    { key: 'name', header: 'Nombre', cell: (unit) => <Primary>{unit.name}</Primary> },
    {
      key: 'allows_fractions',
      header: 'Fracciones',
      hideBelow: 'sm',
      cell: (unit) =>
        unit.allows_fractions ? (
          <Badge tone="info">Admite decimales</Badge>
        ) : (
          <Badge>Solo enteros</Badge>
        ),
    },
    {
      key: 'active',
      header: 'Estado',
      hideBelow: 'sm',
      cell: (unit) =>
        unit.active ? <Badge tone="success">Activa</Badge> : <Badge>Inactiva</Badge>,
    },
  ],
  fields: [
    { name: 'code', label: 'Código', required: true, placeholder: 'KG' },
    { name: 'name', label: 'Nombre', required: true, placeholder: 'Kilogramo' },
    {
      name: 'allows_fractions',
      label: 'Admite cantidades fraccionarias',
      type: 'checkbox',
      defaultValue: true,
      hint: 'Activalo para kilogramos o metros; desactivalo para unidades o cajas.',
    },
    { name: 'active', label: 'Activa', type: 'checkbox', defaultValue: true },
  ],
}

export default function UnitsPage() {
  return <CrudPage config={config} />
}
