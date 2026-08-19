/**
 * Habit accents. A habit may carry its own `color`; anything stored before that
 * field existed falls back to a stable slot in this palette, so nothing needs migrating.
 */
export const HABIT_COLORS = [
  { main: '#E8703A', deep: '#C4551F', light: '#FDEEE4' }, // terracotta
  { main: '#7FD8A0', deep: '#3FA968', light: '#EFFBF3' }, // mint
  { main: '#FF9EBB', deep: '#E5527A', light: '#FFF0F5' }, // rose
  { main: '#8FCFE0', deep: '#4A9EB8', light: '#EEFAFD' }, // sky
  { main: '#C3A6E8', deep: '#9061C2', light: '#F7F0FF' }, // lavender
  { main: '#FFC38B', deep: '#E09B4C', light: '#FFF6EC' }, // honey
]

/** Deterministic per-habit colour: explicit `color` wins, else a slot keyed on the id. */
export function habitColor(habit, index = 0) {
  if (habit?.color) {
    const named = HABIT_COLORS.find(c => c.main.toLowerCase() === String(habit.color).toLowerCase())
    if (named) return named
    return { main: habit.color, deep: habit.color, light: `${habit.color}22` }
  }
  const id = String(habit?.id ?? index)
  const hash = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return HABIT_COLORS[hash % HABIT_COLORS.length]
}
