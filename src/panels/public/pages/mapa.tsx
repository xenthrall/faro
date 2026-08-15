import { useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Compass, MapPin, PartyPopper } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'
import { Footer } from '../components/Footer'

export const meta: PanelPageMeta = {
  label: 'El Mapa',
  icon: MapPin,
  order: 20,
}

// El agujero de luz es más grande que el radio de descubrimiento: primero
// alcanzás a ver la silueta, y recién si te acercás, la criatura despierta.
const LANTERN_RADIUS = 105
const DISCOVERY_RADIUS = 72

// ---------------------------------------------------------------------------
// Criaturas escondidas en la carta náutica
// ---------------------------------------------------------------------------

type Creature = {
  id: string
  name: string
  message: string
  /** Posición en porcentaje del contenedor, para que escale con el ancho. */
  x: number
  y: number
  bob: string
  art: () => React.ReactElement
}

function Island() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <path d="M8 50 Q32 36 56 50 L56 58 L8 58 Z" fill="#fcd34d" />
      <path d="M32 49 Q29 35 34 25" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="25" cy="22" rx="10" ry="4.5" fill="#22c55e" transform="rotate(-22 25 22)" />
      <ellipse cx="43" cy="22" rx="10" ry="4.5" fill="#16a34a" transform="rotate(22 43 22)" />
      <ellipse cx="34" cy="15" rx="4.5" ry="9" fill="#22c55e" />
      <circle cx="34" cy="26" r="2.5" fill="#78350f" />
    </svg>
  )
}

function Whale() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <path d="M22 24 Q21 13 26 8" stroke="#bfdbfe" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="27" cy="6" r="2.5" fill="#bfdbfe" />
      <path d="M48 34 L62 25 L60 45 Z" fill="#3b82f6" />
      <ellipse cx="29" cy="39" rx="22" ry="14" fill="#3b82f6" />
      <ellipse cx="30" cy="44" rx="16" ry="8" fill="#93c5fd" />
      <circle cx="17" cy="35" r="3.5" fill="#fff" />
      <circle cx="17" cy="35" r="1.8" fill="#1e3a8a" />
      <path d="M11 41 Q17 45 23 42" stroke="#1e3a8a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Octopus() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <path d="M17 40 Q12 53 19 59" stroke="#a855f7" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M26 44 Q23 56 30 61" stroke="#a855f7" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M38 44 Q41 56 34 61" stroke="#a855f7" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M47 40 Q52 53 45 59" stroke="#a855f7" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="27" r="19" fill="#a855f7" />
      <ellipse cx="25" cy="25" rx="5.5" ry="6.5" fill="#fff" />
      <ellipse cx="39" cy="25" rx="5.5" ry="6.5" fill="#fff" />
      <circle cx="25" cy="26" r="2.8" fill="#2e1065" />
      <circle cx="39" cy="26" r="2.8" fill="#2e1065" />
      <path d="M27 35 Q32 39 37 35" stroke="#581c87" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Mermaid() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <circle cx="32" cy="21" r="13" fill="#fb923c" />
      <circle cx="32" cy="22" r="9" fill="#fed7aa" />
      <circle cx="29" cy="21" r="1.6" fill="#1c1917" />
      <circle cx="35" cy="21" r="1.6" fill="#1c1917" />
      <path d="M29 26 Q32 29 35 26" stroke="#9a3412" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M27 31 L37 31 L36 44 L28 44 Z" fill="#5eead4" />
      <path d="M28 44 Q21 56 32 62 Q43 56 36 44 Z" fill="#10b981" />
      <path d="M32 57 L23 64 L32 59 L41 64 Z" fill="#059669" />
    </svg>
  )
}

function Shipwreck() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <g transform="rotate(-14 32 42)">
        <path d="M13 40 L51 40 L45 57 L19 57 Z" fill="#92400e" />
        <path d="M13 40 L51 40 L50 45 L14 45 Z" fill="#b45309" />
        <path d="M32 40 L30 12" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 16 L46 23 L30 31 Z" fill="#e7e5e4" />
      </g>
      <circle cx="16" cy="22" r="2.5" fill="#7dd3fc" opacity=".7" />
      <circle cx="22" cy="14" r="1.8" fill="#7dd3fc" opacity=".6" />
      <circle cx="48" cy="18" r="2" fill="#7dd3fc" opacity=".6" />
    </svg>
  )
}

function Crab() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <path d="M14 44 L6 50 M18 48 L12 56 M50 44 L58 50 M46 48 L52 56" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      <circle cx="11" cy="35" r="7.5" fill="#dc2626" />
      <circle cx="53" cy="35" r="7.5" fill="#dc2626" />
      <path d="M26 29 L23 20 M38 29 L41 20" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="39" rx="17" ry="12.5" fill="#ef4444" />
      <circle cx="23" cy="18" r="4.5" fill="#fff" />
      <circle cx="23" cy="18" r="2.2" fill="#1c1917" />
      <circle cx="41" cy="18" r="4.5" fill="#fff" />
      <circle cx="41" cy="18" r="2.2" fill="#1c1917" />
      <path d="M25 42 Q32 47 39 42" stroke="#7f1d1d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

const CREATURES: Creature[] = [
  {
    id: 'isla',
    name: 'La isla',
    message: '¡Tierra a la vista! Una isla con una sola palmera, un coco y cero wifi.',
    x: 20,
    y: 26,
    bob: '3.2s',
    art: Island,
  },
  {
    id: 'ballena',
    name: 'La ballena',
    message: 'Una ballena te saluda con el chorro. Dice que el agua está fresca, pero se banca.',
    x: 71,
    y: 22,
    bob: '4s',
    art: Whale,
  },
  {
    id: 'naufragio',
    name: 'El naufragio',
    message: 'Un barco hundido hace un siglo. Adentro hay un cofre... lleno de facturas viejas.',
    x: 51,
    y: 47,
    bob: '5s',
    art: Shipwreck,
  },
  {
    id: 'pulpo',
    name: 'El pulpo',
    message: 'Un pulpo con ocho brazos y ninguna excusa para no ayudarte a remar.',
    x: 79,
    y: 70,
    bob: '3.6s',
    art: Octopus,
  },
  {
    id: 'sirena',
    name: 'La sirena',
    message: 'Una sirena canta desafinado. Igual funciona: casi chocás contra las rocas.',
    x: 31,
    y: 71,
    bob: '4.4s',
    art: Mermaid,
  },
  {
    id: 'cangrejo',
    name: 'El cangrejo',
    message: 'Un cangrejo gigante camina de costado. Como todos, pero este está muy orgulloso.',
    x: 11,
    y: 56,
    bob: '3s',
    art: Crab,
  },
]

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function CompassRose() {
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 text-sky-300/25">
      <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="21" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M40 6 L45 40 L40 74 L35 40 Z" fill="currentColor" />
      <path d="M6 40 L40 35 L74 40 L40 45 Z" fill="currentColor" opacity=".6" />
    </svg>
  )
}

export default function TreasureMapPage() {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const [found, setFound] = useState<string[]>([])
  const [last, setLast] = useState<Creature | null>(null)
  const [reactionId, setReactionId] = useState(0)

  function handlePointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    setPointer({ x, y })

    for (const creature of CREATURES) {
      if (found.includes(creature.id)) continue

      const dx = x - (creature.x / 100) * rect.width
      const dy = y - (creature.y / 100) * rect.height
      if (Math.hypot(dx, dy) < DISCOVERY_RADIUS) {
        setFound((prev) => (prev.includes(creature.id) ? prev : [...prev, creature.id]))
        setLast(creature)
        setReactionId((id) => id + 1)
        break
      }
    }
  }

  function revealAll() {
    setFound(CREATURES.map((creature) => creature.id))
    setLast(null)
  }

  const complete = found.length === CREATURES.length
  const percent = Math.round((found.length / CREATURES.length) * 100)

  const fog = pointer
    ? `radial-gradient(circle at ${pointer.x}px ${pointer.y}px, transparent 0px, transparent ${LANTERN_RADIUS}px, rgba(4, 13, 24, .93) ${LANTERN_RADIUS + 60}px)`
    : 'rgba(4, 13, 24, .93)'

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">El Mapa</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Una carta náutica a oscuras. Movés la linterna y vas viendo qué hay ahí abajo.
        </p>

        <div
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setPointer(null)}
          className="relative mt-6 h-[26rem] touch-none overflow-hidden rounded-2xl bg-[#0b1e33] select-none sm:h-[32rem]"
        >
          {/* Cuadrícula de la carta */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(125, 211, 252, .13) 1px, transparent 1px), linear-gradient(to bottom, rgba(125, 211, 252, .13) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />

          <div aria-hidden="true" className="absolute top-4 right-4">
            <CompassRose />
          </div>

          {/* Criaturas todavía no encontradas: sólo se ven a través de la linterna. */}
          {CREATURES.filter((creature) => !found.includes(creature.id)).map((creature) => (
            <div
              key={creature.id}
              className="pointer-events-none absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 opacity-80"
              style={{
                left: `${creature.x}%`,
                top: `${creature.y}%`,
                animation: `oracle-bob ${creature.bob} ease-in-out infinite`,
              }}
            >
              <creature.art />
            </div>
          ))}

          {/* Niebla con el agujero de luz siguiendo al puntero. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: fog }}
          />

          {/* Halo cálido de la linterna, por encima de la niebla. */}
          {pointer ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,.18)_0%,transparent_70%)]"
              style={{ left: pointer.x, top: pointer.y }}
            />
          ) : null}

          {/* Ya encontradas: quedan visibles para siempre, sobre la niebla. */}
          {CREATURES.filter((creature) => found.includes(creature.id)).map((creature) => (
            <div
              key={creature.id}
              className="pointer-events-none absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${creature.x}%`,
                top: `${creature.y}%`,
                animation: `oracle-bob ${creature.bob} ease-in-out infinite`,
              }}
            >
              <div
                key={last?.id === creature.id ? reactionId : 'still'}
                className={last?.id === creature.id ? 'animate-[oracle-pop_.6s_ease-out]' : ''}
              >
                <creature.art />
              </div>
            </div>
          ))}

          {/* Pista inicial */}
          {pointer === null && found.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-sky-100 backdrop-blur-sm">
                <Compass className="h-4 w-4" />
                Deslizá el dedo o movés el mouse para alumbrar
              </p>
            </div>
          ) : null}
        </div>

        {/* Bitácora del hallazgo */}
        <div className="mt-4 min-h-20 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          {last ? (
            <div key={reactionId} className="animate-[oracle-pop_.45s_ease-out]">
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-sky-700 uppercase dark:bg-sky-500/15 dark:text-sky-400">
                {last.name}
              </span>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{last.message}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Todavía no encontraste nada. Hay {CREATURES.length} criaturas escondidas ahí abajo.
            </p>
          )}
        </div>

        {/* Progreso */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Encontraste {found.length} de {CREATURES.length}
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          {complete ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <PartyPopper className="h-4 w-4" />
              ¡Mapa completo! No quedó nadie escondido.
            </p>
          ) : (
            <button
              type="button"
              onClick={revealAll}
              className="mt-3 text-xs font-medium text-gray-500 underline-offset-4 hover:underline dark:text-gray-400"
            >
              Encender todo el mapa
            </button>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
