import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
      style={{ background: 'rgba(74,59,78,0.28)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`w-full ${widths[size]} rounded-3xl my-auto flex flex-col max-h-[90dvh]`}
        style={{
          background: '#fff',
          border: '1px solid #F4EADC',
          boxShadow: '0 24px 60px rgba(150, 100, 130, 0.24)',
          animation: 'modalIn 0.28s cubic-bezier(0.34,1.4,0.64,1)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 rounded-t-3xl shrink-0"
          style={{ background: 'linear-gradient(120deg,#FFF6EE,#F9F2FF)', borderBottom: '1px solid #F4EADC' }}
        >
          <h2 className="text-[17px] font-semibold" style={{ color: '#4A3A30' }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/70"
            style={{ color: '#B5A28C' }}
          >
            <X size={17} />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">{children}</div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
