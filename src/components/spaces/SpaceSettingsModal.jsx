import { useState } from 'react'
import { useSpace } from '../../context/SpaceContext'
import { useAuth } from '../../context/AuthContext'
import EmojiPicker from '../shared/EmojiPicker'
import Symbol from '../shared/Symbol'

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

function Btn({ children, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
      style={{ background: 'linear-gradient(135deg, #FF9EBB, #E5527A)', color: '#fff' }}
    >
      {children}
    </button>
  )
}

export default function SpaceSettingsModal({ space, onClose }) {
  const { deleteSpace, updateSpace, spaces, membersOf, isOwnerOf, addMember, removeMember } = useSpace()
  const { email: myEmail } = useAuth()

  const members = membersOf(space.id)
  const isOwner = isOwnerOf(space.id)
  const ownerCount = members.filter(m => m.role === 'owner').length

  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const [idName, setIdName] = useState(space.name)
  const [idEmoji, setIdEmoji] = useState(space.emoji || '🌟')
  const [showPicker, setShowPicker] = useState(false)
  const [savingId, setSavingId] = useState(false)

  const msg = (e = '', s = '') => { setError(e); setSuccess(s) }

  const identityChanged = idName.trim() !== space.name || idEmoji !== (space.emoji || '🌟')

  const handleSaveIdentity = async (e) => {
    e.preventDefault()
    msg()
    if (!idName.trim()) return
    setSavingId(true)
    const res = await updateSpace(space.id, { name: idName.trim(), emoji: idEmoji })
    setSavingId(false)
    if (res.ok) { setShowPicker(false); msg('', 'Space updated') }
    else msg(res.error)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    msg()
    setLoading(true)
    const res = await addMember(space.id, newEmail)
    setLoading(false)
    if (res.ok) { setNewEmail(''); msg('', 'Member added') }
    else msg(res.error)
  }

  const handleRemove = async (memberEmail) => {
    msg()
    const res = await removeMember(space.id, memberEmail)
    if (!res.ok) msg(res.error)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${space.name}" space? This cannot be undone.`)) return
    try {
      await deleteSpace(space.id)
      onClose()
    } catch (err) {
      msg(err.message || 'Could not delete the space')
    }
  }

  const canDelete = spaces.length > 1 && isOwner

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,58,48,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col gap-5" style={{ background: '#fff', border: '1px solid #F4EADC', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center gap-3">
          <Symbol value={space.emoji} size={36} fallback="🌟" />
          <div>
            <p className="font-semibold text-base" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>{space.name}</p>
            <p className="text-xs" style={{ color: '#9C8877' }}>Space settings</p>
          </div>
        </div>

        {isOwner && (
          <form onSubmit={handleSaveIdentity} className="flex flex-col gap-3">
            <Section title="Name & picture">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPicker(p => !p)}
                  aria-label="Choose a picture or symbol for this space"
                  className="w-12 h-[42px] rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
                  style={{ border: showPicker ? '1.5px solid #E5527A' : '1.5px solid #F4EADC', background: '#FFFDFB' }}
                >
                  <Symbol value={idEmoji} size={22} fallback="🌟" />
                </button>
                <Input value={idName} onChange={e => setIdName(e.target.value)} placeholder="Space name" />
              </div>
              {showPicker && <EmojiPicker selected={idEmoji} onSelect={setIdEmoji} />}
            </Section>
            {identityChanged && (
              <Btn type="submit" disabled={savingId || !idName.trim()}>
                {savingId ? 'Saving…' : 'Save changes'}
              </Btn>
            )}
          </form>
        )}

        <Section title={`Members (${members.length})`}>
          <div className="flex flex-col gap-2">
            {members.map(m => {
              // Removing yourself, or the last owner, would orphan the space.
              const isLastOwner = m.role === 'owner' && ownerCount === 1
              const removable = isOwner && m.email !== myEmail && !isLastOwner
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: '#FAF5F0' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: '#4A3A30' }}>
                      {m.email}{m.email === myEmail && ' (you)'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#C9A07B' }}>{m.role}</p>
                  </div>
                  {removable && (
                    <button
                      onClick={() => handleRemove(m.email)}
                      title="Remove member"
                      className="text-sm px-1.5 rounded-lg hover:bg-[#FFF0F5] transition-colors shrink-0"
                      style={{ color: '#E5527A' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </Section>

        {isOwner ? (
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <Section title="Invite by email">
              <Input
                type="email"
                placeholder="their@gmail.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
              <p className="text-[11px]" style={{ color: '#B5A28C' }}>
                Must be the exact Google address they sign in with.
              </p>
            </Section>
            {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}
            {success && <p className="text-xs" style={{ color: '#3FA968' }}>{success}</p>}
            <Btn type="submit" disabled={loading || !newEmail.trim()}>
              {loading ? 'Adding…' : 'Add Member'}
            </Btn>
          </form>
        ) : (
          <>
            <p className="text-[11px]" style={{ color: '#B5A28C' }}>
              Only an owner of this space can change its members.
            </p>
            {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}
          </>
        )}

        {/* Delete space */}
        <div className="border-t pt-4" style={{ borderColor: '#F4EADC' }}>
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            title={!canDelete ? (isOwner ? 'Cannot delete the only space' : 'Only an owner can delete this space') : ''}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-30"
            style={{ background: '#FFF0F5', color: '#E5527A', border: '1px solid #FFB3CB' }}
          >
            Delete space
          </button>
          {!canDelete && (
            <p className="text-[11px] text-center mt-1.5" style={{ color: '#B5A28C' }}>
              {isOwner ? 'You must have at least one space' : 'Only an owner can delete this space'}
            </p>
          )}
        </div>

        <button onClick={onClose} className="text-xs text-center" style={{ color: '#B5A28C' }}>Close</button>
      </div>
    </div>
  )
}
