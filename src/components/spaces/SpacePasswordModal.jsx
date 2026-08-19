import { useState } from 'react'
import { useSpace } from '../../context/SpaceContext'

export default function SpacePasswordModal({ space, onSuccess, onClose, onForgot }) {
  const { verifySpacePassword, switchSpace } = useSpace()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await verifySpacePassword(space.id, password)
    setLoading(false)
    if (ok) {
      switchSpace(space.id)
      onSuccess?.()
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,58,48,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-6" style={{ background: '#fff', border: '1px solid #F4EADC' }}>
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">{space.emoji}</span>
          <h2 className="text-xl font-semibold text-center" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>
            {space.name}
          </h2>
          <p className="text-sm text-center" style={{ color: '#9C8877' }}>This space is password protected</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            autoFocus
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
            style={{ borderColor: error ? '#E5527A' : '#F4EADC', color: '#4A3A30' }}
          />
          {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF9EBB, #E5527A)' }}
          >
            {loading ? 'Verifying…' : 'Enter Space'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onForgot}
            className="text-xs underline"
            style={{ color: '#C9A07B' }}
          >
            Forgot password?
          </button>
          <button
            onClick={onClose}
            className="text-xs"
            style={{ color: '#B5A28C' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
