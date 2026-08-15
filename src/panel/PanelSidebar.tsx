import { NavLink } from 'react-router'
import { usePanel } from './panel-context'
import { resolvePagePath } from './paths'

export type PanelSidebarProps = {
  open: boolean
  onClose: () => void
}

export function PanelSidebar({ open, onClose }: PanelSidebarProps) {
  const panel = usePanel()

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-gray-950/50 backdrop-blur-[1px] transition-opacity duration-300 sm:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-out sm:static sm:z-auto sm:w-64 sm:translate-x-0 sm:transition-none dark:border-gray-800 dark:bg-gray-950 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-gray-200 px-5 sm:hidden dark:border-gray-800">
          <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
            {panel.name}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {panel.pages.map((page) => {
            const Icon = page.icon

            return (
              <NavLink
                key={page.name}
                to={resolvePagePath(panel, page)}
                end={page.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:py-2',
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null}
                <span className="truncate">{page.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
