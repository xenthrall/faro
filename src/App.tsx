import { BrowserRouter, Navigate, useLocation } from 'react-router'
import { appPanel } from '@/panels/app'
import { PanelProvider } from '@/panel'
import { ThemeProvider } from '@/theme'

/**
 * Redirects `/` to the panel's root and otherwise mounts the panel. Kept as
 * a plain location check (no `<Routes>`) so the panel's own `<Routes>` is
 * the only route tree matched against the URL — an extra sibling `<Routes>`
 * here would log "No routes matched" for every path it doesn't own.
 */
function AppRoutes() {
  const location = useLocation()

  if (location.pathname === '/') {
    return <Navigate to={appPanel.path} replace />
  }

  return <PanelProvider panel={appPanel} />
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
