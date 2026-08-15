import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/auth'
import { PanelContent } from './PanelContent'
import { PanelHeader } from './PanelHeader'
import { usePanel } from './panel-context'
import { PanelSidebar } from './PanelSidebar'

function PanelAuthLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-white" />
    </div>
  )
}

/**
 * Standard admin shell: header on top, sidebar + page content below.
 * Reusable and unaware of any specific page — the panel's route generates
 * this once and renders the active page through `<Outlet />`.
 *
 * Owns the mobile drawer's open/closed state since `PanelHeader` (trigger)
 * and `PanelSidebar` (drawer) are siblings that both need it. Also guards
 * every page behind auth when the panel requires it, since they're all
 * mounted as children of this layout's route.
 */
export function PanelLayout() {
  const panel = usePanel()
  const auth = useAuth()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(location.pathname)

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMobileNavOpen(false)
  }

  useEffect(() => {
    if (!mobileNavOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }

    document.body.classList.add('overflow-hidden')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('overflow-hidden')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileNavOpen])

  if (panel.requiresAuth && auth.status !== 'authenticated') {
    if (auth.status === 'loading') return <PanelAuthLoading />
    return <Navigate to={`${panel.path}/login`} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      <PanelHeader onMenuClick={() => setMobileNavOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <PanelSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <PanelContent />
      </div>
    </div>
  )
}
