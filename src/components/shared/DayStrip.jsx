import { format, subDays } from 'date-fns'
import { dayKey, parseDay } from '../../utils/date'

/**
 * Layers-style week strip: weekday initial above a round day pill.
 * `dotFor(key)` returns { done, total } so the strip can render its completion dot.
 */
export default function DayStrip({
  selected,
  onSelect,
  weekOffset = 0,
  onWeekChange,
  dotFor = () => ({ done: 0, total: 0 }),
  accent = '#E8703A',
  today = dayKey(),
}) {
  const days = Array.from({ length: 7 }, (_, i) =>
    dayKey(subDays(parseDay(today), 6 - i + weekOffset * 7))
  )

  return (
    <div className="soft-card rounded-3xl px-4 py-3.5">
      {onWeekChange && (
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={() => onWeekChange(weekOffset + 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
            style={{ background: '#FBF5EC', color: '#A6947F' }}
            aria-label="Previous week"
          >←</button>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#B5A28C' }}>
            {weekOffset === 0 ? 'This week' : `${weekOffset} week${weekOffset > 1 ? 's' : ''} ago`}
          </span>
          <button
            onClick={() => onWeekChange(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold disabled:opacity-30"
            style={{ background: '#FBF5EC', color: '#A6947F' }}
            aria-label="Next week"
          >→</button>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const { done, total } = dotFor(d)
          const isSel = d === selected
          const isToday = d === today
          const full = total > 0 && done === total

          return (
            <button
              key={d}
              onClick={() => onSelect?.(d)}
              className="flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all"
            >
              <span className="text-[10px] font-bold" style={{ color: isSel ? '#4A3A30' : '#B5A28C' }}>
                {format(parseDay(d), 'EEEEE')}
              </span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold transition-all"
                style={isSel
                  ? { background: `linear-gradient(140deg,${accent},#C4551F)`, color: '#fff', boxShadow: `0 6px 16px ${accent}45`, fontFamily: 'Fraunces, serif' }
                  : { background: isToday ? '#FDEEE4' : 'transparent', color: isToday ? '#C4551F' : '#4A3A30', fontFamily: 'Fraunces, serif' }}
              >
                {format(parseDay(d), 'd')}
              </span>
              <span className="h-2 flex items-center">
                {full
                  ? <span className="text-[8px]">⭐</span>
                  : done > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSel ? accent : '#DCCBB4' }} />
                  )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
