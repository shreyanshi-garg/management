import ProgressRing from '../shared/ProgressRing'
import { habitColor } from './habitPalette'

/**
 * Streaks-style grid: one circular tile per habit, the ring showing its 30-day rate.
 */
export default function HabitRings({ habits, isChecked, rateFor, streakFor, onToggle }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {habits.map((h, i) => {
        const c = habitColor(h, i)
        const checked = isChecked(h.id)
        return (
          <button
            key={h.id}
            onClick={() => onToggle(h.id)}
            className="flex flex-col items-center gap-2 py-5 px-3 rounded-3xl transition-all hover:scale-[1.03]"
            style={checked
              ? { background: c.light, boxShadow: `inset 0 0 0 1.5px ${c.main}66` }
              : { background: '#FBF5EC' }}
          >
            <ProgressRing
              value={rateFor(h.id)}
              size={78}
              stroke={7}
              color={c.main}
              track={checked ? '#ffffff' : '#F0E6D8'}
            >
              <span className="text-[26px]">{h.emoji}</span>
            </ProgressRing>

            <span
              className="text-[12.5px] font-bold text-center leading-tight line-clamp-2"
              style={{ color: checked ? c.deep : '#4A3A30' }}
            >
              {h.label}
            </span>
            <span className="text-[10.5px] font-bold" style={{ color: '#B5A28C' }}>
              {streakFor(h.id) > 0 ? `🔥 ${streakFor(h.id)}d` : `${rateFor(h.id)}% this month`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
