/**
 * The primary gradient pill used for every "add / save" action.
 */
export default function PillButton({
  color = '#E8703A',
  deep = '#C4551F',
  icon,
  children,
  variant = 'solid',
  className = '',
  ...props
}) {
  const solid = variant === 'solid'
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 ${className}`}
      style={solid
        ? { background: `linear-gradient(135deg,${color},${deep})`, color: '#fff', boxShadow: `0 6px 18px ${color}45` }
        : { background: '#fff', color: deep, boxShadow: `inset 0 0 0 1.5px ${color}` }}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
