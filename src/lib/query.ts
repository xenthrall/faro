import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * A deliberately small data layer. The app has no server-state library in its
 * dependencies, and the panel's needs are modest: fetch on mount, refetch when
 * something related changes, surface loading and error states consistently.
 *
 * What it does provide — and what makes the panel feel like one application
 * rather than a set of independent screens — is **tag-based invalidation**.
 * Confirming a purchase touches `inventory`, `inventory_lots`,
 * `inventory_movements` and `purchases` at once; any screen listening to those
 * tags refreshes itself without knowing who caused the change.
 */

type Listener = () => void

const listeners = new Map<string, Set<Listener>>()

/** Every tag a screen can subscribe to. Typed so a typo fails to compile. */
export type QueryTag =
  | 'business_settings'
  | 'categories'
  | 'units'
  | 'locations'
  | 'price_lists'
  | 'products'
  | 'product_prices'
  | 'suppliers'
  | 'customers'
  | 'inventory'
  | 'inventory_lots'
  | 'inventory_movements'
  | 'purchases'
  | 'sales'
  | 'transfers'

/** Refetches every mounted query subscribed to any of the given tags. */
export function invalidate(...tags: QueryTag[]): void {
  for (const tag of tags) {
    for (const listener of listeners.get(tag) ?? []) listener()
  }
}

/**
 * Tags that any inventory-affecting operation invalidates. Confirming a
 * document changes stock, lots and the ledger regardless of which document it
 * was, so callers state the document tag and let this cover the rest.
 */
export const INVENTORY_TAGS: QueryTag[] = ['inventory', 'inventory_lots', 'inventory_movements']

/**
 * Throws on a PostgREST error so callers can just `await` the happy path.
 *
 * The generic is over the whole response, not over `data`, on purpose.
 * PostgREST's response type is a union — `{ data, error: null }` on success,
 * `{ data: null, error }` on failure. Declaring the parameter as
 * `{ data: T | null }` makes TypeScript infer `T` from *both* arms of that
 * union, which collapses to `never` whenever the call is inlined as
 * `unwrap(await …)`. Inferring the response and indexing into it afterwards
 * keeps the row type intact at every call site.
 */
export function unwrap<R extends { data: unknown; error: PostgrestError | null }>(
  result: R,
): NonNullable<R['data']> {
  if (result.error) throw new Error(result.error.message)
  if (result.data == null) throw new Error('La consulta no devolvió resultados.')
  return result.data as NonNullable<R['data']>
}

export type QueryState<T> = {
  data: T | undefined
  error: string | null
  loading: boolean
  /** True on the very first load only — lets screens show a skeleton once. */
  initialLoading: boolean
  refetch: () => void
}

export type QueryOptions = {
  /**
   * Re-runs the fetcher when any of these change. Compared by JSON value, not
   * by identity, so an inline array of ids is safe to pass every render.
   */
  deps?: readonly unknown[]
  /** Refetches whenever `invalidate()` is called with any of these tags. */
  tags?: readonly QueryTag[]
  /** Skips fetching entirely — for queries that depend on a not-yet-chosen value. */
  enabled?: boolean
}

export function useQuery<T>(fetcher: () => Promise<T>, options: QueryOptions = {}): QueryState<T> {
  const { deps, tags, enabled = true } = options

  // Bumping this re-runs the fetch effect; it is how `refetch` and tag
  // invalidation both trigger a reload without needing a stable fetcher.
  const [reloadToken, setReloadToken] = useState(0)

  // Inline arrays would restart the effect on every render if compared by
  // identity, so the dependency is the serialised value instead.
  const depsKey = JSON.stringify(deps ?? [])
  const requestKey = `${depsKey}|${reloadToken}`

  // The last settled request, tagged with the key it was made for. Loading is
  // *derived* from comparing that key against the current one rather than
  // being its own state, so nothing has to be written synchronously from
  // inside the effect — only from the promise callbacks, once results arrive.
  const [settled, setSettled] = useState<{
    key: string
    data?: T
    error: string | null
  } | null>(null)

  // The fetcher is almost always an inline arrow function, so it changes
  // identity on every render. It is kept in a ref — synced in an effect rather
  // than during render — so `deps` stays the single source of truth for when a
  // refetch is warranted.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])

  // `tags` is an inline array at every call site, so it is compared by value
  // rather than by identity — otherwise the subscription would tear down and
  // re-register on every render.
  const tagsKey = (tags ?? []).join(',')

  useEffect(() => {
    if (!enabled) return

    // Guards against a slow earlier request resolving after a newer one and
    // overwriting fresher data.
    let cancelled = false

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setSettled({ key: requestKey, data, error: null })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setSettled({
          key: requestKey,
          error: cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [enabled, requestKey])

  useEffect(() => {
    if (!tagsKey) return
    const subscribed = tagsKey.split(',') as QueryTag[]

    for (const tag of subscribed) {
      const set = listeners.get(tag) ?? new Set<Listener>()
      set.add(refetch)
      listeners.set(tag, set)
    }

    return () => {
      for (const tag of subscribed) listeners.get(tag)?.delete(refetch)
    }
  }, [tagsKey, refetch])

  const loading = enabled && settled?.key !== requestKey

  return useMemo(
    () => ({
      // Previous data stays visible while a refetch is in flight, so tables
      // don't blank out when an invalidation fires.
      data: settled?.data,
      error: settled?.error ?? null,
      loading,
      initialLoading: loading && settled === null,
      refetch,
    }),
    [settled, loading, refetch],
  )
}
