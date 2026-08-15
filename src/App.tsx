import { BrowserRouter, Navigate, useLocation } from 'react-router'
import { AuthProvider } from '@/auth'
import { appPanel } from '@/panels/app'
import { publicPanel } from '@/panels/public'
import { PanelProvider } from '@/ui/panel'
import type { Panel } from '@/ui/panel'
import { ThemeProvider } from '@/ui/theme'
import { ToastProvider } from '@/ui/toast'

const panels: Panel[] = [publicPanel, appPanel]

function findActivePanel(pathname: string): Panel | undefined {
  return panels.find((panel) => pathname === panel.path || pathname.startsWith(`${panel.path}/`))
}

/**
 * Mounts whichever registered panel owns the current URL — never more than
 * one at a time. Each panel is a self-contained `<Routes>` tree matched
 * against the full location, so rendering two simultaneously would make the
 * non-matching one falsely think it owns the URL too (e.g. its own 404
 * catch-all firing for a path that actually belongs to a different panel).
 */
function AppRoutes() {
  const location = useLocation()
  const activePanel = findActivePanel(location.pathname)

  if (!activePanel) {
    return <Navigate to={publicPanel.path} replace />
  }

  return <PanelProvider panel={activePanel} />
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
