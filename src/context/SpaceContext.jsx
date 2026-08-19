import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'pm_spaces'

const DEFAULT_SPACES = {
  active: null,
  list: [
    { id: 'shreyanshii', name: 'Shreyanshii', emoji: '🌷', passwordHash: null, recoveryEmail: null },
    { id: 'sambhav', name: 'Sambhav', emoji: '✨', passwordHash: null, recoveryEmail: null },
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
    if (!raw) return DEFAULT_SPACES
    const parsed = JSON.parse(raw)
    // Ensure each space has the new fields
    const list = parsed.list.map(s => ({
      passwordHash: null,
      recoveryEmail: null,
      ...s,
    }))
    // Preserve active=null so landing page shows on fresh-ish loads
    return { active: parsed.active ?? null, list }
  } catch {
    return DEFAULT_SPACES
  }
}

function saveSpaces(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const SpaceContext = createContext(null)

export function SpaceProvider({ children }) {
  const [spacesData, setSpacesData] = useState(loadSpaces)

  const activeSpace = spacesData.active
    ? spacesData.list.find(s => s.id === spacesData.active) || null
    : null

  const switchSpace = (id) => {
    const updated = { ...spacesData, active: id }
    setSpacesData(updated)
    saveSpaces(updated)
  }

  const exitSpace = () => {
    const updated = { ...spacesData, active: null }
    setSpacesData(updated)
    saveSpaces(updated)
  }

  const addSpace = async (name, emoji = '🌟', password = '', recoveryEmail = '') => {
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
    const passwordHash = password ? await hashPassword(password) : null
    const newSpace = { id, name, emoji, passwordHash, recoveryEmail: recoveryEmail || null }
    await supabase.from('spaces').insert({
      id, name, emoji,
      password_hash: passwordHash,
      recovery_email: recoveryEmail || null,
    }).maybeSingle()
    const updated = { active: id, list: [...spacesData.list, newSpace] }
    setSpacesData(updated)
    saveSpaces(updated)
  }

  const deleteSpace = async (id) => {
    if (spacesData.list.length <= 1) return
    const updated = {
      active: spacesData.active === id ? null : spacesData.active,
      list: spacesData.list.filter(s => s.id !== id),
    }
    await supabase.from('spaces').delete().eq('id', id)
    setSpacesData(updated)
    saveSpaces(updated)
  }

  const verifySpacePassword = async (id, password) => {
    const space = spacesData.list.find(s => s.id === id)
    if (!space || !space.passwordHash) return true
    const hash = await hashPassword(password)
    return hash === space.passwordHash
  }

  const addPasswordToSpace = async (id, password, recoveryEmail = '') => {
    const passwordHash = await hashPassword(password)
    const list = spacesData.list.map(s =>
      s.id === id ? { ...s, passwordHash, recoveryEmail: recoveryEmail || s.recoveryEmail } : s
    )
    const updated = { ...spacesData, list }
    await supabase.from('spaces').update({
      password_hash: passwordHash,
      recovery_email: recoveryEmail || null,
    }).eq('id', id)
    setSpacesData(updated)
    saveSpaces(updated)
  }

  const changeSpacePassword = async (id, oldPassword, newPassword) => {
    const ok = await verifySpacePassword(id, oldPassword)
    if (!ok) return false
    const passwordHash = await hashPassword(newPassword)
    const list = spacesData.list.map(s => s.id === id ? { ...s, passwordHash } : s)
    const updated = { ...spacesData, list }
    await supabase.from('spaces').update({ password_hash: passwordHash }).eq('id', id)
    setSpacesData(updated)
    saveSpaces(updated)
    return true
  }

  const removeSpacePassword = async (id, currentPassword) => {
    const ok = await verifySpacePassword(id, currentPassword)
    if (!ok) return false
    const list = spacesData.list.map(s =>
      s.id === id ? { ...s, passwordHash: null, recoveryEmail: null } : s
    )
    const updated = { ...spacesData, list }
    await supabase.from('spaces').update({ password_hash: null, recovery_email: null }).eq('id', id)
    setSpacesData(updated)
    saveSpaces(updated)
    return true
  }

  const updateRecoveryEmail = async (id, email) => {
    const list = spacesData.list.map(s => s.id === id ? { ...s, recoveryEmail: email } : s)
    const updated = { ...spacesData, list }
    await supabase.from('spaces').update({ recovery_email: email }).eq('id', id)
    setSpacesData(updated)
    saveSpaces(updated)
  }

  const sendForgotPasswordOTP = async (spaceId, email) => {
    const space = spacesData.list.find(s => s.id === spaceId)
    if (!space) return { ok: false, error: 'Space not found' }
    if (!space.recoveryEmail) return { ok: false, error: 'No recovery email set for this space' }
    if (space.recoveryEmail.toLowerCase() !== email.toLowerCase()) {
      return { ok: false, error: 'Email does not match the recovery email for this space' }
    }

    const otp = generateOTP()
    const otpHash = await hashPassword(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: dbError } = await supabase.from('space_otps').insert({
      space_id: spaceId,
      otp_hash: otpHash,
      expires_at: expiresAt,
      used: false,
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
    const list = spacesData.list.map(s => s.id === spaceId ? { ...s, passwordHash } : s)
    const updated = { ...spacesData, list }
    await supabase.from('spaces').update({ password_hash: passwordHash }).eq('id', spaceId)
    setSpacesData(updated)
    saveSpaces(updated)

    return { ok: true }
  }

  return (
    <SpaceContext.Provider value={{
      activeSpace,
      spaces: spacesData.list,
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
