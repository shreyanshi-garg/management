import { useState } from 'react'
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { celebrate } from '../shared/CelebrationToast'
import Modal from '../shared/Modal'
import Badge from '../shared/Badge'
import EmptyState from '../shared/EmptyState'

const ROSE = '#FF9EBB'
const ROSE_DEEP = '#E5527A'

const CATEGORIES = [
  { id: 'work', label: 'Work',  emoji: '💼', main: '#8FCFE0', deep: '#4A9EB8', light: '#EEFAFD' },
  { id: 'home', label: 'Home',  emoji: '🏡', main: '#FFC38B', deep: '#E09B4C', light: '#FFF6EC' },
  { id: 'trip', label: 'Trip',  emoji: '✈️', main: '#7FD8A0', deep: '#3FA968', light: '#EFFBF3' },
  { id: 'misc', label: 'Misc',  emoji: '🌼', main: '#C3A6E8', deep: '#9061C2', light: '#F7F0FF' },
]

const STATUS_CYCLE = { todo: 'inProgress', inProgress: 'done', done: 'todo' }
const STATUS_LABELS = { todo: 'To do', inProgress: 'In progress', done: 'Done' }

const DONE_MESSAGES = [
  'You did that! 💗', 'Look at you go! 🌸', 'One less thing 🌷',
  'Proud of you! ✨', 'Crushed it, queen 👑',
]

const inputStyle = { background: '#FBF5EC', border: '1.5px solid #F0E6D8' }
const inputCls = 'w-full rounded-2xl px-4 py-2.5 text-sm font-medium'

function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState(task || {
    title: '', description: '', category: 'work', priority: 'medium', dueDate: '', status: 'todo',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form); onClose()
  }
  return (
    <Modal title={task ? 'Edit task 🌷' : 'New task 🌸'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Task</label>
          <input type="text" required autoFocus value={form.title} onChange={e => set('title', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="What would you like to do?" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Notes</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            className={`${inputCls} resize-none`} style={inputStyle} placeholder="Any details…" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(c => (
              <button key={c.id} type="button" onClick={() => set('category', c.id)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[11px] font-bold"
                style={form.category === c.id
                  ? { background: c.light, color: c.deep, boxShadow: `inset 0 0 0 1.5px ${c.main}` }
                  : { background: '#FBF5EC', color: '#9C8877' }}>
                <span className="text-base">{c.emoji}</span>{c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'high', l: '🌹 High', c: '#E5527A', bg: '#FFF0F5' },
              { v: 'medium', l: '🌼 Medium', c: '#E09B4C', bg: '#FFF6EC' },
              { v: 'low', l: '🌱 Low', c: '#4A9EB8', bg: '#EEFAFD' },
            ].map(p => (
              <button key={p.v} type="button" onClick={() => set('priority', p.v)}
                className="py-2 rounded-2xl text-[12px] font-bold"
                style={form.priority === p.v
                  ? { background: p.bg, color: p.c, boxShadow: `inset 0 0 0 1.5px ${p.c}44` }
                  : { background: '#FBF5EC', color: '#9C8877' }}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Due date</label>
          <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
            className={inputCls} style={inputStyle} />
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{ background: `linear-gradient(135deg,${ROSE},#F58BAE)`, boxShadow: '0 6px 18px rgba(229,82,122,0.28)' }}>
          {task ? 'Save changes' : 'Add task'}
        </button>
      </form>
    </Modal>
  )
}

function TaskCard({ task, onCycle, onEdit, onDelete }) {
  const cat = CATEGORIES.find(c => c.id === task.category) || CATEGORIES[0]
  const isDone = task.status === 'done'

  const handleCycle = () => {
    const next = STATUS_CYCLE[task.status]
    onCycle(task.id)
    if (next === 'done') {
      celebrate(DONE_MESSAGES[Math.floor(task.id % DONE_MESSAGES.length)], '🎀', true)
    }
  }

  return (
    <div className="group soft-card rounded-3xl px-4 py-3.5 transition-all duration-200"
      style={{ borderLeft: `4px solid ${isDone ? '#E7DAC7' : cat.main}`, opacity: isDone ? 0.72 : 1 }}>
      <div className="flex items-start gap-3">
        <button onClick={handleCycle}
          className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110"
          style={isDone
            ? { background: `linear-gradient(135deg,${ROSE},#C3A6E8)` }
            : task.status === 'inProgress'
              ? { background: '#FFF6EC', boxShadow: 'inset 0 0 0 2px #FFC38B' }
              : { background: '#FBF5EC', boxShadow: 'inset 0 0 0 2px #E7DAC7' }}>
          {isDone && <span className="text-white text-[11px] font-bold">✓</span>}
          {task.status === 'inProgress' && <span className="w-2 h-2 rounded-full" style={{ background: '#E09B4C' }} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold leading-snug"
            style={{ color: isDone ? '#B5A28C' : '#4A3A30', textDecoration: isDone ? 'line-through' : 'none' }}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-[12px] mt-1 font-medium" style={{ color: '#B5A28C' }}>{task.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <Badge type={task.status} />
            <Badge type={task.priority} />
            {task.dueDate && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full"
                style={{ background: '#FBF5EC', color: '#9C8877' }}>
                <Calendar size={9} /> {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
        </div>

        {/* Always visible on touch — hover reveal only makes sense with a pointer. */}
        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(task)} className="p-2 md:p-1.5 rounded-xl hover:bg-[#FBF5EC]" style={{ color: '#B5A28C' }}>
            <Edit2 size={15} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-2 md:p-1.5 rounded-xl hover:bg-[#FFF0F5]" style={{ color: '#DCCBB4' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TaskBoard() {
  const { tasks, addTask, updateTask, deleteTask, cycleTaskStatus } = useApp()
  const [activeTab, setActiveTab] = useState('work')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)

  const tabTasks = tasks.filter(t => t.category === activeTab)
  const filtered = filterStatus === 'all' ? tabTasks : tabTasks.filter(t => t.status === filterStatus)
  const activeCat = CATEGORIES.find(c => c.id === activeTab)

  const handleSave = (form) => {
    if (editTask) updateTask(editTask.id, form)
    else addTask(form)
  }
  const handleEdit = (t) => { setEditTask(t); setShowModal(true) }
  const handleClose = () => { setShowModal(false); setEditTask(null) }

  const doneCount = tabTasks.filter(t => t.status === 'done').length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      {/* Category tabs */}
      <div className="grid grid-cols-4 gap-2.5">
        {CATEGORIES.map(cat => {
          const isActive = activeTab === cat.id
          const count = tasks.filter(t => t.category === cat.id && t.status !== 'done').length
          return (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className="relative flex flex-col items-center gap-1.5 py-4 rounded-3xl transition-all duration-200"
              style={isActive
                ? { background: `linear-gradient(140deg,${cat.light},#fff)`, boxShadow: `inset 0 0 0 2px ${cat.main}, 0 6px 18px ${cat.main}33` }
                : { background: 'rgba(255,255,255,0.7)', border: '1px solid #F4EADC' }}>
              <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>{cat.emoji}</span>
              <span className="text-[12px] font-bold" style={{ color: isActive ? cat.deep : '#9C8877' }}>
                {cat.label}
              </span>
              {count > 0 && (
                <span className="absolute top-2.5 right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: cat.main }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filters + add */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'todo', 'inProgress', 'done'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-2 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0"
              style={filterStatus === s
                ? { background: ROSE, color: '#fff' }
                : { background: 'rgba(255,255,255,0.7)', color: '#9C8877', border: '1px solid #F4EADC' }}>
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold text-white"
          style={{ background: `linear-gradient(135deg,${ROSE},#C3A6E8)`, boxShadow: '0 6px 18px rgba(229,82,122,0.26)' }}>
          <Plus size={15} /> New task
        </button>
      </div>

      {/* Progress strip */}
      {tabTasks.length > 0 && (
        <div className="soft-card rounded-2xl px-5 py-3.5 flex items-center gap-4">
          <span className="text-[12px] font-bold shrink-0" style={{ color: activeCat.deep }}>
            {doneCount}/{tabTasks.length} done
          </span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#F6EFE4' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(doneCount / tabTasks.length) * 100}%`, background: `linear-gradient(90deg,${activeCat.main},${ROSE})` }} />
          </div>
          {doneCount === tabTasks.length && <span className="text-base">🎉</span>}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState emoji={activeCat.emoji} title={`Nothing in ${activeCat.label} yet`} subtitle="Add your first task and get going ✨" />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(t => (
            <TaskCard key={t.id} task={t} onCycle={cycleTaskStatus} onEdit={handleEdit} onDelete={deleteTask} />
          ))}
        </div>
      )}

      {showModal && <TaskModal task={editTask} onSave={handleSave} onClose={handleClose} />}
    </div>
  )
}
