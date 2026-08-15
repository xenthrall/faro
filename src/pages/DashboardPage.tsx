import { Activity, LayoutDashboard, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

const stats = [
  { label: 'Usuarios activos', value: '1,204', icon: Users },
  { label: 'Ingresos del mes', value: '$8,420', icon: TrendingUp },
  { label: 'Eventos hoy', value: '312', icon: Activity },
]

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Vista general del panel de administración."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
              <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
