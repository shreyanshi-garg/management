import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'pm_spaces'

const DEFAULT_SPACES = {
  active: 'shreyanshii',
  list: [
    { id: 'shreyanshii', name: 'Shreyanshii', emoji: '🌷' },
    { id: 'sambhav', name: 'Sambhav', emoji: '✨' },
  ],
}

// Migrate flat keys to namespaced keys for 'shreyanshii' on first run
function migrateIfNeeded() {
  if (localStorage.getItem(STORAGE_KEY)) return
  const oldKeys = ['pm_money', 'pm_timeblocks', 'pm_tasks', 'pm_goals', 'pm_health_v2']
  oldKeys.forEach(key => {
    const data = localStorage.getItem(key)
    if (data) localStorage.setItem(`${key}_shreyanshii`, data)
  })
}

function loadSpaces() {
  migrateIfNeeded()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_SPACES
  } catch {
    return DEFAULT_SPACES
  }
}

function saveSpaces(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const SpaceContext = createContext(null)

export function SpaceProvider({ children }) {
  const [spacesData, setSpacesData] = useState(loadSpaces)

  const activeSpace = spacesData.list.find(s => s.id === spacesData.active) || spacesData.list[0]

  const switchSpace = (id) => {
    const updated = { ...spacesData, active: id }
    setSpacesData(updated)
    saveSpaces(updated)
  }

  const addSpace = async (name, emoji = '🌟') => {
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
    const newSpace = { id, name, emoji }
    await supabase.from('spaces').insert({ id, name, emoji }).maybeSingle()
    const updated = { active: id, list: [...spacesData.list, newSpace] }
    setSpacesData(updated)
    saveSpaces(updated)
  }

  return (
    <SpaceContext.Provider value={{ activeSpace, spaces: spacesData.list, switchSpace, addSpace }}>
      {children}
    </SpaceContext.Provider>
  )
}

export function useSpace() {
  return useContext(SpaceContext)
}
