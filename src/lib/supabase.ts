import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Typed against the generated schema, so every `.from()`, `.select()` and
 * `.rpc()` call is checked against the real database. Regenerate the types
 * after any migration with `npm run db:types`.
 */
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
