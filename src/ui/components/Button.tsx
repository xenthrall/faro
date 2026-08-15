import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Spinner } from './Spinner'
import { buttonClassName, type ButtonSize, type ButtonVariant } from './styles'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner and blocks further clicks. */
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      className={buttonClassName(variant, size, className)}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  )
}

export type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** A `<Link>` that looks exactly like a `<Button>`, for navigation actions. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonLinkProps) {
  return <Link {...props} className={buttonClassName(variant, size, className)} />
}

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}

/** Square, icon-only button. `label` is required — it becomes the accessible name. */
export function IconButton({ label, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={[
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500',
        'transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed',
        'disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
