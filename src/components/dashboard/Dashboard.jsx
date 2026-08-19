import { format } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { useSpace } from '../../context/SpaceContext'
import { useHabitStats } from '../../hooks/useHabitStats'
import { celebrate } from '../shared/CelebrationToast'
import ProgressRing from '../shared/ProgressRing'
import DayStrip from '../shared/DayStrip'
import HabitRow from '../health/HabitRow'

const SECTIONS = [
  { id: 'money',  emoji: '💰', label: 'Money',  sub: 'Balance & expenses', main: '#FFC38B', deep: '#E09B4C', light: '#FFF6EC' },
  { id: 'time',   emoji: '⏳', label: 'Time',   sub: 'Schedule & timers',  main: '#8FCFE0', deep: '#4A9EB8', light: '#EEFAFD' },
  { id: 'tasks',  emoji: '📝', label: 'Tasks',  sub: 'Work, home & more',  main: '#FF9EBB', deep: '#E5527A', light: '#FFF0F5' },
  { id: 'goals',  emoji: '🎯', label: 'Goals',  sub: 'Dreams & milestones',main: '#C3A6E8', deep: '#9061C2', light: '#F7F0FF' },
  { id: 'health', emoji: '🌿', label: 'Health', sub: 'Food & movement',    main: '#7FD8A0', deep: '#3FA968', light: '#EFFBF3' },
]

const QUOTES = [
  'Small steps still move you forward 🌷',
  'You are allowed to take up space 💫',
  'Progress over perfection, always 🌸',
  'Be soft with yourself today 🤍',
  'You are becoming her, slowly 🌙',
]

const TERRA = '#E8703A'
const TERRA_DEEP = '#C4551F'

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return { text: 'Still up', emoji: '🌙' }
  if (h < 12) return { text: 'Good morning', emoji: '🌅' }
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' }
  if (h < 21) return { text: 'Good evening', emoji: '🌇' }
  return { text: 'Good night', emoji: '🌙' }
}

export default function Dashboard({ onNavigate }) {
  const { money, timeBlocks, tasks, goals, health, todayKey, toggleHabit } = useApp()
  const { activeSpace } = useSpace()
  const { byId, bestStreak } = useHabitStats(30)

  const spent = money.expenses.reduce((s, e) => s + e.amount, 0)
  const income = money.month.salary + money.month.additional
  const left = income - spent

  const todayBlocks = timeBlocks.filter(b => b.date === todayKey).length
  const openTasks = tasks.filter(t => t.status !== 'done').length
  const doneTasks = tasks.filter(t => t.status === 'done').length

  const day = health.log[todayKey] || { habits: {} }
  const allHabits = health.habits || []
  const habitsDone = allHabits.filter(h => day.habits[h.id]).length
  const habitPct = allHabits.length ? Math.round((habitsDone / allHabits.length) * 100) : 0

  const goalsDone = goals.filter(g => g.milestones.length > 0 && g.milestones.every(m => m.done)).length
  const goalPct = goals.length ? Math.round((goalsDone / goals.length) * 100) : 0
  const taskPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0

  const summaries = {
    money:  income ? `₹${left.toLocaleString('en-IN')} left this month` : 'Add your income to start',
    time:   `${todayBlocks} block${todayBlocks !== 1 ? 's' : ''} scheduled today`,
    tasks:  openTasks ? `${openTasks} task${openTasks !== 1 ? 's' : ''} pending` : 'All caught up! ✨',
    goals:  goals.length ? `${goalsDone}/${goals.length} goals achieved` : 'Dream something up 🌟',
    health: allHabits.length ? `${habitsDone}/${allHabits.length} habits done today` : 'Start tracking today',
  }

  // The nudge card picks whatever most wants her attention right now.
  const nudge = openTasks > 0
    ? { emoji: '📝', title: `${openTasks} task${openTasks !== 1 ? 's' : ''} waiting for you`, cta: 'Open tasks', to: 'tasks' }
    : habitsDone < allHabits.length
      ? { emoji: '🌿', title: `${allHabits.length - habitsDone} habit${allHabits.length - habitsDone !== 1 ? 's' : ''} left today`, cta: 'Tick them off', to: 'health' }
      : { emoji: '🌟', title: 'Everything is done today', cta: 'See your stats', to: 'health' }

  const g = greeting()
  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  const dotFor = (key) => {
    const log = health.log[key] || { habits: {} }
    return { done: allHabits.filter(h => log.habits[h.id]).length, total: allHabits.length }
  }

  const routine = allHabits.slice(0, 4)

  const handleToggle = (habitId) => {
    const wasChecked = day.habits[habitId]
    toggleHabit(habitId, todayKey)
    if (!wasChecked) celebrate('Look after yourself 💗', '🌷')
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      {/* Greeting */}
      <div className="flex items-center gap-4 px-1 pt-1">
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold tracking-wide" style={{ color: '#B08662' }}>
            {g.text} {g.emoji}
          </p>
          <h2 className="text-[30px] md:text-[36px] leading-tight font-semibold mt-0.5" style={{ color: '#4A3A30' }}>
            {activeSpace?.name}
          </h2>
          <p className="text-[12px] mt-1.5 font-semibold" style={{ color: '#B5A28C' }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 floaty"
          style={{ background: `linear-gradient(135deg,${TERRA},#FFC38B)`, fontFamily: 'Fraunces, serif' }}
        >
          {activeSpace?.name?.[0]?.toUpperCase()}
        </div>
      </div>

      <DayStrip selected={todayKey} onSelect={() => onNavigate('health')} dotFor={dotFor} accent={TERRA} today={todayKey} />

      {/* Nudge */}
      <button
        onClick={() => onNavigate(nudge.to)}
        className="w-full text-left relative overflow-hidden rounded-3xl px-5 py-4 flex items-center gap-4 transition-all hover:scale-[1.01]"
        style={{ background: 'linear-gradient(120deg,#FFF1E2 0%,#FDEBDD 100%)', border: '1px solid #F6E4D2' }}
      >
        <div className="absolute -top-8 -right-4 w-28 h-28 rounded-full opacity-40 blur-2xl" style={{ background: '#FFD0AE' }} />
        <span className="text-3xl floaty relative shrink-0">{nudge.emoji}</span>
        <div className="relative flex-1 min-w-0">
          <p className="font-semibold text-[16px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
            {nudge.title}
          </p>
          <p className="text-[12px] mt-0.5 font-semibold" style={{ color: '#B08662' }}>{quote}</p>
        </div>
        <span
          className="relative shrink-0 px-4 py-2 rounded-full text-[12px] font-bold text-white"
          style={{ background: `linear-gradient(135deg,${TERRA},${TERRA_DEEP})`, boxShadow: `0 6px 16px ${TERRA}45` }}
        >
          {nudge.cta}
        </span>
      </button>

      {/* Daily routine */}
      {routine.length > 0 && (
        <div className="soft-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
              Daily routine
            </p>
            <button onClick={() => onNavigate('health')} className="text-[12px] font-bold" style={{ color: TERRA_DEEP }}>
              See all →
            </button>
          </div>

          {routine.map((h, i) => (
            <HabitRow
              key={h.id}
              habit={h}
              index={i}
              checked={!!day.habits[h.id]}
              streak={byId[h.id]?.streak ?? 0}
              onToggle={() => handleToggle(h.id)}
              isLast={i === routine.length - 1}
            />
          ))}

          {bestStreak && (
            <p className="text-[11.5px] font-bold mt-2 px-1" style={{ color: TERRA_DEEP }}>
              🔥 Your longest run right now: {bestStreak.streak} day{bestStreak.streak > 1 ? 's' : ''} of “{bestStreak.label}”
            </p>
          )}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Tasks done', value: doneTasks, pct: taskPct, color: '#E5527A' },
          { label: 'Habits today', value: `${habitsDone}/${allHabits.length}`, pct: habitPct, color: '#3FA968' },
          { label: 'Goals hit', value: goals.length ? `${goalsDone}/${goals.length}` : '—', pct: goalPct, color: '#9061C2' },
        ].map(s => (
          <div key={s.label} className="soft-card rounded-2xl p-4 flex items-center gap-3">
            <ProgressRing value={s.pct} size={44} stroke={5} color={s.color}>
              <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.pct}%</span>
            </ProgressRing>
            <div className="min-w-0">
              <p className="text-[19px] font-bold leading-none" style={{ color: s.color, fontFamily: 'Fraunces, serif' }}>
                {s.value}
              </p>
              <p className="text-[11px] mt-1 font-semibold truncate" style={{ color: '#9C8877' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section cards */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-3 px-1" style={{ color: '#B5A28C' }}>
          Your spaces
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => onNavigate(sec.id)}
              className="group soft-card soft-card-hover text-left rounded-3xl p-5 transition-all duration-300 relative overflow-hidden"
            >
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                style={{ background: sec.main }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                    style={{ background: sec.light, width: 52, height: 52 }}
                  >
                    {sec.emoji}
                  </div>
                  <span
                    className="text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-2"
                    style={{ color: sec.deep }}
                  >
                    →
                  </span>
                </div>

                <p className="font-semibold text-[17px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
                  {sec.label}
                </p>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#B5A28C' }}>{sec.sub}</p>
                <p className="text-[13px] mt-2.5 font-semibold" style={{ color: sec.deep }}>{summaries[sec.id]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
