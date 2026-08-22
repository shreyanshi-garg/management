import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

function rowToSpace(row) {
  return { id: row.id, name: row.name, emoji: row.emoji }
}

const SpaceContext = createContext(null)

export function SpaceProvider({ children }) {
  const { email } = useAuth()
  const [spaces, setSpaces] = useState([])
  const [members, setMembers] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // RLS scopes both queries to the signed-in email, so there is nothing to filter
  // client-side -- an empty result is the correct answer for someone with no
  // spaces yet, and the UI just offers "New space".
  const load = useCallback(async () => {
    const [spacesRes, membersRes] = await Promise.all([
      supabase.from('spaces').select('id, name, emoji').order('name'),
      supabase.from('space_members').select('id, space_id, email, role'),
    ])

    if (spacesRes.error || membersRes.error) {
      setError((spacesRes.error || membersRes.error).message)
    } else {
      setError('')
      setSpaces((spacesRes.data || []).map(rowToSpace))
      setMembers(membersRes.data || [])
    }
    setLoading(false)
  }, [])

  // AuthGate unmounts this provider on sign-out, so `email` never changes from one
  // address to another without a fresh mount -- no need to reset `loading` here.
  useEffect(() => {
    if (email) load()
  }, [email, load])

  const activeSpace = spaces.find(s => s.id === activeId) || null

  const switchSpace = (id) => setActiveId(id)
  const exitSpace = () => setActiveId(null)

  const membersOf = useCallback(
    (spaceId) => members.filter(m => m.space_id === spaceId),
    [members]
  )

  const isOwnerOf = useCallback(
    (spaceId) => membersOf(spaceId).some(m => m.email === email && m.role === 'owner'),
    [membersOf, email]
  )

  const addSpace = async (name, emoji = '🌟') => {
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
    // The spaces_claim_owner trigger inserts the owner membership row in the same
    // transaction, so there is no window where the space has no owner.
    const { data, error: err } = await supabase
      .from('spaces')
      .insert({ id, name, emoji })
      .select('id, name, emoji')
      .single()
    if (err) throw err

    setSpaces(prev => [...prev, rowToSpace(data)])
    await load()
    switchSpace(id)
  }

  // `emoji` is a text column, so it happily holds a kaomoji or an image data URL
  // alongside a plain emoji. RLS rejects a non-owner's update.
  const updateSpace = async (id, { name, emoji }) => {
    const patch = {}
    if (name !== undefined) patch.name = name
    if (emoji !== undefined) patch.emoji = emoji
    if (!Object.keys(patch).length) return { ok: true }

    const { data, error: err } = await supabase
      .from('spaces').update(patch).eq('id', id)
      .select('id, name, emoji').single()
    if (err) return { ok: false, error: err.message }

    setSpaces(prev => prev.map(s => s.id === id ? rowToSpace(data) : s))
    return { ok: true }
  }

  const deleteSpace = async (id) => {
    if (spaces.length <= 1) return
    const { error: err } = await supabase.from('spaces').delete().eq('id', id)
    if (err) throw err
    setSpaces(prev => prev.filter(s => s.id !== id))
    setMembers(prev => prev.filter(m => m.space_id !== id))
    if (activeId === id) exitSpace()
  }

  const addMember = async (spaceId, rawEmail) => {
    const value = rawEmail.trim().toLowerCase()
    if (!value) return { ok: false, error: 'Enter an email address' }
    if (membersOf(spaceId).some(m => m.email === value)) {
      return { ok: false, error: 'That email is already a member' }
    }
    const { data, error: err } = await supabase
      .from('space_members')
      .insert({ space_id: spaceId, email: value, role: 'member' })
      .select('id, space_id, email, role')
      .single()
    // Under RLS a non-owner's insert is rejected rather than silently ignored.
    if (err) return { ok: false, error: err.message }
    setMembers(prev => [...prev, data])
    return { ok: true }
  }

  const removeMember = async (spaceId, rawEmail) => {
    const value = rawEmail.trim().toLowerCase()
    const list = membersOf(spaceId)
    const target = list.find(m => m.email === value)
    if (!target) return { ok: false, error: 'Not a member of this space' }
    if (target.role === 'owner' && list.filter(m => m.role === 'owner').length === 1) {
      return { ok: false, error: 'A space must keep at least one owner' }
    }
    const { error: err } = await supabase.from('space_members').delete().eq('id', target.id)
    if (err) return { ok: false, error: err.message }
    setMembers(prev => prev.filter(m => m.id !== target.id))
    return { ok: true }
  }

  return (
    <SpaceContext.Provider value={{
      activeSpace,
      spaces,
      loading,
      error,
      switchSpace,
      exitSpace,
      addSpace,
      updateSpace,
      deleteSpace,
      membersOf,
      isOwnerOf,
      addMember,
      removeMember,
    }}>
      {children}
    </SpaceContext.Provider>
  )
}

export function useSpace() {
  return useContext(SpaceContext)
}
