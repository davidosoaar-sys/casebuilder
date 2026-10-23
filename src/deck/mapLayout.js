// Default positions for the stakeholder map, as percentages of the map box.
//
// The company sits in the middle. Stakeholders start spread evenly on an
// ellipse, arranged so 2 sit left and right, 3 form a triangle and 4 sit on the
// diagonals (a wide box leaves its corners empty, so a "+" shape wastes space
// and looks stiff). If boxes would touch (many stakeholders), they are nudged
// apart until they don't.

// Sizes used by the CSS, in pixels. Only used to decide whether boxes touch.
export const MAP = { w: 920, h: 500 }
export const NODE = { w: 176, h: 58 }
export const CENTER = { w: 180, h: 88 }
const GAP = 8

const RX = 37
const RY = 34

const rad = deg => (deg * Math.PI) / 180

function startAngles(n) {
  if (n === 1) return [-90]
  if (n === 2) return [180, 0]
  const start = n % 2 === 0 ? -90 + 180 / n : -90
  return Array.from({ length: n }, (_, i) => start + (360 / n) * i)
}

export function defaultPositions(n) {
  if (n <= 0) return []

  // Work in pixels from here so box sizes are meaningful.
  const pts = startAngles(n).map(a => ({
    x: (0.5 + (RX / 100) * Math.cos(rad(a))) * MAP.w,
    y: (0.5 + (RY / 100) * Math.sin(rad(a))) * MAP.h
  }))

  const cx = MAP.w / 2
  const cy = MAP.h / 2
  const minX = NODE.w / 2 + 6
  const maxX = MAP.w - minX
  const minY = NODE.h / 2 + 6
  const maxY = MAP.h - minY

  // Push overlapping boxes apart along whichever axis needs the least movement.
  for (let pass = 0; pass < 400; pass++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pts[j].x - pts[i].x
        const dy = pts[j].y - pts[i].y
        const ox = NODE.w + GAP - Math.abs(dx)
        const oy = NODE.h + GAP - Math.abs(dy)
        if (ox > 0 && oy > 0) {
          moved = true
          if (ox < oy) {
            const s = (dx >= 0 ? 1 : -1) * (ox / 2 + 0.5)
            pts[i].x -= s
            pts[j].x += s
          } else {
            const s = (dy >= 0 ? 1 : -1) * (oy / 2 + 0.5)
            pts[i].y -= s
            pts[j].y += s
          }
        }
      }
      // keep clear of the company box
      const dx = pts[i].x - cx
      const dy = pts[i].y - cy
      const ox = (NODE.w + CENTER.w) / 2 + GAP - Math.abs(dx)
      const oy = (NODE.h + CENTER.h) / 2 + GAP - Math.abs(dy)
      if (ox > 0 && oy > 0) {
        moved = true
        if (ox < oy) pts[i].x += (dx >= 0 ? 1 : -1) * (ox + 0.5)
        else pts[i].y += (dy >= 0 ? 1 : -1) * (oy + 0.5)
      }
      pts[i].x = Math.min(maxX, Math.max(minX, pts[i].x))
      pts[i].y = Math.min(maxY, Math.max(minY, pts[i].y))
    }
    if (!moved) break
  }

  return pts.map(p => ({ x: (p.x / MAP.w) * 100, y: (p.y / MAP.h) * 100 }))
}

// Faint guide ellipses for the map background: [rx, ry] in percent.
export const GUIDE_RINGS = [
  [RX, RY],
  [RX * 0.6, RY * 0.6]
]
