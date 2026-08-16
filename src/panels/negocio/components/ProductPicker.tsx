import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { ProductOption, Reference } from '@/lib/references'
import { controlClassName } from '@/ui/components'

export type ProductPickerProps = {
  products: Reference<ProductOption>
  value: string
  onChange: (productId: string) => void
  ariaLabel: string
  className?: string
}

/** All query words must appear somewhere in name or SKU — order-independent. */
function matches(option: ProductOption, query: string): boolean {
  const haystack = `${option.name} ${option.sku}`.toLowerCase()
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

/**
 * Product select for line editors, as a searchable combobox instead of a
 * native `<select>`. A plain select is fine for a few dozen options, but a
 * catalog with hundreds of products turns it into an unusable scroll — this
 * filters by name and SKU as the user types instead.
 */
export function ProductPicker({ products, value, onChange, ariaLabel, className = '' }: ProductPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = products.byId.get(Number(value))

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return products.rows
    return products.rows.filter((option) => matches(option, trimmed))
  }, [products.rows, query])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    // The panel just mounted this render, so the input isn't focusable yet.
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  function openPicker() {
    setQuery('')
    setHighlighted(0)
    setOpen(true)
  }

  function select(option: ProductOption) {
    onChange(String(option.id))
    setOpen(false)
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
      const option = filtered[highlighted]
      if (option) select(option)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`${controlClassName} flex items-center justify-between gap-2 text-left`}
      >
        <span
          className={`truncate ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}
        >
          {selected ? `${selected.name} · ${selected.sku}` : 'Seleccioná un producto'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-40 mt-1 w-full min-w-[260px] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="relative border-b border-gray-100 p-2 dark:border-gray-800">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setHighlighted(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre o SKU…"
              aria-label="Buscar producto"
              className={`${controlClassName} pl-9`}
            />
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                Sin resultados.
              </li>
            ) : (
              filtered.map((option, index) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.id === selected?.id}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => select(option)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      index === highlighted
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <span className="truncate text-gray-900 dark:text-white">{option.name}</span>
                    <span className="shrink-0 font-mono text-xs text-gray-400 dark:text-gray-500">
                      {option.sku}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
