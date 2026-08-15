import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router'
import { appPanel } from '@/panels/app'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Inicio',
  icon: Compass,
  order: 0,
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full bg-gray-950 sm:h-80 sm:w-80">
        <div className="absolute inset-0 animate-[spin_7s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(250,204,21,0.35)_10deg,transparent_24deg,transparent_360deg)]" />
        <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 shadow-[0_0_70px_22px_rgba(250,204,21,0.45)]">
          <Compass className="h-7 w-7 text-gray-950" />
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
          Faro
        </h1>
        <p className="mx-auto mt-3 max-w-md text-gray-600 dark:text-gray-400">
          Un punto de luz para pequeñas empresas que no quieren pagar de más por su
          infraestructura.
        </p>
      </div>

      <Link
        to={`${appPanel.path}/login`}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        Entrar
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
