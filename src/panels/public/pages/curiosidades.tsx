import { useRef, useState } from 'react'
import { PartyPopper, Sparkles } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'
import { Footer } from '../components/Footer'

export const meta: PanelPageMeta = {
  label: 'Curiosidades',
  icon: Sparkles,
  order: 25,
}

type Mood = 'wow' | 'funny' | 'spooky' | 'proud'
type Fact = { text: string; mood: Mood; tag: string }

const facts: Fact[] = [
  {
    tag: 'Historia',
    mood: 'wow',
    text: 'El Faro de Alejandría fue una de las siete maravillas del mundo antiguo y estuvo de pie casi 1600 años, hasta que unos terremotos lo derrumbaron.',
  },
  {
    tag: 'Insólito',
    mood: 'funny',
    text: 'La Estatua de la Libertad fue un faro oficial durante 16 años. Tenía su propio farero y todo, pero alumbraba tan poco que la terminaron dando de baja.',
  },
  {
    tag: 'Misterio',
    mood: 'spooky',
    text: 'En 1900, los tres fareros de las islas Flannan desaparecieron sin dejar rastro. Nunca se encontraron los cuerpos ni se supo qué pasó.',
  },
  {
    tag: 'Oficio',
    mood: 'funny',
    text: 'En inglés a los fareros les decían "wickies", porque se pasaban el día recortando la mecha de la lámpara.',
  },
  {
    tag: 'Ingeniería',
    mood: 'wow',
    text: 'La lente Fresnel convierte una llama chiquita en un haz visible a decenas de kilómetros. Es de 1822 y sigue siendo brillante. Literal.',
  },
  {
    tag: 'Historia',
    mood: 'wow',
    text: 'Antes del queroseno, muchos faros funcionaban con aceite de ballena. O sea: el mar alumbraba al mar.',
  },
  {
    tag: 'Navegación',
    mood: 'wow',
    text: 'Cada faro tiene su propio patrón de destellos, como una huella digital. Los navegantes lo leen para saber exactamente dónde están.',
  },
  {
    tag: 'Récords',
    mood: 'proud',
    text: 'El faro más alto del mundo está en Yeda, Arabia Saudita: 133 metros, más o menos un edificio de 40 pisos.',
  },
  {
    tag: 'Historia',
    mood: 'proud',
    text: 'Boston Light se encendió por primera vez en 1716 y fue el último faro de Estados Unidos con farero de carne y hueso.',
  },
  {
    tag: 'Vida',
    mood: 'wow',
    text: 'Muchos fareros se mudaban con toda la familia. Hubo chicos que crecieron ahí, con el océano de patio y una escalera de caracol como pasillo.',
  },
  {
    tag: 'Extremo',
    mood: 'spooky',
    text: 'Algunos faros están construidos sobre rocas en mar abierto. En una tormenta, las olas rompen contra la linterna. A 40 metros de altura.',
  },
  {
    tag: 'Presente',
    mood: 'proud',
    text: 'Hoy casi todos los faros son automáticos. El oficio de farero prácticamente se extinguió, pero las luces siguen encendidas.',
  },
]

// ---------------------------------------------------------------------------
// Paco, el loro — reacciona a cada dato según su tono.
// ---------------------------------------------------------------------------

type CharacterMood = 'idle' | Mood

const MOOD_GLOW: Record<CharacterMood, string> = {
  idle: 'rgba(34, 197, 94, .28)',
  wow: 'rgba(56, 189, 248, .40)',
  funny: 'rgba(251, 191, 36, .40)',
  spooky: 'rgba(167, 139, 250, .40)',
  proud: 'rgba(16, 185, 129, .40)',
}

const MOOD_SHOUT: Record<Mood, string> = {
  wow: '¡Nooo, en serio!',
  funny: '¡Jajaja!',
  spooky: 'Uh... me da cosita.',
  proud: '¡Qué grande!',
}

function Brows({ mood }: { mood: CharacterMood }) {
  const stroke = { stroke: '#15803d', strokeWidth: 3, fill: 'none', strokeLinecap: 'round' } as const

  if (mood === 'wow') {
    return (
      <>
        <path d="M52 36 Q64 28 76 36" {...stroke} />
        <path d="M84 36 Q96 28 108 36" {...stroke} />
      </>
    )
  }
  if (mood === 'funny') {
    return (
      <>
        <path d="M54 40 Q64 34 74 39" {...stroke} />
        <path d="M86 39 Q96 34 106 40" {...stroke} />
      </>
    )
  }
  if (mood === 'spooky') {
    return (
      <>
        <path d="M54 45 L74 36" {...stroke} />
        <path d="M106 45 L86 36" {...stroke} />
      </>
    )
  }
  if (mood === 'proud') {
    return (
      <>
        <path d="M54 41 L74 38" {...stroke} />
        <path d="M106 41 L86 38" {...stroke} />
      </>
    )
  }
  return (
    <>
      <path d="M54 42 Q64 38 74 42" {...stroke} />
      <path d="M86 42 Q96 38 106 42" {...stroke} />
    </>
  )
}

function Eyes({ mood }: { mood: CharacterMood }) {
  if (mood === 'funny') {
    // Ojos cerrados de risa (^ ^)
    return (
      <>
        <path
          d="M54 60 Q64 48 74 60"
          stroke="#1c1917"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M86 60 Q96 48 106 60"
          stroke="#1c1917"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
      </>
    )
  }

  if (mood === 'wow') {
    return (
      <>
        <ellipse cx="64" cy="56" rx="13" ry="14" fill="#fff" />
        <ellipse cx="96" cy="56" rx="13" ry="14" fill="#fff" />
        <circle cx="64" cy="57" r="6" fill="#1c1917" />
        <circle cx="96" cy="57" r="6" fill="#1c1917" />
      </>
    )
  }

  if (mood === 'spooky') {
    return (
      <>
        <ellipse cx="64" cy="56" rx="12" ry="13" fill="#fff" />
        <ellipse cx="96" cy="56" rx="12" ry="13" fill="#fff" />
        <circle cx="64" cy="59" r="3.5" fill="#1c1917" />
        <circle cx="96" cy="59" r="3.5" fill="#1c1917" />
      </>
    )
  }

  if (mood === 'proud') {
    // Ojos entrecerrados, de suficiencia
    return (
      <>
        <ellipse cx="64" cy="56" rx="10" ry="7" fill="#fff" />
        <ellipse cx="96" cy="56" rx="10" ry="7" fill="#fff" />
        <circle cx="64" cy="56" r="5" fill="#1c1917" />
        <circle cx="96" cy="56" r="5" fill="#1c1917" />
      </>
    )
  }

  return (
    <>
      <ellipse cx="64" cy="56" rx="10" ry="11" fill="#fff" />
      <ellipse cx="96" cy="56" rx="10" ry="11" fill="#fff" />
      <circle cx="64" cy="57" r="5" fill="#1c1917" />
      <circle cx="96" cy="57" r="5" fill="#1c1917" />
    </>
  )
}

function Beak({ open }: { open: boolean }) {
  if (!open) {
    return (
      <>
        <path d="M68 74 Q80 70 92 74 Q89 94 80 99 Q71 94 68 74 Z" fill="#f97316" />
        <path
          d="M71 80 Q80 84 89 80"
          stroke="#c2410c"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </>
    )
  }
  return (
    <>
      <path d="M68 74 Q80 70 92 74 Q88 85 80 87 Q72 85 68 74 Z" fill="#f97316" />
      <ellipse cx="80" cy="94" rx="10" ry="9" fill="#7f1d1d" />
      <path d="M71 90 Q80 87 89 90 Q87 101 80 103 Q73 101 71 90 Z" fill="#fb923c" />
    </>
  )
}

function Parrot({ mood, reactionKey }: { mood: CharacterMood; reactionKey: number }) {
  const wingsUp = mood === 'wow' || mood === 'funny'
  const beakOpen = mood === 'wow' || mood === 'funny' || mood === 'spooky'

  return (
    <div className="relative flex h-44 w-44 shrink-0 items-center justify-center sm:h-52 sm:w-52">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-2xl transition-colors duration-500"
        style={{ backgroundColor: MOOD_GLOW[mood] }}
      />

      {/* Flotación continua — separada del pop para que no se corten entre sí. */}
      <div className="relative h-full w-full animate-[oracle-bob_3.4s_ease-in-out_infinite]">
        {/* `key` reinicia el pop en cada dato, aunque el humor se repita. */}
        <div key={reactionKey} className="h-full w-full animate-[oracle-pop_.6s_ease-out]">
          <svg viewBox="0 0 160 190" className="h-full w-full">
            {/* cola */}
            <path d="M80 130 L62 186 L80 174 L98 186 Z" fill="#15803d" />

            {/* alas */}
            <ellipse
              cx="40"
              cy="112"
              rx="14"
              ry="24"
              fill="#16a34a"
              style={{ transition: 'transform .35s ease-out' }}
              transform={wingsUp ? 'rotate(-42 40 112)' : 'rotate(-8 40 112)'}
            />
            <ellipse
              cx="120"
              cy="112"
              rx="14"
              ry="24"
              fill="#16a34a"
              style={{ transition: 'transform .35s ease-out' }}
              transform={wingsUp ? 'rotate(42 120 112)' : 'rotate(8 120 112)'}
            />

            {/* cuerpo */}
            <ellipse cx="80" cy="118" rx="42" ry="40" fill="#22c55e" />
            <ellipse cx="80" cy="126" rx="26" ry="28" fill="#4ade80" />

            {/* penacho */}
            <path d="M66 30 Q56 14 68 8 Q72 20 78 30 Z" fill="#f59e0b" />
            <path d="M80 28 Q77 6 88 4 Q88 18 91 28 Z" fill="#fbbf24" />
            <path d="M94 30 Q106 18 103 6 Q95 18 88 30 Z" fill="#f59e0b" />

            {/* cabeza */}
            <circle cx="80" cy="60" r="38" fill="#22c55e" />
            <circle cx="80" cy="66" r="27" fill="#bbf7d0" />

            <Brows mood={mood} />
            <Eyes mood={mood} />
            <Beak open={beakOpen} />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function TriviaPage() {
  const [current, setCurrent] = useState<number | null>(null)
  const [seen, setSeen] = useState<number[]>([])
  const [reactionId, setReactionId] = useState(0)
  // Bolsa barajada: no repite ningún dato hasta haber mostrado todos.
  const bagRef = useRef<number[]>([])

  function nextFact() {
    let pool = bagRef.current
    if (pool.length === 0) {
      pool = shuffle(facts.map((_, index) => index))
      // Evita que el primero de la bolsa nueva sea el que ya está en pantalla.
      if (pool[0] === current && pool.length > 1) {
        ;[pool[0], pool[1]] = [pool[1], pool[0]]
      }
    }

    const next = pool[0]
    bagRef.current = pool.slice(1)
    setCurrent(next)
    setSeen((prev) => (prev.includes(next) ? prev : [...prev, next]))
    setReactionId((id) => id + 1)
  }

  const fact = current === null ? null : facts[current]
  const mood: CharacterMood = fact ? fact.mood : 'idle'
  const complete = seen.length === facts.length
  const percent = Math.round((seen.length / facts.length) * 100)

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Curiosidades</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Paco el loro se pasó la vida en un faro. Preguntale y no para de hablar.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <button
            type="button"
            onClick={nextFact}
            aria-label="Pedirle otro dato a Paco"
            className="rounded-full transition-transform active:scale-95"
          >
            <Parrot mood={mood} reactionKey={reactionId} />
          </button>

          {/* Globo de diálogo */}
          <div className="relative w-full flex-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <span
              aria-hidden="true"
              className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-t border-l border-gray-200 bg-white sm:hidden dark:border-gray-800 dark:bg-gray-900"
            />
            <span
              aria-hidden="true"
              className="absolute top-10 -left-1.5 hidden h-3 w-3 rotate-45 border-b border-l border-gray-200 bg-white sm:block dark:border-gray-800 dark:bg-gray-900"
            />

            {fact ? (
              <div key={reactionId} className="animate-[oracle-pop_.45s_ease-out]">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-500/15 dark:text-amber-400">
                    {fact.tag}
                  </span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    {MOOD_SHOUT[fact.mood]}
                  </span>
                </div>
                <p className="mt-3 text-base text-gray-800 sm:text-lg dark:text-gray-200">
                  {fact.text}
                </p>
              </div>
            ) : (
              <p className="text-base text-gray-500 sm:text-lg dark:text-gray-400">
                ¿Sabías que...? Bueno, todavía no te conté nada. Tocame o apretá el botón.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={nextFact}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-gray-950 transition-all hover:bg-amber-300 active:scale-[0.98] sm:w-auto"
        >
          <Sparkles className="h-4 w-4" />
          {current === null ? 'Contame algo, Paco' : '¡Otro!'}
        </button>

        {/* Progreso — para que dé ganas de descubrirlos todos. */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Descubriste {seen.length} de {facts.length}
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          {complete ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <PartyPopper className="h-4 w-4" />
              ¡Los escuchaste todos! Paco se quedó sin anécdotas... por ahora.
            </p>
          ) : null}
        </div>
      </div>

      <Footer />
    </>
  )
}
