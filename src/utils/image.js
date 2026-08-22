/**
 * Symbols live in plain `text` columns (tasks.emoji, spaces.emoji,
 * expense_categories.emoji, habits.emoji), so a custom image has to be small
 * enough to sit inside one. A centre-cropped 128px WebP lands around 6-15KB.
 */

const MAX_BYTES = 8 * 1024 * 1024

/** Centre-crop `file` to a square, downscale to `size`px, return a data URL. */
export async function fileToSquareDataUrl(file, size = 128) {
  if (!file) throw new Error('No file selected')
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image')
  if (file.size > MAX_BYTES) throw new Error('Image is too large (max 8MB)')

  const img = await loadImage(file)
  const side = Math.min(img.width, img.height)
  const sx = (img.width - side) / 2
  const sy = (img.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

  // Safari used to hand back a stub for unsupported types rather than throwing.
  const webp = canvas.toDataURL('image/webp', 0.8)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png')
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')) }
    img.src = url
  })
}

/** True when a symbol value is an uploaded image rather than an emoji. */
export const isImageSymbol = (value) => typeof value === 'string' && value.startsWith('data:')
