import { useState } from 'react'

const GROUPS = [
  {
    label: 'Smileys',
    emojis: ['😊','😄','🥰','😍','🤩','😂','🥹','😌','🙃','🤗','😎','🥳','🤓','😴','🤔','😮','😇','🥺','😢','😤'],
  },
  {
    label: 'Food & drink',
    emojis: ['🍓','🍎','🍊','🍋','🍇','🍒','🍑','🥝','🫐','🍌','🥑','🥦','🥕','🌽','🥗','🍜','🍕','🍔','🍰','🎂','☕','🧋','🍵','🧃','🥤','🍷'],
  },
  {
    label: 'Activity & health',
    emojis: ['🏃‍♀️','🧘‍♀️','🤸‍♀️','🚴‍♀️','🏋️‍♀️','🤾‍♀️','🧗‍♀️','🏊‍♀️','🚶‍♀️','💪','🧠','💊','💉','🩺','🏥','🛁','🪥','😴','🌙','⭐'],
  },
  {
    label: 'Nature',
    emojis: ['🌸','🌷','🌹','🌺','🌻','🌼','🌿','🍀','🍃','🌱','🌲','🌳','🪴','🌵','🌾','🍂','🍁','🌊','☀️','🌈','⛅','🌙','✨','💫','🔥','❄️'],
  },
  {
    label: 'Objects',
    emojis: ['💰','💳','💎','🎁','📦','📚','📖','✏️','📝','🎯','🏆','🥇','🎖️','⏰','⏱️','📅','🗓️','💡','🔑','🏠','🚗','✈️','🎵','🎨','🎬','📷'],
  },
  {
    label: 'Symbols',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💗','💕','💞','💓','❣️','💯','✅','⚡','🌟','⭐','🔮','🪄','🎀','🪸','🫧','💎','🌀'],
  },
]

/**
 * Inline emoji picker grid.
 * `onSelect(emoji)` is called when an emoji is tapped.
 */
export default function EmojiPicker({ onSelect, selected, className = '' }) {
  const [activeGroup, setActiveGroup] = useState(0)

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ border: '1px solid #F0E6D8' }}>
      {/* Group tabs */}
      <div className="flex scroll-x" style={{ background: '#FBF5EC', borderBottom: '1px solid #F0E6D8' }}>
        {GROUPS.map((g, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveGroup(i)}
            className="px-3 py-2 text-[11px] font-bold whitespace-nowrap transition-all shrink-0"
            style={activeGroup === i
              ? { color: '#C4551F', borderBottom: '2px solid #E8703A', background: '#fff' }
              : { color: '#B5A28C', borderBottom: '2px solid transparent' }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 sm:grid-cols-10 gap-0.5 p-2" style={{ background: '#fff' }}>
        {GROUPS[activeGroup].emojis.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => onSelect(e)}
            className="text-xl rounded-xl p-1 transition-all hover:scale-125"
            style={selected === e
              ? { background: '#FDEEE4', boxShadow: 'inset 0 0 0 1.5px #E8703A' }
              : { background: 'transparent' }}
            aria-label={e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
