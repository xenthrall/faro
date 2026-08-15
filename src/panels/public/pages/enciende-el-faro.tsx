import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'
import { Footer } from '../components/Footer'

export const meta: PanelPageMeta = {
  label: 'Enciende el Faro',
  icon: Lightbulb,
  order: 25,
}

// Silueta adaptada de src/assets/faro-vector.svg (isla, base, torre, linterna)
// con coordenadas propias para este viewBox — no es una copia 1:1, sino la
// misma idea de forma simplificada para esta escena interactiva.
export default function LighthouseControlPage() {
  const [hue, setHue] = useState(45)
  const [speed, setSpeed] = useState(6)
  const [on, setOn] = useState(true)

  const beamColor = `hsl(${hue} 90% 60% / .55)`
  const glowColor = `hsl(${hue} 90% 55%)`
  const ambientColor = `hsl(${hue} 90% 55% / .35)`

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Enciende el Faro</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Es tu turno de guiar los barcos. Ajustá el color y la velocidad del haz.
        </p>

        <section className="relative mt-6 flex h-96 items-end justify-center overflow-visible sm:h-[28rem]">
          {/* Resplandor ambiente: se derrama más allá del faro, hacia el fondo de la página. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-[background] duration-500"
            style={{
              background: on
                ? `radial-gradient(circle at 50% 32%, ${ambientColor} 0%, transparent 55%),
                   radial-gradient(circle at 50% 36%, rgba(6, 20, 35, .85) 0%, rgba(6, 20, 35, .35) 38%, transparent 72%)`
                : 'radial-gradient(circle at 50% 36%, rgba(6, 20, 35, .5) 0%, transparent 60%)',
            }}
          />

          {/* Haz giratorio: más grande que la escena, para que barra la página. */}
          {on ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[30%] h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: `spin-beam ${speed}s linear infinite`,
                backgroundImage: `conic-gradient(from 0deg, transparent 0deg, ${beamColor} 5deg, transparent 12deg, transparent 360deg)`,
              }}
            />
          ) : null}

          {/* Ilustración del faro */}
          <svg viewBox="0 0 200 260" className="relative h-full w-auto">
            <defs>
              <linearGradient id="page-tower-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c9ced0" />
                <stop offset="45%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#aeb5b9" />
              </linearGradient>
            </defs>

            {/* isla */}
            <path
              d="M14 232 C46 210 78 203 100 207 C124 202 158 212 186 233 L186 260 L14 260 Z"
              fill="#0c2941"
            />

            {/* base */}
            <path d="M78 195 L122 195 L131 211 L69 211 Z" fill="#d7d9d8" />
            <path d="M72 208 L128 208 L134 218 L66 218 Z" fill="#0a2135" />

            {/* torre */}
            <path d="M83 195 L91 90 L109 90 L117 195 Z" fill="url(#page-tower-gradient)" />
            <path d="M100 90 L104 195 L117 195 L109 90 Z" fill="#8f989d" opacity=".4" />

            {/* puerta */}
            <path
              d="M93 195 L93 175 Q93 168 100 168 Q107 168 107 175 L107 195 Z"
              fill="#061a2d"
            />

            {/* ventana */}
            <rect x="93.5" y="138" width="13" height="15" rx="2" fill="#061a2d" />
            <line x1="100" y1="140" x2="100" y2="151" stroke="#e6e9e9" strokeWidth="1" />

            {/* balcón */}
            <line x1="76" y1="87" x2="124" y2="87" stroke="#0a1e31" strokeWidth="4" />
            <line x1="78" y1="80" x2="122" y2="80" stroke="#d9dcda" strokeWidth="2.5" />

            {/* linterna */}
            <rect
              x="80"
              y="53"
              width="40"
              height="28"
              rx="3"
              fill="#0b2032"
              stroke="#d5d8d7"
              strokeWidth="2"
            />

            {/* lámpara — color dinámico según el hue elegido */}
            <rect
              x="86"
              y="58"
              width="28"
              height="19"
              rx="2"
              fill={glowColor}
              opacity={on ? 0.95 : 0.35}
              style={{ transition: 'opacity .3s, fill .3s' }}
            />

            {/* techo */}
            <path d="M77 55 L100 33 L123 55 Z" fill="#12283a" stroke="#d9dcdb" strokeWidth="2" />
            <path d="M88 41 L100 31 L112 41 Z" fill="#091a2b" />
            <line x1="100" y1="31" x2="100" y2="22" stroke="#d7dbd9" strokeWidth="2" />
            <circle cx="100" cy="21" r="2" fill="#d7dbd9" />
          </svg>
        </section>

        <div className="mt-6 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
            Color del haz
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(event) => setHue(Number(event.target.value))}
              className="accent-gray-900 dark:accent-white"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
            Velocidad de giro
            <input
              type="range"
              min={2}
              max={15}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="accent-gray-900 dark:accent-white"
            />
          </label>

          <button
            type="button"
            onClick={() => setOn((value) => !value)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {on ? 'Apagar' : 'Encender'}
          </button>
        </div>
      </div>

      <Footer />
    </>
  )
}
