
import { subDays, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth } from 'date-fns'

import { dayKey, parseDay } from './date'

const didHabit = (log, habitId, key) => !!log?.[key]?.habits?.[habitId]

/**
 * Consecutive days ending today. If today isn't ticked yet the streak is measured
 * from yesterday, so an unfinished day never looks like a broken streak.
 */
export function currentStreak(log, habitId, today = dayKey()) {
  if (!log) return 0
  let cursor = parseDay(today)
  if (!didHabit(log, habitId, today)) cursor = subDays(cursor, 1)

  let streak = 0
  while (didHabit(log, habitId, dayKey(cursor))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

/** Longest run of consecutive ticked days anywhere in the history. */
export function longestStreak(log, habitId) {
  const keys = Object.keys(log || {}).filter(k => didHabit(log, habitId, k)).sort()
  let best = 0
  let run = 0
  let prev = null

  for (const key of keys) {
    run = prev && dayKey(addDays(parseDay(prev), 1)) === key ? run + 1 : 1
    if (run > best) best = run
    prev = key
  }
  return best
}

/** Share of the last `days` days (including today) the habit was ticked, 0–100. */
export function completionRate(log, habitId, days = 30, today = dayKey()) {
  if (!days) return 0
  let done = 0
  for (let i = 0; i < days; i++) {
    if (didHabit(log, habitId, dayKey(subDays(parseDay(today), i)))) done++
  }
  return Math.round((done / days) * 100)
}

/** Days in the last `days` where every habit was ticked. */
export function perfectDays(log, habits, days = 30, today = dayKey()) {
  if (!habits?.length) return 0
  let count = 0
  for (let i = 0; i < days; i++) {
    const key = dayKey(subDays(parseDay(today), i))
    if (habits.every(h => didHabit(log, h.id, key))) count++
  }
  return count
}

/** How many habits were ticked on a given day. */
export function dayCount(log, habits, key) {
  return (habits || []).filter(h => didHabit(log, h.id, key)).length
}

/**
 * Full weeks covering `monthDate`, as calendar cells.
 * -> [{ key, date, done, total, inMonth }]
 */
export function monthMatrix(log, habits, monthDate = new Date()) {
  const total = habits?.length || 0
  const from = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
  const to = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })

  const cells = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const key = dayKey(d)
    cells.push({ key, date: d, done: dayCount(log, habits, key), total, inMonth: isSameMonth(d, monthDate) })
  }
  return cells
}

