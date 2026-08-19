import { useState } from 'react'
import { useSpace } from '../../context/SpaceContext'

export default function ForgotPasswordModal({ space, onSuccess, onClose }) {
  const { sendForgotPasswordOTP, verifyOTPAndResetPassword } = useSpace()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await sendForgotPasswordOTP(space.id, email)
    setLoading(false)
    if (result.ok) {
      setStep(2)
    } else {
      setError(result.error)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    setLoading(true)
    const result = await verifyOTPAndResetPassword(space.id, otp, newPassword)
    setLoading(false)
    if (result.ok) {
      onSuccess?.()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,58,48,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-6" style={{ background: '#fff', border: '1px solid #F4EADC' }}>
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">{space.emoji}</span>
          <h2 className="text-lg font-semibold text-center mt-1" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>
            Reset Password
          </h2>
          <p className="text-xs text-center" style={{ color: '#9C8877' }}>
            {step === 1
              ? 'Enter your recovery email to receive a one-time code'
              : 'Enter the OTP sent to your email and set a new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-3">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Recovery email"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
              style={{ borderColor: error ? '#E5527A' : '#F4EADC', color: '#4A3A30' }}
            />
            {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF9EBB, #E5527A)' }}
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              maxLength={6}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none tracking-widest text-center"
              style={{ borderColor: '#F4EADC', color: '#4A3A30' }}
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
              style={{ borderColor: '#F4EADC', color: '#4A3A30' }}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
              style={{ borderColor: error ? '#E5527A' : '#F4EADC', color: '#4A3A30' }}
            />
            {error && <p className="text-xs" style={{ color: '#E5527A' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !otp || !newPassword || !confirmPassword}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF9EBB, #E5527A)' }}
            >
              {loading ? 'Verifying…' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setOtp('') }}
              className="text-xs text-center"
              style={{ color: '#C9A07B' }}
            >
              Resend OTP
            </button>
          </form>
        )}

        <button onClick={onClose} className="text-xs text-center" style={{ color: '#B5A28C' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
