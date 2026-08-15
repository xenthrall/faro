import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { getDisplayName, useAuth, UserAvatar } from '@/auth'
import { usePanel } from './panel-context'

/** Avatar + name trigger that opens a dropdown with account settings and sign out. */
export function PanelUserMenu() {
  const panel = usePanel()
  const auth = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(location.pathname)
  const containerRef = useRef<HTMLDivElement>(null)

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    if (open) setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (auth.status !== 'authenticated' || !auth.user) return null

  const user = auth.user

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <UserAvatar user={user} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-medium text-gray-700 sm:inline dark:text-gray-300">
          {getDisplayName(user)}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 text-gray-400 transition-transform duration-200 sm:inline ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-900/10 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {getDisplayName(user)}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              to={`${panel.path}/account`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Settings className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Configuración
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void auth.signOut()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
