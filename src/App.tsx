import { BrowserRouter, Navigate, useLocation } from 'react-router'
import { adminPanel } from './admin-panel'
import { PanelProvider } from './panel'
import { ThemeProvider } from './theme'

/**
 * Redirects `/` to the panel's root and otherwise mounts the panel. Kept as
 * a plain location check (no `<Routes>`) so the panel's own `<Routes>` is
 * the only route tree matched against the URL — an extra sibling `<Routes>`
 * here would log "No routes matched" for every path it doesn't own.
 */
function AppRoutes() {
  const location = useLocation()

  if (location.pathname === '/') {
    return <Navigate to={adminPanel.path} replace />
  }

  return <PanelProvider panel={adminPanel} />
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
