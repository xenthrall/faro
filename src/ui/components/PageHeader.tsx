import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

export type PageHeaderProps = {
  title: string
  description?: string
  /** Back link rendered above the title — for detail and create pages. */
  backTo?: { to: string; label: string }
  /** Buttons aligned to the right of the title. */
  actions?: ReactNode
  /** Status badge or similar, rendered inline next to the title. */
  badge?: ReactNode
}

/**
 * Every page in the panel opens with one of these, so titles, back links and
 * primary actions always sit in the same place.
 */
export function PageHeader({ title, description, backTo, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {backTo ? (
        <Link
          to={backTo.to}
          className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {backTo.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
