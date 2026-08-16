import { Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/ui/components'
import { usePanel } from '@/ui/panel'
import { LESSONS } from '../lessons'
import { getSeenLessons } from '../progress'

export default function AprenderIndexPage() {
  const panel = usePanel()
  // Lazy initializer: se lee una vez al montar, que es justo cuando se vuelve
  // a esta pantalla y el checklist puede haber cambiado.
  const [seen] = useState<Set<string>>(() => getSeenLessons())

  const seenCount = LESSONS.filter((lesson) => seen.has(lesson.slug)).length
  const allSeen = seenCount === LESSONS.length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Centro de aprendizaje"
        description="Un recorrido corto y sin apuro para que le agarrés la mano al panel de negocio. Andá a tu ritmo: podés parar cuando quieras y seguir después, justo donde quedaste."
      />

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-gray-900 transition-all dark:bg-white"
            style={{ width: `${(seenCount / LESSONS.length) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
          {allSeen ? '¡Completo!' : `${seenCount} de ${LESSONS.length}`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {LESSONS.map((lesson, index) => {
          const Icon = lesson.icon
          const isSeen = seen.has(lesson.slug)

          return (
            <Link
              key={lesson.slug}
              to={`${panel.path}/aprender/${lesson.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 sm:p-5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800"
            >
              <div
                className={[
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                  isSeen
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                ].join(' ')}
              >
                {isSeen ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {index + 1}. {lesson.title}
                </p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{lesson.summary}</p>
              </div>

              <span className="hidden shrink-0 text-xs text-gray-400 sm:inline dark:text-gray-500">
                {lesson.minutes} min
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
