import { format, addMonths, subMonths, isAfter } from 'date-fns'
import { monthMatrix, dayKey } from '../../hooks/useHabitStats'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * Month dot grid — each day's dot grows and deepens with how much of that day was done.
 */
export default function MonthCalendar({
  log,
  habits,
  month,
  onMonthChange,
  accent = '#E8703A',
  onSelectDay,
  today = dayKey(),
}) {
  const cells = monthMatrix(log, habits, month)
  const atCurrentMonth = !isAfter(new Date(), addMonths(month, 1)) &&
    format(month, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  return (
    <div className="soft-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange?.(subMonths(month, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
          style={{ background: '#FBF5EC', color: '#A6947F' }}
          aria-label="Previous month"
        >←</button>
        <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
          {format(month, 'MMMM yyyy')}
        </p>
        <button
          onClick={() => onMonthChange?.(addMonths(month, 1))}
          disabled={atCurrentMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold disabled:opacity-30"
          style={{ background: '#FBF5EC', color: '#A6947F' }}
          aria-label="Next month"
        >→</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[10px] font-bold text-center" style={{ color: '#C6B49F' }}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(c => {
          const ratio = c.total ? c.done / c.total : 0
          const isToday = c.key === today
          return (
            <button
              key={c.key}
              onClick={() => onSelectDay?.(c.key)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105"
              style={{
                background: isToday ? '#FDEEE4' : 'transparent',
                boxShadow: isToday ? `inset 0 0 0 1.5px ${accent}` : 'none',
                opacity: c.inMonth ? 1 : 0.3,
              }}
            >
              <span className="text-[11px] font-bold" style={{ color: '#9C8877' }}>
                {format(c.date, 'd')}
              </span>
              <span
                className="rounded-full transition-all"
                style={{
                  width: ratio > 0 ? 5 + ratio * 4 : 4,
                  height: ratio > 0 ? 5 + ratio * 4 : 4,
                  background: ratio > 0 ? accent : '#F0E6D8',
                  opacity: ratio > 0 ? 0.35 + ratio * 0.65 : 1,
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
