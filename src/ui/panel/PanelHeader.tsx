import { ArrowLeft, LogOut, Menu } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/auth'
import { ThemeToggle } from '../theme'
import { usePanel } from './panel-context'
import { PanelUserMenu } from './PanelUserMenu'

export type PanelHeaderProps = {
  onMenuClick: () => void
}

export function PanelHeader({ onMenuClick }: PanelHeaderProps) {
  const panel = usePanel()
  const auth = useAuth()
  const navigate = useNavigate()
  const showAuthenticatedControls = panel.requiresAuth && auth.status === 'authenticated'
  const Logo = panel.logo
  const backTo = panel.backTo

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b border-gray-200/80 bg-white/80 px-3 backdrop-blur-md sm:px-6 dark:border-gray-800/80 dark:bg-gray-950/80">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir navegación"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 sm:hidden dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
      >
        <Menu className="h-5 w-5" />
      </button>

      {backTo ? (
        <button
          type="button"
          onClick={() =>
            backTo.path.startsWith('/') ? void navigate(backTo.path) : window.location.assign(backTo.path)
          }
          aria-label={backTo.label}
          title={backTo.label}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white dark:active:bg-gray-700"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
      ) : null}

      <Link
        to={panel.path}
        aria-label={`Ir al inicio de ${panel.name}`}
        className="flex flex-1 items-center overflow-hidden px-1 outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white"
      >
        {Logo ? (
          <Logo className="h-6" />
        ) : (
          <span className="truncate text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
            {panel.name}
          </span>
        )}
      </Link>

      {showAuthenticatedControls && panel.userMenu ? <PanelUserMenu /> : null}

      {showAuthenticatedControls && !panel.userMenu ? (
        <button
          type="button"
          onClick={() => void auth.signOut()}
          aria-label="Cerrar sesión"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white dark:active:bg-gray-700"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      ) : null}

      <ThemeToggle />
    </header>
  )
}
