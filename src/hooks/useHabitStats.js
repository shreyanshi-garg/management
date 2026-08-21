import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { currentStreak, longestStreak, completionRate, perfectDays } from '../utils/habitStats'

/** Memoized stats bundle over the live health log. */
export function useHabitStats(days = 30) {
  const { health, todayKey } = useApp()
  const { log, habits: storedHabits } = health

  return useMemo(() => {
    const habits = storedHabits || []
    const perHabit = habits.map(h => ({
      ...h,
      streak: currentStreak(log, h.id, todayKey),
      longest: longestStreak(log, h.id),
      rate: completionRate(log, h.id, days, todayKey),
    }))

    const best = perHabit.reduce((a, b) => (b.streak > (a?.streak ?? -1) ? b : a), null)

    return {
      log,
      habits: perHabit,
      byId: Object.fromEntries(perHabit.map(h => [h.id, h])),
      bestStreak: best && best.streak > 0 ? best : null,
      longestEver: perHabit.reduce((m, h) => Math.max(m, h.longest), 0),
      perfect: perfectDays(log, habits, days, todayKey),
    }
  }, [log, storedHabits, todayKey, days])
}
