import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Enciende el Faro',
  icon: Lightbulb,
  order: 25,
}

export default function LighthouseControlPage() {
  const [hue, setHue] = useState(45)
  const [speed, setSpeed] = useState(6)
  const [on, setOn] = useState(true)

  const beamColor = `hsl(${hue} 90% 55% / 0.4)`
  const glowColor = `hsl(${hue} 90% 55%)`

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Enciende el Faro</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Es tu turno de guiar los barcos. Ajustá el color y la velocidad del haz.
      </p>

      <div className="relative mt-6 flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-gray-950 sm:h-80">
        {on ? (
          <div
            className="absolute inset-0"
            style={{
              animation: `spin-beam ${speed}s linear infinite`,
              backgroundImage: `conic-gradient(from 0deg, transparent 0deg, ${beamColor} 10deg, transparent 24deg, transparent 360deg)`,
            }}
          />
        ) : null}
        <span
          className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-shadow"
          style={{
            backgroundColor: on ? glowColor : '#374151',
            boxShadow: on ? `0 0 70px 22px ${beamColor}` : 'none',
          }}
        >
          <Lightbulb className="h-7 w-7 text-gray-950" />
        </span>
      </div>

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
  )
}
