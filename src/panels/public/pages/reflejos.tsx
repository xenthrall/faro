import { useEffect, useRef, useState } from 'react'
import { Gamepad2, RadioTower, Zap } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'
import { Footer } from '../components/Footer'

export const meta: PanelPageMeta = {
  label: 'Reflejos',
  icon: Gamepad2,
  order: 10,
}

const cardClassName =
  'flex flex-col rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900'

function ChallengeHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap
  title: string
  description: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reto 1 — Reflejos: tocar apenas el botón se pone verde.
// ---------------------------------------------------------------------------

type ReactionState = 'idle' | 'waiting' | 'ready' | 'tooSoon' | 'result'

function ReactionChallenge() {
  const [state, setState] = useState<ReactionState>('idle')
  const [lastMs, setLastMs] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<number[]>([])
  const timeoutRef = useRef<number | undefined>(undefined)
  const startedAtRef = useRef(0)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  function start() {
    setState('waiting')
    const delay = 900 + Math.random() * 2400
    timeoutRef.current = window.setTimeout(() => {
      startedAtRef.current = performance.now()
      setState('ready')
    }, delay)
  }

  function handleTap() {
    if (state === 'waiting') {
      window.clearTimeout(timeoutRef.current)
      setState('tooSoon')
      return
    }
    if (state === 'ready') {
      const elapsed = Math.round(performance.now() - startedAtRef.current)
      setLastMs(elapsed)
      setAttempts((prev) => [...prev, elapsed])
      setState('result')
      return
    }
    start()
  }

  const best = attempts.length ? Math.min(...attempts) : null
  const average = attempts.length
    ? Math.round(attempts.reduce((sum, value) => sum + value, 0) / attempts.length)
    : null

  return (
    <div className={cardClassName}>
      <ChallengeHeader
        icon={Zap}
        title="Reto 1 · Reflejos"
        description="Esperá el verde y tocá lo más rápido que puedas."
      />

      <button
        type="button"
        onClick={handleTap}
        className={`mt-5 flex h-48 w-full items-center justify-center rounded-2xl text-lg font-medium transition-all duration-150 active:scale-[0.98] sm:h-56 ${
          state === 'ready'
            ? 'bg-emerald-500 text-white shadow-[0_0_40px_-6px_rgba(16,185,129,0.6)]'
            : state === 'waiting'
              ? 'bg-red-500 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
        }`}
      >
        {state === 'idle' && 'Tocá para empezar'}
        {state === 'waiting' && 'Esperá...'}
        {state === 'ready' && '¡YA!'}
        {state === 'tooSoon' && 'Muy pronto — tocá para reintentar'}
        {state === 'result' && `${lastMs} ms — tocá para reintentar`}
      </button>

      <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Mejor: {best ?? '—'} ms</span>
        <span>Promedio: {average ?? '—'} ms</span>
        <span>Intentos: {attempts.length}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reto 2 — Código de señales: repetir la secuencia de destellos del faro,
// que crece una señal por ronda (estilo Simon).
// ---------------------------------------------------------------------------

const SIGNALS = [
  { id: 'n', label: 'N' },
  { id: 'e', label: 'E' },
  { id: 's', label: 'S' },
  { id: 'o', label: 'O' },
] as const
type SignalId = (typeof SIGNALS)[number]['id']

type MemoryPhase = 'idle' | 'showing' | 'input' | 'locked' | 'gameover'
type Feedback = { type: 'correct' | 'success' | 'wrong'; signal: SignalId | null } | null

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function randomSignal(): SignalId {
  return SIGNALS[Math.floor(Math.random() * SIGNALS.length)].id
}

function MemoryChallenge() {
  const [sequence, setSequence] = useState<SignalId[]>([])
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<MemoryPhase>('idle')
  const [lit, setLit] = useState<SignalId | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [best, setBest] = useState(0)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
    }
  }, [])

  async function playSequence(seq: SignalId[]) {
    setPhase('showing')
    for (const signal of seq) {
      if (cancelledRef.current) return
      setLit(signal)
      await wait(450)
      if (cancelledRef.current) return
      setLit(null)
      await wait(200)
    }
    if (cancelledRef.current) return
    setStep(0)
    setPhase('input')
  }

  function start() {
    setFeedback(null)
    const first = [randomSignal()]
    setSequence(first)
    void playSequence(first)
  }

  async function handlePress(signal: SignalId) {
    if (phase !== 'input') return

    const correct = signal === sequence[step]

    if (!correct) {
      setFeedback({ type: 'wrong', signal: null })
      setPhase('locked')
      await wait(650)
      if (cancelledRef.current) return
      setFeedback(null)
      setBest((prev) => Math.max(prev, sequence.length - 1))
      setPhase('gameover')
      return
    }

    const isLastStep = step + 1 === sequence.length

    setFeedback({ type: isLastStep ? 'success' : 'correct', signal })
    setPhase('locked')
    await wait(isLastStep ? 600 : 220)
    if (cancelledRef.current) return
    setFeedback(null)

    if (isLastStep) {
      const next = [...sequence, randomSignal()]
      setSequence(next)
      void playSequence(next)
      return
    }

    setStep((current) => current + 1)
    setPhase('input')
  }

  function signalClassName(signal: SignalId): string {
    if (feedback?.type === 'wrong') {
      return 'bg-red-500 text-white shadow-[0_0_30px_-4px_rgba(239,68,68,0.75)]'
    }
    if (feedback?.type === 'success') {
      return 'bg-emerald-500 text-white shadow-[0_0_30px_-4px_rgba(16,185,129,0.75)]'
    }
    if (feedback?.type === 'correct' && feedback.signal === signal) {
      return 'bg-emerald-400 text-white shadow-[0_0_30px_-4px_rgba(52,211,153,0.75)]'
    }
    if (lit === signal) {
      return 'bg-amber-400 text-gray-950 shadow-[0_0_30px_-4px_rgba(251,191,36,0.7)]'
    }
    return 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300 disabled:hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:active:bg-gray-600 dark:disabled:hover:bg-gray-800'
  }

  const round = Math.max(sequence.length - 1, 0)

  return (
    <div className={cardClassName}>
      <ChallengeHeader
        icon={RadioTower}
        title="Reto 2 · Código de señales"
        description="Memorizá y repetí el destello del faro. Cada ronda suma una señal más."
      />

      <div className="mt-5 grid grid-cols-2 gap-3">
        {SIGNALS.map((signal) => (
          <button
            key={signal.id}
            type="button"
            onClick={() => void handlePress(signal.id)}
            disabled={phase !== 'input'}
            className={`flex h-24 touch-manipulation items-center justify-center rounded-xl text-2xl font-semibold transition-all duration-150 select-none active:scale-95 sm:h-28 ${signalClassName(signal.id)}`}
          >
            {signal.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {phase === 'idle' && 'Tocá "Empezar" para ver la primera señal.'}
          {phase === 'showing' && 'Mirá con atención...'}
          {phase === 'input' && `Repetí la secuencia (ronda ${round + 1})`}
          {phase === 'locked' && feedback?.type === 'correct' && 'Correcto, seguí...'}
          {phase === 'locked' && feedback?.type === 'success' && '¡Ronda completa!'}
          {phase === 'locked' && feedback?.type === 'wrong' && '¡Fallaste!'}
          {phase === 'gameover' && `Fallaste en la ronda ${round + 1}. Tocá reiniciar.`}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">Mejor ronda: {best}</span>
        <button
          type="button"
          onClick={start}
          disabled={phase === 'showing' || phase === 'locked'}
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {phase === 'idle' ? 'Empezar' : 'Reiniciar'}
        </button>
      </div>
    </div>
  )
}

export default function ReflexGamePage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reflejos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Dos retos para poner a prueba tus reflejos y tu memoria.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReactionChallenge />
          <MemoryChallenge />
        </div>
      </div>

      <Footer />
    </>
  )
}
