import { useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, Mail, UserRound } from 'lucide-react'
import { useAuth, UserAvatar } from '@/auth'
import { usePanel } from './panel-context'

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white'

const labelClassName = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

const buttonClassName =
  'inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'

type SettingsSectionProps = {
  icon: typeof UserRound
  title: string
  description: string
  children: ReactNode
}

function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ProfileSection() {
  const auth = useAuth()
  const user = auth.user
  const initialFullName =
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''
  const [fullName, setFullName] = useState(initialFullName)
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await auth.updateUser({ data: { full_name: fullName.trim() } })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSavedAt(Date.now())
  }

  return (
    <SettingsSection
      icon={UserRound}
      title="Perfil"
      description="Tu nombre visible en el panel."
    >
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size="lg" />
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="full_name" className={labelClassName}>
              Display name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder={user.email}
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value)
                setSavedAt(null)
              }}
              className={inputClassName}
            />
          </div>
          <button type="submit" disabled={submitting} className={buttonClassName}>
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {savedAt ? (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">Guardado.</p>
      ) : null}
    </SettingsSection>
  )
}

function EmailSection() {
  const auth = useAuth()
  const user = auth.user
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!user?.email) return null
  const currentEmail = user.email

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)

    const { error: passwordError } = await auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })
    if (passwordError) {
      setSubmitting(false)
      setError('La contraseña actual no es correcta.')
      return
    }

    const { error: updateError } = await auth.updateUser({ email: newEmail })
    setSubmitting(false)
    if (updateError) {
      setError(updateError.message)
      return
    }

    setCurrentPassword('')
    setNewEmail('')
    setSuccess(true)
  }

  return (
    <SettingsSection
      icon={Mail}
      title="Email"
      description={`Email actual: ${currentEmail}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:max-w-sm">
        <div>
          <label htmlFor="current_password_email" className={labelClassName}>
            Contraseña actual
          </label>
          <input
            id="current_password_email"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="new_email" className={labelClassName}>
            Nuevo email
          </label>
          <input
            id="new_email"
            type="email"
            required
            autoComplete="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            className={inputClassName}
          />
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Revisá tu correo para confirmar el cambio.
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className={`${buttonClassName} self-start`}>
          {submitting ? 'Verificando…' : 'Cambiar email'}
        </button>
      </form>
    </SettingsSection>
  )
}

function PasswordSection() {
  const auth = useAuth()
  const user = auth.user
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!user?.email) return null
  const currentEmail = user.email

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    setSubmitting(true)

    const { error: passwordError } = await auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })
    if (passwordError) {
      setSubmitting(false)
      setError('La contraseña actual no es correcta.')
      return
    }

    const { error: updateError } = await auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    })
    if (updateError) {
      setSubmitting(false)
      setError(updateError.message)
      return
    }

    // Supabase revokes the session's refresh token as soon as the password
    // changes, so the old session silently stops working shortly after —
    // re-authenticate with the new password to keep the user signed in.
    const { error: refreshError } = await auth.signInWithPassword({
      email: currentEmail,
      password: newPassword,
    })
    setSubmitting(false)
    if (refreshError) {
      setError('Contraseña actualizada, pero tu sesión venció. Volvé a iniciar sesión.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSuccess(true)
  }

  return (
    <SettingsSection
      icon={KeyRound}
      title="Contraseña"
      description="Requiere confirmar tu contraseña actual."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:max-w-sm">
        <div>
          <label htmlFor="current_password" className={labelClassName}>
            Contraseña actual
          </label>
          <input
            id="current_password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="new_password" className={labelClassName}>
            Nueva contraseña
          </label>
          <input
            id="new_password"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className={labelClassName}>
            Confirmar nueva contraseña
          </label>
          <input
            id="confirm_password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClassName}
          />
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Contraseña actualizada.</p>
        ) : null}

        <button type="submit" disabled={submitting} className={`${buttonClassName} self-start`}>
          {submitting ? 'Verificando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </SettingsSection>
  )
}

export function PanelAccount() {
  const panel = usePanel()

  return (
    <div>
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Configuración de la cuenta
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestioná tu perfil en {panel.name}.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <ProfileSection />
        <EmailSection />
        <PasswordSection />
      </div>
    </div>
  )
}
