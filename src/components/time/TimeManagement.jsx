import { useState } from 'react'
import { Plus, Trash2, Play, Pause, RotateCcw, Check } from 'lucide-react'
import { addDays, subDays, format, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { useTimer } from '../../hooks/useTimer'
import { celebrate } from '../shared/CelebrationToast'
import Modal from '../shared/Modal'
import ProgressBar from '../shared/ProgressBar'
import ProgressRing from '../shared/ProgressRing'
import EmptyState from '../shared/EmptyState'

const SKY = '#8FCFE0'
const SKY_DEEP = '#4A9EB8'
const LAV = '#C3A6E8'

const inputStyle = { background: '#FBF5EC', border: '1.5px solid #F0E6D8' }
const inputCls = 'w-full rounded-2xl px-4 py-2.5 text-sm font-medium'

function AddBlockModal({ date, onAdd, onClose }) {
  const [form, setForm] = useState({
    title: '', date: format(date, 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', hours: 1,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onAdd({ ...form, hours: Number(form.hours) }); onClose()
  }
  return (
    <Modal title="Plan your time 🕰️" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>What are you doing?</label>
          <input type="text" required autoFocus value={form.title} onChange={e => set('title', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="e.g. Deep work, gym, reading…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>From</label>
            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>To</label>
            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
              className={inputCls} style={inputStyle} />
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
          Add to schedule
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

export default function TimeManagement() {
  const { timeBlocks, addTimeBlock, updateTimeBlock, deleteTimeBlock, logTime } = useApp()
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showAdd, setShowAdd] = useState(null)
  const [timerBlock, setTimerBlock] = useState(null)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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
            <div key={key} className="rounded-2xl p-1.5 md:p-2 min-h-36"
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
                  <div key={bl.id} onClick={() => setTimerBlock(bl)}
                    className="group relative rounded-xl px-2 py-1.5 cursor-pointer hover:scale-[1.03] transition-transform"
                    style={{
                      background: bl.progress >= 100 ? '#EFFBF3' : '#EEFAFD',
                      borderLeft: `3px solid ${bl.progress >= 100 ? '#7FD8A0' : SKY}`,
                    }}>
                    <p className="text-[10px] font-bold leading-tight truncate" style={{ color: '#4A3A30' }}>
                      {bl.title}
                    </p>
                    <p className="text-[9px] font-semibold" style={{ color: '#A9BCC7' }}>{bl.hours}h</p>
                    <div className="mt-1 h-[3px] rounded-full" style={{ background: '#E4F1F7' }}>
                      <div className="h-[3px] rounded-full transition-all"
                        style={{ width: `${bl.progress}%`, background: bl.progress >= 100 ? '#7FD8A0' : SKY }} />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteTimeBlock(bl.id) }}
                      aria-label="Delete block"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center md:hidden md:group-hover:flex text-white text-[9px]"
                      style={{ background: '#FF9EBB' }}>×</button>
                  </div>
                ))}
                <button onClick={() => setShowAdd(day)}
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

      {/* All blocks */}
      <div className="soft-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
            All time blocks
          </p>
          <button onClick={() => setShowAdd(new Date())}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold text-white"
            style={{ background: `linear-gradient(135deg,${SKY},${LAV})` }}>
            <Plus size={13} /> Add block
          </button>
        </div>

        {timeBlocks.length === 0 ? (
          <EmptyState emoji="🕰️" title="Your week is wide open" subtitle="Tap a day above to plan something lovely" />
        ) : (
          <div className="space-y-2.5">
            {[...timeBlocks].sort((a, b) => b.date.localeCompare(a.date)).map(bl => (
              <div key={bl.id} className="group flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#FBF5EC' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold truncate" style={{ color: '#4A3A30' }}>{bl.title}</p>
                    {bl.progress >= 100 && <span className="text-[11px]">🌟</span>}
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color: '#B5A28C' }}>
                    {format(parseISO(bl.date), 'EEE, MMM d')} · {bl.startTime}–{bl.endTime} · {bl.hours}h
                  </p>
                  <div className="mt-1.5"><ProgressBar value={bl.progress} color={SKY} height={4} /></div>
                </div>
                <button onClick={() => setTimerBlock(bl)}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#EEFAFD', color: SKY_DEEP }}>
                  <Play size={13} />
                </button>
                <button onClick={() => updateTimeBlock(bl.id, { progress: 100 })}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#EFFBF3', color: '#3FA968' }}>
                  <Check size={14} />
                </button>
                <button onClick={() => deleteTimeBlock(bl.id)}
                  aria-label="Delete block"
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 md:w-auto md:h-auto md:opacity-0 md:group-hover:opacity-100"
                  style={{ color: '#DCCBB4' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddBlockModal date={showAdd} onAdd={addTimeBlock} onClose={() => setShowAdd(null)} />}
      {timerBlock && <TimerModal block={timerBlock} onLog={logTime} onClose={() => setTimerBlock(null)} />}
    </div>
  )
}
