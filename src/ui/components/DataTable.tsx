import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { EmptyState, ErrorState, type EmptyStateProps } from './EmptyState'
import { controlClassName } from './styles'
import { Spinner } from './Spinner'

export type Column<T> = {
  /** Unique within the table; also used as the React key. */
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Hides the column below the given breakpoint, to keep phones readable. */
  hideBelow?: 'sm' | 'md' | 'lg'
  /** Tailwind width class, e.g. `w-32`. */
  width?: string
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const

const HIDE_BELOW = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const

export type DataTableProps<T> = {
  rows: T[] | undefined
  columns: Column<T>[]
  getRowKey: (row: T) => string | number
  /** Show the skeleton instead of the body. Pass `initialLoading` from `useQuery`. */
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  empty: Omit<EmptyStateProps, 'bare'>
  /**
   * Enables the search box. Returns whether a row matches the (lower-cased)
   * query — the table owns the input state so callers don't have to.
   */
  filter?: (row: T, query: string) => boolean
  searchPlaceholder?: string
  /** Extra controls rendered next to the search box (filters, selects). */
  toolbar?: ReactNode
  /** Makes each row clickable, navigating to the returned path. */
  rowHref?: (row: T) => string
  /** Rendered as a full-width row under the body — for totals. */
  footer?: ReactNode
  pageSize?: number
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  loading = false,
  error = null,
  onRetry,
  empty,
  filter,
  searchPlaceholder = 'Buscar…',
  toolbar,
  rowHref,
  footer,
  pageSize = 25,
}: DataTableProps<T>) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!rows) return []
    const trimmed = query.trim().toLowerCase()
    if (!filter || !trimmed) return rows
    return rows.filter((row) => filter(row, trimmed))
  }, [rows, query, filter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  // Filtering can shrink the list below the current page; clamp instead of
  // resetting, so paging back and forth doesn't lose the user's position.
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const hasToolbar = Boolean(filter || toolbar)

  return (
    <div className="flex flex-col gap-3">
      {hasToolbar ? (
        <div className="flex flex-wrap items-center gap-2">
          {filter ? (
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(0)
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={`${controlClassName} pl-9`}
              />
            </div>
          ) : null}
          {toolbar}
        </div>
      ) : null}

      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Wide tables scroll inside this container rather than pushing the
              page sideways. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={[
                        'px-4 py-2.5 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400',
                        ALIGN[column.align ?? 'left'],
                        column.hideBelow ? HIDE_BELOW[column.hideBelow] : '',
                        column.width ?? '',
                      ].join(' ')}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-16">
                      <div className="flex justify-center text-gray-400">
                        <Spinner className="h-6 w-6" />
                      </div>
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      {query.trim() ? (
                        <EmptyState
                          bare
                          icon={Search}
                          title="Sin resultados"
                          description={`Ningún registro coincide con “${query.trim()}”.`}
                        />
                      ) : (
                        <EmptyState bare {...empty} />
                      )}
                    </td>
                  </tr>
                ) : (
                  visible.map((row) => {
                    const href = rowHref?.(row)
                    return (
                      <tr
                        key={getRowKey(row)}
                        onClick={href ? () => void navigate(href) : undefined}
                        className={
                          href
                            ? 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            : ''
                        }
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={[
                              'px-4 py-3 text-gray-700 dark:text-gray-300',
                              ALIGN[column.align ?? 'left'],
                              column.hideBelow ? HIDE_BELOW[column.hideBelow] : '',
                            ].join(' ')}
                          >
                            {column.cell(row)}
                          </td>
                        ))}
                      </tr>
                    )
                  })
                )}
              </tbody>

              {footer && !loading && visible.length > 0 ? (
                <tfoot className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                  {footer}
                </tfoot>
              ) : null}
            </table>
          </div>

          {pageCount > 1 && !loading ? (
            <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-2.5 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filtered.length} registros · página {safePage + 1} de {pageCount}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 0}
                  aria-label="Página anterior"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= pageCount - 1}
                  aria-label="Página siguiente"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Monospaced cell content — SKUs, codes, document references. */
export function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[13px] text-gray-600 dark:text-gray-400">{children}</span>
  )
}

/** Primary cell content — the one column that identifies the row. */
export function Primary({ children }: { children: ReactNode }) {
  return <span className="font-medium text-gray-900 dark:text-white">{children}</span>
}

/** Secondary line under a `Primary`, for context that isn't worth a column. */
export function Muted({ children }: { children: ReactNode }) {
  return <span className="text-xs text-gray-500 dark:text-gray-400">{children}</span>
}
