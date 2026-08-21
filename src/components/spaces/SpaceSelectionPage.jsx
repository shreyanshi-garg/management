import { useState } from 'react'
import { useSpace } from '../../context/SpaceContext'
import { useAuth } from '../../context/AuthContext'

function NewSpaceForm({ onDone }) {
  const { addSpace } = useSpace()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    setLoading(true)
    try {
      await addSpace(name.trim(), emoji.trim() || '🌟')
      onDone?.()
    } catch (err) {
      setError(err.message || 'Could not create the space')
    } finally {
      setLoading(false)
    }
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

      <p className="text-[11px]" style={{ color: '#B5A28C' }}>
        You'll be its owner. Invite others by email from space settings.
      </p>

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
  const { spaces, switchSpace, error } = useSpace()
  const { email, signOut } = useAuth()
  const [showNewForm, setShowNewForm] = useState(false)

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
        <p className="text-sm" style={{ color: '#9C8877' }}>
          {spaces.length ? 'Choose a space to continue' : 'No spaces yet — create your first one'}
        </p>
      </div>

      {error && (
        <p className="mb-4 text-xs text-center max-w-md" style={{ color: '#E5527A' }}>{error}</p>
      )}

      {/* Space cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {spaces.map(space => (
          <button
            key={space.id}
            onClick={() => switchSpace(space.id)}
            className="relative flex flex-col items-center gap-3 p-6 rounded-3xl text-center group transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: '#fff',
              border: '1.5px solid #F4EADC',
              boxShadow: '0 2px 16px rgba(74,58,48,0.06)',
            }}
          >
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

      {/* Signed-in identity */}
      <div className="mt-10 flex flex-col items-center gap-1.5">
        <p className="text-xs" style={{ color: '#B5A28C' }}>Signed in as {email}</p>
        <button onClick={signOut} className="text-xs font-semibold hover:underline" style={{ color: '#C9A07B' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
