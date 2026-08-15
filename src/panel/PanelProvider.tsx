import { Route, Routes } from 'react-router'
import { PanelContext } from './panel-context'
import { PanelLayout } from './PanelLayout'
import { PanelLogin } from './PanelLogin'
import { PanelNotFound } from './PanelNotFound'
import { PanelPage } from './PanelPage'
import { relativePagePath } from './paths'
import type { Panel } from './types'

export type PanelProviderProps = {
  panel: Panel
}

/**
 * Turns a Panel definition into layout, navigation and routes. Expects to be
 * rendered inside a Router (e.g. `<BrowserRouter>`) provided by the host app,
 * so a page can host multiple panels or mix panels with its own routes.
 */
export function PanelProvider({ panel }: PanelProviderProps) {
  const NotFound = panel.notFoundComponent ?? PanelNotFound

  return (
    <PanelContext.Provider value={panel}>
      <Routes>
        {panel.requiresAuth ? (
          <Route path={`${panel.path}/login`} element={<PanelLogin />} />
        ) : null}
        <Route path={panel.path} element={<PanelLayout />}>
          {panel.pages.map((page) => (
            <Route
              key={page.name}
              index={page.path === '/'}
              path={relativePagePath(page)}
              element={<PanelPage page={page} />}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </PanelContext.Provider>
  )
}
