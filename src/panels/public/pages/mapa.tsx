import { useState } from 'react'
import { MapPin, Sparkles } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'El Mapa',
  icon: MapPin,
  order: 15,
}

type Spot = { id: string; top: string; left: string; message: string }

const spots: Spot[] = [
  {
    id: 'a',
    top: '18%',
    left: '20%',
    message: 'Acá se escondía el primer prototipo de Faro. Tenía un solo botón y ya andaba raro.',
  },
  {
    id: 'b',
    top: '55%',
    left: '72%',
    message: 'Un desarrollador dejó este comentario en el código: "no tocar, funciona por magia".',
  },
  {
    id: 'c',
    top: '75%',
    left: '22%',
    message: 'Cuenta la leyenda que acá se guarda el café que mantiene vivo este proyecto.',
  },
  {
    id: 'd',
    top: '28%',
    left: '78%',
    message: 'Si llegaste hasta acá, ya sos parte de la tripulación. Bienvenido a bordo.',
  },
]

export default function TreasureMapPage() {
  const [found, setFound] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<Spot | null>(null)

  function reveal(spot: Spot) {
    setActive(spot)
    setFound((prev) => new Set(prev).add(spot.id))
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">El Mapa</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Tocá las marcas para descubrir qué esconde cada una. {found.size}/{spots.length}{' '}
        encontradas.
      </p>

      <div className="relative mt-6 h-80 overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50 bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(180,83,9,0.15),transparent_55%)] dark:border-amber-900/40 dark:bg-gray-900">
        {spots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => reveal(spot)}
            style={{ top: spot.top, left: spot.left }}
            className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed text-lg font-bold transition-transform hover:scale-110 ${
              found.has(spot.id)
                ? 'border-amber-500 bg-amber-400 text-white'
                : 'border-amber-400 bg-white text-amber-600 dark:bg-gray-800'
            }`}
          >
            ×
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-16 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {active ? (
          <p className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            {active.message}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Elegí una marca del mapa...</p>
        )}
      </div>
    </div>
  )
}
