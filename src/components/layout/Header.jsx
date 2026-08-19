import { format } from 'date-fns'
import { ACCENT, SpaceSwitcher } from './Sidebar'
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
      className="sticky top-0 z-10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3"
      style={{
        background: 'rgba(255,249,251,0.78)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #F4EADC',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-base md:text-lg shrink-0"
          style={{ background: a.light }}
        >
          {emoji}
        </span>
        <h1 className="text-[16px] md:text-[19px] font-semibold truncate" style={{ color: '#4A3A30' }}>{label}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden lg:block text-sm" style={{ color: '#9C8877' }}>
          {format(new Date(), 'EEEE, MMM d')}
        </span>
        {/* The sidebar (and its space switcher) is hidden on phones — surface it here. */}
        <div className="md:hidden">
          <SpaceSwitcher compact />
        </div>
        <span
          className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#FF9EBB,#C3A6E8)' }}
        >
          {initial}
        </span>
      </div>
    </header>
  )
}
