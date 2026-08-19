import { useState, useRef, useEffect } from 'react'
import { useSpace } from '../../context/SpaceContext'

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

function SpaceSwitcher() {
  const { activeSpace, spaces, switchSpace, addSpace } = useSpace()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setAdding(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addSpace(name, newEmoji.trim() || '🌟')
    setNewName('')
    setNewEmoji('')
    setAdding(false)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative px-5 py-6">
      <button
        onClick={() => { setOpen(o => !o); setAdding(false) }}
        className="flex items-center gap-2.5 w-full text-left"
      >
        <span className="text-2xl floaty">{activeSpace.emoji}</span>
        <div className="hidden md:block leading-none">
          <p style={{ fontFamily: 'Fraunces, serif' }} className="text-[15px] font-semibold text-[#4A3A30]">
            {activeSpace.name}
          </p>
          <p className="text-[10px] tracking-[0.18em] uppercase mt-1" style={{ color: '#C9A07B' }}>
            my space ▾
          </p>
        </div>
      </button>

      {open && (
        <div
          className="absolute left-4 top-full mt-1 z-50 rounded-2xl shadow-lg overflow-hidden min-w-[180px]"
          style={{ background: '#fff', border: '1px solid #F4EADC' }}
        >
          {spaces.map(space => (
            <button
              key={space.id}
              onClick={() => { switchSpace(space.id); setOpen(false) }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left hover:bg-[#FFF0F5] transition-colors"
            >
              <span className="text-lg">{space.emoji}</span>
              <span className="text-sm font-medium text-[#4A3A30] flex-1">{space.name}</span>
              {space.id === activeSpace.id && (
                <span className="text-[#E5527A] text-xs">✓</span>
              )}
            </button>
          ))}

          <div className="border-t border-[#F4EADC]">
            {adding ? (
              <div className="px-4 py-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    placeholder="🌟"
                    className="w-10 text-center border border-[#F4EADC] rounded-lg text-sm px-1 py-1 outline-none"
                  />
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Name"
                    className="flex-1 border border-[#F4EADC] rounded-lg text-sm px-2 py-1 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 text-xs font-semibold py-1 rounded-lg text-white"
                    style={{ background: '#E5527A' }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="flex-1 text-xs py-1 rounded-lg"
                    style={{ color: '#9C8877' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-[#FFF0F5] transition-colors"
              >
                <span className="text-base text-[#C9A07B]">+</span>
                <span className="text-sm text-[#C9A07B]">Add space</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside
      className="flex flex-col w-20 md:w-60 shrink-0 h-screen sticky top-0 z-20"
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
