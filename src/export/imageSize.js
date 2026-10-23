// Natural width and height of an image from its first bytes, so the PowerPoint
// export can fit pictures without a browser. Handles PNG, JPEG and GIF data
// URLs; anything else falls back to 4:3.

function toBytes(dataUrl) {
  const m = /^data:[^;,]+(;base64)?,(.*)$/s.exec(dataUrl || '')
  if (!m) return null
  if (m[1]) {
    const bin = typeof atob === 'function' ? atob(m[2]) : Buffer.from(m[2], 'base64').toString('binary')
    return Uint8Array.from(bin, c => c.charCodeAt(0))
  }
  return null
}

export function dataUrlSize(src) {
  const b = toBytes(src)
  if (!b || b.length < 24) return { w: 4, h: 3 }
  const u32 = i => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
  // PNG
  if (b[0] === 0x89 && b[1] === 0x50) return { w: u32(16), h: u32(20) }
  // GIF
  if (b[0] === 0x47 && b[1] === 0x49) return { w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8) }
  // JPEG: walk the segments to the first start-of-frame marker
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++
        continue
      }
      const marker = b[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] }
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3])
    }
  }
  return { w: 4, h: 3 }
}
