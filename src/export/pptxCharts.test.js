import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'
import { buildPptx } from './pptx.js'
import { outOfBounds } from './pptxDimensions.test.js'
import { SAMPLE_CASES, createSampleCase } from '../sampleCases.js'
import { newProject } from '../projects.js'
import { buildEnv, resolveBlock, block, BLOCK_MENU, LIVE } from '../deck/model.js'
import { resolveStakeholder } from '../deck/stakeholders.js'
import { clientStakeholder } from '../stakeholderRequirements.js'

function envFor(blank = false) {
  const p = createSampleCase(SAMPLE_CASES[0], newProject)
  const fields = blank ? p.fields.map(f => ({ ...f, value: '', source: { state: 'empty', origin: '' } })) : p.fields
  const inputs = Object.fromEntries(fields.map(f => [f.key, f.value]))
  return { p, env: buildEnv(inputs, fields, clientStakeholder(resolveStakeholder(p.stakeholders[0]))) }
}
const chart = kind => block('chart', { kind })

test('chart blocks are in the menu and live', () => {
  for (const n of ['Payback chart', 'Value breakdown chart', 'Input confidence chart']) assert.ok(BLOCK_MENU.some(m => m.name === n))
  assert.ok(LIVE.has('chart'))
})

test('payback chart: 36 months of cumulative value and cost from the model', () => {
  const { env } = envFor()
  const r = resolveBlock(chart('payback'), env)
  assert.equal(r.incomplete, undefined)
  assert.equal(r.months.length, 36)
  const F = env.model.figures
  assert.equal(r.value[11], Math.round(F.totalValue.value))
  assert.equal(r.cost[11], Math.round(env.model.inputs.portalCost))
})

test('breakdown chart lists known drivers with capacity vs spend labels', () => {
  const { env } = envFor()
  const r = resolveBlock(chart('breakdown'), env)
  assert.ok(r.rows.length > 0)
  for (const row of r.rows) assert.ok(['Capacity value', 'Spend reduction'].includes(row.groupLabel))
  const tooling = r.rows.find(x => x.key === 'toolingValue')
  if (tooling) assert.equal(tooling.group, 'spend')
})

test('confidence chart counts inputs by source state', () => {
  const { env } = envFor()
  const r = resolveBlock(chart('confidence'), env)
  assert.equal(r.rows.map(x => x.key).join(), 'input,assumption,suggestion,empty')
  assert.equal(r.rows.reduce((t, x) => t + x.count, 0), r.total)
  assert.ok(r.rows.find(x => x.key === 'assumption').count > 0)
})

test('missing inputs: charts wait instead of showing zeros', () => {
  const { env } = envFor(true)
  for (const k of ['payback', 'breakdown']) {
    const r = resolveBlock(chart(k), env)
    assert.equal(r.incomplete, true, k)
    assert.ok(r.waiting.length > 0, k)
    assert.equal(r.value, undefined)
  }
  const c = resolveBlock(chart('confidence'), env)
  assert.equal(c.rows.find(x => x.key === 'empty').count, c.total)
})

test('each chart kind exports a native PowerPoint chart inside the slide', async () => {
  const { p, env } = envFor()
  for (const kind of ['payback', 'breakdown', 'confidence']) {
    const slides = [{ id: 's', layout: 'plain', design: {}, blocks: [resolveBlock(chart(kind), env)] }]
    const pptx = await buildPptx({ company: p.name, brand: p.brand, slides, deps: { PptxGenJS, logoPng: () => null, imageSize: async () => null } })
    const zip = await JSZip.loadAsync(await pptx.write({ outputType: 'nodebuffer' }))
    const charts = Object.keys(zip.files).filter(f => /^ppt\/charts\/chart\d+\.xml$/.test(f))
    assert.equal(charts.length, 1, kind)
    const xml = await zip.file(charts[0]).async('string')
    assert.match(xml, kind === 'payback' ? /<c:lineChart>/ : kind === 'breakdown' ? /<c:barChart>/ : /<c:doughnutChart>/)
    const slide = await zip.file('ppt/slides/slide1.xml').async('string')
    assert.deepEqual(outOfBounds(slide), [], kind)
    const frame = slide.match(/<p:graphicFrame>[\s\S]*?<a:off x="(\d+)" y="(\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"\/>/)
    assert.ok(frame, kind)
    const [x, y, w, h] = frame.slice(1).map(Number)
    assert.ok(x >= 0 && y >= 0 && x + w <= 12192000 && y + h <= 6858000, kind)
  }
})
