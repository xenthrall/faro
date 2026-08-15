import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { CrudTable } from './types'

/**
 * `CrudPage` picks its table at runtime from a config object, so the generated
 * per-table `Insert`/`Update` types can't be resolved statically — TypeScript
 * would collapse a union of six table shapes into `never`.
 *
 * This is the one place the typed client is deliberately widened, and it is
 * narrow on purpose: only the four operations `CrudPage` performs. Every other
 * query in the app goes through the fully typed `supabase` client. The field
 * list in each resource's config is what keeps payloads honest here; a wrong
 * column name surfaces as a PostgREST error, which the page shows as-is.
 */
type Payload = Record<string, unknown>

type Result = { error: PostgrestError | null }

type CrudClient = {
  from: (table: CrudTable) => {
    select: (columns: string) => {
      order: (
        column: string,
        options?: { ascending?: boolean },
      ) => PromiseLike<{ data: Payload[] | null; error: PostgrestError | null }>
    }
    insert: (values: Payload) => PromiseLike<Result>
    update: (values: Payload) => { eq: (column: string, value: unknown) => PromiseLike<Result> }
    delete: () => { eq: (column: string, value: unknown) => PromiseLike<Result> }
  }
}

export const crudClient = supabase as unknown as CrudClient
