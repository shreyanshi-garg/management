import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { celebrate } from '../shared/CelebrationToast'
import Modal from '../shared/Modal'
import ProgressBar from '../shared/ProgressBar'
import ProgressRing from '../shared/ProgressRing'
import EmptyState from '../shared/EmptyState'

const LAV = '#C3A6E8'
const LAV_DEEP = '#9061C2'

const STEP_MESSAGES = ['One step closer 🌷', 'Look at that progress ✨', 'Keep blooming 🌸', "You're getting there 💜"]

const inputStyle = { background: '#FBF5EC', border: '1.5px solid #F0E6D8' }
const inputCls = 'w-full rounded-2xl px-4 py-2.5 text-sm font-medium'

function AddGoalModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [target, setTarget] = useState('')
  const [milestones, setMilestones] = useState([''])

  const setM = (i, v) => setMilestones(m => m.map((mi, idx) => idx === i ? v : mi))

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const ms = milestones.filter(m => m.trim()).map((label, i) => ({ id: Date.now() + i, label: label.trim(), done: false }))
    onAdd({ title: title.trim(), description: desc.trim(), targetDate: target, milestones: ms })
    onClose()
  }

  return (
    <Modal title="Dream something up 🌙" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Your goal</label>
          <input type="text" required autoFocus value={title} onChange={e => setTitle(e.target.value)}
            className={inputCls} style={inputStyle} placeholder="What do you want to achieve?" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Why it matters</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            className={`${inputCls} resize-none`} style={inputStyle} placeholder="A little note to future you…" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Target date</label>
          <input type="date" value={target} onChange={e => setTarget(e.target.value)}
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-semibold" style={{ color: '#9C8877' }}>Milestones</label>
            {milestones.length < 10 && (
              <button type="button" onClick={() => setMilestones(m => [...m, ''])}
                className="text-[12px] font-bold" style={{ color: LAV_DEEP }}>+ Add step</button>
            )}
          </div>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: '#F7F0FF', color: LAV_DEEP }}>{i + 1}</span>
                <input value={m} onChange={e => setM(i, e.target.value)}
                  className="flex-1 rounded-2xl px-3.5 py-2 text-sm font-medium" style={inputStyle}
                  placeholder={`Step ${i + 1}…`} />
                {milestones.length > 1 && (
                  <button type="button" onClick={() => setMilestones(ms => ms.filter((_, idx) => idx !== i))}
                    className="w-6 h-6 rounded-full text-[13px] shrink-0" style={{ color: '#DCCBB4' }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{ background: `linear-gradient(135deg,${LAV},#FF9EBB)`, boxShadow: '0 6px 18px rgba(144,97,194,0.26)' }}>
          Create goal
        </button>
      </form>
    </Modal>
  )
}

function GoalCard({ goal, onToggle, onDelete }) {
  const done = goal.milestones.filter(m => m.done).length
  const total = goal.milestones.length
  const progress = total ? Math.round((done / total) * 100) : 0
  const isComplete = total > 0 && done === total

  const handleToggle = (id) => {
    const m = goal.milestones.find(ms => ms.id === id)
    onToggle(goal.id, id)
    if (!m.done) {
      if (done + 1 === total) celebrate('Goal achieved! You did it 👑', '🏆', true)
      else celebrate(STEP_MESSAGES[done % STEP_MESSAGES.length], '⭐')
    }
  }

  return (
    <div className="soft-card rounded-3xl p-4 sm:p-5 relative overflow-hidden"
      style={isComplete
        ? { background: 'linear-gradient(140deg,#FBF3FF,#FFF9F2)', border: `1.5px solid ${LAV}66` }
        : {}}>
      {isComplete && (
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-2xl" style={{ background: LAV }} />
      )}

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isComplete && <span className="text-base">🏆</span>}
            <h3 className="font-semibold text-[17px] leading-snug" style={{ color: '#4A3A30' }}>{goal.title}</h3>
          </div>
          {goal.description && (
            <p className="text-[12.5px] mt-1 font-medium" style={{ color: '#9C8877' }}>{goal.description}</p>
          )}
          {goal.targetDate && (
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: '#F7F0FF', color: LAV_DEEP }}>
              🗓 {format(new Date(goal.targetDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        {/* progress ring */}
        <ProgressRing value={progress} size={56} stroke={6} color={LAV}>
          <span className="text-[12px] font-bold" style={{ color: LAV_DEEP }}>{progress}%</span>
        </ProgressRing>
      </div>

      <div className="relative mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold" style={{ color: '#9C8877' }}>{done} of {total} steps</span>
          {isComplete && <span className="text-[11px] font-bold" style={{ color: LAV_DEEP }}>Complete! 🎉</span>}
        </div>
        <ProgressBar value={progress} color={LAV} height={8} />
      </div>

      {/* pb-9 leaves room for the always-visible mobile delete button */}
      {total > 0 && (
        <div className="relative space-y-2 pb-9 md:pb-0">
          {goal.milestones.map((ms, i) => (
            <button key={ms.id} onClick={() => handleToggle(ms.id)}
              className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-2xl group transition-colors"
              style={{ background: ms.done ? '#FAF5FF' : '#FBF5EC' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                style={ms.done
                  ? { background: `linear-gradient(135deg,${LAV},#FF9EBB)` }
                  : { background: '#fff', boxShadow: 'inset 0 0 0 2px #E7DAC7' }}>
                {ms.done
                  ? <span className="text-white text-[10px] font-bold">✓</span>
                  : <span className="text-[9px] font-bold" style={{ color: '#DCCBB4' }}>{i + 1}</span>}
              </div>
              <span className="text-[13px] font-semibold"
                style={{ color: ms.done ? '#B5A28C' : '#4A3A30', textDecoration: ms.done ? 'line-through' : 'none' }}>
                {ms.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <button onClick={() => onDelete(goal.id)}
        aria-label="Delete goal"
        className="absolute bottom-3 right-3 p-2 rounded-xl md:opacity-0 md:hover:opacity-100 md:focus:opacity-100"
        style={{ color: '#DCCBB4' }}>
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function GoalList() {
  const { goals, addGoal, deleteGoal, toggleMilestone } = useApp()
  const [showModal, setShowModal] = useState(false)

  const isDone = g => g.milestones.length > 0 && g.milestones.every(m => m.done)
  const active = goals.filter(g => !isDone(g))
  const achieved = goals.filter(isDone)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-5">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-3xl px-6 py-5 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(120deg,#F6EEFF 0%,#FFF3E9 100%)', border: '1px solid #EDE0FA' }}>
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full opacity-40 blur-2xl" style={{ background: LAV }} />
        <div className="relative">
          <p className="text-[17px] font-semibold" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
            {goals.length ? `${achieved.length} of ${goals.length} achieved` : 'No goals yet'}
          </p>
          <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: '#A98BBE' }}>
            Big things start with small steps 🌙
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="relative flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold text-white shrink-0"
          style={{ background: `linear-gradient(135deg,${LAV},#FF9EBB)`, boxShadow: '0 6px 18px rgba(144,97,194,0.28)' }}>
          <Plus size={15} /> New goal
        </button>
      </div>

      {goals.length === 0 && (
        <EmptyState emoji="🌙" title="Your dreams go here" subtitle="Set your first goal and break it into little steps" />
      )}

      {active.length > 0 && (
        <div className="space-y-4">
          {active.map(g => <GoalCard key={g.id} goal={g} onToggle={toggleMilestone} onDelete={deleteGoal} />)}
        </div>
      )}

      {achieved.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] mb-3 px-1" style={{ color: '#B5A28C' }}>
            🏆 Achieved
          </p>
          <div className="space-y-4">
            {achieved.map(g => <GoalCard key={g.id} goal={g} onToggle={toggleMilestone} onDelete={deleteGoal} />)}
          </div>
        </div>
      )}

      {showModal && <AddGoalModal onAdd={addGoal} onClose={() => setShowModal(false)} />}
    </div>
  )
}
