import { ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router'
import { resolvePagePath, usePanel } from '@/ui/panel'

const cardStyles = [
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-fuchsia-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
]

/**
 * Mobile-only call to action: the sidebar is collapsed on small screens, so
 * this surfaces the panel's other pages directly on the home page instead
 * of leaving mobile visitors to discover the hamburger menu on their own.
 */
export function ExplorePages() {
  const panel = usePanel()
  const pages = panel.pages.filter((page) => !page.hidden && page.path !== '/')

  if (pages.length === 0) return null

  return (
    <div className="w-full sm:hidden">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        Seguí explorando
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {pages.map((page, index) => {
          const Icon = page.icon

          return (
            <NavLink
              key={page.name}
              to={resolvePagePath(panel, page)}
              className={`group flex flex-col justify-between rounded-2xl bg-gradient-to-br p-4 text-white shadow-sm transition-transform active:scale-95 ${cardStyles[index % cardStyles.length]}`}
            >
              {Icon ? <Icon className="h-5 w-5" /> : null}
              <div className="mt-6 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{page.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
              </div>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}
