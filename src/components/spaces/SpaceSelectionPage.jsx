import { useState } from 'react'
import { useSpace } from '../../context/SpaceContext'
import SpacePasswordModal from './SpacePasswordModal'
import ForgotPasswordModal from './ForgotPasswordModal'

function NewSpaceForm({ onDone }) {
  const { addSpace } = useSpace()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [withPassword, setWithPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    if (withPassword) {
      if (password !== confirmPassword) return setError('Passwords do not match')
      if (password.length < 4) return setError('Password must be at least 4 characters')
    }
    setLoading(true)
    await addSpace(name.trim(), emoji.trim() || '🌟', withPassword ? password : '', recoveryEmail)
    setLoading(false)
    onDone?.()
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-3 mt-1">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          placeholder="🌟"
          className="w-12 text-center border rounded-xl px-2 py-2.5 text-sm outline-none"
          style={{ borderColor: '#F4EADC', color: '#4A3A30' }}
        />
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Space name"
          className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ borderColor: '#F4EADC', color: '#4A3A30' }}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#9C8877' }}>
        <input
          type="checkbox"
          checked={withPassword}
          onChange={e => setWithPassword(e.target.checked)}
          className="rounded accent-pink-400"
        />
        Protect with a password
      </label>

      {withPassword && (
        <div className="flex flex-col gap-2 pl-1">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: '#F4EADC', color: '#4A3A30' }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: error ? '#E5527A' : '#F4EADC', color: '#4A3A30' }}
          />
          <input
            type="email"
            value={recoveryEmail}
            onChange={e => setRecoveryEmail(e.target.value)}
            placeholder="Recovery email (optional)"
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: '#F4EADC', color: '#4A3A30' }}
          />
        </div>
      )}

      {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #FF9EBB, #E5527A)' }}
      >
        {loading ? 'Creating…' : 'Create Space'}
      </button>
    </form>
  )
}

export default function SpaceSelectionPage() {
  const { spaces, switchSpace } = useSpace()
  const [lockedSpace, setLockedSpace] = useState(null)
  const [forgotSpace, setForgotSpace] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)

  const handleSpaceClick = (space) => {
    if (space.passwordHash) {
      setLockedSpace(space)
    } else {
      switchSpace(space.id)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #FFF5F8 0%, #FFF9F0 50%, #F5F0FF 100%)' }}
    >
      {/* Header */}
      <div className="mb-10 text-center flex flex-col items-center gap-2">
        <div className="text-4xl mb-1">🌸</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: '#9C8877' }}>Choose a space to continue</p>
      </div>

      {/* Space cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {spaces.map(space => (
          <button
            key={space.id}
            onClick={() => handleSpaceClick(space)}
            className="relative flex flex-col items-center gap-3 p-6 rounded-3xl text-center group transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: '#fff',
              border: '1.5px solid #F4EADC',
              boxShadow: '0 2px 16px rgba(74,58,48,0.06)',
            }}
          >
            {space.passwordHash && (
              <span
                className="absolute top-3 right-3 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#FFF0F5', color: '#E5527A' }}
              >
                🔒
              </span>
            )}
            <span className="text-4xl transition-transform group-hover:scale-110">{space.emoji}</span>
            <span className="text-sm font-semibold" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>
              {space.name}
            </span>
          </button>
        ))}

        {/* New space card */}
        {!showNewForm ? (
          <button
            onClick={() => setShowNewForm(true)}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl text-center transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              border: '1.5px dashed #F4EADC',
              color: '#C9A07B',
            }}
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">New space</span>
          </button>
        ) : null}
      </div>

      {/* New space form — outside the grid so it spans full width */}
      {showNewForm && (
        <div
          className="mt-4 w-full max-w-md rounded-3xl p-6"
          style={{ background: '#fff', border: '1.5px solid #F4EADC', boxShadow: '0 2px 16px rgba(74,58,48,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>Create a new space</p>
            <button onClick={() => setShowNewForm(false)} className="text-xs" style={{ color: '#B5A28C' }}>Cancel</button>
          </div>
          <NewSpaceForm onDone={() => setShowNewForm(false)} />
        </div>
      )}

      {/* Password modal */}
      {lockedSpace && !forgotSpace && (
        <SpacePasswordModal
          space={lockedSpace}
          onSuccess={() => setLockedSpace(null)}
          onClose={() => setLockedSpace(null)}
          onForgot={() => setForgotSpace(lockedSpace)}
        />
      )}

      {/* Forgot password modal */}
      {forgotSpace && (
        <ForgotPasswordModal
          space={forgotSpace}
          onSuccess={() => { setForgotSpace(null); setLockedSpace(null) }}
          onClose={() => { setForgotSpace(null) }}
        />
      )}
    </div>
  )
}
