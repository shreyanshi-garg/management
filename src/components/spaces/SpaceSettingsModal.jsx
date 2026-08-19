import { useState } from 'react'
import { useSpace } from '../../context/SpaceContext'

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#C9A07B' }}>{title}</p>
      {children}
    </div>
  )
}

function Input({ type = 'text', ...props }) {
  return (
    <input
      type={type}
      className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none"
      style={{ borderColor: '#F4EADC', color: '#4A3A30' }}
      {...props}
    />
  )
}

function Btn({ children, danger, disabled, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
      style={danger
        ? { background: '#FFF0F5', color: '#E5527A', border: '1px solid #FFB3CB' }
        : { background: 'linear-gradient(135deg, #FF9EBB, #E5527A)', color: '#fff' }
      }
    >
      {children}
    </button>
  )
}

export default function SpaceSettingsModal({ space, onClose }) {
  const { addPasswordToSpace, changeSpacePassword, removeSpacePassword, updateRecoveryEmail, deleteSpace, spaces } = useSpace()

  const hasPassword = !!space.passwordHash

  const [tab, setTab] = useState(hasPassword ? 'change' : 'add')

  // Add password
  const [addPw, setAddPw] = useState('')
  const [addConfirm, setAddConfirm] = useState('')
  const [addEmail, setAddEmail] = useState(space.recoveryEmail || '')

  // Change password
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newConfirm, setNewConfirm] = useState('')

  // Remove password
  const [removePw, setRemovePw] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const msg = (e = '', s = '') => { setError(e); setSuccess(s) }

  const handleAdd = async (e) => {
    e.preventDefault()
    msg()
    if (addPw !== addConfirm) return msg('Passwords do not match')
    if (addPw.length < 4) return msg('Password must be at least 4 characters')
    setLoading(true)
    await addPasswordToSpace(space.id, addPw, addEmail)
    setLoading(false)
    msg('', 'Password added!')
    setTimeout(onClose, 1200)
  }

  const handleChange = async (e) => {
    e.preventDefault()
    msg()
    if (newPw !== newConfirm) return msg('New passwords do not match')
    if (newPw.length < 4) return msg('Password must be at least 4 characters')
    setLoading(true)
    const ok = await changeSpacePassword(space.id, oldPw, newPw)
    setLoading(false)
    if (ok) { msg('', 'Password changed!'); setTimeout(onClose, 1200) }
    else msg('Current password is incorrect')
  }

  const handleRemove = async (e) => {
    e.preventDefault()
    msg()
    setLoading(true)
    const ok = await removeSpacePassword(space.id, removePw)
    setLoading(false)
    if (ok) { msg('', 'Password removed'); setTimeout(onClose, 1200) }
    else msg('Incorrect password')
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${space.name}" space? This cannot be undone.`)) return
    await deleteSpace(space.id)
    onClose()
  }

  const canDelete = spaces.length > 1

  const TABS = hasPassword
    ? [{ id: 'change', label: 'Change password' }, { id: 'remove', label: 'Remove password' }]
    : [{ id: 'add', label: 'Add password' }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,58,48,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col gap-5" style={{ background: '#fff', border: '1px solid #F4EADC', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{space.emoji}</span>
          <div>
            <p className="font-semibold text-base" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>{space.name}</p>
            <p className="text-xs" style={{ color: '#9C8877' }}>Space settings</p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); msg() }}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={tab === t.id
                ? { background: '#FFF0F5', color: '#E5527A', border: '1px solid #FFB3CB' }
                : { background: '#FAF5F0', color: '#9C8877' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Add password */}
        {tab === 'add' && (
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <Section title="New password">
              <Input type="password" placeholder="Password" value={addPw} onChange={e => setAddPw(e.target.value)} />
              <Input type="password" placeholder="Confirm password" value={addConfirm} onChange={e => setAddConfirm(e.target.value)} />
            </Section>
            <Section title="Recovery email (optional)">
              <Input type="email" placeholder="your@email.com" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
              <p className="text-[11px]" style={{ color: '#B5A28C' }}>Used for forgot-password OTP. Leave blank to skip.</p>
            </Section>
            {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}
            {success && <p className="text-xs" style={{ color: '#3FA968' }}>{success}</p>}
            <Btn type="submit" disabled={loading || !addPw || !addConfirm}>{loading ? 'Saving…' : 'Set Password'}</Btn>
          </form>
        )}

        {/* Change password */}
        {tab === 'change' && (
          <form onSubmit={handleChange} className="flex flex-col gap-3">
            <Section title="Verify current">
              <Input type="password" placeholder="Current password" value={oldPw} onChange={e => setOldPw(e.target.value)} />
            </Section>
            <Section title="New password">
              <Input type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} />
              <Input type="password" placeholder="Confirm new password" value={newConfirm} onChange={e => setNewConfirm(e.target.value)} />
            </Section>
            {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}
            {success && <p className="text-xs" style={{ color: '#3FA968' }}>{success}</p>}
            <Btn type="submit" disabled={loading || !oldPw || !newPw || !newConfirm}>{loading ? 'Saving…' : 'Change Password'}</Btn>
          </form>
        )}

        {/* Remove password */}
        {tab === 'remove' && (
          <form onSubmit={handleRemove} className="flex flex-col gap-3">
            <Section title="Confirm current password to remove">
              <Input type="password" placeholder="Current password" value={removePw} onChange={e => setRemovePw(e.target.value)} />
            </Section>
            {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}
            {success && <p className="text-xs" style={{ color: '#3FA968' }}>{success}</p>}
            <Btn type="submit" danger disabled={loading || !removePw}>{loading ? 'Removing…' : 'Remove Password'}</Btn>
          </form>
        )}

        {/* Delete space */}
        <div className="border-t pt-4" style={{ borderColor: '#F4EADC' }}>
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            title={!canDelete ? 'Cannot delete the only space' : ''}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-30"
            style={{ background: '#FFF0F5', color: '#E5527A', border: '1px solid #FFB3CB' }}
          >
            Delete space
          </button>
          {!canDelete && (
            <p className="text-[11px] text-center mt-1.5" style={{ color: '#B5A28C' }}>You must have at least one space</p>
          )}
        </div>

        <button onClick={onClose} className="text-xs text-center" style={{ color: '#B5A28C' }}>Close</button>
      </div>
    </div>
  )
}
