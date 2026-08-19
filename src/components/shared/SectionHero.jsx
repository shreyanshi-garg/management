/**
 * The gradient banner every section opens with — blurred blob + floaty emoji.
 */
export default function SectionHero({
  gradient = 'linear-gradient(120deg,#FFF3E4 0%,#FDEDE1 100%)',
  blob = '#FFD3B0',
  border = '#F6E6D4',
  emoji,
  className = '',
  children,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl px-6 py-6 ${className}`}
      style={{ background: gradient, border: `1px solid ${border}` }}
    >
      <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full opacity-45 blur-2xl" style={{ background: blob }} />
      {emoji && <span className="absolute top-6 right-8 text-3xl floaty opacity-75 hidden sm:block">{emoji}</span>}
      <div className="relative">{children}</div>
    </div>
  )
}
