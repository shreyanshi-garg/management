export default function ProgressBar({ value = 0, color = '#FF9EBB', height = 8 }) {
  const v = Math.min(100, Math.max(0, value))
  return (
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
  )
}
