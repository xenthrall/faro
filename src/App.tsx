import { BrowserRouter, Navigate, useLocation } from 'react-router'
import { AuthProvider } from '@/auth'
import { appPanel } from '@/panels/app'
import { PanelProvider } from '@/ui/panel'
import { ThemeProvider } from '@/ui/theme'

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
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
