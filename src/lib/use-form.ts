import { useCallback, useState } from 'react'

/**
 * Form values are held as strings (and booleans for checkboxes), the way the
 * DOM hands them over. Numbers become numbers only at submit time, via the
 * `toNumber`/`toNullable` helpers below.
 *
 * Keeping `""` rather than `0` for an empty number input matters here: the
 * difference between "no minimum stock" (NULL) and "a minimum of zero" is
 * meaningful to the database, and a number-typed state would collapse both.
 */
export type FormValues = Record<string, string | boolean>

export type Form<T extends FormValues> = {
  values: T
  set: <K extends keyof T>(name: K, value: T[K]) => void
  reset: (values?: T) => void
  /** Props for a text, number, date, textarea or select control. */
  input: (name: keyof T & string) => {
    name: string
    value: string
    onChange: (event: { target: { value: string } }) => void
  }
  /** Props for a checkbox control. */
  checkbox: (name: keyof T & string) => {
    name: string
    checked: boolean
    onChange: (event: { target: { checked: boolean } }) => void
  }
  dirty: boolean
}

export function useForm<T extends FormValues>(initial: T): Form<T> {
  const [values, setValues] = useState<T>(initial)
  const [dirty, setDirty] = useState(false)

  const set = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((current) => ({ ...current, [name]: value }))
    setDirty(true)
  }, [])

  const reset = useCallback(
    (next?: T) => {
      setValues(next ?? initial)
      setDirty(false)
    },
    // `initial` is an object literal at the call site, so it changes identity
    // every render; only its first value is meaningful as a reset target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const input = useCallback(
    (name: keyof T & string) => ({
      name,
      value: String(values[name] ?? ''),
      onChange: (event: { target: { value: string } }) =>
        set(name, event.target.value as T[typeof name]),
    }),
    [values, set],
  )

  const checkbox = useCallback(
    (name: keyof T & string) => ({
      name,
      checked: Boolean(values[name]),
      onChange: (event: { target: { checked: boolean } }) =>
        set(name, event.target.checked as T[typeof name]),
    }),
    [values, set],
  )

  return { values, set, reset, input, checkbox, dirty }
}

/** `""` → `null`, so an untouched optional text field clears the column. */
export function toNullable(value: string | boolean): string | null {
  if (typeof value === 'boolean') return value ? 'true' : null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** `""` → `null`, `"12.5"` → `12.5`. Throws nothing: invalid input becomes null. */
export function toNullableNumber(value: string | boolean): number | null {
  if (typeof value === 'boolean') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/** Same as `toNullableNumber` but falling back to `fallback` instead of null. */
export function toNumber(value: string | boolean, fallback = 0): number {
  return toNullableNumber(value) ?? fallback
}
