import { CalendarRange } from 'lucide-react'
import {
  RANGE_PRESETS,
  describeRange,
  type DateRange,
  type RangePresetId,
} from '@/lib/date-ranges'
import { controlClassName } from '@/ui/components'

export type RangeFilterProps = {
  preset: RangePresetId
  onPresetChange: (preset: RangePresetId) => void
  custom: { from: string; to: string }
  onCustomChange: (custom: { from: string; to: string }) => void
  range: DateRange
}

/**
 * Selector de período. Los presets cubren lo que se consulta a diario — hoy,
 * la semana, el mes — y el rango personalizado queda para lo demás, sin
 * ocupar espacio hasta que se elige.
 *
 * Los controles van en una sola fila sobre los gráficos: filtrar y ver el
 * resultado no debería exigir desplazarse.
 */
export function RangeFilter({
  preset,
  onPresetChange,
  custom,
  onCustomChange,
  range,
}: RangeFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarRange className="h-4 w-4 shrink-0 text-gray-400" />

        {/* Los presets frecuentes quedan a un clic en pantallas anchas; en
            móvil colapsan en el mismo <select> para no comerse la pantalla. */}
        <div className="hidden flex-wrap gap-1 lg:flex">
          {RANGE_PRESETS.filter((item) => item.id !== 'custom').map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPresetChange(item.id)}
              aria-pressed={preset === item.id}
              className={[
                'rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                preset === item.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPresetChange('custom')}
            aria-pressed={preset === 'custom'}
            className={[
              'rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
              preset === 'custom'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            ].join(' ')}
          >
            Personalizado
          </button>
        </div>

        <select
          value={preset}
          onChange={(event) => onPresetChange(event.target.value as RangePresetId)}
          aria-label="Período"
          className={`${controlClassName} lg:hidden`}
        >
          {RANGE_PRESETS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <span className="ml-auto hidden text-xs text-gray-500 sm:block dark:text-gray-400">
          {describeRange(range)}
        </span>
      </div>

      {preset === 'custom' ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Desde</span>
            <input
              type="date"
              value={custom.from}
              max={custom.to}
              onChange={(event) => onCustomChange({ ...custom, from: event.target.value })}
              className={`${controlClassName} w-auto`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Hasta</span>
            <input
              type="date"
              value={custom.to}
              min={custom.from}
              onChange={(event) => onCustomChange({ ...custom, to: event.target.value })}
              className={`${controlClassName} w-auto`}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
