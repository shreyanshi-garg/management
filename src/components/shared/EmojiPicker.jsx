import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { fileToSquareDataUrl, isImageSymbol } from '../../utils/image'
import Symbol from './Symbol'

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
  {
    label: 'Doodles',
    emojis: ['✿','❀','❁','✾','✽','☘','♧','♡','♥','☾','☽','✧','✦','⋆','⟡','✩','✫','✬','⊹','ღ','❥','࿔','༄','⌇','❃','❉','⁘','⟢','◌','⟠'],
  },
  {
    label: 'Anime',
    emojis: ['🌸','⛩️','🍥','🗾','👘','🎌','🍡','🎋','🏯','🎐','🍙','🥷','🐉','🌊','(｡•̀ᴗ-)✧','(๑>ᴗ<๑)','ʕ•ᴥ•ʔ','(づ｡◕‿‿◕｡)づ','(◕‿◕✿)','ヽ(•‿•)ノ','(⁄ ⁄•⁄ω⁄•⁄ ⁄)','(=^･ω･^=)','(・_・;)','٩(◕‿◕)۶'],
  },
]

/**
 * Symbol picker: type anything, upload an image, or tap a preset.
 * `onSelect(value)` receives an emoji/kaomoji string or an image data URL.
 */
export default function EmojiPicker({ onSelect, selected }) {
  const [activeGroup, setActiveGroup] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const custom = isImageSymbol(selected) ? '' : (selected || '')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again after a failure
    if (!file) return
    setError('')
    setBusy(true)
    try {
      onSelect(await fileToSquareDataUrl(file))
    } catch (err) {
      setError(err.message || 'Could not use that image')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F0E6D8' }}>
      {/* Type-anything + upload */}
      <div className="flex items-center gap-2 p-2" style={{ background: '#fff', borderBottom: '1px solid #F0E6D8' }}>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative"
          style={{ background: '#FBF5EC' }}
        >
          <Symbol value={selected} size={26} />
          {isImageSymbol(selected) && (
            <button
              type="button"
              onClick={() => onSelect('')}
              aria-label="Remove image"
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
              style={{ background: '#FF9EBB' }}
            >
              <X size={9} />
            </button>
          )}
        </div>

        <input
          type="text"
          value={custom}
          onChange={e => onSelect(e.target.value)}
          placeholder="Type any emoji…"
          aria-label="Type your own symbol"
          className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
          style={{ background: '#FBF5EC', border: '1.5px solid #F0E6D8', color: '#4A3A30' }}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-bold shrink-0 disabled:opacity-50"
          style={{ background: '#F0E6FF', color: '#7B5EA7' }}
        >
          <ImagePlus size={14} /> {busy ? '…' : 'Image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      {error && (
        <p className="px-3 py-1.5 text-[11px] font-semibold" style={{ background: '#FFF0F5', color: '#E5527A' }}>{error}</p>
      )}

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
            className="rounded-xl p-1 transition-all hover:scale-125 flex items-center justify-center h-9"
            style={selected === e
              ? { background: '#FDEEE4', boxShadow: 'inset 0 0 0 1.5px #E8703A' }
              : { background: 'transparent' }}
            aria-label={e}
          >
            <Symbol value={e} size={20} />
          </button>
        ))}
      </div>
    </div>
  )
}
