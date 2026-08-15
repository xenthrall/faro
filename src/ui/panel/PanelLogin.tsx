import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '@/auth'
import { usePanel } from './panel-context'
import { ThemeToggle } from '../theme'

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white'

export function PanelLogin() {
  const panel = usePanel()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const Logo = panel.logo

  // Signing in updates `auth.status` via the shared auth state (not a local
  // flag), so a successful submit lands here on the next render and redirects.
  if (auth.status === 'authenticated') {
    return <Navigate to={panel.path} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await auth.signInWithPassword({ email, password })

    setSubmitting(false)

    if (error) {
      setError('Email o contraseña incorrectos.')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between p-4">
        <Link
          to="/"
          aria-label="Volver al inicio"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {Logo ? (
            <Logo className="h-8" />
          ) : (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{panel.name}</h1>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Iniciá sesión para continuar.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
              />
            </div>

            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
