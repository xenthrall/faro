import { useState } from 'react'
import { axisTicks, niceMax, percentOf } from './chart-utils'
import { ChartEmpty, ChartLegend, ChartTooltip, type ChartSeries } from './ChartFrame'

export type ColumnRow = {
  /** Etiqueta del eje horizontal. */
  label: string
  /** Etiqueta larga para el tooltip; por defecto usa `label`. */
  fullLabel?: string
  /** Un valor por serie, indexado por `key`. */
  values: Record<string, number>
}

export type ColumnChartProps = {
  rows: ColumnRow[]
  /** Se apilan en el orden dado, de abajo hacia arriba. */
  series: ChartSeries[]
  formatValue: (value: number) => string
  /** Se muestra bajo el total en el tooltip, p. ej. la cantidad de ventas. */
  tooltipFooter?: (row: ColumnRow) => string | undefined
  emptyMessage?: string
  height?: number
}

/**
 * Columnas apiladas para una serie temporal.
 *
 * La forma es deliberada: el alto total de cada columna es el ingreso del
 * intervalo y los segmentos lo parten en costo y ganancia. Un solo gráfico
 * responde a la vez "cuánto vendí" y "cuánto de eso me quedó", que es
 * exactamente la relación que dos gráficos separados obligarían a reconstruir
 * mentalmente.
 */
export function ColumnChart({
  rows,
  series,
  formatValue,
  tooltipFooter,
  emptyMessage = 'Sin datos en el período.',
  height = 240,
}: ColumnChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const totals = rows.map((row) => series.reduce((sum, s) => sum + (row.values[s.key] ?? 0), 0))
  const max = niceMax(Math.max(...totals, 0))
  const hasData = totals.some((total) => total > 0)

  if (rows.length === 0 || !hasData) return <ChartEmpty message={emptyMessage} />

  // Con muchas columnas las etiquetas se pisan, así que se muestra una de cada n.
  const labelStep = Math.ceil(rows.length / 12)

  const hoveredRow = hovered === null ? null : (rows[hovered] ?? null)
  const hoveredTotal = hovered === null ? 0 : (totals[hovered] ?? 0)

  return (
    <div className="viz flex flex-col gap-3">
      <ChartLegend series={series} />

      <div className="flex gap-3">
        {/* Eje vertical: retraído a propósito, el dato manda. */}
        <div
          className="flex shrink-0 flex-col-reverse justify-between text-right text-[11px] text-gray-400 tabular-nums dark:text-gray-500"
          style={{ height }}
        >
          {axisTicks(max).map((tick) => (
            <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {formatValue(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {axisTicks(max).map((tick) => (
              <div
                key={tick}
                aria-hidden="true"
                className="absolute inset-x-0 border-t"
                style={{ bottom: `${percentOf(tick, max)}%`, borderColor: 'var(--viz-grid)' }}
              />
            ))}

            <div className="absolute inset-0 flex items-end gap-[2px]">
              {rows.map((row, index) => {
                const total = totals[index]
                const isHovered = hovered === index

                return (
                  <div
                    key={`${row.label}-${index}`}
                    // El área sensible es toda la columna, no solo la barra:
                    // apuntar a un día flojo no debería exigir puntería.
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered((current) => (current === index ? null : current))}
                    tabIndex={0}
                    role="img"
                    aria-label={`${row.fullLabel ?? row.label}: ${formatValue(total)}`}
                    className="group relative flex h-full min-w-0 flex-1 cursor-default flex-col justify-end outline-none"
                  >
                    {/* El resaltado va sobre la barra, no sobre toda la altura de
                        la columna: un bloque de fondo hasta el tope del gráfico se
                        lee como un segmento apilado más. */}
                    <div
                      className={`relative flex flex-col-reverse overflow-hidden rounded-t transition-shadow ${
                        isHovered
                          ? 'ring-2 ring-gray-900/25 dark:ring-white/30'
                          : ''
                      }`}
                      style={{ height: `${percentOf(total, max)}%` }}
                    >
                      {series.map((s) => {
                        const value = row.values[s.key] ?? 0
                        if (value <= 0) return null
                        return (
                          <div
                            key={s.key}
                            style={{
                              height: `${percentOf(value, total)}%`,
                              backgroundColor: s.color,
                            }}
                            // Separador de 2px del color de la superficie entre
                            // segmentos, para que el apilado se lea como partes.
                            // El contenedor es flex-col-reverse: el primer hijo
                            // del DOM queda abajo, y su borde inferior caería
                            // sobre la línea base en vez de entre segmentos.
                            className="w-full shrink-0 border-b-2 border-white first:border-b-0 dark:border-gray-900"
                          />
                        )
                      })}
                    </div>

                  </div>
                )
              })}
            </div>

            {/* El tooltip se ancla al área del gráfico, no a la columna: sobre la
                barra más alta se saldría de la tarjeta y taparía el título. Se
                ubica en el lado opuesto al de la columna señalada, así nunca
                cubre el dato que se está mirando. */}
            {hoveredRow ? (
              <div
                className={`pointer-events-none absolute top-2 z-20 ${
                  (hovered ?? 0) < rows.length / 2 ? 'right-2' : 'left-2'
                }`}
              >
                <ChartTooltip
                  title={hoveredRow.fullLabel ?? hoveredRow.label}
                  rows={[
                    ...series.map((s) => ({
                      label: s.label,
                      value: formatValue(hoveredRow.values[s.key] ?? 0),
                      color: s.color,
                    })),
                    { label: 'Total', value: formatValue(hoveredTotal) },
                  ]}
                  footer={tooltipFooter?.(hoveredRow)}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex gap-[2px]">
            {rows.map((row, index) => (
              <div
                key={`${row.label}-label-${index}`}
                className="min-w-0 flex-1 truncate text-center text-[11px] text-gray-400 dark:text-gray-500"
              >
                {index % labelStep === 0 ? row.label : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
