/**
 * The primary gradient pill used for every "add / save" action.
 */
export default function PillButton({
  color = '#E8703A',
  deep = '#C4551F',
  children,
  ...props
}) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      style={{ background: `linear-gradient(135deg,${color},${deep})`, color: '#fff', boxShadow: `0 6px 18px ${color}45` }}
      {...props}
    >
      {children}
    </button>
  )
}
