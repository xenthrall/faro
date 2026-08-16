const STORAGE_KEY = 'faro:aprender:vistas'

function readSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    // Modo privado, cuota agotada, etc. — el progreso simplemente no
    // persiste; no es un error que deba interrumpir la lectura.
    return new Set()
  }
}

/** Lecciones que el usuario ya abrió al menos una vez, en este navegador. */
export function getSeenLessons(): Set<string> {
  return readSeen()
}

export function markLessonSeen(slug: string): void {
  const seen = readSeen()
  if (seen.has(slug)) return
  seen.add(slug)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
  } catch {
    // Ídem: si no se puede guardar, seguimos sin el checklist persistente.
  }
}
