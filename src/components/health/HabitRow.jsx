import { Check, Clock } from 'lucide-react'
import { habitColor } from './habitPalette'

/**
 * Layers-style habit row: round check + timeline connector, colored icon tile,
 * label with its streak underneath, optional duration chip.
 */
export default function HabitRow({ habit, index = 0, checked, streak = 0, onToggle, isLast = false }) {
  const c = habitColor(habit, index)

  return (
    <div className="relative flex items-stretch gap-3">
      {/* check + connector */}
      <div className="flex flex-col items-center pt-4 shrink-0">
        <button
          onClick={onToggle}
          aria-label={`${checked ? 'Undo' : 'Complete'} ${habit.label}`}
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all hover:scale-110 shrink-0"
          style={checked
            ? { background: `linear-gradient(135deg,${c.main},${c.deep})`, boxShadow: `0 3px 10px ${c.main}55` }
            : { background: '#fff', boxShadow: 'inset 0 0 0 2px #E7DAC7' }}
        >
          {checked && <Check size={13} strokeWidth={3.5} color="#fff" />}
        </button>
        {!isLast && <div className="w-[2px] flex-1 mt-1.5 rounded-full" style={{ background: '#F0E6D8' }} />}
      </div>

      {/* card */}
      <button
        onClick={onToggle}
        className="flex-1 min-w-0 flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all hover:scale-[1.01] mb-2"
        style={checked
          ? { background: c.light, boxShadow: `inset 0 0 0 1.5px ${c.main}66` }
          : { background: '#FBF5EC' }}
      >
        <span
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-[19px] shrink-0"
          style={{ background: checked ? '#fff' : c.light }}
        >
          {habit.emoji}
        </span>

        <span className="flex-1 min-w-0">
          <span
            className={`block text-[13.5px] font-bold truncate ${checked ? 'line-through decoration-[1.5px]' : ''}`}
            style={{ color: checked ? c.deep : '#4A3A30' }}
          >
            {habit.label}
          </span>
          <span className="block text-[11px] font-semibold mt-0.5" style={{ color: streak > 0 ? c.deep : '#B5A28C' }}>
            {streak > 0 ? `🔥 Streak ${streak} day${streak > 1 ? 's' : ''}` : 'No streak yet'}
          </span>
        </span>

        {habit.minutes && (
          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
            style={{ background: '#fff', color: '#9C8877' }}
          >
            <Clock size={11} /> {habit.minutes} min
          </span>
        )}
      </button>
    </div>
  )
}
