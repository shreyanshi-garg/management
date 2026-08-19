import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { dayKey } from '../utils/date'

const AppContext = createContext(null)

const DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Other']

const DEFAULT_HABITS = [
  { id: 'water',    label: 'Drank enough water', category: 'food',     emoji: '💧', isDefault: true },
  { id: 'lemon',    label: 'Lemon water',         category: 'food',     emoji: '🍋', isDefault: true },
  { id: 'homeFood', label: 'Ate at home',          category: 'food',     emoji: '🏡', isDefault: true },
  { id: 'meditate', label: 'Meditated',            category: 'physical', emoji: '🧘‍♀️', isDefault: true },
  { id: 'stretch',  label: 'Stretched',            category: 'physical', emoji: '🤸‍♀️', isDefault: true },
  { id: 'exercise', label: 'Exercised',            category: 'physical', emoji: '🏃‍♀️', isDefault: true },
]

const EMPTY_MONEY = {
  balance: 0,
  month: { salary: 0, additional: 0 },
  expenses: [],
  categories: DEFAULT_EXPENSE_CATEGORIES,
  categoryEmojis: {},
  subcategories: {},
}

function uid() {
  return crypto.randomUUID()
}

function AppProvider({ children, spaceId = 'shreyanshi' }) {
  const [money, setMoney] = useState(EMPTY_MONEY)
  const [timeBlocks, setTimeBlocks] = useState([])
  const [tasks, setTasks] = useState([])
  const [goals, setGoals] = useState([])
  const [health, setHealth] = useState({ log: {}, habits: DEFAULT_HABITS })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [spaceId])

  // ─── Loaders ──────────────────────────────────────────────────────────────

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadTasks(), loadGoals(), loadMoney(), loadTimeBlocks(), loadHealth()])
    setLoading(false)
  }

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setTasks(data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        category: row.category,
        priority: row.priority,
        status: row.status,
        dueDate: row.due_date || '',
        createdAt: row.created_at,
      })))
    } else {
      await migrateTasks()
    }
  }

  async function loadGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*, goal_milestones(*)')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setGoals(data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        targetDate: row.target_date || '',
        createdAt: row.created_at,
        milestones: (row.goal_milestones || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(m => ({ id: m.id, label: m.label, done: m.done })),
      })))
    } else {
      await migrateGoals()
    }
  }

  async function loadMoney() {
    const [settingsRes, categoriesRes, expensesRes] = await Promise.all([
      supabase.from('money_settings').select('*').eq('space_id', spaceId).maybeSingle(),
      supabase.from('expense_categories').select('*, expense_subcategories(name)').eq('space_id', spaceId),
      supabase.from('expenses').select('*, expense_categories(name)').eq('space_id', spaceId).order('date', { ascending: false }),
    ])

    const cats = categoriesRes.data || []
    const hasMoney = settingsRes.data || cats.length > 0 || (expensesRes.data && expensesRes.data.length > 0)

    if (hasMoney) {
      const settings = settingsRes.data || {}
      const categoryEmojis = {}
      const subcategories = {}
      cats.forEach(c => {
        if (c.emoji) categoryEmojis[c.name] = c.emoji
        subcategories[c.name] = (c.expense_subcategories || []).map(s => s.name)
      })
      setMoney({
        balance: Number(settings.balance || 0),
        month: { salary: Number(settings.salary || 0), additional: Number(settings.additional_income || 0) },
        expenses: (expensesRes.data || []).map(e => ({
          id: e.id,
          date: e.date,
          amount: Number(e.amount),
          category: e.expense_categories?.name || '',
          subcategory: e.subcategory || '',
          note: e.note || '',
        })),
        categories: cats.length > 0 ? cats.map(c => c.name) : DEFAULT_EXPENSE_CATEGORIES,
        categoryEmojis,
        subcategories,
      })
    } else {
      await migrateMoney()
    }
  }

  async function loadTimeBlocks() {
    const { data } = await supabase
      .from('time_blocks')
      .select('*, time_logs(*)')
      .eq('space_id', spaceId)

    if (data && data.length > 0) {
      setTimeBlocks(data.map(row => {
        const logs = (row.time_logs || []).map(l => ({ date: l.log_date, seconds: l.seconds }))
        const totalSecs = logs.reduce((s, l) => s + l.seconds, 0)
        const progress = row.planned_hours
          ? Math.min(100, Math.round((totalSecs / (row.planned_hours * 3600)) * 100))
          : 0
        return {
          id: row.id,
          title: row.title,
          date: row.date,
          startTime: row.start_time || '',
          endTime: row.end_time || '',
          hours: row.planned_hours ? Number(row.planned_hours) : 0,
          timeLogs: logs,
          progress,
        }
      }))
    } else {
      await migrateTimeBlocks()
    }
  }

  async function loadHealth() {
    const [habitsRes, logsRes, nutritionRes] = await Promise.all([
      supabase.from('habits').select('*').eq('space_id', spaceId).order('sort_order'),
      supabase.from('health_logs').select('*').eq('space_id', spaceId),
      supabase.from('nutrition_logs').select('*').eq('space_id', spaceId),
    ])

    if (habitsRes.data && habitsRes.data.length > 0) {
      const habits = habitsRes.data.map(h => ({
        id: h.id,
        label: h.label,
        category: h.category,
        emoji: h.emoji || '',
        color: h.color || undefined,
        minutes: h.minutes || undefined,
        isDefault: h.is_default,
      }))
      const log = {}
      ;(logsRes.data || []).forEach(l => {
        if (!log[l.log_date]) log[l.log_date] = { habits: {}, nutrition: { protein: 0 } }
        log[l.log_date].habits[l.habit_id] = l.completed
      })
      ;(nutritionRes.data || []).forEach(n => {
        if (!log[n.log_date]) log[n.log_date] = { habits: {}, nutrition: { protein: 0 } }
        log[n.log_date].nutrition = { protein: Number(n.protein || 0) }
      })
      setHealth({ habits, log })
    } else {
      await migrateHealth()
    }
  }

  // ─── Migration: localStorage → Supabase (runs once per space if DB is empty) ──

  async function migrateTasks() {
    try {
      const raw = localStorage.getItem(`pm_tasks_${spaceId}`)
      if (!raw) return
      const local = JSON.parse(raw)
      if (!local?.length) return
      const rows = local.map(t => ({
        id: uid(), space_id: spaceId,
        title: t.title, description: t.description || null,
        category: t.category || 'misc', priority: t.priority || 'medium',
        status: t.status || 'todo', due_date: t.dueDate || null,
        created_at: t.createdAt || new Date().toISOString(),
      }))
      const { data } = await supabase.from('tasks').insert(rows).select()
      if (data) setTasks(data.map(r => ({ id: r.id, title: r.title, description: r.description || '', category: r.category, priority: r.priority, status: r.status, dueDate: r.due_date || '', createdAt: r.created_at })))
    } catch (e) { console.error('migrate tasks', e) }
  }

  async function migrateGoals() {
    try {
      const raw = localStorage.getItem(`pm_goals_${spaceId}`)
      if (!raw) return
      const local = JSON.parse(raw)
      if (!local?.length) return
      const goalRows = local.map(g => ({
        id: uid(), space_id: spaceId, title: g.title,
        description: g.description || null, target_date: g.targetDate || null,
        created_at: g.createdAt || new Date().toISOString(),
      }))
      const { data: inserted } = await supabase.from('goals').insert(goalRows).select()
      if (!inserted) return
      const milestoneRows = []
      local.forEach((g, i) => {
        const dbGoal = inserted[i]
        if (!dbGoal) return
        ;(g.milestones || []).forEach((m, j) => {
          milestoneRows.push({ id: uid(), goal_id: dbGoal.id, label: m.label, done: m.done || false, sort_order: j })
        })
      })
      if (milestoneRows.length) await supabase.from('goal_milestones').insert(milestoneRows)
      await loadGoals()
    } catch (e) { console.error('migrate goals', e) }
  }

  async function migrateMoney() {
    try {
      const raw = localStorage.getItem(`pm_money_${spaceId}`)
      const local = raw ? JSON.parse(raw) : null

      await supabase.from('money_settings').upsert({
        space_id: spaceId,
        balance: local?.balance || 0,
        salary: local?.month?.salary || 0,
        additional_income: local?.month?.additional || 0,
      }, { onConflict: 'space_id' })

      const catNames = local?.categories || DEFAULT_EXPENSE_CATEGORIES
      const catRows = catNames.map(name => ({
        id: uid(), space_id: spaceId, name,
        emoji: local?.categoryEmojis?.[name] || null,
      }))
      const { data: insertedCats } = await supabase.from('expense_categories').insert(catRows).select()
      const catMap = {}
      if (insertedCats) insertedCats.forEach(c => { catMap[c.name] = c.id })

      const subRows = []
      Object.entries(local?.subcategories || {}).forEach(([catName, subs]) => {
        const catId = catMap[catName]
        if (!catId) return
        subs.forEach(name => subRows.push({ id: uid(), category_id: catId, name }))
      })
      if (subRows.length) await supabase.from('expense_subcategories').insert(subRows)

      const expRows = (local?.expenses || []).map(e => ({
        id: uid(), space_id: spaceId,
        date: e.date ? e.date.split('T')[0] : new Date().toISOString().split('T')[0],
        amount: Number(e.amount),
        category_id: catMap[e.category] || null,
        subcategory: e.subcategory || null,
        note: e.note || null,
      }))
      if (expRows.length) await supabase.from('expenses').insert(expRows)

      await loadMoney()
    } catch (e) { console.error('migrate money', e) }
  }

  async function migrateTimeBlocks() {
    try {
      const raw = localStorage.getItem(`pm_timeblocks_${spaceId}`)
      if (!raw) return
      const local = JSON.parse(raw)
      if (!local?.length) return
      const blockRows = local.map(b => ({
        id: uid(), space_id: spaceId, title: b.title, date: b.date,
        start_time: b.startTime || null, end_time: b.endTime || null,
        planned_hours: b.hours || null,
      }))
      const { data: inserted } = await supabase.from('time_blocks').insert(blockRows).select()
      if (!inserted) return
      const logRows = []
      local.forEach((b, i) => {
        const dbBlock = inserted[i]
        if (!dbBlock) return
        ;(b.timeLogs || []).forEach(l => {
          logRows.push({ id: uid(), time_block_id: dbBlock.id, log_date: l.date ? l.date.split('T')[0] : new Date().toISOString().split('T')[0], seconds: l.seconds })
        })
      })
      if (logRows.length) await supabase.from('time_logs').insert(logRows)
      await loadTimeBlocks()
    } catch (e) { console.error('migrate timeblocks', e) }
  }

  async function migrateHealth() {
    try {
      const raw = localStorage.getItem(`pm_health_v2_${spaceId}`)
      const local = raw ? JSON.parse(raw) : null

      const habitsToSeed = local?.habits || DEFAULT_HABITS
      const habitRows = habitsToSeed.map((h, i) => ({
        id: h.id, space_id: spaceId, label: h.label, category: h.category,
        emoji: h.emoji || null, color: h.color || null,
        minutes: h.minutes || null, is_default: h.isDefault || false, sort_order: i,
      }))
      await supabase.from('habits').insert(habitRows)

      const logRows = []
      const nutritionRows = []
      Object.entries(local?.log || {}).forEach(([dateKey, dayData]) => {
        Object.entries(dayData.habits || {}).forEach(([habitId, completed]) => {
          logRows.push({ id: uid(), space_id: spaceId, log_date: dateKey, habit_id: habitId, completed: !!completed })
        })
        if (dayData.nutrition?.protein) {
          nutritionRows.push({ id: uid(), space_id: spaceId, log_date: dateKey, protein: dayData.nutrition.protein })
        }
      })
      if (logRows.length) await supabase.from('health_logs').insert(logRows)
      if (nutritionRows.length) await supabase.from('nutrition_logs').insert(nutritionRows)

      await loadHealth()
    } catch (e) { console.error('migrate health', e) }
  }

  // ─── Money helpers ────────────────────────────────────────────────────────

  const addExpense = async (expense) => {
    const { data: cat } = await supabase
      .from('expense_categories').select('id')
      .eq('space_id', spaceId).eq('name', expense.category).maybeSingle()
    const id = uid()
    const dateStr = expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
    await supabase.from('expenses').insert({
      id, space_id: spaceId, date: dateStr,
      amount: Number(expense.amount), category_id: cat?.id || null,
      subcategory: expense.subcategory || null, note: expense.note || null,
    })
    setMoney(m => ({
      ...m,
      expenses: [{ id, date: dateStr, amount: Number(expense.amount), category: expense.category, subcategory: expense.subcategory || '', note: expense.note || '' }, ...m.expenses],
    }))
  }

  const deleteExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    setMoney(m => ({ ...m, expenses: m.expenses.filter(e => e.id !== id) }))
  }

  const updateExpense = async (id, updates) => {
    const dbUpdates = {}
    if (updates.amount !== undefined) dbUpdates.amount = Number(updates.amount)
    if (updates.date !== undefined) dbUpdates.date = updates.date.split('T')[0]
    if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory
    if (updates.note !== undefined) dbUpdates.note = updates.note
    if (updates.category !== undefined) {
      const { data: cat } = await supabase
        .from('expense_categories').select('id')
        .eq('space_id', spaceId).eq('name', updates.category).maybeSingle()
      dbUpdates.category_id = cat?.id || null
    }
    await supabase.from('expenses').update(dbUpdates).eq('id', id)
    setMoney(m => ({ ...m, expenses: m.expenses.map(e => e.id === id ? { ...e, ...updates } : e) }))
  }

  const updateIncome = async (field, value) => {
    const dbField = field === 'salary' ? 'salary' : 'additional_income'
    await supabase.from('money_settings').upsert({ space_id: spaceId, [dbField]: Number(value) }, { onConflict: 'space_id' })
    setMoney(m => ({ ...m, month: { ...m.month, [field]: Number(value) } }))
  }

  const updateBalance = async (value) => {
    await supabase.from('money_settings').upsert({ space_id: spaceId, balance: Number(value) }, { onConflict: 'space_id' })
    setMoney(m => ({ ...m, balance: Number(value) }))
  }

  const addExpenseCategory = async (name, emoji) => {
    const id = uid()
    await supabase.from('expense_categories').insert({ id, space_id: spaceId, name, emoji: emoji || null })
    setMoney(m => ({
      ...m,
      categories: [...m.categories, name],
      categoryEmojis: emoji ? { ...(m.categoryEmojis || {}), [name]: emoji } : (m.categoryEmojis || {}),
    }))
  }

  const deleteExpenseCategory = async (name) => {
    await supabase.from('expense_categories').delete().eq('space_id', spaceId).eq('name', name)
    setMoney(m => {
      const emojis = { ...(m.categoryEmojis || {}) }
      delete emojis[name]
      return { ...m, categories: m.categories.filter(c => c !== name), categoryEmojis: emojis }
    })
  }

  const setCategoryEmoji = async (name, emoji) => {
    await supabase.from('expense_categories').update({ emoji }).eq('space_id', spaceId).eq('name', name)
    setMoney(m => ({ ...m, categoryEmojis: { ...(m.categoryEmojis || {}), [name]: emoji } }))
  }

  const addExpenseSubcategory = async (category, name) => {
    const { data: cat } = await supabase
      .from('expense_categories').select('id')
      .eq('space_id', spaceId).eq('name', category).maybeSingle()
    if (cat?.id) await supabase.from('expense_subcategories').insert({ id: uid(), category_id: cat.id, name })
    setMoney(m => ({
      ...m,
      subcategories: { ...(m.subcategories || {}), [category]: [...(m.subcategories?.[category] || []), name] },
    }))
  }

  const deleteExpenseSubcategory = async (category, name) => {
    const { data: cat } = await supabase
      .from('expense_categories').select('id')
      .eq('space_id', spaceId).eq('name', category).maybeSingle()
    if (cat?.id) await supabase.from('expense_subcategories').delete().eq('category_id', cat.id).eq('name', name)
    setMoney(m => ({
      ...m,
      subcategories: { ...(m.subcategories || {}), [category]: (m.subcategories?.[category] || []).filter(s => s !== name) },
    }))
  }

  // ─── Time helpers ─────────────────────────────────────────────────────────

  const addTimeBlock = async (block) => {
    const id = uid()
    await supabase.from('time_blocks').insert({
      id, space_id: spaceId, title: block.title, date: block.date,
      start_time: block.startTime || null, end_time: block.endTime || null,
      planned_hours: block.hours || null,
    })
    setTimeBlocks(b => [...b, { id, timeLogs: [], progress: 0, ...block }])
  }

  const updateTimeBlock = async (id, updates) => {
    const dbUpdates = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime
    if (updates.hours !== undefined) dbUpdates.planned_hours = updates.hours
    if (Object.keys(dbUpdates).length) await supabase.from('time_blocks').update(dbUpdates).eq('id', id)
    setTimeBlocks(b => b.map(bl => bl.id === id ? { ...bl, ...updates } : bl))
  }

  const deleteTimeBlock = async (id) => {
    await supabase.from('time_blocks').delete().eq('id', id)
    setTimeBlocks(b => b.filter(bl => bl.id !== id))
  }

  const logTime = async (id, seconds) => {
    const logDate = new Date().toISOString().split('T')[0]
    await supabase.from('time_logs').insert({ id: uid(), time_block_id: id, log_date: logDate, seconds })
    setTimeBlocks(b => b.map(bl => {
      if (bl.id !== id) return bl
      const logs = [...(bl.timeLogs || []), { date: logDate, seconds }]
      const totalSecs = logs.reduce((s, l) => s + l.seconds, 0)
      const progress = bl.hours ? Math.min(100, Math.round((totalSecs / (bl.hours * 3600)) * 100)) : 0
      return { ...bl, timeLogs: logs, progress }
    }))
  }

  // ─── Task helpers ─────────────────────────────────────────────────────────

  const addTask = async (task) => {
    const id = uid()
    await supabase.from('tasks').insert({
      id, space_id: spaceId, title: task.title,
      description: task.description || null, category: task.category || 'misc',
      priority: task.priority || 'medium', status: 'todo',
      due_date: task.dueDate || null,
    })
    setTasks(t => [{ id, status: 'todo', createdAt: new Date().toISOString(), ...task }, ...t])
  }

  const updateTask = async (id, updates) => {
    const dbUpdates = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null
    if (Object.keys(dbUpdates).length) await supabase.from('tasks').update(dbUpdates).eq('id', id)
    setTasks(t => t.map(tk => tk.id === id ? { ...tk, ...updates } : tk))
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(t => t.filter(tk => tk.id !== id))
  }

  const cycleTaskStatus = (id) => {
    const cycle = { todo: 'inProgress', inProgress: 'done', done: 'todo' }
    const task = tasks.find(t => t.id === id)
    if (!task) return
    updateTask(id, { status: cycle[task.status] })
    return task.status
  }

  // ─── Goal helpers ─────────────────────────────────────────────────────────

  const addGoal = async (goal) => {
    const id = uid()
    await supabase.from('goals').insert({
      id, space_id: spaceId, title: goal.title,
      description: goal.description || null, target_date: goal.targetDate || null,
    })
    const milestonesWithIds = (goal.milestones || []).map(m => ({ ...m, id: uid() }))
    if (milestonesWithIds.length) {
      await supabase.from('goal_milestones').insert(
        milestonesWithIds.map((m, i) => ({ id: m.id, goal_id: id, label: m.label, done: m.done || false, sort_order: i }))
      )
    }
    setGoals(g => [{ id, createdAt: new Date().toISOString(), ...goal, milestones: milestonesWithIds }, ...g])
  }

  const updateGoal = async (id, updates) => {
    const dbUpdates = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate || null
    if (updates.milestones !== undefined) {
      const milestonesWithIds = updates.milestones.map(m => ({ ...m, id: m.id || uid() }))
      await supabase.from('goal_milestones').delete().eq('goal_id', id)
      if (milestonesWithIds.length) {
        await supabase.from('goal_milestones').insert(
          milestonesWithIds.map((m, i) => ({ id: m.id, goal_id: id, label: m.label, done: m.done || false, sort_order: i }))
        )
      }
      updates = { ...updates, milestones: milestonesWithIds }
    }
    if (Object.keys(dbUpdates).length) await supabase.from('goals').update(dbUpdates).eq('id', id)
    setGoals(g => g.map(gl => gl.id === id ? { ...gl, ...updates } : gl))
  }

  const deleteGoal = async (id) => {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(g => g.filter(gl => gl.id !== id))
  }

  const toggleMilestone = async (goalId, milestoneId) => {
    const goal = goals.find(g => g.id === goalId)
    const milestone = goal?.milestones?.find(m => m.id === milestoneId)
    if (!milestone) return
    await supabase.from('goal_milestones').update({ done: !milestone.done }).eq('id', milestoneId)
    setGoals(g => g.map(gl => {
      if (gl.id !== goalId) return gl
      return { ...gl, milestones: gl.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m) }
    }))
  }

  // ─── Health helpers ───────────────────────────────────────────────────────

  const todayKey = dayKey()

  const getHealthDay = (dateKey = todayKey) =>
    health.log[dateKey] || { nutrition: { protein: 0 }, habits: {} }

  const toggleHabit = async (habitId, dateKey = todayKey) => {
    const day = getHealthDay(dateKey)
    const newVal = !day.habits[habitId]
    await supabase.from('health_logs').upsert(
      { space_id: spaceId, log_date: dateKey, habit_id: habitId, completed: newVal },
      { onConflict: 'space_id,log_date,habit_id' }
    )
    setHealth(h => ({
      ...h,
      log: {
        ...h.log,
        [dateKey]: {
          ...(h.log[dateKey] || { nutrition: { protein: 0 }, habits: {} }),
          habits: { ...(h.log[dateKey]?.habits || {}), [habitId]: newVal },
        },
      },
    }))
  }

  const setProtein = async (value, dateKey = todayKey) => {
    await supabase.from('nutrition_logs').upsert(
      { space_id: spaceId, log_date: dateKey, protein: Number(value) },
      { onConflict: 'space_id,log_date' }
    )
    setHealth(h => ({
      ...h,
      log: {
        ...h.log,
        [dateKey]: {
          ...(h.log[dateKey] || { nutrition: { protein: 0 }, habits: {} }),
          nutrition: { protein: Number(value) },
        },
      },
    }))
  }

  const addHabit = async (label, category, { emoji = '✨', color, minutes } = {}) => {
    const id = `custom_${Date.now()}`
    await supabase.from('habits').insert({
      id, space_id: spaceId, label, category,
      emoji, color: color || null, minutes: minutes || null,
      is_default: false, sort_order: health.habits.length,
    })
    setHealth(h => ({ ...h, habits: [...h.habits, { id, label, category, emoji, color, minutes, isDefault: false }] }))
  }

  const deleteHabit = async (id) => {
    await supabase.from('habits').delete().eq('id', id).eq('space_id', spaceId)
    setHealth(h => ({ ...h, habits: h.habits.filter(hb => hb.id !== id) }))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '1.5rem' }}>
        🌸
      </div>
    )
  }

  return (
    <AppContext.Provider value={{
      money, addExpense, deleteExpense, updateExpense, updateIncome, updateBalance,
      addExpenseCategory, deleteExpenseCategory, setCategoryEmoji, addExpenseSubcategory, deleteExpenseSubcategory,
      timeBlocks, addTimeBlock, updateTimeBlock, deleteTimeBlock, logTime,
      tasks, addTask, updateTask, deleteTask, cycleTaskStatus,
      goals, addGoal, updateGoal, deleteGoal, toggleMilestone,
      health, getHealthDay, toggleHabit, setProtein, addHabit, deleteHabit, todayKey,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}

export default AppProvider
