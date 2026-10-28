import fs from 'node:fs'
import {initWasm, Resvg} from '@resvg/resvg-wasm'

let ready
export async function rasterLogo(data) {
  if (/^data:image\/(png|jpeg);base64,/.test(data)) return data
  if (!/^data:image\/svg\+xml;base64,/.test(data)) return null
  const svg = Buffer.from(data.split(',')[1], 'base64').toString('utf8')
  if (svg.length > 900000 || /<(?:script|foreignObject|image|use)\b|\bon\w+\s*=|(?:href|src)\s*=|<!ENTITY|url\s*\(/i.test(svg)) throw Error('Unsafe SVG logo')
  ready ||= initWasm(fs.readFileSync(new URL('./resvg.wasm', import.meta.url)))
  await ready
  const renderer = new Resvg(svg, {fitTo:{mode:'width',value:800}})
  try {
    const image = renderer.render()
    try { return 'data:image/png;base64,' + Buffer.from(image.asPng()).toString('base64') }
    finally { image.free() }
  } finally { renderer.free() }
}
