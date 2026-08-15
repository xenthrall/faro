import { useEffect, useRef, useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'Reflejos',
  icon: Gamepad2,
  order: 10,
}

type GameState = 'idle' | 'waiting' | 'ready' | 'tooSoon' | 'result'

export default function ReflexGamePage() {
  const [state, setState] = useState<GameState>('idle')
  const [reactionMs, setReactionMs] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const timeoutRef = useRef<number | undefined>(undefined)
  const startedAtRef = useRef(0)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  function start() {
    setState('waiting')
    setReactionMs(null)
    const delay = 1000 + Math.random() * 2500
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
      setReactionMs(elapsed)
      setBest((prev) => (prev === null ? elapsed : Math.min(prev, elapsed)))
      setState('result')
      return
    }
    start()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reflejos</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Esperá el verde y tocá lo más rápido que puedas.
      </p>

      <button
        type="button"
        onClick={handleTap}
        className={`mt-6 flex h-56 w-full items-center justify-center rounded-2xl text-lg font-medium transition-colors sm:h-72 ${
          state === 'ready'
            ? 'bg-emerald-500 text-white'
            : state === 'waiting'
              ? 'bg-red-500 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
        }`}
      >
        {state === 'idle' && 'Tocá para empezar'}
        {state === 'waiting' && 'Esperá...'}
        {state === 'ready' && '¡YA!'}
        {state === 'tooSoon' && 'Muy pronto — tocá para reintentar'}
        {state === 'result' && `${reactionMs} ms — tocá para reintentar`}
      </button>

      {best !== null ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Mejor tiempo: {best} ms</p>
      ) : null}
    </div>
  )
}
