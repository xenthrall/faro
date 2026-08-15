import type { LucideIcon } from 'lucide-react'

export type PageHeaderProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </header>
  )
}
