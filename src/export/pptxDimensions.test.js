import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'
import { buildPptx } from './pptx.js'
import { dataUrlSize } from './imageSize.js'
import { SAMPLE_CASES, createSampleCase } from '../sampleCases.js'
import { newProject } from '../projects.js'
import { buildEnv, resolveSlides } from '../deck/model.js'
import { resolveStakeholder } from '../deck/stakeholders.js'
import { clientStakeholder } from '../stakeholderRequirements.js'

// Standard 16:9 PowerPoint: 13.333 x 7.5 in (LAYOUT_WIDE).
const CX = 12192000, CY = 6858000

export async function sampleDeckXml(sample) {
  const p = createSampleCase(sample, newProject)
  const inputs = Object.fromEntries(p.fields.map(f => [f.key, f.value]))
  const env = buildEnv(inputs, p.fields, clientStakeholder(resolveStakeholder(p.stakeholders[0])))
  const pptx = await buildPptx({ company: p.name, brand: p.brand, slides: resolveSlides(p.deck, env), deps: { PptxGenJS, logoPng: () => null, imageSize: async src => dataUrlSize(src) } })
  return JSZip.loadAsync(await pptx.write({ outputType: 'nodebuffer' }))
}

export function outOfBounds(xml) {
  const bad = []
  for (const m of xml.matchAll(/<a:off x="(-?\d+)" y="(-?\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"\/>/g)) {
    const [x, y, w, h] = m.slice(1).map(Number)
    if (x < 0 || y < 0 || x + w > CX + 1 || y + h > CY + 1) bad.push({ x, y, w, h })
  }
  return bad
}

for (const sample of SAMPLE_CASES) {
  test(`${sample.name} sample exports as standard 16:9 PowerPoint with every shape on the slide`, async () => {
    const zip = await sampleDeckXml(sample)
    const pres = await zip.file('ppt/presentation.xml').async('string')
    assert.match(pres, new RegExp(`<p:sldSz cx="${CX}" cy="${CY}"`))
    const slides = Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    assert.ok(slides.length > 0)
    for (const f of slides) {
      const bad = outOfBounds(await zip.file(f).async('string'))
      assert.deepEqual(bad, [], `${f} has shapes outside 13.333 x 7.5 in`)
    }
  })
}

test('default unbranded deck (hero glow included) stays inside 13.333 x 7.5 in', async () => {
  const p = newProject('Example', {})
  const inputs = Object.fromEntries(p.fields.map(f => [f.key, f.value]))
  const env = buildEnv(inputs, p.fields, clientStakeholder(resolveStakeholder(p.stakeholders[0])))
  const slides = resolveSlides(p.deck, env).map((s, i) => i === 0 ? { ...s, variant: 'hero', design: {} } : s)
  const pptx = await buildPptx({ company: 'Example', slides, deps: { PptxGenJS, logoPng: () => null, imageSize: async src => dataUrlSize(src) } })
  const zip = await JSZip.loadAsync(await pptx.write({ outputType: 'nodebuffer' }))
  assert.match(await zip.file('ppt/presentation.xml').async('string'), new RegExp(`<p:sldSz cx="${CX}" cy="${CY}"`))
  for (const f of Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))) assert.deepEqual(outOfBounds(await zip.file(f).async('string')), [], f)
})
