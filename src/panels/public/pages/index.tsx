import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router'
import { appPanel } from '@/panels/app'
import type { PanelPageMeta } from '@/ui/panel'
import { FaroLogo } from '@/ui/components/FaroLogo'
import { FaroWordmark } from '@/ui/components/FaroWordmark'
import { Footer } from '../components/Footer'
import { ExplorePages } from '../ExplorePages'

export const meta: PanelPageMeta = {
  label: 'Inicio',
  icon: Compass,
  order: 0,
}

export default function HomePage() {
  return (
    <>
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <FaroLogo className="w-full max-w-[280px] sm:max-w-[340px]" />
        <FaroWordmark className="h-10 sm:h-12" />

        <p className="mx-auto max-w-md text-gray-600 dark:text-gray-400">
          Un punto de luz para pequeñas empresas que no quieren pagar de más por su
          infraestructura.
        </p>

        <Link
          to={`${appPanel.path}/login`}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Entrar
          <ArrowRight className="h-4 w-4" />
        </Link>

        <ExplorePages />
      </div>

      <Footer />
    </>
  )
}
