/**
 * Class strings shared by more than one component. They live outside the
 * component files so those keep exporting only components, which is what lets
 * Vite's fast refresh update them without a full reload.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
  ghost:
    'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
  danger:
    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-9 gap-2 px-4 text-sm',
}

export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
): string {
  return [
    'inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors',
    'outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60',
    'dark:focus-visible:ring-white dark:focus-visible:ring-offset-gray-950',
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(' ')
}

/**
 * One control style shared by every input in the panel — including the bare
 * `<select>` and `<input>` elements used inside table toolbars and line
 * editors, so a quantity field on a purchase line looks identical to a text
 * field on the product form.
 */
export const controlClassName = [
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900',
  'outline-none transition-colors placeholder:text-gray-400',
  'focus:border-gray-900 focus:ring-1 focus:ring-gray-900',
  'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
  'dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600',
  'dark:focus:border-white dark:focus:ring-white dark:disabled:bg-gray-900',
].join(' ')
