import { Truck } from 'lucide-react'
import type { Supplier } from '@/lib/types'
import { Badge, Mono, Muted, Primary } from '@/ui/components'
import { CrudPage, type CrudConfig } from '@/ui/crud'

const config: CrudConfig<Supplier> = {
  table: 'suppliers',
  tag: 'suppliers',
  title: 'Proveedores',
  description: 'A quién le comprás. El proveedor es opcional en una compra menor.',
  singular: 'proveedor',
  icon: Truck,
  searchPlaceholder: 'Buscar por nombre o NIT…',
  emptyDescription: 'Registrá los proveedores para poder asociarlos a tus compras.',
  filter: (supplier, query) =>
    supplier.name.toLowerCase().includes(query) ||
    (supplier.tax_id ?? '').toLowerCase().includes(query),
  columns: [
    {
      key: 'name',
      header: 'Proveedor',
      cell: (supplier) => (
        <div className="flex flex-col">
          <Primary>{supplier.name}</Primary>
          {supplier.email ? <Muted>{supplier.email}</Muted> : null}
        </div>
      ),
    },
    {
      key: 'tax_id',
      header: 'NIT',
      hideBelow: 'sm',
      cell: (supplier) => (supplier.tax_id ? <Mono>{supplier.tax_id}</Mono> : '—'),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      hideBelow: 'md',
      cell: (supplier) => supplier.phone ?? '—',
    },
    {
      key: 'active',
      header: 'Estado',
      hideBelow: 'lg',
      cell: (supplier) =>
        supplier.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge>,
    },
  ],
  fields: [
    { name: 'name', label: 'Nombre', required: true, wide: true },
    { name: 'tax_id', label: 'NIT / RUT', placeholder: '900123456-1' },
    { name: 'phone', label: 'Teléfono', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Dirección' },
    { name: 'notes', label: 'Notas', type: 'textarea', wide: true },
    { name: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
  ],
}

export default function SuppliersPage() {
  return <CrudPage config={config} />
}
