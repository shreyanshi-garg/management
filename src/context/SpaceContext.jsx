import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Only the active-space preference is per-device; everything else lives in Supabase.
const ACTIVE_KEY = 'pm_active_space'

const DEFAULT_SPACES = [
  { id: 'shreyanshii', name: 'Shreyanshii', emoji: '🌷', passwordHash: null, recoveryEmail: null },
  { id: 'sambhav', name: 'Sambhav', emoji: '✨', passwordHash: null, recoveryEmail: null },
]

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function rowToSpace(row) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    passwordHash: row.password_hash ?? null,
    recoveryEmail: row.recovery_email ?? null,
  }
}

const SpaceContext = createContext(null)

export function SpaceProvider({ children }) {
  const [spaces, setSpaces] = useState([])
  const [activeId, setActiveId] = useState(() => localStorage.getItem(ACTIVE_KEY) || null)
  const [loading, setLoading] = useState(true)

  // Load spaces from Supabase on mount; seed defaults if table is empty
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, name, emoji, password_hash, recovery_email')

      if (!error && data && data.length > 0) {
        setSpaces(data.map(rowToSpace))
      } else {
        // Seed default spaces into Supabase
        await supabase.from('spaces').upsert(
          DEFAULT_SPACES.map(s => ({ id: s.id, name: s.name, emoji: s.emoji, password_hash: null, recovery_email: null })),
          { onConflict: 'id' }
        )
        setSpaces(DEFAULT_SPACES)
      }
      setLoading(false)
    }
    load()
  }, [])

  const activeSpace = spaces.find(s => s.id === activeId) || null

  const switchSpace = (id) => {
    setActiveId(id)
    localStorage.setItem(ACTIVE_KEY, id)
  }

  const exitSpace = () => {
    setActiveId(null)
    localStorage.removeItem(ACTIVE_KEY)
  }

  const addSpace = async (name, emoji = '🌟', password = '', recoveryEmail = '') => {
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
    const passwordHash = password ? await hashPassword(password) : null
    const { error } = await supabase.from('spaces').insert({
      id, name, emoji,
      password_hash: passwordHash,
      recovery_email: recoveryEmail || null,
    })
    if (error) throw error
    const newSpace = { id, name, emoji, passwordHash, recoveryEmail: recoveryEmail || null }
    setSpaces(prev => [...prev, newSpace])
    switchSpace(id)
  }

  const deleteSpace = async (id) => {
    if (spaces.length <= 1) return
    await supabase.from('spaces').delete().eq('id', id)
    setSpaces(prev => prev.filter(s => s.id !== id))
    if (activeId === id) exitSpace()
  }

  const verifySpacePassword = async (id, password) => {
    const space = spaces.find(s => s.id === id)
    if (!space || !space.passwordHash) return true
    const hash = await hashPassword(password)
    return hash === space.passwordHash
  }

  const addPasswordToSpace = async (id, password, recoveryEmail = '') => {
    const passwordHash = await hashPassword(password)
    await supabase.from('spaces').update({
      password_hash: passwordHash,
      recovery_email: recoveryEmail || null,
    }).eq('id', id)
    setSpaces(prev => prev.map(s =>
      s.id === id ? { ...s, passwordHash, recoveryEmail: recoveryEmail || s.recoveryEmail } : s
    ))
  }

  const changeSpacePassword = async (id, oldPassword, newPassword) => {
    const ok = await verifySpacePassword(id, oldPassword)
    if (!ok) return false
    const passwordHash = await hashPassword(newPassword)
    await supabase.from('spaces').update({ password_hash: passwordHash }).eq('id', id)
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, passwordHash } : s))
    return true
  }

  const removeSpacePassword = async (id, currentPassword) => {
    const ok = await verifySpacePassword(id, currentPassword)
    if (!ok) return false
    await supabase.from('spaces').update({ password_hash: null, recovery_email: null }).eq('id', id)
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, passwordHash: null, recoveryEmail: null } : s))
    return true
  }

  const updateRecoveryEmail = async (id, email) => {
    await supabase.from('spaces').update({ recovery_email: email }).eq('id', id)
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, recoveryEmail: email } : s))
  }

  const sendForgotPasswordOTP = async (spaceId, email) => {
    const space = spaces.find(s => s.id === spaceId)
    if (!space) return { ok: false, error: 'Space not found' }
    if (!space.recoveryEmail) return { ok: false, error: 'No recovery email set for this space' }
    if (space.recoveryEmail.toLowerCase() !== email.toLowerCase()) {
      return { ok: false, error: 'Email does not match the recovery email for this space' }
    }
    const otp = generateOTP()
    const otpHash = await hashPassword(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const { error: dbError } = await supabase.from('space_otps').insert({
      space_id: spaceId, otp_hash: otpHash, expires_at: expiresAt, used: false,
    })
    if (dbError) return { ok: false, error: 'Failed to create OTP' }
    try {
      const emailjs = await import('@emailjs/browser')
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        { otp, space_name: space.name, to_email: email },
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY },
      )
    } catch {
      return { ok: false, error: 'Failed to send OTP email. Check EmailJS configuration.' }
    }
    return { ok: true }
  }

  const verifyOTPAndResetPassword = async (spaceId, otp, newPassword) => {
    const otpHash = await hashPassword(otp)
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('space_otps')
      .select('id')
      .eq('space_id', spaceId)
      .eq('otp_hash', otpHash)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return { ok: false, error: 'Invalid or expired OTP' }
    await supabase.from('space_otps').update({ used: true }).eq('id', data.id)
    const passwordHash = await hashPassword(newPassword)
    await supabase.from('spaces').update({ password_hash: passwordHash }).eq('id', spaceId)
    setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, passwordHash } : s))
    return { ok: true }
  }

  return (
    <SpaceContext.Provider value={{
      activeSpace,
      spaces,
      loading,
      switchSpace,
      exitSpace,
      addSpace,
      deleteSpace,
      verifySpacePassword,
      addPasswordToSpace,
      changeSpacePassword,
      removeSpacePassword,
      updateRecoveryEmail,
      sendForgotPasswordOTP,
      verifyOTPAndResetPassword,
    }}>
      {children}
    </SpaceContext.Provider>
  )
}

export function useSpace() {
  return useContext(SpaceContext)
}
