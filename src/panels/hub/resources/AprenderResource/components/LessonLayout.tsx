import { ArrowLeft, ArrowRight, PartyPopper } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '@/ui/components'
import { usePanel } from '@/ui/panel'
import { LESSONS } from '../lessons'
import { markLessonSeen } from '../progress'

export type LessonLayoutProps = {
  slug: string
  children: React.ReactNode
}

/**
 * Chrome compartido por toda lección: de dónde vino, cuánto falta, y hacia
 * dónde seguir. Marca la lección como vista al montarse — es lo único que
 * necesita pasar para que el índice muestre el check la próxima vez.
 */
export function LessonLayout({ slug, children }: LessonLayoutProps) {
  const panel = usePanel()
  const basePath = `${panel.path}/aprender`
  const index = LESSONS.findIndex((lesson) => lesson.slug === slug)
  const lesson = LESSONS[index]
  const prev = index > 0 ? LESSONS[index - 1] : undefined
  const next = index >= 0 && index < LESSONS.length - 1 ? LESSONS[index + 1] : undefined

  useEffect(() => {
    markLessonSeen(slug)
  }, [slug])

  if (!lesson) return null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div>
        <Link
          to={basePath}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Centro de aprendizaje
        </Link>

        <p className="mt-5 text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
          Lección {index + 1} de {LESSONS.length} · {lesson.minutes} min
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {lesson.title}
        </h1>
      </div>

      <div className="flex flex-col gap-5">{children}</div>

      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        {prev ? (
          <Link
            to={`${basePath}/${prev.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <ButtonLink to={`${basePath}/${next.slug}`}>
            Siguiente: {next.title}
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        ) : (
          <ButtonLink to={basePath}>
            <PartyPopper className="h-4 w-4" />
            Terminaste el recorrido
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
