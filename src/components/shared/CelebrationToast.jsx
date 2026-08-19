import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'

let showToastFn = null

const PALETTE = ['#FF9EBB', '#C3A6E8', '#FFC38B', '#8FCFE0', '#7FD8A0', '#FFD6E8']

export function celebrate(message, emoji = '🌸', big = false) {
  if (showToastFn) showToastFn({ message, emoji, big })

  if (big) {
    // soft double burst from the sides
    confetti({ particleCount: 70, spread: 70, origin: { x: 0.2, y: 0.75 }, angle: 60, colors: PALETTE, scalar: 0.95, shapes: ['circle'] })
    confetti({ particleCount: 70, spread: 70, origin: { x: 0.8, y: 0.75 }, angle: 120, colors: PALETTE, scalar: 0.95, shapes: ['circle'] })
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, colors: PALETTE, scalar: 1.1, shapes: ['circle', 'square'] })
    }, 180)
  } else {
    confetti({ particleCount: 45, spread: 55, origin: { y: 0.72 }, colors: PALETTE, scalar: 0.85, shapes: ['circle'] })
  }
}

export default function CelebrationToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    showToastFn = (t) => {
      setToast(t)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setToast(null), 3200)
    }
    return () => { showToastFn = null; clearTimeout(timerRef.current) }
  }, [])

  if (!toast) return null

  return (
    <div
      className="fixed bottom-[calc(84px+env(safe-area-inset-bottom,0px))] md:bottom-7 left-1/2 z-[100] flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-full max-w-[calc(100vw-2rem)]"
      style={{
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid #FFDCE9',
        boxShadow: '0 10px 34px rgba(219, 130, 168, 0.28)',
        animation: 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
        style={{ background: 'linear-gradient(135deg,#FFE3EE,#F6E7FF)' }}
      >
        {toast.emoji}
      </span>
      <span className="text-sm font-bold pr-1" style={{ color: '#4A3A30' }}>{toast.message}</span>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.88); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
