import { isImageSymbol } from '../../utils/image'

/**
 * Renders a symbol that may be an emoji, a kaomoji, or an uploaded image
 * (stored as a data URL). Everywhere a symbol shows up goes through here so
 * the two are interchangeable.
 */
export default function Symbol({ value, size = 20, className = '', fallback = '✨' }) {
  if (isImageSymbol(value)) {
    return (
      <img
        src={value}
        alt=""
        className={`rounded-lg object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  const text = value || fallback
  // Kaomoji need to shrink or they blow out the layout they sit in.
  const fontSize = text.length > 2 ? Math.max(9, size * 0.42) : size
  return (
    <span
      className={`inline-flex items-center justify-center leading-none shrink-0 ${className}`}
      style={{ fontSize, minWidth: size, height: size }}
    >
      {text}
    </span>
  )
}
