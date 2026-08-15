/**
 * Rangos de fecha para la analítica.
 *
 * Todo se calcula en la zona horaria del navegador y se envía como
 * `timestamptz`, así que "hoy" significa el día del usuario y no el del
 * servidor. Los rangos son semiabiertos `[desde, hasta)`: el instante final
 * queda excluido, que es lo que evita que una venta de las 23:59:59 caiga en
 * dos períodos a la vez.
 */

export type TimeBucket = 'hour' | 'day' | 'week' | 'month'

export type DateRange = {
  from: Date
  to: Date
}

export type RangePresetId =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'this_month'
  | 'last_month'
  | 'last90'
  | 'this_year'
  | 'all'
  | 'custom'

export type RangePreset = {
  id: RangePresetId
  label: string
  /** Texto del período con el que se compara, para los deltas. */
  comparisonLabel: string
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: 'today', label: 'Hoy', comparisonLabel: 'vs. ayer' },
  { id: 'yesterday', label: 'Ayer', comparisonLabel: 'vs. anteayer' },
  { id: 'last7', label: 'Últimos 7 días', comparisonLabel: 'vs. 7 días previos' },
  { id: 'this_month', label: 'Este mes', comparisonLabel: 'vs. mes anterior' },
  { id: 'last_month', label: 'Mes pasado', comparisonLabel: 'vs. mes previo' },
  { id: 'last90', label: 'Últimos 90 días', comparisonLabel: 'vs. 90 días previos' },
  { id: 'this_year', label: 'Este año', comparisonLabel: 'vs. año anterior' },
  { id: 'all', label: 'Todo el histórico', comparisonLabel: '' },
  { id: 'custom', label: 'Personalizado', comparisonLabel: 'vs. período previo' },
]

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

/**
 * `YYYY-MM-DD` en hora local, para los `<input type="date">` del rango
 * personalizado. `offsetDays` negativo retrocede desde hoy.
 */
export function todayIso(offsetDays = 0): string {
  const date = addDays(startOfDay(new Date()), offsetDays)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function resolveRange(
  preset: RangePresetId,
  custom?: { from: string; to: string },
): DateRange {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)

  switch (preset) {
    case 'today':
      return { from: today, to: tomorrow }
    case 'yesterday':
      return { from: addDays(today, -1), to: today }
    case 'last7':
      return { from: addDays(today, -6), to: tomorrow }
    case 'this_month':
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: tomorrow }
    case 'last_month':
      return {
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        to: new Date(today.getFullYear(), today.getMonth(), 1),
      }
    case 'last90':
      return { from: addDays(today, -89), to: tomorrow }
    case 'this_year':
      return { from: new Date(today.getFullYear(), 0, 1), to: tomorrow }
    case 'all':
      // Suficientemente atrás para cubrir cualquier historial que el negocio
      // haya cargado, sin depender de consultar la fecha del primer documento.
      return { from: new Date(2000, 0, 1), to: tomorrow }
    case 'custom': {
      if (!custom?.from || !custom?.to) return { from: addDays(today, -29), to: tomorrow }
      const [fy, fm, fd] = custom.from.split('-').map(Number)
      const [ty, tm, td] = custom.to.split('-').map(Number)
      return {
        from: new Date(fy, fm - 1, fd),
        // El input de fecha marca un día inclusive; el rango es semiabierto, así
        // que el final se corre al día siguiente para incluirlo completo.
        to: addDays(new Date(ty, tm - 1, td), 1),
      }
    }
  }
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date)
  const day = copy.getDate()
  copy.setDate(1)
  copy.setMonth(copy.getMonth() + months)
  // Evita que el 31 de marzo menos un mes caiga en el 3 de marzo.
  const lastDay = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate()
  copy.setDate(Math.min(day, lastDay))
  return copy
}

/**
 * Período con el que se compara, para los deltas.
 *
 * Para los presets de calendario se retrocede un mes o un año completo en vez
 * de restar días: comparar "del 1 al 15 de agosto" contra "del 17 al 31 de
 * julio" sería un tramo del mismo largo, pero la etiqueta dice "vs. mes
 * anterior" y el usuario espera el mismo tramo del mes pasado. Para los demás
 * presets sí corresponde el bloque inmediatamente anterior de igual duración.
 */
export function previousRange(range: DateRange, preset: RangePresetId): DateRange {
  if (preset === 'this_month' || preset === 'last_month') {
    return { from: addMonths(range.from, -1), to: addMonths(range.to, -1) }
  }

  if (preset === 'this_year') {
    const shift = (date: Date) => {
      const copy = new Date(date)
      copy.setFullYear(copy.getFullYear() - 1)
      return copy
    }
    return { from: shift(range.from), to: shift(range.to) }
  }

  const span = range.to.getTime() - range.from.getTime()
  return { from: new Date(range.from.getTime() - span), to: new Date(range.from) }
}

/**
 * Granularidad del gráfico según el largo del rango: suficientes columnas para
 * ver el ritmo, no tantas como para volverlas ilegibles.
 */
export function bucketFor(range: DateRange): TimeBucket {
  const days = (range.to.getTime() - range.from.getTime()) / 86_400_000
  if (days <= 2) return 'hour'
  if (days <= 62) return 'day'
  if (days <= 400) return 'week'
  return 'month'
}

const BUCKET_LABELS: Record<TimeBucket, string> = {
  hour: 'por hora',
  day: 'por día',
  week: 'por semana',
  month: 'por mes',
}

export function bucketLabel(bucket: TimeBucket): string {
  return BUCKET_LABELS[bucket]
}

/** Etiqueta corta del eje según la granularidad. */
export function formatBucket(value: string, bucket: TimeBucket): string {
  const date = new Date(value)
  switch (bucket) {
    case 'hour':
      return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', hour12: true }).format(date)
    case 'day':
      return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(date)
    case 'week':
      return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(date)
    case 'month':
      return new Intl.DateTimeFormat('es-CO', { month: 'short', year: '2-digit' }).format(date)
  }
}

/** Etiqueta larga para el tooltip, donde sí hay espacio. */
export function formatBucketLong(value: string, bucket: TimeBucket): string {
  const date = new Date(value)
  if (bucket === 'hour') {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      hour12: true,
    }).format(date)
  }
  if (bucket === 'month') {
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(date)
  }
  const formatted = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
  return bucket === 'week' ? `Semana del ${formatted}` : formatted
}

/** Rango legible para el encabezado, p. ej. `1 – 15 ago 2026`. */
export function describeRange(range: DateRange): string {
  const last = new Date(range.to.getTime() - 1)
  const sameDay = range.from.toDateString() === last.toDateString()
  const fmt = (date: Date) =>
    new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
  return sameDay ? fmt(range.from) : `${fmt(range.from)} – ${fmt(last)}`
}

/** Variación porcentual contra el período previo. `null` si no hay base. */
export function deltaPercent(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}
