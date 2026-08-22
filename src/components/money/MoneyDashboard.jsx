import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2, Settings, Sparkles, Pencil, Check, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { dayKey } from '../../utils/date'
import { celebrate } from '../shared/CelebrationToast'
import Modal from '../shared/Modal'
import EmptyState from '../shared/EmptyState'
import EmojiPicker from '../shared/EmojiPicker'
import HistoryBrowser from '../shared/HistoryBrowser'
import Symbol from '../shared/Symbol'

const HONEY = '#FFC38B'
const HONEY_DEEP = '#E09B4C'

const PIE_COLORS = ['#FF9EBB', '#C3A6E8', '#FFC38B', '#8FCFE0', '#7FD8A0', '#FFB5C5', '#D4B5F0', '#FFD6A5']

const CATEGORY_EMOJI = {
  Food: '🍰', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '🧾', Other: '🌼',
}

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Other']

const inputCls = 'w-full rounded-2xl px-4 py-2.5 text-sm font-medium'
const inputStyle = { background: '#FBF5EC', border: '1.5px solid #F0E6D8' }

const expenseDate = (exp) => {
  try { return parseISO(exp.date) } catch { return new Date() }
}

function groupExpenses(expenses, mode) {
  const grouped = new Map()
  for (const exp of expenses) {
    const d = expenseDate(exp)
    let key, label
    if (mode === 'day') {
      key = format(d, 'yyyy-MM-dd')
      label = format(d, 'EEEE, MMM d')
    } else if (mode === 'week') {
      const ws = startOfWeek(d, { weekStartsOn: 1 })
      const we = endOfWeek(d, { weekStartsOn: 1 })
      key = format(ws, 'yyyy-MM-dd')
      label = `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    } else {
      key = format(d, 'yyyy-MM')
      label = format(d, 'MMMM yyyy')
    }
    if (!grouped.has(key)) grouped.set(key, { key, label, total: 0, items: [] })
    const g = grouped.get(key)
    g.total += exp.amount
    g.items.push(exp)
  }
  return [...grouped.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, g]) => ({ ...g, items: [...g.items].sort((a, b) => expenseDate(b) - expenseDate(a)) }))
}

function SubcategoryPicker({ category, subcategories, selected, onSelect }) {
  const subs = subcategories?.[category] || []
  if (subs.length === 0) return null
  return (
    <div>
      <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Subcategory <span style={{ color: '#DCCBB4', fontWeight: 400 }}>(optional)</span></label>
      <div className="flex flex-wrap gap-2">
        {subs.map(s => (
          <button key={s} type="button" onClick={() => onSelect(selected === s ? '' : s)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
            style={selected === s
              ? { background: '#C3A6E8', color: '#fff' }
              : { background: '#FBF5EC', color: '#A6947F', border: '1.5px solid #F0E6D8' }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function AddExpenseModal({ categories, subcategories, emojiFor, onAdd, onClose }) {
  const [form, setForm] = useState({
    amount: '', category: categories[0] || '', subcategory: '', note: '',
    date: dayKey(),
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setCategory = (c) => setForm(f => ({ ...f, category: c, subcategory: '' }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.category) return
    onAdd({ amount: parseFloat(form.amount), category: form.category, subcategory: form.subcategory, note: form.note, date: form.date })
    onClose()
  }
  return (
    <Modal title="Add an expense 🧾" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Amount (₹)</label>
          <input type="number" min="0" step="0.01" required autoFocus value={form.amount}
            onChange={e => set('amount', e.target.value)} className={inputCls} style={inputStyle} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                style={form.category === c
                  ? { background: HONEY, color: '#fff' }
                  : { background: '#FBF5EC', color: '#A6947F', border: '1.5px solid #F0E6D8' }}>
                <Symbol value={emojiFor ? emojiFor(c) : CATEGORY_EMOJI[c]} size={14} className="mr-1" /> {c}
              </button>
            ))}
          </div>
        </div>
        <SubcategoryPicker
          category={form.category}
          subcategories={subcategories}
          selected={form.subcategory}
          onSelect={v => set('subcategory', v)}
        />
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Note</label>
          <input type="text" value={form.note} onChange={e => set('note', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="What was this for?" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className={inputCls} style={inputStyle} />
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{ background: `linear-gradient(135deg,${HONEY},#F7A76C)`, boxShadow: '0 6px 18px rgba(224,155,76,0.3)' }}>
          Add expense
        </button>
      </form>
    </Modal>
  )
}

function EditExpenseModal({ expense, categories, subcategories, emojiFor, onSave, onClose }) {
  const [form, setForm] = useState({
    amount: String(expense.amount),
    category: expense.category,
    subcategory: expense.subcategory || '',
    note: expense.note || '',
    date: format(expenseDate(expense), 'yyyy-MM-dd'),
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setCategory = (c) => setForm(f => ({ ...f, category: c, subcategory: '' }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.category) return
    onSave({ amount: parseFloat(form.amount), category: form.category, subcategory: form.subcategory, note: form.note, date: form.date })
    onClose()
  }
  return (
    <Modal title="Edit expense ✏️" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Amount (₹)</label>
          <input type="number" min="0" step="0.01" required autoFocus value={form.amount}
            onChange={e => set('amount', e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                style={form.category === c
                  ? { background: HONEY, color: '#fff' }
                  : { background: '#FBF5EC', color: '#A6947F', border: '1.5px solid #F0E6D8' }}>
                <Symbol value={emojiFor ? emojiFor(c) : CATEGORY_EMOJI[c]} size={14} className="mr-1" /> {c}
              </button>
            ))}
          </div>
        </div>
        <SubcategoryPicker
          category={form.category}
          subcategories={subcategories}
          selected={form.subcategory}
          onSelect={v => set('subcategory', v)}
        />
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Note</label>
          <input type="text" value={form.note} onChange={e => set('note', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="What was this for?" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className={inputCls} style={inputStyle} />
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{ background: `linear-gradient(135deg,${HONEY},#F7A76C)`, boxShadow: '0 6px 18px rgba(224,155,76,0.3)' }}>
          Save changes
        </button>
      </form>
    </Modal>
  )
}

function AddLentModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    personName: '', amount: '', note: '',
    date: dayKey(),
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.personName.trim() || !form.amount) return
    onAdd({ personName: form.personName.trim(), amount: parseFloat(form.amount), date: form.date, note: form.note })
    onClose()
  }
  return (
    <Modal title="Lend money 🤝" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Person name</label>
          <input type="text" required autoFocus value={form.personName}
            onChange={e => set('personName', e.target.value)} className={inputCls} style={inputStyle} placeholder="Who are you lending to?" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Amount (₹)</label>
          <input type="number" min="0" step="0.01" required value={form.amount}
            onChange={e => set('amount', e.target.value)} className={inputCls} style={inputStyle} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Note <span style={{ color: '#DCCBB4', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" value={form.note} onChange={e => set('note', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="What's it for?" />
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#C3A6E8,#A07BC5)', boxShadow: '0 6px 18px rgba(160,123,197,0.3)' }}>
          Record lent amount
        </button>
      </form>
    </Modal>
  )
}

function AddRepaymentModal({ lent, onAdd, onClose }) {
  const [form, setForm] = useState({
    amount: '', note: '',
    date: dayKey(),
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e) => {
    e.preventDefault()
    if (!form.amount) return
    onAdd(lent.id, { amount: parseFloat(form.amount), date: form.date, note: form.note })
    onClose()
  }
  const totalRepaid = lent.repayments.reduce((s, r) => s + r.amount, 0)
  const outstanding = lent.amount - totalRepaid
  return (
    <Modal title={`Repayment from ${lent.personName} 💜`} onClose={onClose}>
      <div className="mb-4 px-4 py-3 rounded-2xl" style={{ background: '#F8F0FF', border: '1.5px solid #E8D8FF' }}>
        <p className="text-[12px] font-semibold" style={{ color: '#7B5EA7' }}>
          Outstanding: ₹{outstanding.toLocaleString('en-IN')} of ₹{lent.amount.toLocaleString('en-IN')} lent
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Amount (₹)</label>
          <input type="number" min="0" step="0.01" required autoFocus value={form.amount}
            onChange={e => set('amount', e.target.value)} className={inputCls} style={inputStyle} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>Note <span style={{ color: '#DCCBB4', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" value={form.note} onChange={e => set('note', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="Any note?" />
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#C3A6E8,#A07BC5)', boxShadow: '0 6px 18px rgba(160,123,197,0.3)' }}>
          Record repayment
        </button>
      </form>
    </Modal>
  )
}

function CategoryManager({ categories, categoryEmojis, subcategories, onAdd, onDelete, onSetEmoji, onAddSub, onDeleteSub, onClose }) {
  const [newCat, setNewCat] = useState('')
  const [newEmoji, setNewEmoji] = useState('✨')
  const [showPicker, setShowPicker] = useState(false)
  const [editingEmoji, setEditingEmoji] = useState(null)
  const [expandedCat, setExpandedCat] = useState(null)
  const [newSubInputs, setNewSubInputs] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const v = newCat.trim()
    if (!v || categories.includes(v)) return
    onAdd(v, newEmoji)
    setNewCat('')
    setNewEmoji('✨')
    setShowPicker(false)
  }
  const missing = DEFAULT_CATEGORIES.filter(d => !categories.includes(d))
  const emojiFor = (c) => categoryEmojis?.[c] || CATEGORY_EMOJI[c] || '✨'

  const submitSub = (e, cat) => {
    e.preventDefault()
    const v = (newSubInputs[cat] || '').trim()
    if (!v || (subcategories?.[cat] || []).includes(v)) return
    onAddSub(cat, v)
    setNewSubInputs(s => ({ ...s, [cat]: '' }))
  }

  return (
    <Modal title="Your categories 🌼" onClose={onClose} size="lg">
      {/* Add new category */}
      <form onSubmit={submit} className="space-y-3 mb-5">
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowPicker(p => !p)}
            className="w-12 h-[42px] rounded-2xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
            aria-label="Choose a symbol for this category"
            style={{ background: '#FBF5EC', border: showPicker ? '1.5px solid #E8703A' : '1.5px solid #F0E6D8' }}>
            <Symbol value={newEmoji} size={22} />
          </button>
          <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Category name…"
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium" style={inputStyle} />
          <button type="submit" className="px-5 rounded-2xl text-sm font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${HONEY},#F7A76C)` }}>Add</button>
        </div>
        {showPicker && (
          <EmojiPicker selected={newEmoji} onSelect={e => setNewEmoji(e)} />
        )}
      </form>

      {/* Current categories */}
      <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: '#DCCBB4' }}>
        Your categories
      </p>
      <div className="space-y-2 mb-4">
        {categories.map(c => {
          const subs = subcategories?.[c] || []
          const isExpanded = expandedCat === c
          return (
            <div key={c} className="rounded-2xl overflow-hidden" style={{ background: '#FBF5EC' }}>
              {/* Category row */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setEditingEmoji(editingEmoji === c ? null : c)}
                    className="transition-all hover:scale-110"
                    aria-label={`Change symbol for ${c}`}
                    title="Tap to change symbol"
                  >
                    <Symbol value={emojiFor(c)} size={22} />
                  </button>
                  <span className="text-[13px] font-semibold" style={{ color: '#4A3A30' }}>{c}</span>
                  {subs.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FFE8D6', color: HONEY_DEEP }}>
                      {subs.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExpandedCat(isExpanded ? null : c)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all hover:scale-105"
                    style={{ background: isExpanded ? '#C3A6E8' : '#F0E6D8', color: isExpanded ? '#fff' : '#9C8877' }}
                  >
                    {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    Subs
                  </button>
                  <button onClick={() => onDelete(c)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all hover:scale-105"
                    style={{ background: '#FFF0F5', color: '#E5527A' }}>
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              </div>

              {/* Emoji picker for this category */}
              {editingEmoji === c && (
                <div className="px-4 pb-3">
                  <EmojiPicker selected={emojiFor(c)} onSelect={e => { onSetEmoji(c, e); setEditingEmoji(null) }} />
                </div>
              )}

              {/* Subcategories panel */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2" style={{ borderTop: '1px solid #F0E6D8' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider pt-2.5" style={{ color: '#DCCBB4' }}>Subcategories</p>
                  {subs.length === 0 ? (
                    <p className="text-[11px] font-semibold" style={{ color: '#C5B4A0' }}>No subcategories yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {subs.map(s => (
                        <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: '#F0E6FF', color: '#7B5EA7' }}>
                          {s}
                          <button type="button" onClick={() => onDeleteSub(c, s)}
                            className="ml-0.5 hover:scale-110 transition-all" aria-label={`Remove ${s}`}>
                            <Trash2 size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Add subcategory */}
                  <form onSubmit={e => submitSub(e, c)} className="flex gap-2 pt-1">
                    <input
                      value={newSubInputs[c] || ''}
                      onChange={e => setNewSubInputs(s => ({ ...s, [c]: e.target.value }))}
                      placeholder="Add subcategory…"
                      className="flex-1 rounded-xl px-3 py-1.5 text-[12px] font-medium"
                      style={{ background: '#fff', border: '1.5px solid #E8D8F0' }}
                    />
                    <button type="submit" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white shrink-0"
                      style={{ background: '#C3A6E8' }}>Add</button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
        {categories.length === 0 && (
          <p className="text-center text-[12px] py-4 font-semibold" style={{ color: '#B5A28C' }}>
            No categories yet 🌱
          </p>
        )}
      </div>

      {/* Restore missing defaults */}
      {missing.length > 0 && (
        <div style={{ borderTop: '1px solid #F0E6D8', paddingTop: 14 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: '#DCCBB4' }}>
            Restore defaults
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.map(c => (
              <button key={c} onClick={() => onAdd(c, CATEGORY_EMOJI[c] || '✨')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all hover:scale-105"
                style={{ background: '#FFF6EC', color: HONEY_DEEP, border: `1.5px dashed ${HONEY}` }}>
                <Plus size={11} /> {CATEGORY_EMOJI[c] || '✨'} {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

const GROUP_MODES = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'history', label: '🗂️ History' },
]

const HISTORY_ACCENT = { main: HONEY, deep: HONEY_DEEP, light: '#FFF6EC' }

const PERIOD_LABELS = { day: 'today', week: 'this week', month: 'this month' }

/** Is this expense inside the current day / week / month? */
function inPeriod(exp, mode) {
  const d = expenseDate(exp)
  const now = new Date()
  if (mode === 'day') return format(d, 'yyyy-MM-dd') === dayKey(now)
  if (mode === 'week') {
    return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      === format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }
  return format(d, 'yyyy-MM') === format(now, 'yyyy-MM')
}

/** One expense line — shared by the grouped list and the history day view. */
function ExpenseRow({ exp, emojiFor, editMode, onEdit, onDelete }) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{ background: editMode ? '#FFF6EC' : '#FBF5EC' }}>
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
        <Symbol value={emojiFor(exp.category)} size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold truncate" style={{ color: '#4A3A30' }}>
          {exp.category}
          {exp.subcategory && (
            <span className="font-semibold" style={{ color: '#9B82C4' }}> · {exp.subcategory}</span>
          )}
          {exp.note && <span className="font-medium" style={{ color: '#B5A28C' }}> · {exp.note}</span>}
        </p>
        <p className="text-[11px] font-semibold" style={{ color: '#B5A28C' }}>
          {format(expenseDate(exp), 'MMM d, yyyy')}
        </p>
      </div>
      <span className="font-bold text-sm shrink-0" style={{ color: HONEY_DEEP }}>
        ₹{exp.amount.toLocaleString('en-IN')}
      </span>
      {/* Edit + delete — always visible in edit mode */}
      <div className={`items-center gap-1 shrink-0 transition-opacity ${editMode ? 'flex opacity-100' : 'hidden md:flex md:opacity-0 md:group-hover:opacity-100'}`}>
        <button
          onClick={() => onEdit(exp)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: '#FFF6EC', color: HONEY_DEEP }}
          aria-label="Edit expense"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(exp.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: '#FFF0F5', color: '#E5527A' }}
          aria-label="Delete expense"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function MoneyDashboard() {
  const { money, addExpense, deleteExpense, updateExpense, updateIncome, addExpenseCategory, deleteExpenseCategory, setCategoryEmoji, addExpenseSubcategory, deleteExpenseSubcategory, addLent, deleteLent, addRepayment, deleteRepayment } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [showCats, setShowCats] = useState(false)
  const [editingExp, setEditingExp] = useState(null)
  const [filterCat, setFilterCat] = useState('All')
  const [groupMode, setGroupMode] = useState('day')
  const [editMode, setEditMode] = useState(false)
  const [drillCategory, setDrillCategory] = useState(null)
  const [showExpenses, setShowExpenses] = useState(false)
  const [showLent, setShowLent] = useState(false)
  const [showAddLent, setShowAddLent] = useState(false)
  const [lentRepaymentTarget, setLentRepaymentTarget] = useState(null)
  const [confirmDeleteLent, setConfirmDeleteLent] = useState(null)
  const [expandedLent, setExpandedLent] = useState(null)

  const subcategories = money.subcategories || {}

  const income = money.month.salary + money.month.additional
  const spent = money.expenses.reduce((s, e) => s + e.amount, 0)
  const balance = income - spent
  const savedPct = income ? Math.round((balance / income) * 100) : 0

  const handleAddExpense = (exp) => {
    addExpense(exp)
    const newBalance = income - (spent + exp.amount)
    if (income > 0 && newBalance > income * 0.5) {
      celebrate("You're saving beautifully! 💗", '🌸')
    } else {
      celebrate('Expense noted 🧾', '🧾')
    }
  }

  const handleSaveExpense = (id, updates) => {
    updateExpense(id, updates)
    celebrate('Expense updated ✨', '✏️')
  }

  const emojiFor = (cat) => money.categoryEmojis?.[cat] || CATEGORY_EMOJI[cat] || '✨'

  // Top-level: spending by category
  const topLevelPieData = money.categories.map((cat, i) => ({
    name: cat,
    value: money.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: PIE_COLORS[i % PIE_COLORS.length],
  })).filter(d => d.value > 0)

  // Drill-down: spending by subcategory within selected category
  const drillPieData = drillCategory ? (() => {
    const catExpenses = money.expenses.filter(e => e.category === drillCategory)
    const subs = subcategories[drillCategory] || []
    const buckets = {}
    for (const exp of catExpenses) {
      const key = (exp.subcategory && subs.includes(exp.subcategory)) ? exp.subcategory : '(Other)'
      buckets[key] = (buckets[key] || 0) + exp.amount
    }
    return Object.entries(buckets).map(([name, value], i) => ({
      name, value, color: PIE_COLORS[i % PIE_COLORS.length],
    }))
  })() : []

  const pieData = drillCategory ? drillPieData : topLevelPieData

  const baseList = filterCat === 'All' ? money.expenses : money.expenses.filter(e => e.category === filterCat)
  // Day / Week / Month scope to the *current* period — the archive is History's job.
  const periodList = groupMode === 'history' ? baseList : baseList.filter(e => inPeriod(e, groupMode))
  const groups = groupExpenses(periodList, groupMode)
  const periodLabel = PERIOD_LABELS[groupMode]

  const lentList = money.lent || []
  const totalOutstanding = lentList.reduce((s, l) => {
    const repaid = l.repayments.reduce((r, p) => r + p.amount, 0)
    return s + Math.max(0, l.amount - repaid)
  }, 0)

  const cards = [
    { label: 'Balance', value: balance, emoji: '💗', tint: '#FFF0F5', color: balance >= 0 ? '#E5527A' : '#D6455F' },
    { label: 'Income', value: income, emoji: '🌸', tint: '#F7F0FF', color: '#9061C2' },
    { label: 'Spent', value: spent, emoji: '🛍️', tint: '#FFF6EC', color: HONEY_DEEP },
    { label: 'Saved', value: Math.max(0, balance), emoji: '🏦', tint: '#EFFBF3', color: '#3FA968' },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      {/* Balance banner */}
      <div className="relative overflow-hidden rounded-3xl px-7 py-6"
        style={{ background: 'linear-gradient(120deg,#FFF4E6 0%,#FFF3E9 60%,#F8EEFF 100%)', border: '1px solid #FFE8D6' }}>
        <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full opacity-45 blur-2xl" style={{ background: '#FFD3A5' }} />
        <div className="relative flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: '#C9A07B' }}>
              Balance left this month
            </p>
            <p className="text-[40px] leading-none font-semibold mt-2"
              style={{ color: balance >= 0 ? '#4A3A30' : '#D6455F', fontFamily: 'Fraunces, serif' }}>
              ₹{Math.abs(balance).toLocaleString('en-IN')}
            </p>
            {income > 0 && (
              <p className="text-[13px] mt-2 font-semibold" style={{ color: '#B08D6E' }}>
                {savedPct}% of your income is still yours ✨
              </p>
            )}
          </div>
          <span className="text-4xl floaty">💰</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="soft-card rounded-2xl p-4">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm mb-2"
              style={{ background: c.tint }}>{c.emoji}</span>
            <p className="text-[19px] font-bold" style={{ color: c.color, fontFamily: 'Fraunces, serif' }}>
              ₹{Math.abs(c.value).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#9C8877' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Income */}
      <div className="soft-card rounded-3xl p-5">
        <p className="font-semibold text-[15px] mb-4 flex items-center gap-2"
          style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
          <Sparkles size={15} style={{ color: HONEY_DEEP }} /> Monthly income
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: '💼 Salary', field: 'salary' }, { label: '🌟 Additional', field: 'additional' }].map(({ label, field }) => (
            <div key={field}>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#9C8877' }}>{label}</label>
              <input type="number" min="0" value={money.month[field] || ''}
                onChange={e => updateIncome(field, e.target.value)}
                className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold" style={inputStyle} placeholder="0" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart + actions */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="soft-card rounded-3xl p-4 sm:p-5 md:col-span-3">
          {/* Chart header */}
          <div className="flex items-center gap-2 mb-2">
            {drillCategory && (
              <button
                onClick={() => setDrillCategory(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all hover:scale-105"
                style={{ background: '#F0E6FF', color: '#7B5EA7' }}
              >
                <ArrowLeft size={11} /> Back
              </button>
            )}
            <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
              {drillCategory ? `${emojiFor(drillCategory)} ${drillCategory} breakdown` : 'Where it goes'}
            </p>
          </div>
          {!drillCategory && (
            <p className="text-[11px] font-semibold mb-1" style={{ color: '#DCCBB4' }}>
              Tap a slice to see subcategory breakdown
            </p>
          )}
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="46%"
                  innerRadius={48} outerRadius={78}
                  dataKey="value" paddingAngle={3} stroke="none"
                  onClick={drillCategory ? undefined : (data) => setDrillCategory(data.name)}
                  style={{ cursor: drillCategory ? 'default' : 'pointer' }}
                >
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                  contentStyle={{ borderRadius: 14, border: '1px solid #F0E6D8', fontSize: 12, fontFamily: 'Quicksand', fontWeight: 600 }}
                />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, fontWeight: 600, color: '#A6947F' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState emoji="🌸" title={drillCategory ? 'No expenses in this category' : 'Nothing spent yet'} subtitle="Your wallet is very happy" />
          )}
        </div>

        <div className="flex flex-col gap-3 md:col-span-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center justify-center gap-2 py-5 rounded-3xl font-bold text-sm text-white flex-1"
            style={{ background: `linear-gradient(135deg,${HONEY},#F7A76C)`, boxShadow: '0 8px 22px rgba(224,155,76,0.28)' }}>
            <Plus size={17} /> Add expense
          </button>
          <button onClick={() => setShowCats(true)}
            className="soft-card soft-card-hover flex items-center justify-center gap-2 py-5 rounded-3xl font-bold text-sm flex-1"
            style={{ color: '#9C8877' }}>
            <Settings size={15} /> Manage categories
          </button>
        </div>
      </div>

      {/* Expenses */}
      <div className="soft-card rounded-3xl p-5">
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 flex-wrap ${showExpenses ? 'mb-4' : ''}`}>
          <button
            onClick={() => { setShowExpenses(o => !o); setEditMode(false) }}
            className="flex items-center gap-2 -m-1 p-1 rounded-xl transition-all"
            aria-expanded={showExpenses}
          >
            <ChevronRight
              size={16}
              className="transition-transform"
              style={{ color: HONEY_DEEP, transform: showExpenses ? 'rotate(90deg)' : 'none' }}
            />
            <span className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
              Expenses
            </span>
            <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: '#FFF6EC', color: HONEY_DEEP }}>
              {groupMode === 'history' ? baseList.length : periodList.length}
            </span>
          </button>
          <div className="flex items-center gap-2" style={{ display: showExpenses ? undefined : 'none' }}>
            {/* Edit mode toggle */}
            <button
              onClick={() => setEditMode(m => !m)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={editMode
                ? { background: HONEY, color: '#fff' }
                : { background: '#FBF5EC', color: '#9C8877' }}
              aria-label={editMode ? 'Done editing' : 'Edit expenses'}
            >
              {editMode ? <><Check size={12} /> Done</> : <><Pencil size={12} /> Edit</>}
            </button>

            {/* Group mode toggle */}
            <div className="flex gap-1 p-1 rounded-full" style={{ background: '#FBF5EC' }}>
              {GROUP_MODES.map(m => (
                <button key={m.id} onClick={() => setGroupMode(m.id)}
                  className="px-3.5 py-1.5 rounded-full text-[11.5px] font-bold transition-all"
                  style={groupMode === m.id
                    ? { background: '#fff', color: HONEY_DEEP, boxShadow: '0 2px 8px rgba(150,115,80,0.12)' }
                    : { color: '#B5A28C' }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showExpenses && (<>
        {/* Category filter pills */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['All', ...money.categories].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
              style={filterCat === c
                ? { background: HONEY, color: '#fff' }
                : { background: '#FBF5EC', color: '#9C8877' }}>
              {c}
            </button>
          ))}
        </div>

        {groupMode === 'history' ? (
          <HistoryBrowser
            items={baseList}
            accent={HISTORY_ACCENT}
            emptyEmoji="🧾"
            emptyTitle="No expenses here"
            emptySubtitle="Nothing to see — that's a good thing!"
            summarize={list => `₹${list.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}`}
            renderDay={(list) => (
              <div className="space-y-1.5">
                {[...list].sort((a, b) => expenseDate(b) - expenseDate(a)).map(exp => (
                  <ExpenseRow key={exp.id} exp={exp} emojiFor={emojiFor} editMode={editMode}
                    onEdit={setEditingExp} onDelete={deleteExpense} />
                ))}
              </div>
            )}
          />
        ) : periodList.length === 0 ? (
          <EmptyState emoji="🧾" title={`Nothing spent ${periodLabel}`}
            subtitle="Check History for older expenses 🗂️" />
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.key}>
                {/* Period separator */}
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: '#B5A28C' }}>
                    {group.label}
                  </span>
                  <span className="text-[12px] font-bold px-3 py-1 rounded-full"
                    style={{ background: '#FFF6EC', color: HONEY_DEEP }}>
                    ₹{group.total.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.items.map(exp => (
                    <ExpenseRow key={exp.id} exp={exp} emojiFor={emojiFor} editMode={editMode}
                      onEdit={setEditingExp} onDelete={deleteExpense} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </>)}
      </div>

      {/* Lent */}
      <div className="soft-card rounded-3xl p-5">
        <div className={`flex items-center justify-between gap-3 flex-wrap ${showLent ? 'mb-4' : ''}`}>
          <button
            onClick={() => setShowLent(o => !o)}
            className="flex items-center gap-2 -m-1 p-1 rounded-xl transition-all"
            aria-expanded={showLent}
          >
            <ChevronRight
              size={16}
              className="transition-transform"
              style={{ color: '#7B5EA7', transform: showLent ? 'rotate(90deg)' : 'none' }}
            />
            <span className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>
              Money Lent
            </span>
            <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: '#F0E6FF', color: '#7B5EA7' }}>
              {lentList.length}
            </span>
          </button>
          {showLent && (
            <button
              onClick={() => setShowAddLent(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg,#C3A6E8,#A07BC5)', boxShadow: '0 6px 18px rgba(160,123,197,0.3)' }}
            >
              <Plus size={14} /> Lend money
            </button>
          )}
        </div>

        {showLent && (<>
          {totalOutstanding > 0 && (
            <div className="mb-4 px-4 py-3 rounded-2xl" style={{ background: '#F8F0FF', border: '1.5px solid #E8D8FF' }}>
              <p className="text-[12px] font-bold" style={{ color: '#7B5EA7' }}>
                Total outstanding: ₹{totalOutstanding.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {lentList.length === 0 ? (
            <EmptyState emoji="🤝" title="No lent records" subtitle="Track money you've lent to friends and family" />
          ) : (
            <div className="space-y-3">
              {lentList.map(lent => {
                const totalRepaid = lent.repayments.reduce((s, r) => s + r.amount, 0)
                const outstanding = lent.amount - totalRepaid
                const isPaid = outstanding <= 0
                const isExpanded = expandedLent === lent.id
                return (
                  <div key={lent.id} className="rounded-2xl overflow-hidden" style={{ background: '#FBF5EC' }}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: '#F0E6FF' }}>
                        🤝
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold" style={{ color: '#4A3A30' }}>{lent.personName}</p>
                        <p className="text-[11px] font-semibold" style={{ color: '#B5A28C' }}>
                          {format(parseISO(lent.date), 'MMM d, yyyy')} · Lent ₹{lent.amount.toLocaleString('en-IN')}
                        </p>
                        {lent.note && <p className="text-[11px] font-medium" style={{ color: '#C5B4A0' }}>{lent.note}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {isPaid ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#EFFBF3', color: '#3FA968' }}>
                            Paid back ✓
                          </span>
                        ) : (
                          <>
                            <p className="font-bold text-sm" style={{ color: '#7B5EA7' }}>₹{outstanding.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-semibold" style={{ color: '#C5B4A0' }}>outstanding</p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setExpandedLent(isExpanded ? null : lent.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                          style={{ background: isExpanded ? '#C3A6E8' : '#F0E6FF', color: isExpanded ? '#fff' : '#7B5EA7' }}
                          aria-label="Show repayments"
                        >
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteLent(confirmDeleteLent === lent.id ? null : lent.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                          style={{ background: '#FFF0F5', color: '#E5527A' }}
                          aria-label="Delete lent record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {confirmDeleteLent === lent.id && (
                      <div className="px-4 pb-3 flex items-center gap-2" style={{ borderTop: '1px solid #F0E6D8' }}>
                        <p className="text-[12px] font-semibold flex-1" style={{ color: '#9C8877' }}>Delete this record?</p>
                        <button onClick={() => { deleteLent(lent.id); setConfirmDeleteLent(null) }}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white" style={{ background: '#E5527A' }}>
                          Delete
                        </button>
                        <button onClick={() => setConfirmDeleteLent(null)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold" style={{ background: '#FBF5EC', color: '#9C8877', border: '1px solid #F0E6D8' }}>
                          Cancel
                        </button>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="px-4 pb-3" style={{ borderTop: '1px solid #F0E6D8' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider pt-2.5 mb-2" style={{ color: '#DCCBB4' }}>
                          Repayments
                        </p>
                        {lent.repayments.length === 0 ? (
                          <p className="text-[11px] font-semibold mb-3" style={{ color: '#C5B4A0' }}>No repayments recorded yet</p>
                        ) : (
                          <div className="space-y-1.5 mb-3">
                            {lent.repayments.map(r => (
                              <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#fff' }}>
                                <span className="font-bold text-[12px] flex-1" style={{ color: '#7B5EA7' }}>
                                  ₹{r.amount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-semibold" style={{ color: '#B5A28C' }}>
                                  {format(parseISO(r.date), 'MMM d, yyyy')}
                                </span>
                                {r.note && (
                                  <span className="text-[10px] font-medium" style={{ color: '#C5B4A0' }}>· {r.note}</span>
                                )}
                                <button
                                  onClick={() => deleteRepayment(r.id, lent.id)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                                  style={{ background: '#FFF0F5', color: '#E5527A' }}
                                  aria-label="Delete repayment"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setLentRepaymentTarget(lent)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[12px] text-white"
                          style={{ background: 'linear-gradient(135deg,#C3A6E8,#A07BC5)' }}
                        >
                          <Plus size={12} /> Add repayment
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>)}
      </div>

      {showAdd && (
        <AddExpenseModal
          categories={money.categories}
          subcategories={subcategories}
          emojiFor={emojiFor}
          onAdd={handleAddExpense}
          onClose={() => setShowAdd(false)}
        />
      )}
      {showCats && (
        <CategoryManager
          categories={money.categories}
          categoryEmojis={money.categoryEmojis}
          subcategories={subcategories}
          onAdd={addExpenseCategory}
          onDelete={deleteExpenseCategory}
          onSetEmoji={setCategoryEmoji}
          onAddSub={addExpenseSubcategory}
          onDeleteSub={deleteExpenseSubcategory}
          onClose={() => setShowCats(false)}
        />
      )}
      {editingExp && (
        <EditExpenseModal
          expense={editingExp}
          categories={money.categories}
          subcategories={subcategories}
          emojiFor={emojiFor}
          onSave={(updates) => handleSaveExpense(editingExp.id, updates)}
          onClose={() => setEditingExp(null)}
        />
      )}
      {showAddLent && (
        <AddLentModal
          onAdd={(data) => { addLent(data); celebrate('Lent amount recorded 🤝', '💜') }}
          onClose={() => setShowAddLent(false)}
        />
      )}
      {lentRepaymentTarget && (
        <AddRepaymentModal
          lent={lentRepaymentTarget}
          onAdd={(lentId, data) => { addRepayment(lentId, data); celebrate('Repayment recorded ✨', '💜') }}
          onClose={() => setLentRepaymentTarget(null)}
        />
      )}
    </div>
  )
}
