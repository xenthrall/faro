import type { User } from '@supabase/supabase-js'
import { getInitials } from './user-display'

// Full literal class names (not template-built) so Tailwind's scanner picks
// all of them up, regardless of which one gets used at runtime.
const palette = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
]

function colorForUser(user: User): string {
  let hash = 0
  for (let i = 0; i < user.id.length; i++) {
    hash = (hash * 31 + user.id.charCodeAt(i)) | 0
  }
  return palette[Math.abs(hash) % palette.length]
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const

export type UserAvatarProps = {
  user: User
  size?: keyof typeof sizeClasses
}

/** Initials-based avatar generated from the user's data — no image upload or external avatar service involved. */
export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorForUser(user)} ${sizeClasses[size]}`}
    >
      {getInitials(user)}
    </span>
  )
}
