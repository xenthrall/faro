import { LayoutDashboard, Settings, Users } from 'lucide-react'
import { createPanel } from './panel'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { UsersPage } from './pages/UsersPage'

export const adminPanel = createPanel({
  id: 'admin',
  path: '/admin',
  name: 'Faro',

  pages: [
    {
      name: 'dashboard',
      label: 'Dashboard',
      path: '/',
      component: DashboardPage,
      icon: LayoutDashboard,
    },
    {
      name: 'users',
      label: 'Usuarios',
      path: '/users',
      component: UsersPage,
      icon: Users,
    },
    {
      name: 'settings',
      label: 'Configuración',
      path: '/settings',
      component: SettingsPage,
      icon: Settings,
    },
  ],
})
