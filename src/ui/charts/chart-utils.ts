/**
 * Escalas y ejes de los gráficos.
 *
 * Todos los gráficos del panel se dibujan con HTML y CSS, no con SVG ni con una
 * librería: las formas que necesita un panel administrativo (columnas apiladas
 * y barras horizontales) son porcentajes dentro de un contenedor, así que el
 * layout ya las resuelve — y de paso quedan responsivas y con texto nítido sin
 * medir el ancho en JavaScript.
 */

/**
 * Redondea el máximo a un valor "redondo" (1, 2, 2.5 o 5 × 10ⁿ) para que las
 * marcas del eje caigan en cifras legibles y no en 3.847.
 */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

/** Marcas del eje, de 0 al máximo, incluidas ambas puntas. */
export function axisTicks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, index) => (max / count) * index)
}

/** Porcentaje seguro: nunca divide por cero ni devuelve NaN. */
export function percentOf(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}
