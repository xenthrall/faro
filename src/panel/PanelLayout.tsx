import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { PanelContent } from './PanelContent'
import { PanelHeader } from './PanelHeader'
import { PanelSidebar } from './PanelSidebar'

/**
 * Standard admin shell: header on top, sidebar + page content below.
 * Reusable and unaware of any specific page — the panel's route generates
 * this once and renders the active page through `<Outlet />`.
 *
 * Owns the mobile drawer's open/closed state since `PanelHeader` (trigger)
 * and `PanelSidebar` (drawer) are siblings that both need it.
 */
export function PanelLayout() {
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
