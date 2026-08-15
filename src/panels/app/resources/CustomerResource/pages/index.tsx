import { Users } from 'lucide-react'
import { useMemo } from 'react'
import { usePriceLists } from '@/lib/references'
import type { Customer } from '@/lib/types'
import { Badge, Mono, Muted, Primary } from '@/ui/components'
import { CrudPage, type CrudConfig } from '@/ui/crud'

export default function CustomersPage() {
  const priceLists = usePriceLists()

  const config = useMemo<CrudConfig<Customer>>(
    () => ({
      table: 'customers',
      tag: 'customers',
      title: 'Clientes',
      description:
        'A quién le vendés. Una venta de mostrador puede no tener cliente asociado.',
      singular: 'cliente',
      icon: Users,
      searchPlaceholder: 'Buscar por nombre o NIT…',
      emptyDescription:
        'Registrá clientes para asociarles ventas y, si querés, una lista de precios preferente.',
      filter: (customer, query) =>
        customer.name.toLowerCase().includes(query) ||
        (customer.tax_id ?? '').toLowerCase().includes(query),
      columns: [
        {
          key: 'name',
          header: 'Cliente',
          cell: (customer) => (
            <div className="flex flex-col">
              <Primary>{customer.name}</Primary>
              {customer.email ? <Muted>{customer.email}</Muted> : null}
            </div>
          ),
        },
        {
          key: 'tax_id',
          header: 'NIT / CC',
          hideBelow: 'sm',
          cell: (customer) => (customer.tax_id ? <Mono>{customer.tax_id}</Mono> : '—'),
        },
        {
          key: 'price_list_id',
          header: 'Lista de precios',
          hideBelow: 'md',
          cell: (customer) =>
            customer.price_list_id ? (
              <Badge tone="info">
                {priceLists.byId.get(customer.price_list_id)?.name ?? '—'}
              </Badge>
            ) : (
              <Muted>Por defecto</Muted>
            ),
        },
        {
          key: 'active',
          header: 'Estado',
          hideBelow: 'lg',
          cell: (customer) =>
            customer.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge>,
        },
      ],
      fields: [
        { name: 'name', label: 'Nombre', required: true, wide: true },
        { name: 'tax_id', label: 'NIT / Cédula' },
        { name: 'phone', label: 'Teléfono', type: 'tel' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Dirección' },
        {
          name: 'price_list_id',
          label: 'Lista de precios',
          type: 'select',
          numeric: true,
          options: priceLists.options,
          emptyOption: 'Usar la lista por defecto',
          hint: 'Se preselecciona al crear una venta para este cliente.',
        },
        { name: 'notes', label: 'Notas', type: 'textarea', wide: true },
        { name: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
      ],
    }),
    [priceLists.options, priceLists.byId],
  )

  return <CrudPage config={config} />
}
