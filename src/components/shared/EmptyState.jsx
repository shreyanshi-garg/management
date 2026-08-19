export default function EmptyState({ emoji = '🌸', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-3 floaty"
        style={{ background: 'linear-gradient(135deg,#FFF0F5,#F7F0FF)' }}
      >
        {emoji}
      </div>
      <p className="font-semibold text-[15px]" style={{ color: '#4A3A30', fontFamily: 'Fraunces, serif' }}>{title}</p>
      {subtitle && <p className="text-[13px] mt-1" style={{ color: '#B5A28C' }}>{subtitle}</p>}
    </div>
  )
}
