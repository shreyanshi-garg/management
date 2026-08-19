import { format } from 'date-fns'
import { ACCENT } from './Sidebar'
import { useSpace } from '../../context/SpaceContext'

const SECTION_META = {
  money:  { label: 'Money Management', emoji: '💰' },
  time:   { label: 'Time Management',  emoji: '⏳' },
  tasks:  { label: 'My Tasks',         emoji: '📝' },
  goals:  { label: 'My Goals',         emoji: '🎯' },
  health: { label: 'Health Tracker',   emoji: '🌿' },
}

export default function Header({ section }) {
  const { activeSpace } = useSpace()
  const meta = SECTION_META[section]
  const label = meta ? meta.label : `${activeSpace.name}'s Space`
  const emoji = meta ? meta.emoji : '🌸'
  const a = ACCENT[section] || ACCENT.dashboard
  const initial = activeSpace.name.charAt(0).toUpperCase()

  return (
    <header
      className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
      style={{
        background: 'rgba(255,249,251,0.78)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #F4EADC',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: a.light }}
        >
          {emoji}
        </span>
        <h1 className="text-[19px] font-semibold" style={{ color: '#4A3A30' }}>{label}</h1>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-sm" style={{ color: '#9C8877' }}>
          {format(new Date(), 'EEEE, MMM d')}
        </span>
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#FF9EBB,#C3A6E8)' }}
        >
          {initial}
        </span>
      </div>
    </header>
  )
}
