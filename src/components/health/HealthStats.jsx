import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useHabitStats } from '../../hooks/useHabitStats'
import ProgressRing from '../shared/ProgressRing'
import MonthCalendar from '../shared/MonthCalendar'
import EmptyState from '../shared/EmptyState'
import { habitColor } from './habitPalette'

function StatTile({ emoji, value, label, color, tint }) {
  return (
    <div className="soft-card rounded-2xl p-4 text-center">
      <span className="w-8 h-8 rounded-xl inline-flex items-center justify-center text-sm mb-1.5" style={{ background: tint }}>
        {emoji}
      </span>
      <p className="text-[26px] font-bold leading-none" style={{ color, fontFamily: 'Fraunces, serif' }}>{value}</p>
      <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#9C8877' }}>{label}</p>
    </div>
  )
}

export default function HealthStats({ onSelectDay }) {
  const { health, todayKey } = useApp()
  const { habits, bestStreak, longestEver, perfect } = useHabitStats(30)
  const [month, setMonth] = useState(new Date())

  if (!habits.length) {
    return <EmptyState emoji="🌱" title="Nothing to measure yet" subtitle="Add a habit and your stats will bloom here" />
  }

  const monthlyAvg = Math.round(habits.reduce((s, h) => s + h.rate, 0) / (habits.length || 1))

  return (
    <div className="space-y-4 fade-up">
      <div className="grid grid-cols-3 gap-3">
        <StatTile emoji="🔥" value={bestStreak?.streak ?? 0} label="Current streak" color="#C4551F" tint="#FDEEE4" />
        <StatTile emoji="🏆" value={longestEver} label="Longest ever" color="#9061C2" tint="#F7F0FF" />
        <StatTile emoji="⭐" value={perfect} label="Perfect days" color="#3FA968" tint="#EFFBF3" />
      </div>

      {/* 30-day completion per habit */}
      <div className="soft-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
            📊 Last 30 days
          </p>
          <span className="text-[12px] font-bold" style={{ color: '#C4551F' }}>{monthlyAvg}% average</span>
        </div>
        <p className="text-[11.5px] font-semibold mb-4" style={{ color: '#B5A28C' }}>
          How often you showed up for each habit
        </p>

        <div className="space-y-3">
          {habits.map((h, i) => {
            const c = habitColor(h, i)
            return (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-base shrink-0 w-6 text-center">{h.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold truncate" style={{ color: '#9C8877' }}>
                      {h.label}
                    </span>
                    <span className="text-[12px] font-bold shrink-0 ml-2" style={{ color: c.deep }}>{h.rate}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#F0E6D8' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${h.rate}%`,
                        background: `linear-gradient(90deg, ${c.main}bb, ${c.main})`,
                        minWidth: h.rate > 0 ? 8 : 0,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Month at a glance */}
      <MonthCalendar
        log={health.log}
        habits={health.habits || []}
        month={month}
        onMonthChange={setMonth}
        onSelectDay={onSelectDay}
        today={todayKey}
      />

      {/* Encouragement */}
      <div className="soft-card rounded-3xl p-5 flex items-center gap-4">
        <ProgressRing value={monthlyAvg} size={68} stroke={7} color="#E8703A">
          <span className="text-[13px] font-bold" style={{ color: '#C4551F' }}>{monthlyAvg}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
            {monthlyAvg >= 70 ? 'You are so consistent 🌟' : monthlyAvg >= 40 ? 'You are finding your rhythm 🌷' : 'Every small step counts 🌱'}
          </p>
          <p className="text-[12px] font-semibold mt-1" style={{ color: '#9C8877' }}>
            {bestStreak
              ? `${bestStreak.streak} days strong on “${bestStreak.label}” — keep blooming 💗`
              : 'Tick one habit today and your first streak begins 💗'}
          </p>
        </div>
      </div>
    </div>
  )
}
