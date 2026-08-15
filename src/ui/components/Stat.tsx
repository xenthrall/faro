import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Spinner } from './Spinner'

export type StatProps = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  /** Small line under the value — a breakdown or comparison. */
  detail?: ReactNode
  loading?: boolean
  /** Turns the whole tile into a link to the screen that explains the number. */
  to?: string
  /** Draws attention when the number needs action (expired stock, low stock). */
  tone?: 'neutral' | 'warning' | 'danger'
}

const TONES = {
  neutral: 'border-gray-200 dark:border-gray-800',
  warning: 'border-amber-300 dark:border-amber-900',
  danger: 'border-red-300 dark:border-red-900',
} as const

export function Stat({
  label,
  value,
  icon: Icon,
  detail,
  loading = false,
  to,
  tone = 'neutral',
}: StatProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" /> : null}
      </div>
      {loading ? (
        <div className="mt-2 flex h-8 items-center text-gray-300 dark:text-gray-700">
          <Spinner className="h-5 w-5" />
        </div>
      ) : (
        <p className="mt-2 truncate text-2xl font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      )}
      {detail && !loading ? (
        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{detail}</p>
      ) : null}
    </>
  )

  const className = [
    'block rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900',
    TONES[tone],
    to ? 'transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60' : '',
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

/** Responsive row of `Stat` tiles. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}
