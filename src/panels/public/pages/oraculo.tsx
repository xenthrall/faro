import { useState } from 'react'
import { Droplet, Eye, Sparkles } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'
import { Footer } from '../components/Footer'

export const meta: PanelPageMeta = {
  label: 'El Oráculo',
  icon: Eye,
  order: 15,
}

type AnswerMood = 'positive' | 'negative' | 'neutral'
type Answer = { text: string; mood: AnswerMood }

const answers: Answer[] = [
  { text: 'El faro dice que sí.', mood: 'positive' },
  { text: 'Las olas están confusas. Preguntá de nuevo.', mood: 'neutral' },
  { text: 'No es un buen momento para zarpar.', mood: 'negative' },
  { text: 'Todo indica que sí, seguí adelante.', mood: 'positive' },
  { text: 'El horizonte está despejado. Adelante.', mood: 'positive' },
  { text: 'Mejor esperá a que baje la marea.', mood: 'negative' },
  { text: 'Las estrellas no se ponen de acuerdo. Intentá mañana.', mood: 'neutral' },
  { text: 'Sin dudas: sí.', mood: 'positive' },
]

// ---------------------------------------------------------------------------
// Personaje del oráculo — un fantasmita simple que cambia de cara según el
// tono de la predicción, con un "pop" que se repite en cada consulta (aunque
// el humor se repita) gracias a `reactionKey`.
// ---------------------------------------------------------------------------

type CharacterMood = 'idle' | 'thinking' | AnswerMood

const MOOD_GLOW: Record<CharacterMood, string> = {
  idle: 'rgba(129, 140, 248, .35)',
  thinking: 'rgba(245, 158, 11, .35)',
  positive: 'rgba(16, 185, 129, .45)',
  negative: 'rgba(244, 63, 94, .35)',
  neutral: 'rgba(148, 163, 184, .35)',
}

function IdleFace() {
  return (
    <>
      <ellipse cx="58" cy="80" rx="10" ry="12" fill="#fff" />
      <ellipse cx="102" cy="80" rx="10" ry="12" fill="#fff" />
      <circle cx="58" cy="82" r="5" fill="#1e1b4b" />
      <circle cx="102" cy="82" r="5" fill="#1e1b4b" />
      <path d="M46 62 Q58 58 70 63" stroke="#4338ca" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M90 63 Q102 58 114 62" stroke="#4338ca" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M65 112 Q80 120 95 112" stroke="#312e81" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  )
}

function ThinkingFace() {
  return (
    <>
      <ellipse cx="58" cy="80" rx="10" ry="12" fill="#fff" />
      <ellipse cx="102" cy="80" rx="10" ry="12" fill="#fff" />
      <circle cx="61" cy="76" r="5" fill="#1e1b4b" />
      <circle cx="105" cy="76" r="5" fill="#1e1b4b" />
      <path d="M46 60 Q58 66 70 61" stroke="#4338ca" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M90 58 Q102 54 114 60" stroke="#4338ca" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="113" r="5" fill="none" stroke="#312e81" strokeWidth="3.5" />
    </>
  )
}

function PositiveFace() {
  return (
    <>
      <path d="M46 82 Q58 68 70 82" stroke="#1e1b4b" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M90 82 Q102 68 114 82" stroke="#1e1b4b" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M46 58 Q58 52 70 57" stroke="#4338ca" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M90 57 Q102 52 114 58" stroke="#4338ca" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M56 106 Q80 134 104 106 Q80 122 56 106 Z" fill="#312e81" />
    </>
  )
}

function NegativeFace() {
  return (
    <>
      <ellipse cx="58" cy="82" rx="10" ry="11" fill="#fff" />
      <ellipse cx="102" cy="82" rx="10" ry="11" fill="#fff" />
      <circle cx="58" cy="86" r="5" fill="#1e1b4b" />
      <circle cx="102" cy="86" r="5" fill="#1e1b4b" />
      <path d="M48 76 Q58 71 68 76 L68 78 Q58 74 48 78 Z" fill="#a5b4fc" />
      <path d="M92 76 Q102 71 112 76 L112 78 Q102 74 92 78 Z" fill="#a5b4fc" />
      <path d="M46 64 L70 70" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" />
      <path d="M114 64 L90 70" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" />
      <path d="M62 122 Q80 108 98 122" stroke="#312e81" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  )
}

function NeutralFace() {
  return (
    <>
      <ellipse cx="58" cy="80" rx="10" ry="12" fill="#fff" />
      <ellipse cx="102" cy="80" rx="10" ry="12" fill="#fff" />
      <circle cx="58" cy="80" r="5" fill="#1e1b4b" />
      <circle cx="102" cy="80" r="5" fill="#1e1b4b" />
      <path d="M46 66 Q58 63 70 66" stroke="#4338ca" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M90 58 L114 63" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M62 114 Q69 108 76 114 Q83 120 90 114 Q97 108 100 114"
        stroke="#312e81"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  )
}

function OracleCharacter({ mood, reactionKey }: { mood: CharacterMood; reactionKey: number }) {
  return (
    <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-2xl transition-colors duration-500"
        style={{ backgroundColor: MOOD_GLOW[mood] }}
      />

      {mood === 'thinking' ? (
        <div className="absolute -top-1 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400 [animation-delay:300ms]" />
        </div>
      ) : null}

      {mood === 'positive' ? (
        <Sparkles className="absolute -top-2 -right-1 z-10 h-6 w-6 text-amber-300" />
      ) : null}

      {mood === 'negative' ? (
        <Droplet className="absolute -top-1 -left-1 z-10 h-5 w-5 text-sky-300" />
      ) : null}

      {/* Flotación continua — no se remonta, así el pop de abajo no la corta. */}
      <div className="relative h-full w-full animate-[oracle-bob_3s_ease-in-out_infinite]">
        {/* `key` fuerza a reiniciar el pop en cada consulta, aunque el humor se repita. */}
        <div key={reactionKey} className="h-full w-full animate-[oracle-pop_.6s_ease-out]">
          <svg viewBox="0 0 160 170" className="h-full w-full">
            {/* brazos */}
            <ellipse cx="22" cy="98" rx="10" ry="16" fill="#818cf8" transform="rotate(-20 22 98)" />
            <ellipse cx="138" cy="98" rx="10" ry="16" fill="#818cf8" transform="rotate(20 138 98)" />

            {/* cuerpo */}
            <circle cx="80" cy="88" r="62" fill="#a5b4fc" />
            <circle cx="80" cy="88" r="62" fill="none" stroke="#818cf8" strokeWidth="2" opacity=".5" />

            {/* cara según el humor */}
            {mood === 'idle' && <IdleFace />}
            {mood === 'thinking' && <ThinkingFace />}
            {mood === 'positive' && <PositiveFace />}
            {mood === 'negative' && <NegativeFace />}
            {mood === 'neutral' && <NeutralFace />}
          </svg>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

type OracleState = 'idle' | 'thinking' | 'answered'

export default function OraclePage() {
  const [question, setQuestion] = useState('')
  const [state, setState] = useState<OracleState>('idle')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [reactionId, setReactionId] = useState(0)

  function consult() {
    setState('thinking')
    window.setTimeout(() => {
      setAnswer(answers[Math.floor(Math.random() * answers.length)])
      setState('answered')
      setReactionId((id) => id + 1)
    }, 1200)
  }

  const mood: CharacterMood =
    state === 'thinking' ? 'thinking' : state === 'answered' && answer ? answer.mood : 'idle'

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">El Oráculo</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Preguntale al faro lo que quieras saber.
        </p>

        <div className="mt-6 flex flex-col items-center gap-6 rounded-2xl bg-gray-950 px-6 py-10 text-center">
          <OracleCharacter mood={mood} reactionKey={reactionId} />

          {state === 'answered' && answer ? (
            <p className="max-w-sm text-lg text-white">{answer.text}</p>
          ) : (
            <p className="max-w-sm text-sm text-gray-400">
              {state === 'thinking' ? 'El faro está pensando...' : 'Esperando tu pregunta.'}
            </p>
          )}

          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Escribí tu pregunta (opcional)"
            className="w-full max-w-xs rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-center text-sm text-white outline-none focus:border-gray-500"
          />

          <button
            type="button"
            onClick={consult}
            disabled={state === 'thinking'}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Consultar al faro
          </button>
        </div>
      </div>

      <Footer />
    </>
  )
}
