import { useRef, useState } from 'react'

const SKY = '#8FCFE0'
const SKY_DEEP = '#4A9EB8'
const LAV = '#C3A6E8'

const R = 100          // face radius in viewBox units
const HAND = 74        // distance of a selectable number from centre

const pad = (n) => String(n).padStart(2, '0')

/** 'HH:mm' -> { h: 0-23, m: 0-59 }, tolerant of junk. */
function parseTime(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value || '').trim())
  if (!m) return { h: 9, m: 0 }
  return {
    h: Math.min(23, Math.max(0, Number(m[1]))),
    m: Math.min(59, Math.max(0, Number(m[2]))),
  }
}

/** Value -> point on the dial. 12 o'clock is up, so subtract a quarter turn. */
function polar(value, steps, radius = HAND) {
  const a = (value / steps) * Math.PI * 2 - Math.PI / 2
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius }
}

/**
 * Circular clock face. Tap or drag the hand; hour picked first, then minute.
 * `onChange` fires with 'HH:mm' on every adjustment.
 */
export default function ClockPicker({ value, onChange, onDone }) {
  const { h, m } = parseTime(value)
  const [mode, setMode] = useState('hour')     // 'hour' | 'minute'
  // Only holds a value mid-typing, so the dial stays the source of truth.
  const [typed, setTyped] = useState(null)
  const svgRef = useRef(null)
  const dragging = useRef(false)

  const text = typed ?? `${pad(h)}:${pad(m)}`

  const emit = (nh, nm) => onChange(`${pad(nh)}:${pad(nm)}`)

  const isPM = h >= 12
  const hour12 = h % 12 === 0 ? 12 : h % 12

  const setHour12 = (v) => {                    // v is 1..12
    const base = v % 12
    emit(isPM ? base + 12 : base, m)
  }
  const setMeridiem = (pm) => {
    const base = h % 12
    emit(pm ? base + 12 : base, m)
  }

  // ─── Pointer → value ──────────────────────────────────────────────────────

  const valueAt = (evt) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = evt.clientX - cx
    const dy = evt.clientY - cy
    // atan2 gives -PI..PI from the +x axis; rotate so 0 is 12 o'clock.
    let turns = (Math.atan2(dy, dx) + Math.PI / 2) / (Math.PI * 2)
    if (turns < 0) turns += 1
    return turns
  }

  const applyPointer = (evt) => {
    const turns = valueAt(evt)
    if (turns === null) return
    if (mode === 'hour') {
      const v = Math.round(turns * 12) % 12
      setHour12(v === 0 ? 12 : v)
    } else {
      emit(h, Math.round(turns * 60) % 60)
    }
  }

  const onPointerDown = (e) => {
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    applyPointer(e)
  }
  const onPointerMove = (e) => { if (dragging.current) applyPointer(e) }
  const onPointerUp = (e) => {
    if (!dragging.current) return
    dragging.current = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    // Picking the hour naturally leads into picking the minute.
    if (mode === 'hour') setMode('minute')
  }

  // ─── Typed entry ──────────────────────────────────────────────────────────

  const onText = (raw) => {
    setTyped(raw)
    const parsed = /^(\d{1,2}):(\d{2})$/.exec(raw.trim())
    if (!parsed) return
    const nh = Number(parsed[1]), nm = Number(parsed[2])
    if (nh > 23 || nm > 59) return
    emit(nh, nm)
  }

  const handPos = mode === 'hour' ? polar(hour12 % 12, 12) : polar(m, 60)

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Digital readout — hour / minute segments double as mode switches */}
      <div className="flex items-center gap-2">
        <div className="flex items-baseline rounded-2xl px-3 py-2" style={{ background: '#FBF5EC' }}>
          <button
            type="button" onClick={() => setMode('hour')}
            className="text-[30px] font-bold tabular-nums px-1 rounded-lg transition-colors"
            style={{ color: mode === 'hour' ? SKY_DEEP : '#C6B6A2', fontFamily: 'Fraunces, serif' }}
          >
            {pad(hour12)}
          </button>
          <span className="text-[26px] font-bold" style={{ color: '#C6B6A2' }}>:</span>
          <button
            type="button" onClick={() => setMode('minute')}
            className="text-[30px] font-bold tabular-nums px-1 rounded-lg transition-colors"
            style={{ color: mode === 'minute' ? SKY_DEEP : '#C6B6A2', fontFamily: 'Fraunces, serif' }}
          >
            {pad(m)}
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {[['AM', false], ['PM', true]].map(([label, pm]) => (
            <button
              key={label} type="button" onClick={() => setMeridiem(pm)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
              style={isPM === pm
                ? { background: SKY, color: '#fff' }
                : { background: '#FBF5EC', color: '#B5A28C' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dial */}
      <svg
        ref={svgRef}
        viewBox="-120 -120 240 240"
        className="w-[240px] h-[240px] touch-none cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label={mode === 'hour' ? 'Hour' : 'Minute'}
        aria-valuetext={`${pad(hour12)}:${pad(m)} ${isPM ? 'PM' : 'AM'}`}
      >
        <circle cx="0" cy="0" r={R + 14} fill="#F6FCFE" stroke="#E4F1F7" strokeWidth="1.5" />

        {/* Hand */}
        <line x1="0" y1="0" x2={handPos.x} y2={handPos.y} stroke={SKY} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={handPos.x} cy={handPos.y} r="17" fill={SKY} opacity="0.9" />
        <circle cx="0" cy="0" r="4" fill={SKY_DEEP} />

        {/* Numbers */}
        {mode === 'hour'
          ? Array.from({ length: 12 }, (_, i) => {
              const label = i === 0 ? 12 : i
              const p = polar(i, 12)
              const active = hour12 % 12 === i
              return (
                <text
                  key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="15" fontWeight="700" fontFamily="Quicksand, sans-serif"
                  fill={active ? '#fff' : '#7A9CAB'} pointerEvents="none"
                >
                  {label}
                </text>
              )
            })
          : Array.from({ length: 12 }, (_, i) => {
              const label = i * 5
              const p = polar(label, 60)
              const active = m === label
              return (
                <text
                  key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="14" fontWeight="700" fontFamily="Quicksand, sans-serif"
                  fill={active ? '#fff' : '#7A9CAB'} pointerEvents="none"
                >
                  {pad(label)}
                </text>
              )
            })}

        {/* Minute ticks — the in-between minutes are still selectable by drag */}
        {mode === 'minute' && Array.from({ length: 60 }, (_, i) => {
          if (i % 5 === 0) return null
          const p = polar(i, 60, HAND + 16)
          return <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="#CBE3ED" pointerEvents="none" />
        })}
      </svg>

      {/* Typed entry */}
      <div className="w-full flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={e => onText(e.target.value)}
          onBlur={() => setTyped(null)}
          aria-label="Time (24-hour, HH:MM)"
          placeholder="HH:MM"
          className="flex-1 min-w-0 rounded-2xl px-4 py-2.5 text-sm font-bold text-center tabular-nums outline-none"
          style={{ background: '#FBF5EC', border: '1.5px solid #F0E6D8', color: '#4A3A30' }}
        />
        {onDone && (
          <button
            type="button" onClick={onDone}
            className="px-6 py-2.5 rounded-2xl font-bold text-sm text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${SKY},${LAV})` }}
          >
            Set time
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * A tappable field that opens the dial. Drop-in for <input type="time">.
 *
 * The dial floats in its own full-screen layer rather than sitting inside the
 * field's parent — a popover would be clipped by the scrolling modal it is
 * usually rendered in. Edits apply live; "Set time" just dismisses.
 */
export function TimeField({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const { h, m } = parseTime(value)
  const hour12 = h % 12 === 0 ? 12 : h % 12

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-haspopup="dialog"
        className="w-full rounded-2xl px-4 py-2.5 text-sm font-bold text-left flex items-center justify-between gap-2"
        style={{ background: '#FBF5EC', border: '1.5px solid #F0E6D8', color: '#4A3A30' }}
      >
        <span className="tabular-nums">{pad(hour12)}:{pad(m)}</span>
        <span className="text-[11px] font-bold" style={{ color: SKY_DEEP }}>{h >= 12 ? 'PM' : 'AM'}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(74,58,48,0.35)', backdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={label || 'Pick a time'}
        >
          <div
            className="rounded-3xl p-5 w-full max-w-[300px]"
            style={{ background: '#fff', border: '1px solid #F0E6D8', boxShadow: '0 18px 44px rgba(74,58,48,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            {label && (
              <p className="text-[13px] font-semibold mb-3 text-center" style={{ color: '#9C8877' }}>{label}</p>
            )}
            <ClockPicker value={value} onChange={onChange} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
