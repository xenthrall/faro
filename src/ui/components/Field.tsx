import { controlClassName } from './styles'
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export type FieldProps = {
  label: string
  htmlFor?: string
  required?: boolean
  /** Explanatory text under the control. */
  hint?: string
  /** Validation message; replaces the hint and reddens the label. */
  error?: string | null
  children: ReactNode
  className?: string
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className = '',
}: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  )
}

type BaseFieldProps = {
  label: string
  hint?: string
  error?: string | null
  className?: string
}

export type TextFieldProps = BaseFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>

export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  const id = useId()
  return (
    <Field
      label={label}
      htmlFor={id}
      required={props.required}
      hint={hint}
      error={error}
      className={className}
    >
      <input id={id} {...props} className={controlClassName} />
    </Field>
  )
}

export type SelectOption = {
  value: string | number
  label: string
  disabled?: boolean
}

export type SelectFieldProps = BaseFieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'> & {
    options: SelectOption[]
    /** Shown as the first, empty option. Omit to make the select non-clearable. */
    placeholder?: string
  }

export function SelectField({
  label,
  hint,
  error,
  className,
  options,
  placeholder,
  ...props
}: SelectFieldProps) {
  const id = useId()
  return (
    <Field
      label={label}
      htmlFor={id}
      required={props.required}
      hint={hint}
      error={error}
      className={className}
    >
      <select id={id} {...props} className={controlClassName}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export type TextareaFieldProps = BaseFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export function TextareaField({ label, hint, error, className, ...props }: TextareaFieldProps) {
  const id = useId()
  return (
    <Field
      label={label}
      htmlFor={id}
      required={props.required}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea id={id} rows={3} {...props} className={controlClassName} />
    </Field>
  )
}

export type CheckboxFieldProps = BaseFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'>

export function CheckboxField({ label, hint, className = '', ...props }: CheckboxFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          {...props}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 accent-gray-900 focus:ring-gray-900 dark:border-gray-700 dark:accent-white"
        />
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {hint ? (
            <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
              {hint}
            </span>
          ) : null}
        </label>
      </div>
    </div>
  )
}

/** Two-column responsive grid for form fields. `md:col-span-2` widens one. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
}
