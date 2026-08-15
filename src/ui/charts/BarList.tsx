import { useState } from 'react'
import { percentOf } from './chart-utils'
import { ChartEmpty, ChartTooltip, type ChartTooltipRow } from './ChartFrame'

export type BarItem = {
  id: string | number
  label: string
  /** Segunda línea bajo la etiqueta: SKU, categoría, unidades. */
  caption?: string
  value: number
  /** Filas extra del tooltip, p. ej. ganancia y margen. */
  detail?: ChartTooltipRow[]
  href?: string
}

export type BarListProps = {
  items: BarItem[]
  formatValue: (value: number) => string
  emptyMessage?: string
  /** Etiqueta del valor en el tooltip. */
  valueLabel?: string
}

/**
 * Barras horizontales ordenadas de mayor a menor.
 *
 * Un solo matiz, no una paleta categórica: acá todas las barras miden lo mismo
 * y lo que se compara es la magnitud. Darle un color distinto a cada producto
 * sugeriría una identidad que no existe y agotaría la paleta sin ganar nada.
 * El nombre va sobre la barra, así que la lectura nunca depende del color.
 */
export function BarList({
  items,
  formatValue,
  emptyMessage = 'Sin datos en el período.',
  valueLabel = 'Total',
}: BarListProps) {
  const [hovered, setHovered] = useState<string | number | null>(null)

  if (items.length === 0) return <ChartEmpty message={emptyMessage} />

  const max = Math.max(...items.map((item) => item.value), 0)

  return (
    <div className="viz flex flex-col gap-3">
      {items.map((item) => {
        const isHovered = hovered === item.id

        return (
          <div
            key={item.id}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered((current) => (current === item.id ? null : current))}
            className="relative"
          >
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </p>
                {item.caption ? (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.caption}</p>
                ) : null}
              </div>
              {/* El valor va siempre visible, en color de texto: el gráfico se
                  puede leer entero sin pasar el mouse. */}
              <span className="shrink-0 text-sm font-medium text-gray-900 tabular-nums dark:text-white">
                {formatValue(item.value)}
              </span>
            </div>

            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--viz-track)' }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${percentOf(item.value, max)}%`,
                  backgroundColor: 'var(--viz-sequential)',
                  opacity: isHovered ? 1 : 0.9,
                }}
              />
            </div>

            {isHovered && item.detail?.length ? (
              <div className="absolute top-full left-0 z-20 mt-1">
                <ChartTooltip
                  title={item.label}
                  rows={[{ label: valueLabel, value: formatValue(item.value) }, ...item.detail]}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export type ShareSegment = {
  id: string | number
  label: string
  value: number
  color: string
  caption?: string
}

/**
 * Una sola barra apilada horizontal para una relación parte-todo con pocas
 * partes. Más honesta que una dona: las longitudes se comparan bien, los
 * ángulos no.
 */
export function ShareBar({
  segments,
  formatValue,
  emptyMessage = 'Sin datos en el período.',
}: {
  segments: ShareSegment[]
  formatValue: (value: number) => string
  emptyMessage?: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  if (total <= 0) return <ChartEmpty message={emptyMessage} />

  return (
    <div className="viz flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segments.map((segment) => (
          <div
            key={segment.id}
            title={`${segment.label}: ${formatValue(segment.value)}`}
            style={{
              width: `${percentOf(segment.value, total)}%`,
              backgroundColor: segment.color,
            }}
            className="h-full border-r-2 border-white last:border-r-0 dark:border-gray-900"
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {segments.map((segment) => (
          <li key={segment.id} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: segment.color }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm text-gray-900 dark:text-white">
                  {segment.label}
                </span>
                {segment.caption ? (
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {segment.caption}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="shrink-0 text-right text-sm font-medium text-gray-900 tabular-nums dark:text-white">
              {formatValue(segment.value)}
              <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                {Math.round(percentOf(segment.value, total))}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
