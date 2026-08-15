import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  /** Renders without the dashed border, for use inside a table body. */
  bare?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bare = false,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3 px-6 text-center',
        bare
          ? 'py-12'
          : 'rounded-xl border border-dashed border-gray-300 bg-white py-14 dark:border-gray-700 dark:bg-gray-900',
      ].join(' ')}
    >
      {Icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export type ErrorStateProps = {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/50">
      <p className="text-sm font-medium text-red-800 dark:text-red-300">
        No se pudieron cargar los datos
      </p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-400">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-800 underline underline-offset-4 dark:text-red-300"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
