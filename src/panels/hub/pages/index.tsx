import { Briefcase, ChevronRight, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { getDisplayName, useAuth } from '@/auth'
import { unwrap, useQuery } from '@/lib/query'
import { supabase } from '@/lib/supabase'
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
    label: 'Negocio',
    description: 'Llevá el inventario, registrá compras y ventas, y mirá cómo va tu negocio.',
    icon: Briefcase,
    to: '/negocio',
  },
]

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function DestinationCard({ destination }: { destination: Destination }) {
  const Icon = destination.icon
  const isExternal = !destination.to.startsWith('/')

  const content = (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-gray-900 dark:text-white">{destination.label}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{destination.description}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-gray-400 transition-colors group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-white">
        <span className="hidden sm:inline">Entrar</span>
        <ChevronRight className="h-4 w-4" />
      </span>
    </>
  )

  const className =
    'group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800'

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
  const auth = useAuth()

  const business = useQuery<{ business_name: string } | null>(
    async () =>
      unwrap(
        await supabase.from('business_settings').select('business_name').eq('id', 1).single(),
      ),
    { tags: ['business_settings'] },
  )

  const name = auth.user ? getDisplayName(auth.user) : ''
  const businessName = business.data?.business_name

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {greeting()}
          {name ? `, ${name}` : ''}.
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {businessName ? `Bienvenido a ${businessName}` : 'Bienvenido a Faro'}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Elegí qué querés abrir.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {destinations.map((destination) => (
          <DestinationCard key={destination.label} destination={destination} />
        ))}
      </div>
    </div>
  )
}
