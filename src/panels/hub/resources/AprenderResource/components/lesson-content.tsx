import { AlertTriangle, Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

export type CalloutProps = {
  /** "tip" para un dato útil; "important" para algo que conviene no pasar por alto. */
  tone?: 'tip' | 'important'
  children: ReactNode
}

/** Caja destacada dentro de una lección, para un dato aparte del texto corrido. */
export function Callout({ tone = 'tip', children }: CalloutProps) {
  const important = tone === 'important'
  const Icon = important ? AlertTriangle : Lightbulb

  return (
    <div
      className={[
        'flex gap-3 rounded-xl border p-4 text-sm',
        important
          ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200'
          : 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-200',
      ].join(' ')}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex flex-col gap-1 [&_strong]:font-semibold">{children}</div>
    </div>
  )
}

/** Lista numerada para un procedimiento, con el mismo círculo en todas las lecciones. */
export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white dark:bg-white dark:text-gray-900">
            {index + 1}
          </span>
          <div className="text-sm text-gray-700 dark:text-gray-300">{item}</div>
        </li>
      ))}
    </ol>
  )
}

/** Término + definición, para el glosario. Una sola columna: se lee como diccionario, no como ficha. */
export function Term({ children }: { children: ReactNode }) {
  return <dt className="text-[15px] font-semibold text-gray-900 dark:text-white">{children}</dt>
}

export function Definition({ children }: { children: ReactNode }) {
  return <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">{children}</dd>
}
