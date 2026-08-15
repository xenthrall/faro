import type { ReactNode } from 'react'

export type CardProps = {
  children: ReactNode
  className?: string
  /** Removes the inner padding, for cards that host a full-bleed table. */
  flush?: boolean
}

/** The panel's single surface primitive. Every boxed block on a page is one. */
export function Card({ children, className = '', flush = false }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
        flush ? '' : 'p-5',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export type SectionProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

/** A titled block inside a page: heading row on top, content below. */
export function Section({ title, description, actions, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
