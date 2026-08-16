import { ChevronRight, LayoutDashboard, Store, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/ui/components'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Inicio',
  icon: LayoutDashboard,
  order: 0,
}

type Destination = {
  label: string
  description: string
  icon: LucideIcon
  /** Ruta interna (empieza con `/`) o URL completa a otro dominio. */
  to: string
}

// Único lugar que hay que tocar para agregar un panel nuevo al hub — interno
// (ruta que empieza con `/`) o en otro dominio (URL completa, se enlaza con
// <a> en vez de <Link> para no pasar por el router de este panel).
const destinations: Destination[] = [
  {
    label: 'Ferretería',
    description: 'Inventario, compras, ventas, catálogo y analítica del negocio.',
    icon: Store,
    to: '/ferreteria',
  },
]

function DestinationCard({ destination }: { destination: Destination }) {
  const Icon = destination.icon
  const isExternal = !destination.to.startsWith('/')

  const content = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{destination.label}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {destination.description}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />
    </>
  )

  const className =
    'flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800'

  if (isExternal) {
    return (
      <a href={destination.to} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link to={destination.to} className={className}>
      {content}
    </Link>
  )
}

export default function HubPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tus paneles" description="Elegí dónde querés trabajar." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {destinations.map((destination) => (
          <DestinationCard key={destination.label} destination={destination} />
        ))}
      </div>
    </div>
  )
}
