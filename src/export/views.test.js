import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { buildWebsite, buildOnePager } from './html.js'
import { prepareOnePager } from './prepare.js'
import { INPUT_FIELDS, DEMO_VALUES } from '../valueModel.js'
import { resolveStakeholder } from '../deck/stakeholders.js'
import { defaultDeck } from '../deck/model.js'

const fields = INPUT_FIELDS.map(f => ({ ...f, value: DEMO_VALUES[f.key] ?? f.value }))
const source = ['format.js', 'model.js', 'source.js', 'valueModel.js'].map(f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join('\n')
const stakeholder = resolveStakeholder({ key: 'finance', builtin: true })
const args = { company: 'Preview fixture', slides: defaultDeck(), stakeholders: [{ ...stakeholder, builtin: true }], activeKey: 'finance', inputs: { ...DEMO_VALUES }, sliders: [], vmSource: source }

test('PDF and Slides are standalone previews with no print or download on open', () => {
  for (const viewMode of ['pdf', 'slides']) {
    const html = buildWebsite({ ...args, viewMode })
    assert.ok(html.includes(`class="view-${viewMode}"`))
    assert.ok(html.includes('A4 landscape'))
    assert.equal(html.includes('window.print('), false)
    assert.equal(html.includes('.writeFile('), false)
    const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1]
    assert.ok(script)
    assert.doesNotThrow(() => new vm.Script(script))
    assert.equal(JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]).activeKey, 'finance')
  }
})

test('website view supports section navigation and scenario exploration without the internal stakeholder journey', () => {
  const html = buildWebsite({ ...args, viewMode: 'website' })
  assert.ok(html.includes('class="view-website"'))
  assert.equal(html.includes('Stakeholder perspective'),false)
  assert.equal(html.includes('Adjust assumptions'),false)
  assert.ok(html.includes('data-header-scenario>Adjust the numbers</button>'))
  assert.equal(html.includes('data-journey-node'),false)
  assert.ok(html.includes('Adjust the numbers'))
  assert.ok(html.includes('scroll-snap-type:none'))
  assert.ok(html.includes('Reset to the original'))
  assert.ok(html.includes('reading-progress'))
  assert.ok(html.includes('Close scenario explorer'))
  // the close button stays visible while the sliders scroll: the panel itself does not scroll, its body does
  assert.match(html, /<div class="whatif-heading">.*?<\/div>\s*<div class="whatif-body">/s)
  assert.match(html, /\.whatif\{[^}]*overflow:hidden/)
  assert.match(html, /\.whatif-body\{[^}]*overflow-y:auto/)
  assert.ok(html.includes('aria-expanded="false"'))
  assert.ok(html.includes('prefers-reduced-motion'))
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1]
  assert.doesNotThrow(() => new vm.Script(script))
  for (const viewMode of ['pdf', 'slides']) {
    const other = buildWebsite({ ...args, viewMode })
    assert.equal(other.includes('.view-website{--site-width:1120px}'), false)
  }
})

test('one-pager rearranges model figures, driver arithmetic and stakeholder needs onto A4', () => {
  const facts = prepareOnePager({ inputs: DEMO_VALUES, fields, who: stakeholder, date: 'October 24, 2026' })
  const html = buildOnePager({ facts })
  assert.ok(html.includes('A4 portrait'))
  assert.ok(html.includes('onepager-content'))
  assert.ok(html.includes('Value drivers'))
  assert.ok(html.includes('Portal versus self-hosting'))
  for (const stat of facts.stats) assert.ok(html.includes(stat.value))
  for (const group of facts.groups) for (const row of group.rows) assert.ok(html.includes(row.valueStr))
  assert.equal(html.includes('window.print('), false)
  assert.equal(html.includes('confidence'), false)
  assert.equal(html.includes('sourceUrl'), false)
})

test('one-pager excludes unavailable figures instead of fabricating zeroes', () => {
  const empty = INPUT_FIELDS.map(f => ({ ...f, value: f.structural ? f.value : '' }))
  const facts = prepareOnePager({ inputs: Object.fromEntries(empty.map(f => [f.key, f.value])), fields: empty, who: stakeholder })
  const html = buildOnePager({ facts })
  assert.equal(html.includes('brief-stat good'), false)
  assert.equal(html.includes('$0'), false)
  assert.equal(html.includes('Where the value comes from'), false)
})

test('Live Room does not repeat a company-name heading in the sticky header',()=>{
 const web=buildWebsite({...args,viewMode:'website'});
 const slides=buildWebsite({...args,viewMode:'slides'});
 const header=web.match(/<header class="top">([\s\S]*?)<\/header>/)[1];
 assert.equal(header.includes('class="co"'),false);
 assert.equal(slides.includes('<div class="co">'),false);
  assert.ok(buildWebsite({...args,viewMode:'pdf'}).includes('<div class="co">Preview fixture</div>'));
});
