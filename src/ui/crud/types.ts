import type { LucideIcon } from 'lucide-react'
import type { SelectOption } from '@/ui/components'
import type { QueryTag } from '@/lib/query'
import type { Column } from '@/ui/components'

export type CrudFieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'email'
  | 'tel'

/**
 * One control in a catalogue record's form. This is the declarative layer the
 * simple resources are built from: a resource describes *what* its fields are,
 * and `CrudPage` decides how they render, validate and serialise.
 */
export type CrudField = {
  /** Column name in the table. */
  name: string
  label: string
  type?: CrudFieldType
  required?: boolean
  hint?: string
  placeholder?: string
  /** Value used when creating a new record. Defaults to `''` / `false`. */
  defaultValue?: string | boolean
  /** For `select`. */
  options?: SelectOption[]
  /** Placeholder option for a clearable `select`. */
  emptyOption?: string
  /** Spans both columns of the form grid. */
  wide?: boolean
  step?: string
  min?: number
  max?: number
  /** Hides the field unless the predicate passes — for dependent fields. */
  visible?: (values: Record<string, string | boolean>) => boolean
  /** Marks the column as `numeric` so it is sent as a number, not a string. */
  numeric?: boolean
}

/** Tables `CrudPage` knows how to operate on. */
export type CrudTable =
  | 'units'
  | 'categories'
  | 'locations'
  | 'price_lists'
  | 'suppliers'
  | 'customers'

export type CrudConfig<T> = {
  table: CrudTable
  /** Invalidated after every write, so dependent screens refresh. */
  tag: QueryTag
  title: string
  description?: string
  /** Singular noun used in buttons and dialogs, e.g. "unidad". */
  singular: string
  /** Grammatical gender of `singular`, for "Nuevo"/"Nueva". */
  gender?: 'm' | 'f'
  icon?: LucideIcon
  columns: Column<T>[]
  fields: CrudField[]
  /** `select=` clause. Defaults to `*`. */
  select?: string
  /** Ordering column. Defaults to `name`. */
  orderBy?: string
  filter?: (row: T, query: string) => boolean
  searchPlaceholder?: string
  emptyDescription?: string
}
