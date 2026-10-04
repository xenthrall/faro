import type { User } from '@supabase/supabase-js'

/**
 * Cuenta pública de demostración. Faro es un concepto experimental desplegado
 * en GitHub Pages, así que el login viene precargado con esta cuenta para que
 * cualquiera pueda entrar a probarlo.
 *
 * El usuario se crea a mano desde el dashboard de Supabase (ver
 * `docs/demo-user.md`). La migración `demo_user_lock.sql` bloquea en la base
 * cualquier cambio de email, contraseña o nombre de esta cuenta: si cambiás
 * el email acá, cambialo también allá.
 */
export const DEMO_USER = {
  email: 'demo@faro.app',
  password: 'faro-demo',
  fullName: 'Usuario demo',
} as const

export function isDemoUser(user: Pick<User, 'email'> | null | undefined): boolean {
  return user?.email === DEMO_USER.email
}
