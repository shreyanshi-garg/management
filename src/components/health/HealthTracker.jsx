import { useState } from 'react'
import { Plus, Trash2, LayoutGrid, List } from 'lucide-react'
import EmojiPicker from '../shared/EmojiPicker'
import { format } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { useHabitStats, parseDay } from '../../hooks/useHabitStats'
import { celebrate } from '../shared/CelebrationToast'
import SectionHero from '../shared/SectionHero'
import ProgressRing from '../shared/ProgressRing'
import DayStrip from '../shared/DayStrip'
import PillButton from '../shared/PillButton'
import HabitRow from './HabitRow'
import HabitRings from './HabitRings'
import HealthStats from './HealthStats'

const TERRA = '#E8703A'
const TERRA_DEEP = '#C4551F'
const MINT_DEEP = '#3FA968'

const inputStyle = { background: '#FBF5EC', border: '1.5px solid #F0E6D8' }

function AddHabitInline({ category, onAdd }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [show, setShow] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const save = () => {
    if (label.trim()) {
      onAdd(label.trim(), category, { emoji })
      setLabel(''); setEmoji('✨'); setShow(false); setShowPicker(false)
    }
  }

  if (!show) return (
    <button onClick={() => setShow(true)}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-colors"
      style={{ color: '#B5A28C', border: '1.5px dashed #EDDFC9' }}>
      <Plus size={14} /> Add your own habit
    </button>
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setShowPicker(p => !p)}
          className="w-11 h-[42px] rounded-2xl text-xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
          style={{ background: '#FBF5EC', border: showPicker ? '1.5px solid #E8703A' : '1.5px solid #F0E6D8' }}>
          {emoji}
        </button>
        <input autoFocus value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setShow(false); setShowPicker(false) } }}
          placeholder="Name your habit…"
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium" style={inputStyle} />
        <PillButton onClick={save} color={TERRA} deep={TERRA_DEEP}>Add</PillButton>
      </div>
      {showPicker && (
        <EmojiPicker selected={emoji} onSelect={e => { setEmoji(e); setShowPicker(false) }} />
      )}
    </div>
  )
}

export default function HealthTracker() {
  const { health, getHealthDay, toggleHabit, setProtein, addHabit, deleteHabit, todayKey } = useApp()
  const [view, setView] = useState('today')
  const [layout, setLayout] = useState('list')
  const [activeTab, setActiveTab] = useState('food')
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [weekOffset, setWeekOffset] = useState(0)

  const { byId, bestStreak } = useHabitStats(30)

  const day = getHealthDay(selectedDate)
  const habits = health.habits || []
  const currentHabits = habits.filter(h => h.category === activeTab)
  const protein = day.nutrition?.protein || 0

  const doneAll = habits.filter(h => day.habits[h.id]).length
  const pct = habits.length ? Math.round((doneAll / habits.length) * 100) : 0

  const handleToggle = (habitId) => {
    const wasChecked = day.habits[habitId]
    toggleHabit(habitId, selectedDate)
    if (!wasChecked) {
      const nowDone = currentHabits.filter(h => h.id !== habitId && day.habits[h.id]).length + 1
      if (nowDone === currentHabits.length) {
        celebrate(`All ${activeTab} habits done! 🌟`, activeTab === 'food' ? '🥗' : '💪', true)
      } else {
        celebrate('Look after yourself 💗', activeTab === 'food' ? '🍓' : '🧘‍♀️')
      }
    }
  }

  const dotFor = (key) => {
    const log = health.log[key] || { habits: {} }
    return { done: habits.filter(h => log.habits[h.id]).length, total: habits.length }
  }

  const jumpToDay = (key) => {
    if (key > todayKey) return
    setSelectedDate(key)
    setWeekOffset(0)
    setView('today')
  }

  const TABS = [
    { id: 'food', label: 'Food', emoji: '🥗' },
    { id: 'physical', label: 'Movement', emoji: '🧘‍♀️' },
  ]

  const VIEWS = [
    { id: 'today', label: 'Today' },
    { id: 'stats', label: 'Stats' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
      {/* Summary */}
      <SectionHero
        gradient="linear-gradient(120deg,#FFF1E2 0%,#FDF3EA 55%,#F1FBF4 100%)"
        blob="#FFD0AE"
        border="#F6E4D2"
        emoji="🌿"
      >
        <div className="flex items-center gap-4">
          <ProgressRing value={pct} size={72} stroke={7} color={TERRA} track="#ffffffcc">
            <span className="text-[13px] font-bold" style={{ color: TERRA_DEEP }}>{pct}%</span>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <p className="text-[19px] font-semibold" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
              {doneAll} of {habits.length} habits
            </p>
            <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: '#B08662' }}>
              {format(parseDay(selectedDate), 'EEEE, MMM d')}
              {selectedDate === todayKey && ' · today'}
            </p>
            {pct === 100 && habits.length > 0 && (
              <p className="text-[12px] font-bold mt-1" style={{ color: MINT_DEEP }}>A perfect day, well done 🌸</p>
            )}
            {bestStreak && pct < 100 && (
              <p className="text-[12px] font-bold mt-1" style={{ color: TERRA_DEEP }}>
                🔥 {bestStreak.streak}-day streak on “{bestStreak.label}”
              </p>
            )}
          </div>
        </div>
      </SectionHero>

      {/* Today / Stats */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 p-1 rounded-full" style={{ background: '#FBF5EC' }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="px-5 py-2 rounded-full text-[12.5px] font-bold transition-all"
              style={view === v.id
                ? { background: '#fff', color: TERRA_DEEP, boxShadow: '0 2px 10px rgba(150,115,80,0.12)' }
                : { color: '#B5A28C' }}>
              {v.label}
            </button>
          ))}
        </div>

        {view === 'today' && (
          <button onClick={() => setLayout(l => (l === 'list' ? 'rings' : 'list'))}
            className="ml-auto w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: '#FBF5EC', color: '#9C8877' }}
            aria-label={layout === 'list' ? 'Switch to ring view' : 'Switch to list view'}>
            {layout === 'list' ? <LayoutGrid size={15} /> : <List size={15} />}
          </button>
        )}
      </div>

      {view === 'stats' ? (
        <HealthStats onSelectDay={jumpToDay} />
      ) : (
        <div className="space-y-4 fade-up">
          <DayStrip
            selected={selectedDate}
            onSelect={setSelectedDate}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
            dotFor={dotFor}
            accent={TERRA}
            today={todayKey}
          />

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2.5">
            {TABS.map(t => {
              const isActive = activeTab === t.id
              const tHabits = habits.filter(h => h.category === t.id)
              const tDone = tHabits.filter(h => day.habits[h.id]).length
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-3xl transition-all"
                  style={isActive
                    ? { background: 'linear-gradient(140deg,#FDEEE4,#fff)', boxShadow: `inset 0 0 0 2px ${TERRA}, 0 6px 18px ${TERRA}30` }
                    : { background: 'rgba(255,255,255,0.7)', border: '1px solid #F4EADC' }}>
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-[13px] font-bold" style={{ color: isActive ? TERRA_DEEP : '#9C8877' }}>
                    {t.label}
                  </span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: isActive ? '#fff' : '#FBF5EC', color: isActive ? TERRA_DEEP : '#B5A28C' }}>
                    {tDone}/{tHabits.length}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Protein (food tab) */}
          {activeTab === 'food' && (
            <div className="soft-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[15px] flex items-center gap-2"
                  style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
                  🍓 Protein today
                </p>
                <span className="text-[12px] font-bold" style={{ color: protein >= 60 ? MINT_DEEP : '#B5A28C' }}>
                  {protein >= 60 ? 'Goal hit! 🌟' : `${Math.max(0, 60 - protein)}g to go`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" min="0" value={protein || ''}
                  onChange={e => setProtein(e.target.value, selectedDate)}
                  className="w-24 rounded-2xl px-4 py-2.5 text-sm font-bold text-center" style={inputStyle} placeholder="0" />
                <span className="text-[12px] font-bold" style={{ color: '#9C8877' }}>grams</span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#F6EFE4' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (protein / 60) * 100)}%`, background: `linear-gradient(90deg,${TERRA},#7FD8A0)` }} />
                </div>
                <span className="text-[11px] font-bold shrink-0" style={{ color: '#B5A28C' }}>60g</span>
              </div>
            </div>
          )}

          {/* Habits */}
          <div className="soft-card rounded-3xl p-5 space-y-2.5">
            <p className="font-semibold text-[15px] mb-1" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
              {activeTab === 'food' ? '🥗 Food habits' : '🧘‍♀️ Movement habits'}
            </p>

            {layout === 'list'
              ? currentHabits.map((h, i) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  index={habits.indexOf(h)}
                  checked={!!day.habits[h.id]}
                  streak={byId[h.id]?.streak ?? 0}
                  onToggle={() => handleToggle(h.id)}
                  isLast={i === currentHabits.length - 1}
                />
              ))
              : currentHabits.length > 0 && (
                <HabitRings
                  habits={currentHabits}
                  isChecked={id => !!day.habits[id]}
                  rateFor={id => byId[id]?.rate ?? 0}
                  streakFor={id => byId[id]?.streak ?? 0}
                  onToggle={handleToggle}
                />
              )}

            {currentHabits.length === 0 && (
              <p className="text-[13px] text-center py-5 font-semibold" style={{ color: '#B5A28C' }}>
                No habits here yet — add one below 🌱
              </p>
            )}

            <div className="pt-2">
              <AddHabitInline category={activeTab} onAdd={addHabit} />
            </div>

            {currentHabits.some(h => !h.isDefault) && (
              <div className="pt-2 space-y-1" style={{ borderTop: '1px solid #F4EADC' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider pt-2 px-1" style={{ color: '#DCCBB4' }}>
                  Your custom habits
                </p>
                {currentHabits.filter(h => !h.isDefault).map(h => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-1.5 rounded-xl group hover:bg-[#FBF5EC]">
                    <span className="text-[12px] font-semibold" style={{ color: '#9C8877' }}>{h.emoji} {h.label}</span>
                    <button onClick={() => deleteHabit(h.id)}
                      className="opacity-0 group-hover:opacity-100" style={{ color: '#DCCBB4' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
