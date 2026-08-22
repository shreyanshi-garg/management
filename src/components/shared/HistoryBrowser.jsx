import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { parseDay } from '../../utils/date'
import EmptyState from './EmptyState'

const DEFAULT_ACCENT = { main: '#FFC38B', deep: '#E09B4C', light: '#FFF6EC' }

/** Group items by a key derived from their local day, newest bucket first. */
function bucket(items, keyOf, labelOf) {
  const map = new Map()
  for (const item of items) {
    if (!item?.date) continue
    const d = parseDay(item.date)
    const key = keyOf(d)
    if (!map.has(key)) map.set(key, { key, label: labelOf(d), items: [] })
    map.get(key).items.push(item)
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key))
}

const monthKey = (d) => format(startOfMonth(d), 'yyyy-MM')
const weekKey = (d) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
const dayKeyOf = (d) => format(d, 'yyyy-MM-dd')

const weekLabel = (d) => {
  const ws = startOfWeek(d, { weekStartsOn: 1 })
  const we = endOfWeek(d, { weekStartsOn: 1 })
  return `${format(ws, 'MMM d')} – ${format(we, 'MMM d')}`
}

function Folder({ emoji, label, sub, count, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
      style={{ background: '#FBF5EC', border: '1px solid #F4EADC' }}
    >
      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: '#fff' }}>
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold truncate" style={{ color: '#4A3A30' }}>{label}</p>
        {sub && <p className="text-[11px] font-semibold truncate" style={{ color: '#B5A28C' }}>{sub}</p>}
      </div>
      <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: accent.light, color: accent.deep }}>
        {count}
      </span>
      <ChevronRight size={15} style={{ color: '#DCCBB4' }} className="shrink-0" />
    </button>
  )
}

/**
 * Folder-style archive: month → week → day, landing on a single day's items.
 *
 * `items` are any objects carrying a local 'yyyy-MM-dd' `date`.
 * `summarize(items)` builds each folder's subtitle (e.g. a total).
 * `renderDay(items, dayKey)` renders the leaf.
 */
export default function HistoryBrowser({
  items = [],
  accent = DEFAULT_ACCENT,
  summarize,
  renderDay,
  emptyEmoji = '🗂️',
  emptyTitle = 'Nothing archived yet',
  emptySubtitle = 'Come back once you have some history',
}) {
  const [path, setPath] = useState({ month: null, week: null, day: null })

  const months = useMemo(
    () => bucket(items, monthKey, d => format(d, 'MMMM yyyy')),
    [items],
  )
  const activeMonth = months.find(mo => mo.key === path.month) || null

  const weeks = useMemo(
    () => (activeMonth ? bucket(activeMonth.items, weekKey, weekLabel) : []),
    [activeMonth],
  )
  const activeWeek = weeks.find(w => w.key === path.week) || null

  const days = useMemo(
    () => (activeWeek ? bucket(activeWeek.items, dayKeyOf, d => format(d, 'EEEE, MMM d')) : []),
    [activeWeek],
  )
  const activeDay = days.find(d => d.key === path.day) || null

  const sub = (list) => (summarize ? summarize(list) : `${list.length} item${list.length === 1 ? '' : 's'}`)

  const back = () => {
    if (path.day) setPath(p => ({ ...p, day: null }))
    else if (path.week) setPath(p => ({ ...p, week: null }))
    else setPath({ month: null, week: null, day: null })
  }

  const crumb = activeDay
    ? activeDay.label
    : activeWeek
      ? `${activeMonth.label} · ${activeWeek.label}`
      : activeMonth
        ? activeMonth.label
        : null

  if (items.length === 0) {
    return <EmptyState emoji={emptyEmoji} title={emptyTitle} subtitle={emptySubtitle} />
  }

  return (
    <div className="space-y-3">
      {crumb && (
        <div className="flex items-center gap-2">
          <button
            onClick={back}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all hover:scale-105 shrink-0"
            style={{ background: accent.light, color: accent.deep }}
          >
            <ArrowLeft size={11} /> Back
          </button>
          <p className="text-[12.5px] font-bold truncate" style={{ color: '#9C8877' }}>{crumb}</p>
        </div>
      )}

      {activeDay ? (
        renderDay(activeDay.items, activeDay.key)
      ) : activeWeek ? (
        <div className="space-y-2">
          {days.map(d => (
            <Folder key={d.key} emoji="📄" label={d.label} sub={sub(d.items)} count={d.items.length}
              accent={accent} onClick={() => setPath(p => ({ ...p, day: d.key }))} />
          ))}
        </div>
      ) : activeMonth ? (
        <div className="space-y-2">
          {weeks.map(w => (
            <Folder key={w.key} emoji="🗒️" label={w.label} sub={sub(w.items)} count={w.items.length}
              accent={accent} onClick={() => setPath(p => ({ ...p, week: w.key }))} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {months.map(mo => (
            <Folder key={mo.key} emoji="📁" label={mo.label} sub={sub(mo.items)} count={mo.items.length}
              accent={accent} onClick={() => setPath({ month: mo.key, week: null, day: null })} />
          ))}
        </div>
      )}
    </div>
  )
}
