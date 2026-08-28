import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { ProductOption, Reference } from '@/lib/references'

export type ProductSearchBarProps = {
  products: Reference<ProductOption>
  /** Called when a product is picked — by click, Enter, or an exact barcode scan. */
  onPick: (product: ProductOption) => void
  placeholder: string
  /** Right-side content for each dropdown row — e.g. stock and price, or just stock. */
  renderMeta?: (product: ProductOption) => ReactNode
  autoFocus?: boolean
}

/** All query words must appear somewhere in name, SKU or barcode — order-independent. */
function matchesQuery(option: ProductOption, query: string): boolean {
  const haystack = `${option.name} ${option.sku} ${option.barcode ?? ''}`.toLowerCase()
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

/**
 * A big, mobile-friendly product search used by both quick-checkout screens
 * (venta rápida, compra rápida): searches name/SKU/barcode, supports a
 * barcode-scanner workflow (type + Enter adds instantly on an exact match),
 * and hands the picked product back — the caller owns the cart.
 */
export function ProductSearchBar({
  products,
  onPick,
  placeholder,
  renderMeta,
  autoFocus = true,
}: ProductSearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return []
    return products.rows.filter((option) => matchesQuery(option, trimmed)).slice(0, 8)
  }, [products.rows, query])

  function handleQueryChange(value: string) {
    setQuery(value)
    setOpen(value.trim().length > 0)
    setHighlighted(0)
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function pick(product: ProductOption) {
    onPick(product)
    setQuery('')
    setOpen(false)
    // Deferred: focusing synchronously re-triggers onFocus before React
    // re-renders with the cleared query, reopening the dropdown on stale text.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((index) => Math.min(index + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      // A barcode scanner types the code and sends Enter — an exact match
      // should add instantly even if the dropdown never opened.
      const trimmed = query.trim().toLowerCase()
      const exactBarcode = products.rows.find(
        (option) => option.barcode && option.barcode.toLowerCase() === trimmed,
      )
      const chosen = exactBarcode ?? filtered[highlighted]
      if (chosen) pick(chosen)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex h-14 items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 transition-colors focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:focus-within:border-white dark:focus-within:ring-white">
        <Search className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setOpen(query.trim().length > 0)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Buscar producto"
          autoFocus={autoFocus}
          className="w-full min-w-0 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-600"
        />
      </div>

      {open ? (
        <div className="absolute top-full left-0 z-40 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              Sin resultados.
            </p>
          ) : (
            <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
              {filtered.map((option, index) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlighted}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => pick(option)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                      index === highlighted
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {option.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{option.sku}</p>
                    </div>
                    {renderMeta ? (
                      <div className="flex shrink-0 items-center gap-3">{renderMeta(option)}</div>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
