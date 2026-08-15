import type { ReactNode } from 'react'
import { DOCUMENT_STATUS_LABELS, type DocumentStatus } from '@/lib/types'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONES: Record<BadgeTone, string> = {
  neutral:
    'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700',
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
  warning:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
  danger:
    'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900',
  info: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
}

export type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        TONES[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

const STATUS_TONES: Record<DocumentStatus, BadgeTone> = {
  draft: 'neutral',
  confirmed: 'success',
  cancelled: 'danger',
}

/** Document lifecycle badge — same colours for purchases, sales and transfers. */
export function StatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{DOCUMENT_STATUS_LABELS[status]}</Badge>
}

/** Mirrors the `expiration_status` computed by the `v_expiring_stock` view. */
const EXPIRATION_TONES: Record<string, { tone: BadgeTone; label: string }> = {
  expired: { tone: 'danger', label: 'Vencido' },
  critical: { tone: 'danger', label: 'Crítico' },
  warning: { tone: 'warning', label: 'Por vencer' },
  upcoming: { tone: 'info', label: 'Próximo' },
  ok: { tone: 'neutral', label: 'Vigente' },
}

export function ExpirationBadge({ status }: { status: string | null }) {
  const config = EXPIRATION_TONES[status ?? 'ok'] ?? EXPIRATION_TONES.ok
  return <Badge tone={config.tone}>{config.label}</Badge>
}
