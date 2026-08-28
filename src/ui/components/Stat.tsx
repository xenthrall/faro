import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Spinner } from './Spinner'

export type StatDelta = {
  /** Variación porcentual. `null` cuando no hay base con la que comparar. */
  percent: number | null
  /** Con qué se compara, p. ej. "vs. mes anterior". */
  label: string
  /**
   * Si subir es bueno. Para las compras es `'neutral'`: gastar más no es
   * mejor ni peor por sí solo, así que la cifra se muestra sin color de estado.
   */
  polarity?: 'up-is-good' | 'up-is-bad' | 'neutral'
}

function DeltaBadge({ percent, label, polarity = 'up-is-good' }: StatDelta) {
  if (percent === null) {
    return (
      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
        Sin datos previos para comparar
      </p>
    )
  }

  const rounded = Math.round(percent)
  const flat = Math.abs(rounded) < 1
  const Icon = flat ? ArrowRight : rounded > 0 ? ArrowUpRight : ArrowDownRight

  // El color es un refuerzo, no el dato: el signo y la flecha ya dicen la
  // dirección, así que se sigue leyendo sin distinguir colores.
  const good = polarity === 'neutral' ? null : rounded > 0 === (polarity === 'up-is-good')
  const tone =
    flat || good === null
      ? 'text-gray-500 dark:text-gray-400'
      : good
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400'

  return (
    <p className={`mt-1 flex items-center gap-1 truncate text-xs ${tone}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="font-medium tabular-nums">
        {rounded > 0 ? '+' : ''}
        {rounded}%
      </span>
      <span className="truncate text-gray-500 dark:text-gray-400">{label}</span>
    </p>
  )
}

export type StatProps = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  /** Small line under the value — a breakdown or comparison. */
  detail?: ReactNode
  /** Variación contra el período previo. Reemplaza a `detail` cuando está presente. */
  delta?: StatDelta
  loading?: boolean
  /** Turns the whole tile into a link to the screen that explains the number. */
  to?: string
  /** Draws attention when the number needs action (expired stock, low stock). */
  tone?: 'neutral' | 'warning' | 'danger'
  /** `lg` for the one number a screen wants to lead with — bigger value, more breathing room. */
  size?: 'md' | 'lg'
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
  delta,
  loading = false,
  to,
  tone = 'neutral',
  size = 'md',
}: StatProps) {
  const large = size === 'lg'

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
        <p
          className={`mt-2 truncate font-semibold text-gray-900 dark:text-white ${large ? 'text-4xl' : 'text-2xl'}`}
        >
          {value}
        </p>
      )}
      {!loading && delta ? <DeltaBadge {...delta} /> : null}
      {!loading && !delta && detail ? (
        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{detail}</p>
      ) : null}
    </>
  )

  const className = [
    'block min-w-0 rounded-xl border bg-white shadow-sm dark:bg-gray-900',
    large ? 'p-6' : 'p-5',
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
