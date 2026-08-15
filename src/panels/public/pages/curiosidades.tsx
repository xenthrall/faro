import { useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Curiosidades',
  icon: Sparkles,
  order: 20,
}

const facts = [
  'El primer faro del mundo, el Faro de Alejandría, fue una de las siete maravillas del mundo antiguo.',
  'Los faros modernos ya casi no necesitan un fanalero: la mayoría funciona de forma automática.',
  'El faro más alto del mundo mide más de 106 metros: el Faro de Jeddah, en Arabia Saudita.',
  'Antes de la electricidad, los faros usaban aceite de ballena, keroseno o gas para producir luz.',
  'La luz de un faro puede verse a más de 40 kilómetros de distancia en condiciones ideales.',
  'Cada faro tiene un patrón de destellos único, como una huella digital, para que los barcos lo identifiquen.',
]

export default function TriviaPage() {
  const [index, setIndex] = useState(0)

  function shuffle() {
    setIndex((current) => {
      if (facts.length <= 1) return current
      let next = Math.floor(Math.random() * facts.length)
      while (next === current) {
        next = Math.floor(Math.random() * facts.length)
      }
      return next
    })
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Curiosidades</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Datos random sobre faros, porque sí.
      </p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <p className="mt-4 text-lg text-gray-800 dark:text-gray-200">{facts[index]}</p>
      </div>

      <button
        type="button"
        onClick={shuffle}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        <RefreshCw className="h-4 w-4" />
        Otro dato
      </button>
    </div>
  )
}
