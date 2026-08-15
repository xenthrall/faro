import { createContext, useContext } from 'react'
import type { Panel } from './types'

export const PanelContext = createContext<Panel | null>(null)

/** Returns the active Panel. Must be called from within a `PanelProvider`. */
export function usePanel(): Panel {
  const panel = useContext(PanelContext)
  if (!panel) {
    throw new Error('usePanel() must be used within a <PanelProvider>.')
  }
  return panel
}
