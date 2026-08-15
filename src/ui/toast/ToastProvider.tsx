import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Toast, type ToastTone } from './toast-context'

const DURATIONS: Record<ToastTone, number> = {
  success: 3500,
  info: 3500,
  // Errors usually carry a database message worth reading before it vanishes.
  error: 7000,
}

const TONES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: {
    icon: CheckCircle2,
    className:
      'border-emerald-200 bg-white text-emerald-800 dark:border-emerald-900 dark:bg-gray-900 dark:text-emerald-300',
  },
  error: {
    icon: XCircle,
    className:
      'border-red-200 bg-white text-red-800 dark:border-red-900 dark:bg-gray-900 dark:text-red-300',
  },
  info: {
    icon: Info,
    className:
      'border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, tone, message }])
      window.setTimeout(() => dismiss(id), DURATIONS[tone])
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
      info: (message: string) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((toast) => {
          const { icon: Icon, className } = TONES[toast.tone]
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${className}`}
            >
              <Icon className="mt-px h-4 w-4 shrink-0" />
              <p className="min-w-0 flex-1 text-sm break-words">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Descartar"
                className="-mr-1 shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
