import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type Toast = {
  id: number
  tone: ToastTone
  message: string
}

export type ToastContextValue = {
  /** Confirms an action succeeded. Auto-dismisses. */
  success: (message: string) => void
  /** Reports a failure. Stays longer, since it usually needs reading. */
  error: (message: string) => void
  info: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Feedback for actions that change data. Every mutation in the panel reports
 * through this, so the user always learns whether a write landed — including
 * the ones whose visible effect happens on another screen (confirming a
 * purchase updates inventory, not the purchase list).
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast() must be used within a <ToastProvider>.')
  }
  return ctx
}
