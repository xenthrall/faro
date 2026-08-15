import { useState } from 'react'
import { Eye } from 'lucide-react'
import type { PanelPageMeta } from '@/ui/panel'

export const meta: PanelPageMeta = {
  label: 'El Oráculo',
  icon: Eye,
  order: 30,
}

const answers = [
  'El faro dice que sí.',
  'Las olas están confusas. Preguntá de nuevo.',
  'No es un buen momento para zarpar.',
  'Todo indica que sí, seguí adelante.',
  'El horizonte está despejado. Adelante.',
  'Mejor esperá a que baje la marea.',
  'Las estrellas no se ponen de acuerdo. Intentá mañana.',
  'Sin dudas: sí.',
]

type OracleState = 'idle' | 'thinking' | 'answered'

export default function OraclePage() {
  const [question, setQuestion] = useState('')
  const [state, setState] = useState<OracleState>('idle')
  const [answer, setAnswer] = useState('')

  function consult() {
    setState('thinking')
    window.setTimeout(() => {
      setAnswer(answers[Math.floor(Math.random() * answers.length)])
      setState('answered')
    }, 1200)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">El Oráculo</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Preguntale al faro lo que quieras saber.
      </p>

      <div className="mt-6 flex flex-col items-center gap-6 rounded-2xl bg-gray-950 px-6 py-10 text-center">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/20 transition-all ${
            state === 'thinking' ? 'animate-pulse' : ''
          }`}
        >
          <Eye
            className={`h-10 w-10 text-indigo-300 transition-transform ${state === 'thinking' ? 'scale-90' : ''}`}
          />
        </div>

        {state === 'answered' ? (
          <p className="max-w-sm text-lg text-white">{answer}</p>
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
  )
}
