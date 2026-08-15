export type SpinnerProps = {
  className?: string
}

export function Spinner({ className = 'h-5 w-5' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60 ${className}`}
    />
  )
}
