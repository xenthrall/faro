import type { ReactNode } from 'react'

export type ChartSeries = {
  key: string
  label: string
  /** Custom property from the validated palette, e.g. `var(--viz-1)`. */
  color: string
}

/**
 * Legend for a chart. Present whenever there are two or more series, so
 * identity never rests on colour alone — the swatch marks the series and the
 * label names it, in text colour.
 */
export function ChartLegend({ series }: { series: ChartSeries[] }) {
  if (series.length < 2) return null

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

export type ChartTooltipRow = {
  label: string
  value: string
  color?: string
}

/** Shared tooltip body, so every chart in the panel reads the same. */
export function ChartTooltip({
  title,
  rows,
  footer,
}: {
  title: string
  rows: ChartTooltipRow[]
  footer?: ReactNode
}) {
  return (
    <div className="pointer-events-none min-w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium text-gray-900 dark:text-white">{title}</p>
      <dl className="mt-1.5 flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
              {row.color ? (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: row.color }}
                />
              ) : null}
              {row.label}
            </dt>
            <dd className="text-xs font-medium text-gray-900 tabular-nums dark:text-white">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {footer ? (
        <p className="mt-1.5 border-t border-gray-100 pt-1.5 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {footer}
        </p>
      ) : null}
    </div>
  )
}

/** Message shown in place of the plot when a period has nothing to draw. */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 px-6 text-center dark:border-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}
