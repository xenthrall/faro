import type { ReactNode } from 'react'

export type DescriptionItem = {
  label: string
  value: ReactNode
  /** Spans the full width — for notes and other long values. */
  wide?: boolean
}

export type DescriptionListProps = {
  items: DescriptionItem[]
  columns?: 2 | 3
}

/** Read-only key/value block used by every document and record detail page. */
export function DescriptionList({ items, columns = 3 }: DescriptionListProps) {
  return (
    <dl
      className={`grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 ${
        columns === 3 ? 'lg:grid-cols-3' : ''
      }`}
    >
      {items.map((item) => (
        <div key={item.label} className={item.wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
