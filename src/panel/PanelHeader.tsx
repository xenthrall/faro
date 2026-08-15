import { Menu } from 'lucide-react'
import { ThemeToggle } from '../theme'
import { usePanel } from './panel-context'

export type PanelHeaderProps = {
  onMenuClick: () => void
}

export function PanelHeader({ onMenuClick }: PanelHeaderProps) {
  const panel = usePanel()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b border-gray-200/80 bg-white/80 px-3 backdrop-blur-md sm:px-6 dark:border-gray-800/80 dark:bg-gray-950/80">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir navegación"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 sm:hidden dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
      >
        <Menu className="h-5 w-5" />
      </button>

      <span className="flex-1 truncate px-1 text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
        {panel.name}
      </span>

      <ThemeToggle />
    </header>
  )
}
