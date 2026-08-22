import { useState } from 'react'
import { Plus, Trash2, Play, Pause, RotateCcw, Check, Pencil } from 'lucide-react'
import { addDays, subDays, format, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { useTimer } from '../../hooks/useTimer'
import { celebrate } from '../shared/CelebrationToast'
import Modal from '../shared/Modal'
import ProgressBar from '../shared/ProgressBar'
import ProgressRing from '../shared/ProgressRing'
import EmptyState from '../shared/EmptyState'
import HistoryBrowser from '../shared/HistoryBrowser'
import { TimeField } from '../shared/ClockPicker'
import Symbol from '../shared/Symbol'
import { dayKey } from '../../utils/date'

const SKY = '#8FCFE0'
const SKY_DEEP = '#4A9EB8'
const LAV = '#C3A6E8'
const DONE = '#7FD8A0'
const DONE_DEEP = '#3FA968'

const HISTORY_ACCENT = { main: SKY, deep: SKY_DEEP, light: '#EEFAFD' }

const inputStyle = { background: '#FBF5EC', border: '1.5px solid #F0E6D8' }
const inputCls = 'w-full rounded-2xl px-4 py-2.5 text-sm font-medium'

/** Add when `block` is absent, edit when it is present. */
function BlockModal({ date, block, onAdd, onUpdate, onClose }) {
  const [form, setForm] = useState(() => block
    ? {
        title: block.title,
        date: block.date,
        startTime: block.startTime || '09:00',
        endTime: block.endTime || '10:00',
        hours: block.hours || 1,
      }
    : { title: '', date: format(date, 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', hours: 1 })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = { ...form, title: form.title.trim(), hours: Number(form.hours) }
    if (block) onUpdate(block.id, payload)
    else onAdd(payload)
    onClose()
  }
  return (
    <Modal title={block ? 'Edit this block ✏️' : 'Plan your time 🕰️'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>What are you doing?</label>
          <input type="text" required autoFocus value={form.title} onChange={e => set('title', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="e.g. Deep work, gym, reading…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>From</label>
            <TimeField label="Start time" value={form.startTime} onChange={v => set('startTime', v)} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>To</label>
            <TimeField label="End time" value={form.endTime} onChange={v => set('endTime', v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Hours planned</label>
            <input type="number" min="0.25" step="0.25" value={form.hours} onChange={e => set('hours', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{ background: `linear-gradient(135deg,${SKY},${LAV})`, boxShadow: '0 6px 18px rgba(74,158,184,0.26)' }}>
          {block ? 'Save changes' : 'Add to schedule'}
        </button>
      </form>
    </Modal>
  )
}

function TimerModal({ block, onLog, onClose }) {
  const { elapsed, running, start, pause, reset, format: fmt } = useTimer()
  const loggedSecs = (block.timeLogs || []).reduce((s, l) => s + l.seconds, 0)
  const loggedHrs = (loggedSecs / 3600).toFixed(1)

  const save = () => {
    if (elapsed > 0) {
      onLog(block.id, elapsed)
      const newTotal = loggedSecs + elapsed
      if (block.hours && newTotal >= block.hours * 3600) {
        celebrate('Block complete! So proud 🌟', '🏅', true)
      } else {
        celebrate('Focus session saved 🌷', '⏳')
      }
    }
    reset(); onClose()
  }

  return (
    <Modal title={block.title} onClose={onClose}>
      <div className="text-center space-y-5">
        <ProgressRing value={block.progress} size={176} stroke={12} color={SKY} className="mx-auto">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[34px] font-bold tabular-nums" style={{ color: SKY_DEEP, fontFamily: 'Fraunces, serif' }}>
              {fmt(elapsed)}
            </span>
            <span className="text-[11px] font-bold mt-0.5" style={{ color: '#B5A28C' }}>
              {running ? 'in flow ✨' : 'ready when you are'}
            </span>
          </div>
        </ProgressRing>

        <div>
          <ProgressBar value={block.progress} color={SKY} height={9} />
          <p className="text-[12px] font-semibold mt-2" style={{ color: '#9C8877' }}>
            {loggedHrs}h logged of {block.hours}h planned
          </p>
        </div>

        <div className="flex justify-center gap-2.5">
          {!running ? (
            <button onClick={start} className="flex items-center gap-2 px-7 py-3 rounded-full text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg,${SKY},${LAV})`, boxShadow: '0 6px 18px rgba(74,158,184,0.3)' }}>
              <Play size={15} /> Start
            </button>
          ) : (
            <button onClick={pause} className="flex items-center gap-2 px-7 py-3 rounded-full text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#FFC38B,#F7A76C)', boxShadow: '0 6px 18px rgba(224,155,76,0.3)' }}>
              <Pause size={15} /> Pause
            </button>
          )}
          <button onClick={reset} className="px-4 py-3 rounded-full" style={{ background: '#FBF5EC', color: '#9C8877' }}>
            <RotateCcw size={15} />
          </button>
        </div>

        {elapsed > 0 && (
          <button onClick={save} className="w-full py-3.5 rounded-2xl font-bold text-sm"
            style={{ background: '#EEFAFD', color: SKY_DEEP, boxShadow: `inset 0 0 0 1.5px ${SKY}` }}>
            Save this session ✓
          </button>
        )}
      </div>
    </Modal>
  )
}

/** One row in the "all blocks" list and in the history day view. */
function BlockRow({ block: bl, onStart, onToggleDone, onEdit, onDelete }) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: bl.done ? '#F6FBF7' : '#FBF5EC', opacity: bl.done ? 0.75 : 1 }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-bold truncate"
            style={{ color: bl.done ? '#B5A28C' : '#4A3A30', textDecoration: bl.done ? 'line-through' : 'none' }}>
            {bl.title}
          </p>
          {bl.done && <span className="text-[11px]">🌟</span>}
        </div>
        <p className="text-[11px] font-semibold" style={{ color: '#B5A28C' }}>
          {format(parseISO(bl.date), 'EEE, MMM d')} · {bl.startTime}–{bl.endTime} · {bl.hours}h
        </p>
        <div className="mt-1.5"><ProgressBar value={bl.progress} color={bl.done ? DONE : SKY} height={4} /></div>
      </div>
      <button onClick={() => onStart(bl)} aria-label="Start timer"
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: '#EEFAFD', color: SKY_DEEP }}>
        <Play size={13} />
      </button>
      <button onClick={() => onToggleDone(bl)}
        aria-label={bl.done ? 'Mark as not done' : 'Mark as done'}
        aria-pressed={bl.done}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
        style={bl.done
          ? { background: DONE, color: '#fff' }
          : { background: '#EFFBF3', color: DONE_DEEP }}>
        <Check size={14} />
      </button>
      <button onClick={() => onEdit(bl)} aria-label="Edit block"
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: '#F7F0FF', color: '#9061C2' }}>
        <Pencil size={13} />
      </button>
      <button onClick={() => onDelete(bl.id)}
        aria-label="Delete block"
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 md:w-auto md:h-auto md:opacity-0 md:group-hover:opacity-100"
        style={{ color: '#DCCBB4' }}>
        <Trash2 size={14} />
      </button>
    </div>
  )
}

/** What actually happened on one day — tasks ticked off, plus that day's blocks. */
function DayDetailModal({ date, blocks, tasks, onClose }) {
  const doneBlocks = blocks.filter(b => b.done)
  const openBlocks = blocks.filter(b => !b.done)
  const loggedHrs = blocks.reduce(
    (s, b) => s + (b.timeLogs || []).reduce((t, l) => t + l.seconds, 0), 0) / 3600

  const Section = ({ title, count, children }) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#B5A28C' }}>
        {title} · {count}
      </p>
      {children}
    </div>
  )

  return (
    <Modal title={`${format(date, 'EEEE, MMM d')} 🗓️`} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-around text-center"
          style={{ background: 'linear-gradient(120deg,#EAF7FC,#F3EEFF)' }}>
          {[
            [tasks.length, 'tasks done'],
            [`${doneBlocks.length}/${blocks.length}`, 'blocks done'],
            [`${loggedHrs.toFixed(1)}h`, 'logged'],
          ].map(([v, label]) => (
            <div key={label}>
              <p className="text-[18px] font-bold" style={{ color: SKY_DEEP, fontFamily: 'Fraunces, serif' }}>{v}</p>
              <p className="text-[10.5px] font-semibold" style={{ color: '#8FA9BC' }}>{label}</p>
            </div>
          ))}
        </div>

        <Section title="Tasks completed" count={tasks.length}>
          {tasks.length === 0 ? (
            <p className="text-[12.5px] font-semibold px-1" style={{ color: '#B5A28C' }}>
              Nothing ticked off on this day.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                  style={{ background: '#F6FBF7' }}>
                  <Symbol value={t.emoji} size={16} fallback="✅" />
                  <p className="text-[13px] font-bold flex-1 min-w-0 truncate" style={{ color: '#4A3A30' }}>
                    {t.title}
                  </p>
                  {t.completedAt && (
                    <span className="text-[10.5px] font-semibold shrink-0" style={{ color: '#8FA396' }}>
                      {format(parseISO(t.completedAt), 'h:mm a')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Time blocks" count={blocks.length}>
          {blocks.length === 0 ? (
            <p className="text-[12.5px] font-semibold px-1" style={{ color: '#B5A28C' }}>
              No blocks planned for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {[...doneBlocks, ...openBlocks].map(bl => (
                <div key={bl.id} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                  style={{ background: bl.done ? '#F6FBF7' : '#FBF5EC', opacity: bl.done ? 0.85 : 1 }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                    style={{ background: bl.done ? DONE_DEEP : '#E4D9C7' }}>
                    <Check size={11} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate"
                      style={{ color: bl.done ? '#8FA396' : '#4A3A30', textDecoration: bl.done ? 'line-through' : 'none' }}>
                      {bl.title}
                    </p>
                    <p className="text-[10.5px] font-semibold" style={{ color: '#B5A28C' }}>
                      {bl.startTime}–{bl.endTime} · {bl.hours}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </Modal>
  )
}

export default function TimeManagement() {
  const { timeBlocks, tasks, addTimeBlock, updateTimeBlock, deleteTimeBlock, logTime } = useApp()
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showAdd, setShowAdd] = useState(null)
  const [editBlock, setEditBlock] = useState(null)
  const [timerBlock, setTimerBlock] = useState(null)
  const [listMode, setListMode] = useState('all')   // 'all' | 'history'
  const [dayDetail, setDayDetail] = useState(null)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const toggleDone = (bl) => {
    const next = !bl.done
    updateTimeBlock(bl.id, { done: next })
    if (next) celebrate('Block complete! So proud 🌟', '🏅')
  }

  // A block that was finished on an earlier day has served its purpose — it
  // drops out of the working list and lives on in History.
  const today = dayKey()
  const activeBlocks = timeBlocks.filter(b => !(b.done && b.date < today))

  const rowProps = {
    onStart: setTimerBlock,
    onToggleDone: toggleDone,
    onEdit: setEditBlock,
    onDelete: deleteTimeBlock,
  }

  const weekBlocks = timeBlocks.filter(b => days.some(d => format(d, 'yyyy-MM-dd') === b.date))
  const totalHrs = weekBlocks.reduce((s, b) => s + Number(b.hours || 0), 0)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      {/* Week header */}
      <div className="relative overflow-hidden rounded-3xl px-6 py-5"
        style={{ background: 'linear-gradient(120deg,#EAF7FC 0%,#F3EEFF 100%)', border: '1px solid #DCEEF6' }}>
        <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full opacity-40 blur-2xl" style={{ background: SKY }} />
        <div className="relative flex items-center justify-between gap-3">
          <button onClick={() => setWeekStart(d => subDays(d, 7))}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{ background: 'rgba(255,255,255,0.75)', color: SKY_DEEP }}>←</button>
          <div className="text-center">
            <p className="text-[17px] font-semibold" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}
            </p>
            <p className="text-[12px] font-semibold mt-0.5" style={{ color: '#8FA9BC' }}>
              {weekBlocks.length} blocks · {totalHrs}h planned
            </p>
          </div>
          <button onClick={() => setWeekStart(d => addDays(d, 7))}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{ background: 'rgba(255,255,255,0.75)', color: SKY_DEEP }}>→</button>
        </div>
      </div>

      {/* Week grid — seven columns can't breathe on a phone, so it scrolls sideways there */}
      <div className="scroll-x -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 min-w-[620px] sm:min-w-0">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const blocks = timeBlocks.filter(b => b.date === key)
          const isToday = isSameDay(day, new Date())
          return (
            <div key={key} onClick={() => setDayDetail(day)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDayDetail(day) } }}
              aria-label={`See what happened on ${format(day, 'EEEE, MMMM d')}`}
              className="rounded-2xl p-1.5 md:p-2 min-h-36 cursor-pointer transition-shadow hover:shadow-md"
              style={{
                background: isToday ? 'linear-gradient(160deg,#EAF7FC,#fff)' : 'rgba(255,255,255,0.62)',
                border: isToday ? `1.5px solid ${SKY}` : '1px solid #F4EADC',
              }}>
              <div className="text-center mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#B5A28C' }}>
                  {format(day, 'EEE')}
                </p>
                <p className="text-[15px] font-bold" style={{ color: isToday ? SKY_DEEP : '#4A3A30', fontFamily: 'Fraunces, serif' }}>
                  {format(day, 'd')}
                </p>
              </div>

              <div className="space-y-1.5">
                {blocks.map(bl => (
                  <div key={bl.id} onClick={(e) => { e.stopPropagation(); setTimerBlock(bl) }}
                    className="group relative rounded-xl px-2 py-1.5 cursor-pointer hover:scale-[1.03] transition-transform"
                    style={{
                      background: bl.done ? '#EFFBF3' : '#EEFAFD',
                      borderLeft: `3px solid ${bl.done ? DONE : SKY}`,
                      opacity: bl.done ? 0.8 : 1,
                    }}>
                    <p className="text-[10px] font-bold leading-tight truncate"
                      style={{ color: bl.done ? '#8FA396' : '#4A3A30', textDecoration: bl.done ? 'line-through' : 'none' }}>
                      {bl.title}
                    </p>
                    <p className="text-[9px] font-semibold" style={{ color: '#A9BCC7' }}>{bl.hours}h</p>
                    <div className="mt-1 h-[3px] rounded-full" style={{ background: '#E4F1F7' }}>
                      <div className="h-[3px] rounded-full transition-all"
                        style={{ width: `${bl.progress}%`, background: bl.done ? DONE : SKY }} />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleDone(bl) }}
                      aria-label={bl.done ? 'Mark as not done' : 'Mark as done'}
                      className="absolute -top-1 -left-1 w-4 h-4 rounded-full items-center justify-center flex text-white"
                      style={{ background: bl.done ? DONE_DEEP : '#CBE3ED' }}>
                      <Check size={9} />
                    </button>
                    {/* Editing lives in the "all time blocks" list below — the
                        chips only need done / delete. */}
                    <button onClick={(e) => { e.stopPropagation(); deleteTimeBlock(bl.id) }}
                      aria-label="Delete block"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center md:hidden md:group-hover:flex text-white text-[9px]"
                      style={{ background: '#FF9EBB' }}>×</button>
                  </div>
                ))}
                <button onClick={(e) => { e.stopPropagation(); setShowAdd(day) }}
                  className="w-full py-1.5 rounded-xl flex items-center justify-center hover:bg-white transition-colors"
                  style={{ color: '#DCCBB4' }}>
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      </div>

      {/* All blocks / history */}
      <div className="soft-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
            {listMode === 'history' ? 'History' : 'All time blocks'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-full" style={{ background: '#FBF5EC' }}>
              {[['all', 'All'], ['history', 'History']].map(([id, label]) => (
                <button key={id} onClick={() => setListMode(id)}
                  className="px-3.5 py-1.5 rounded-full text-[11.5px] font-bold transition-all"
                  style={listMode === id
                    ? { background: '#fff', color: SKY_DEEP, boxShadow: '0 2px 8px rgba(74,158,184,0.14)' }
                    : { color: '#B5A28C' }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(new Date())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold text-white"
              style={{ background: `linear-gradient(135deg,${SKY},${LAV})` }}>
              <Plus size={13} /> Add block
            </button>
          </div>
        </div>

        {listMode === 'history' ? (
          <HistoryBrowser
            items={timeBlocks}
            accent={HISTORY_ACCENT}
            emptyEmoji="🕰️"
            emptyTitle="No history yet"
            emptySubtitle="Blocks you plan will be filed here by month"
            summarize={list => {
              const hrs = list.reduce((s, b) => s + Number(b.hours || 0), 0)
              const done = list.filter(b => b.done).length
              return `${list.length} block${list.length === 1 ? '' : 's'} · ${hrs}h · ${done} done`
            }}
            renderDay={(list) => (
              <div className="space-y-2.5">
                {[...list]
                  .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                  .map(bl => <BlockRow key={bl.id} block={bl} {...rowProps} />)}
              </div>
            )}
          />
        ) : activeBlocks.length === 0 ? (
          <EmptyState emoji="🕰️" title="Nothing left to do"
            subtitle="Finished blocks are filed away in History 🗂️" />
        ) : (
          <div className="space-y-2.5">
            {[...activeBlocks].sort((a, b) => b.date.localeCompare(a.date)).map(bl => (
              <BlockRow key={bl.id} block={bl} {...rowProps} />
            ))}
          </div>
        )}
      </div>

      {showAdd && <BlockModal date={showAdd} onAdd={addTimeBlock} onClose={() => setShowAdd(null)} />}
      {editBlock && (
        <BlockModal block={editBlock} onUpdate={updateTimeBlock} onClose={() => setEditBlock(null)} />
      )}
      {timerBlock && <TimerModal block={timerBlock} onLog={logTime} onClose={() => setTimerBlock(null)} />}
      {dayDetail && (
        <DayDetailModal
          date={dayDetail}
          blocks={timeBlocks
            .filter(b => b.date === dayKey(dayDetail))
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))}
          tasks={tasks
            .filter(t => t.status === 'done' && t.completedAt && dayKey(new Date(t.completedAt)) === dayKey(dayDetail))
            .sort((a, b) => a.completedAt.localeCompare(b.completedAt))}
          onClose={() => setDayDetail(null)}
        />
      )}
    </div>
  )
}
