import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Anchor,
  ArrowUpToLine,
  Award,
  BookOpen,
  ChevronDown,
  TowerControl,
  Wind,
  Star,
} from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'
import { Footer } from '../components/Footer'

export const meta: PanelPageMeta = {
  label: 'Subí al Faro',
  icon: TowerControl,
  order: 30,
}

// ---------------------------------------------------------------------------
// "Subí al Faro" — un scroll narrativo: se sube la escalera en espiral del
// faro piso por piso, con algo para descubrir en cada uno, hasta llegar a la
// linterna. Cada piso se revela al entrar en pantalla y queda revelado
// (no se vuelve a ocultar si se retrocede) — es el patrón estándar de
// "scroll reveal". El medidor de altura de abajo a la derecha usa el mismo
// IntersectionObserver para saber cuál es el piso "actual".
// ---------------------------------------------------------------------------

const FLOORS = [
  'intro',
  'entrada',
  'almacen',
  'fanalero',
  'combustible',
  'balcon',
  'linterna',
] as const
type FloorId = (typeof FLOORS)[number]

function useFloorTracking(floorIds: readonly FloorId[]) {
  const refs = useRef<Partial<Record<FloorId, HTMLElement | null>>>({})
  const [revealed, setRevealed] = useState<Partial<Record<FloorId, boolean>>>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const ratios: Partial<Record<FloorId, number>> = {}
    const nodeToId = new Map<Element, FloorId>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = nodeToId.get(entry.target)
          if (!id) continue

          ratios[id] = entry.intersectionRatio

          if (entry.intersectionRatio > 0.15) {
            setRevealed((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
          }
        }

        let bestId: FloorId = floorIds[0]
        let bestRatio = -1
        for (const id of floorIds) {
          const ratio = ratios[id] ?? 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }
        setCurrentIndex(floorIds.indexOf(bestId))
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] },
    )

    for (const id of floorIds) {
      const node = refs.current[id]
      if (node) {
        observer.observe(node)
        nodeToId.set(node, id)
      }
    }

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function registerRef(id: FloorId) {
    return (node: HTMLElement | null) => {
      refs.current[id] = node
    }
  }

  return { registerRef, revealed, currentIndex }
}

function AltitudeGauge({ currentIndex }: { currentIndex: number }) {
  const total = FLOORS.length
  const percent = Math.round(((currentIndex + 1) / total) * 100)
  const meters = Math.round(((currentIndex + 1) / total) * 40)

  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-md sm:right-6 sm:bottom-6 dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-300">
      <ArrowUpToLine className="h-3.5 w-3.5 text-amber-500" />
      <span className="tabular-nums">{meters} m</span>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function Floor({
  id,
  registerRef,
  revealed,
  className = '',
  children,
}: {
  id: FloorId
  registerRef: (node: HTMLElement | null) => void
  revealed: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      ref={registerRef}
      data-floor={id}
      className={`flex min-h-[60vh] flex-col justify-center py-12 transition-all duration-700 ease-out ${
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Cositas para descubrir en el camino
// ---------------------------------------------------------------------------

function RevealButton({
  idleLabel,
  nextLabel,
  entries,
  icon: Icon,
}: {
  idleLabel: string
  nextLabel: string
  entries: string[]
  icon: typeof BookOpen
}) {
  const [index, setIndex] = useState<number | null>(null)

  function advance() {
    setIndex((current) => (current === null ? 0 : (current + 1) % entries.length))
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3 text-center">
      <button
        type="button"
        onClick={advance}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        <Icon className="h-4 w-4" />
        {index === null ? idleLabel : nextLabel}
      </button>

      {index !== null ? (
        <p
          key={index}
          className="max-w-sm animate-[oracle-pop_.5s_ease-out] text-sm text-gray-500 italic dark:text-gray-400"
        >
          {entries[index]}
        </p>
      ) : null}
    </div>
  )
}

const doormatJoke = 'Bienvenido... o no, depende de la marea.'

function DoormatJoke() {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="mt-5 flex flex-col items-center gap-3 text-center">
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        <Anchor className="h-4 w-4" />
        Pisar el felpudo
      </button>
      {revealed ? (
        <p className="max-w-sm animate-[oracle-pop_.5s_ease-out] text-sm text-gray-500 italic dark:text-gray-400">
          {doormatJoke}
        </p>
      ) : null}
    </div>
  )
}

const barrelJokes = [
  'Este barril dice "PÓLVORA" pero adentro solo hay papas.',
  'Alguien escribió "NO TOCAR" y después le dibujó una carita feliz.',
  'Huele a salmuera y a decisiones que tomó otro fanalero.',
]

const logEntries = [
  '"Noche 12: el mar estuvo tranquilo. Cebé mate y conté las olas."',
  '"Noche 87: una tormenta apagó la lámpara. La encendí de nuevo con las manos heladas."',
  '"Noche 203: un barco pasó tan cerca que saludé con la mano. No sé si me vieron."',
  '"Noche 340: encontré una gaviota durmiendo en el balcón. Le puse nombre: Capitán."',
]

const wishes = [
  'Concedido. El viento ya está de tu lado.',
  'Tu deseo zarpó esta misma noche.',
  'El faro lo guardó bajo la marea alta — se cumple cuando baje.',
  'Las gaviotas se lo llevaron volando. Buen viaje.',
  'Consultado con las estrellas: aprobado.',
  'Necesita un poco más de tiempo, pero va en camino.',
]

function WishMaker() {
  const [wish, setWish] = useState<string | null>(null)
  const [wishId, setWishId] = useState(0)

  function makeWish() {
    setWish(wishes[Math.floor(Math.random() * wishes.length)])
    setWishId((id) => id + 1)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={makeWish}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-medium text-gray-950 transition-colors hover:bg-amber-300"
      >
        <Star className="h-4 w-4" />
        Pedir un deseo
      </button>

      {wish ? (
        <p key={wishId} className="max-w-sm animate-[oracle-pop_.6s_ease-out] text-sm text-amber-200">
          {wish}
        </p>
      ) : null}
    </div>
  )
}

const birds = [
  { top: '18%', duration: '16s', delay: '0s' },
  { top: '48%', duration: '13s', delay: '3.5s' },
  { top: '70%', duration: '19s', delay: '7s' },
]

function Birds() {
  return (
    <div className="relative mt-6 h-28 w-full overflow-hidden">
      {birds.map((bird) => (
        <svg
          key={bird.top}
          viewBox="0 0 24 12"
          className="absolute h-3 w-6 text-gray-400 dark:text-gray-500"
          style={{
            top: bird.top,
            left: '-8%',
            animation: `fly-across ${bird.duration} linear infinite`,
            animationDelay: bird.delay,
          }}
        >
          <path
            d="M0 6 Q6 0 12 6 Q18 0 24 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function ClimbLighthousePage() {
  const { registerRef, revealed, currentIndex } = useFloorTracking(FLOORS)

  return (
    <>
      <AltitudeGauge currentIndex={currentIndex} />

      <Floor
        id="intro"
        registerRef={registerRef('intro')}
        revealed={revealed.intro ?? false}
        className="min-h-[45vh] items-center text-center"
      >
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-white">
          Subí al Faro
        </h1>
        <p className="mx-auto mt-3 max-w-md text-gray-600 dark:text-gray-400">
          40 metros de escalera en espiral te separan de la linterna. ¿Te animás?
        </p>
        <ChevronDown className="mx-auto mt-8 h-6 w-6 animate-bounce text-gray-400 dark:text-gray-500" />
      </Floor>

      <Floor id="entrada" registerRef={registerRef('entrada')} revealed={revealed.entrada ?? false}>
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">La entrada</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Una puerta de madera pesada, hinchada por la humedad, y escalones de piedra
            desgastados por cien años de botas mojadas.
          </p>
          <DoormatJoke />
        </div>
      </Floor>

      <Floor id="almacen" registerRef={registerRef('almacen')} revealed={revealed.almacen ?? false}>
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">El almacén</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Barriles apilados, cabos de soga enrollados y un traje de buzo antiguo que nadie
            se anima a mover.
          </p>
          <RevealButton
            idleLabel="Abrir un barril"
            nextLabel="Abrir otro"
            entries={barrelJokes}
            icon={Anchor}
          />
        </div>
      </Floor>

      <Floor id="fanalero" registerRef={registerRef('fanalero')} revealed={revealed.fanalero ?? false}>
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            La sala del fanalero
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Una silla mecedora, una estufa apagada y un diario de guardia sobre el escritorio,
            todavía abierto.
          </p>
          <RevealButton
            idleLabel="Abrir el diario"
            nextLabel="Pasar la página"
            entries={logEntries}
            icon={BookOpen}
          />
        </div>
      </Floor>

      <Floor
        id="combustible"
        registerRef={registerRef('combustible')}
        revealed={revealed.combustible ?? false}
      >
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            El depósito de combustible
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tanques de metal oxidado que alguna vez guardaron el queroseno de la lámpara.
            Hoy la luz es eléctrica — pero el olor a fuego viejo nunca se fue del todo.
          </p>
        </div>
      </Floor>

      <Floor id="balcon" registerRef={registerRef('balcon')} revealed={revealed.balcon ?? false}>
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">El balcón</h2>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Wind className="h-4 w-4 shrink-0" />
            Salís y el viento te despeina. Abajo, el mar. Arriba, gaviotas que no tienen
            apuro por ningún lado.
          </p>
          <Birds />
        </div>
      </Floor>

      <Floor
        id="linterna"
        registerRef={registerRef('linterna')}
        revealed={revealed.linterna ?? false}
        className="min-h-[75vh] items-center text-center"
      >
        <div className="relative mx-auto flex h-52 w-52 items-center justify-center overflow-hidden rounded-full bg-gray-950 sm:h-64 sm:w-64">
          <div
            className="absolute inset-0"
            style={{
              animation: 'spin-beam 5s linear infinite',
              backgroundImage:
                'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,.55) 8deg, transparent 20deg, transparent 170deg, rgba(251,191,36,.55) 178deg, transparent 190deg, transparent 360deg)',
            }}
          />
          <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 shadow-[0_0_60px_18px_rgba(251,191,36,0.45)]">
            <TowerControl className="h-6 w-6 text-gray-950" />
          </span>
        </div>

        <h2 className="mt-8 text-xl font-semibold text-gray-900 dark:text-white">
          ¡Llegaste a la cima!
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600 dark:text-gray-400">
          Desde acá se ve todo: el pueblo, los barcos, el horizonte entero. Antes de bajar,
          tenés derecho a un deseo.
        </p>

        <div className="mt-6">
          <WishMaker />
        </div>

        <div className="mx-auto mt-10 flex max-w-xs items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left dark:border-gray-800 dark:bg-gray-900">
          <Award className="h-8 w-8 shrink-0 text-amber-500" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Subiste 40 metros y encendiste el faro. No está mal para una tarde.
          </p>
        </div>
      </Floor>

      <Footer />
    </>
  )
}
