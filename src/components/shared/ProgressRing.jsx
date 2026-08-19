/**
 * Animated SVG progress ring. Wraps whatever you put inside it (a %, an emoji, a count).
 */
export default function ProgressRing({
  value = 0,
  size = 64,
  stroke = 6,
  color = '#E8703A',
  track = '#F3EADF',
  children,
  className = '',
}) {
  const v = Math.min(100, Math.max(0, value))
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
