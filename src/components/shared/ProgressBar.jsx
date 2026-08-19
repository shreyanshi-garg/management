export default function ProgressBar({ value = 0, color = '#FF9EBB', height = 8, showLabel = false }) {
  const v = Math.min(100, Math.max(0, value))
  return (
    <div className="w-full">
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#F6EFE4' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${v}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: v > 0 ? `0 0 8px ${color}66` : 'none',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-semibold mt-1 inline-block" style={{ color: '#9C8877' }}>
          {Math.round(v)}%
        </span>
      )}
    </div>
  )
}
