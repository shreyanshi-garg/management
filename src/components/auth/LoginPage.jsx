import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A8.99 8.99 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A8.98 8.98 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

export default function LoginPage() {
  const { signInWithGoogle, error } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  const handleSignIn = async () => {
    setRedirecting(true)
    await signInWithGoogle()
    // On success the browser navigates away; only a failure lands back here.
    setRedirecting(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #FFF5F8 0%, #FFF9F0 50%, #F5F0FF 100%)' }}
    >
      <div className="mb-10 text-center flex flex-col items-center gap-2">
        <div className="text-4xl mb-1">🌸</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#4A3A30' }}>
          Self Management
        </h1>
        <p className="text-sm" style={{ color: '#9C8877' }}>Sign in to reach your spaces</p>
      </div>

      <div
        className="w-full max-w-sm rounded-3xl p-7 flex flex-col gap-4"
        style={{ background: '#fff', border: '1.5px solid #F4EADC', boxShadow: '0 2px 16px rgba(74,58,48,0.06)' }}
      >
        <button
          onClick={handleSignIn}
          disabled={redirecting}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#fff', border: '1.5px solid #F4EADC', color: '#4A3A30' }}
        >
          <GoogleMark />
          {redirecting ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {error && <p className="text-xs text-center" style={{ color: '#E5527A' }}>{error}</p>}

        <p className="text-[11px] text-center leading-relaxed" style={{ color: '#B5A28C' }}>
          You'll only see the spaces your email has been added to.
          Sessions expire after 24 hours.
        </p>
      </div>
    </div>
  )
}
