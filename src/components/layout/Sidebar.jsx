import { useState } from 'react'
import { useSpace } from '../../context/SpaceContext'
import { useAuth } from '../../context/AuthContext'
import SpaceSettingsModal from '../spaces/SpaceSettingsModal'
import Symbol from '../shared/Symbol'

const NAV = [
  { id: 'dashboard', emoji: '🌸', label: 'Home' },
  { id: 'money', emoji: '💰', label: 'Money' },
  { id: 'time', emoji: '⏳', label: 'Time' },
  { id: 'tasks', emoji: '📝', label: 'Tasks' },
  { id: 'goals', emoji: '🎯', label: 'Goals' },
  { id: 'health', emoji: '🌿', label: 'Health' },
]

export const ACCENT = {
  dashboard: { main: '#FF9EBB', deep: '#E5527A', light: '#FFF0F5' },
  money:     { main: '#FFC38B', deep: '#E09B4C', light: '#FFF6EC' },
  time:      { main: '#8FCFE0', deep: '#4A9EB8', light: '#EEFAFD' },
  tasks:     { main: '#FF9EBB', deep: '#E5527A', light: '#FFF0F5' },
  goals:     { main: '#C3A6E8', deep: '#9061C2', light: '#F7F0FF' },
  health:    { main: '#7FD8A0', deep: '#3FA968', light: '#EFFBF3' },
}

export function SpaceSwitcher({ compact = false }) {
  const { activeSpace, exitSpace } = useSpace()
  const { email, signOut } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  if (!activeSpace) return null

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <button
            onClick={exitSpace}
            className="flex items-center gap-1.5"
            title="Switch space"
          >
            <Symbol value={activeSpace.emoji} size={22} fallback="🌟" />
            <span className="text-[13px] font-semibold truncate max-w-[90px]" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>
              {activeSpace.name}
            </span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-base leading-none px-1 rounded-lg hover:bg-[#FFF0F5] transition-colors"
            title="Space settings"
            style={{ color: '#C9A07B' }}
          >
            ⚙
          </button>
          <button
            onClick={signOut}
            className="text-sm leading-none px-1 rounded-lg hover:bg-[#FFF0F5] transition-colors"
            title={`Sign out (${email})`}
            style={{ color: '#C9A07B' }}
          >
            ⏏
          </button>
        </div>
        {showSettings && (
          <SpaceSettingsModal space={activeSpace} onClose={() => setShowSettings(false)} />
        )}
      </>
    )
  }

  return (
    <>
      <div className="px-5 py-5 flex items-center gap-2.5">
        <Symbol value={activeSpace.emoji} size={26} className="floaty" fallback="🌟" />
        <div className="hidden md:flex flex-col flex-1 min-w-0">
          <p className="text-[15px] font-semibold truncate" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>
            {activeSpace.name}
          </p>
          <button
            onClick={exitSpace}
            className="text-[10px] tracking-[0.16em] uppercase text-left mt-0.5 hover:underline"
            style={{ color: '#C9A07B' }}
          >
            switch space ↩
          </button>
          <button
            onClick={signOut}
            title={email}
            className="text-[10px] tracking-[0.16em] uppercase text-left mt-0.5 hover:underline"
            style={{ color: '#C9A07B' }}
          >
            sign out ⏏
          </button>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-xl hover:bg-[#FFF0F5] transition-colors shrink-0"
          title="Space settings"
          style={{ color: '#C9A07B', fontSize: '15px' }}
        >
          ⚙
        </button>
      </div>
      {showSettings && (
        <SpaceSettingsModal space={activeSpace} onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}

/**
 * Mobile navigation. The 80px icon rail ate a fifth of a phone screen, so on
 * small viewports the same NAV items live in a thumb-reachable bottom bar.
 */
export function BottomNav({ active, onNavigate }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 safe-bottom"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid #F4EADC',
      }}
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
        {NAV.map(item => {
          const isActive = active === item.id
          const a = ACCENT[item.id]
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 rounded-2xl"
              style={isActive ? { background: a.light } : {}}
            >
              <span className={`text-[19px] leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.emoji}
              </span>
              <span
                className="text-[10px] leading-none truncate max-w-full"
                style={{ color: isActive ? a.deep : '#B5A28C', fontWeight: isActive ? 700 : 600 }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 z-20"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(14px)',
        borderRight: '1px solid #F4EADC',
      }}
    >
      <SpaceSwitcher />

      <nav className="flex flex-col gap-1.5 px-3 flex-1 mt-2">
        {NAV.map(item => {
          const isActive = active === item.id
          const a = ACCENT[item.id]
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left group"
              style={isActive
                ? { background: `linear-gradient(135deg, ${a.light}, #fff)`, boxShadow: `inset 0 0 0 1.5px ${a.main}55` }
                : {}}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ background: a.main }}
                />
              )}
              <span className={`text-xl shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.emoji}
              </span>
              <span
                className="hidden md:block text-sm transition-colors"
                style={{
                  color: isActive ? a.deep : '#9C8877',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="px-5 pb-6 hidden md:block">
        <div
          className="rounded-2xl px-3.5 py-3 text-center"
          style={{ background: 'linear-gradient(135deg,#FFF0F5,#F7F0FF)' }}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: '#9C8877' }}>
            You're doing great,<br />keep blooming 🌷
          </p>
        </div>
      </div>
    </aside>
  )
}
