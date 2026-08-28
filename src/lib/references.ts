import { useMemo } from 'react'
import type { Category, Location, PriceList, Unit } from './types'
import { unwrap, useQuery, type QueryTag } from './query'
import { supabase } from './supabase'
import type { SelectOption } from '@/ui/components'

/**
 * Reference data every form needs to fill its selects. These are small,
 * slow-changing catalogues, so each screen loading them in full is fine — and
 * because they share the same query tags as the catalogue screens themselves,
 * adding a location on one screen refreshes the location select on another.
 */

export type Reference<T> = {
  rows: T[]
  options: SelectOption[]
  loading: boolean
  byId: Map<number, T>
}

function useReference<T extends { id: number }>(
  fetcher: () => Promise<T[]>,
  toLabel: (row: T, all: T[]) => string,
  tag: QueryTag,
  deps: readonly unknown[] = [],
): Reference<T> {
  const query = useQuery<T[]>(fetcher, { tags: [tag], deps })
  const rows = useMemo(() => query.data ?? [], [query.data])

  return useMemo(
    () => ({
      rows,
      options: rows.map((row) => ({ value: row.id, label: toLabel(row, rows) })),
      loading: query.initialLoading,
      byId: new Map(rows.map((row) => [row.id, row])),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, query.initialLoading],
  )
}

/** `Ferretería › Tornillería › Tornillos` — the full path, so ambiguous leaf names stay distinguishable. */
export function categoryPath(category: Category, all: Category[]): string {
  const byId = new Map(all.map((item) => [item.id, item]))
  const parts: string[] = [category.name]

  let current = category.parent_id ? byId.get(category.parent_id) : undefined
  let depth = 0
  while (current && depth < 32) {
    parts.unshift(current.name)
    current = current.parent_id ? byId.get(current.parent_id) : undefined
    depth += 1
  }

  return parts.join(' › ')
}

export function useCategories(): Reference<Category> {
  return useReference<Category>(
    async () => unwrap(await supabase.from('categories').select('*').order('name')),
    categoryPath,
    'categories',
  )
}

export function useUnits(): Reference<Unit> {
  return useReference<Unit>(
    async () =>
      unwrap(await supabase.from('units').select('*').eq('active', true).order('code')),
    (unit) => `${unit.name} (${unit.code})`,
    'units',
  )
}

export function useLocations(): Reference<Location> {
  return useReference<Location>(
    async () =>
      unwrap(await supabase.from('locations').select('*').eq('active', true).order('name')),
    (location) => location.name,
    'locations',
  )
}

export function usePriceLists(): Reference<PriceList> {
  return useReference<PriceList>(
    async () =>
      unwrap(await supabase.from('price_lists').select('*').eq('active', true).order('name')),
    (list) => list.name,
    'price_lists',
  )
}

export function useSuppliers() {
  return useReference(
    async () =>
      unwrap(await supabase.from('suppliers').select('*').eq('active', true).order('name')),
    (supplier) => supplier.name,
    'suppliers',
  )
}

export function useCustomers() {
  return useReference(
    async () =>
      unwrap(await supabase.from('customers').select('*').eq('active', true).order('name')),
    (customer) => customer.name,
    'customers',
  )
}

export type ProductOption = {
  id: number
  sku: string
  barcode: string | null
  name: string
  tax_rate: number
  track_lot: boolean
  track_expiration: boolean
  unit_id: number
  units: { code: string } | null
}

/** Active products, for the line-item pickers on purchases, sales and transfers. */
export function useProductOptions() {
  return useReference<ProductOption>(
    async () =>
      unwrap(
        await supabase
          .from('products')
          .select('id, sku, barcode, name, tax_rate, track_lot, track_expiration, unit_id, units(code)')
          .eq('active', true)
          .order('name'),
      ) as ProductOption[],
    (product) => `${product.name} · ${product.sku}`,
    'products',
  )
}

/** The location marked `is_default`, used to preselect a location on new documents. */
export function defaultLocationId(locations: Location[]): string {
  return String(locations.find((location) => location.is_default)?.id ?? locations[0]?.id ?? '')
}
