// Writes the sample (Nike) case's default pitch deck to a pptx for inspection.
// Usage: node scripts/pitch-pptx.mjs [/tmp/pitch-nike.pptx]
import { writeFileSync } from 'node:fs'
import PptxGenJS from 'pptxgenjs'
import { buildPptx } from '../src/export/pptx.js'
import { SAMPLE_CASES, createSampleCase } from '../src/sampleCases.js'
import { newProject } from '../src/projects.js'
import { buildEnv, defaultDeck, resolveSlides } from '../src/deck/model.js'
import { resolveStakeholder } from '../src/deck/stakeholders.js'
import { clientStakeholder } from '../src/stakeholderRequirements.js'

const out = process.argv[2] || '/tmp/pitch-nike.pptx'
const sample = SAMPLE_CASES.find(s => /nike/i.test(JSON.stringify(s).slice(0, 400))) || SAMPLE_CASES[0]
const p = createSampleCase(sample, newProject)
const inputs = Object.fromEntries(p.fields.map(f => [f.key, f.value]))
const env = buildEnv(inputs, p.fields, clientStakeholder(resolveStakeholder(p.stakeholders[0])))
const slides = resolveSlides(defaultDeck(), env)
const pptx = await buildPptx({ company: p.name, brand: p.brand, slides, deps: { PptxGenJS, logoPng: () => null, imageSize: async () => null } })
writeFileSync(out, await pptx.write({ outputType: 'nodebuffer' }))
console.log(`${p.name}: ${slides.length} slides -> ${out}`)
for (const s of slides) console.log('-', (s.blocks.find(b => b.kind === 'text' && ['title', 'headline', 'hero'].includes(b.style)) || {}).text)
