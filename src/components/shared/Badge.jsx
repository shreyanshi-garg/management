const presets = {
  work: { bg: '#EEF6FF', text: '#5B8DBE', label: '💼 Work' },
  home: { bg: '#FFF6EC', text: '#E09B4C', label: '🏡 Home' },
  trip: { bg: '#EFFBF3', text: '#3FA968', label: '✈️ Trip' },
  misc: { bg: '#F7F0FF', text: '#9061C2', label: '🌼 Misc' },

  todo:       { bg: '#FBF5EC', text: '#A6947F', label: 'To do' },
  inProgress: { bg: '#FFF6EC', text: '#E09B4C', label: 'In progress' },
  done:       { bg: '#EFFBF3', text: '#3FA968', label: 'Done ✓' },

  high:   { bg: '#FFF0F5', text: '#E5527A', label: '🌹 High' },
  medium: { bg: '#FFF6EC', text: '#E09B4C', label: '🌼 Medium' },
  low:    { bg: '#EEFAFD', text: '#4A9EB8', label: '🌱 Low' },
}

export default function Badge({ type, custom }) {
  const style = presets[type] || { bg: '#FBF5EC', text: '#A6947F', label: type }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: style.bg, color: style.text }}
    >
      {custom || style.label}
    </span>
  )
}
