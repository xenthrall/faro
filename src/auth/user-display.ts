import type { User } from '@supabase/supabase-js'

function fullNameOf(user: User): string {
  const value = user.user_metadata?.full_name
  return typeof value === 'string' ? value.trim() : ''
}

/** Display name shown across the UI: the user's set display name, or their email as a fallback. */
export function getDisplayName(user: User): string {
  return fullNameOf(user) || user.email || 'Usuario'
}

/** One or two letters used as the avatar's fallback content. */
export function getInitials(user: User): string {
  const parts = getDisplayName(user).split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
