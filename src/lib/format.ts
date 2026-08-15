/**
 * Shared formatters. Every number the user reads goes through one of these,
 * so money, quantities and dates look the same on every screen.
 *
 * The database stores exact `numeric` values, which supabase-js hands back as
 * JS numbers. That is fine for display; anything that must stay exact (totals,
 * stock) is computed in PostgreSQL, never here.
 */

const LOCALE = 'es-CO'

const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const moneyPrecise = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** `1234567` → `$ 1.234.567`. Used for totals and values. */
export function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  return money.format(value)
}

/** Same as `formatMoney` but keeping cents — for unit costs and prices. */
export function formatMoneyPrecise(value: number | null | undefined): string {
  if (value == null) return '—'
  return moneyPrecise.format(value)
}

/**
 * Quantities are `numeric(18,4)`, so most values come back as `500.0000`.
 * Trailing zeros are noise for a hardware store selling whole units, but
 * meaningful for a business selling 1.5 kg — so decimals are shown only when
 * the value actually has them.
 */
export function formatQuantity(value: number | null | undefined): string {
  if (value == null) return '—'
  const rounded = Math.round(value * 10000) / 10000
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(rounded) ? 0 : 4,
  }).format(rounded)
}

/** `19` → `19%`. Tax rates are stored as percentages, not fractions. */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  const rounded = Math.round(value * 1000) / 1000
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 }).format(rounded)}%`
}

/** `2026-08-15T10:00:00Z` → `15 ago 2026`. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

/** `2026-08-15T10:00:00Z` → `15 ago 2026, 10:00`. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

/**
 * A `date` column (no time) arrives as `2026-09-01`. Parsing that with `new
 * Date()` treats it as UTC midnight, which renders as the previous day in any
 * timezone west of Greenwich — so the parts are read directly instead.
 */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

/** `-14` → `vencido hace 14 días`; `17` → `en 17 días`. */
export function formatDaysToExpiration(days: number | null | undefined): string {
  if (days == null) return '—'
  if (days < 0) return `vencido hace ${Math.abs(days)} d`
  if (days === 0) return 'vence hoy'
  return `en ${days} d`
}

/** Today as `YYYY-MM-DD` in local time, for date inputs. */
export function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/**
 * Turns a `<input type="date">` value into a timestamptz the database can
 * store, anchored at local noon. Noon (not midnight) keeps the calendar day
 * stable regardless of the timezone the value is later rendered in.
 */
export function dateInputToTimestamp(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0).toISOString()
}
