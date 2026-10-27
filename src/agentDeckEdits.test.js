import test from 'node:test'
import assert from 'node:assert/strict'
import { applyDeckOps, undoDeckOps, applyAgentReply, undoAgentReply, agentFonts, MAX_DECK_OPS, MAX_TEXT } from './agentDeckEdits.js'
import { defaultDeck } from './deck/model.js'
import { DEFAULT_BRAND } from './brand.js'
import { INPUT_FIELDS } from './valueModel.js'

const NOW = '2026-10-26T12:00:00.000Z'
const deck = () => defaultDeck()
const brand = () => ({ ...DEFAULT_BRAND })
const hero = d => d[0].blocks.find(b => b.style === 'hero')

test('set_text changes one block, says where, and leaves the input deck alone', () => {
  const d = deck()
  const before = JSON.stringify(d)
  const r = applyDeckOps(d, brand(), [{ op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, field: 'text', value: '{company} platform case' }], { now: NOW })
  assert.equal(hero(r.deck).text, '{company} platform case')
  assert.equal(JSON.stringify(d), before)
  assert.deepEqual(r.refused, [])
  assert.equal(r.changes.length, 1)
  assert.equal(r.changes[0].sentence, 'Changed the hero title on page 1')
  assert.equal(r.changes[0].before, '{company}')
})

test('set_text defaults the field and refuses fields a block does not have', () => {
  const d = deck()
  const ok = applyDeckOps(d, brand(), [{ op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: 'New' }])
  assert.equal(hero(ok.deck).text, 'New')
  const bad = applyDeckOps(d, brand(), [{ op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, field: 'src', value: 'x' }])
  assert.equal(bad.changes.length, 0)
  assert.equal(bad.refused.length, 1)
  const live = d[1].blocks.find(b => b.type === 'versus')
  assert.equal(applyDeckOps(d, brand(), [{ op: 'set_text', slide_id: d[1].id, block_id: live.id, value: 'x' }]).refused.length, 1)
})

test('unknown ids, bad enums, empty and overlong text are refused, not guessed', () => {
  const d = deck()
  const r = applyDeckOps(d, brand(), [
    { op: 'set_text', slide_id: 'nope', block_id: 'x', value: 'a' },
    { op: 'set_text', slide_id: d[0].id, block_id: 'nope', value: 'a' },
    { op: 'set_style', slide_id: d[0].id, block_id: hero(d).id, style: 'giant' },
    { op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: '   ' },
    { op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: 'x'.repeat(MAX_TEXT + 1) },
    { op: 'add_slide', template: 'poster' },
    { op: 'add_block', slide_id: d[0].id, kind: 'Image' },
    { op: 'add_block', slide_id: d[0].id, kind: 'Logo' },
    { op: 'explode' },
    null
  ])
  assert.equal(r.changes.length, 0)
  assert.equal(r.refused.length, 10)
  assert.deepEqual(r.deck, d)
})

test('set_style changes a text style only', () => {
  const d = deck()
  const title = d[2].blocks.find(b => b.style === 'title')
  const r = applyDeckOps(d, brand(), [{ op: 'set_style', slide_id: d[2].id, block_id: title.id, style: 'headline' }])
  assert.equal(r.deck[2].blocks.find(b => b.id === title.id).style, 'headline')
  assert.equal(r.changes[0].sentence, 'Made the title on page 3 a headline')
})

test('add_slide after a page with the agent own text replaces the template text', () => {
  const d = deck()
  const r = applyDeckOps(d, brand(), [{ op: 'add_slide', template: 'bullets', after_slide_id: d[0].id, texts: [{ style: 'title', text: 'Rollout plan' }, { style: 'body', text: '- Pilot\n- Expand\n- Migrate' }] }])
  assert.equal(r.deck.length, d.length + 1)
  const page = r.deck[1]
  assert.deepEqual(page.blocks.map(b => [b.style, b.text]), [['title', 'Rollout plan'], ['body', '- Pilot\n- Expand\n- Migrate']])
  assert.ok(page.id && page.blocks.every(b => b.id))
  assert.equal(r.changes[0].sentence, 'Added a page "Rollout plan" after page 1')
  const end = applyDeckOps(d, brand(), [{ op: 'add_slide', template: 'drivers', after_slide_id: null }])
  assert.equal(end.deck.at(-1).blocks.some(b => b.type === 'drivers'), true)
  assert.match(end.changes[0].sentence, /at the end$/)
  assert.equal(applyDeckOps(d, brand(), [{ op: 'add_slide', template: 'drivers', texts: [{ style: 'title', text: 'x' }] }]).refused.length, 1)
})

test('remove, move and block ops', () => {
  const d = deck()
  const r = applyDeckOps(d, brand(), [
    { op: 'move_slide', slide_id: d[5].id, to_index: 1 },
    { op: 'remove_slide', slide_id: d[4].id },
    { op: 'add_block', slide_id: d[0].id, after_block_id: hero(d).id, kind: 'Quote', text: 'Ship faster.' },
    { op: 'remove_block', slide_id: d[0].id, block_id: d[0].blocks[0].id }
  ])
  assert.deepEqual(r.refused, [])
  assert.equal(r.deck[1].id, d[5].id)
  assert.equal(r.deck.some(s => s.id === d[4].id), false)
  assert.deepEqual(r.deck[0].blocks.map(b => b.type), ['text', 'quote', 'text', 'text', 'text'])
  assert.equal(r.deck[0].blocks[1].text, 'Ship faster.')
  assert.deepEqual(r.changes.map(c => c.sentence), [
    'Moved "Business impact" to page 2',
    'Removed page 6, "This room"',
    'Added a quote to page 1',
    'Removed the logo from page 1'
  ])
})

test('set_brand takes #rrggbb colours and known fonts only, never images', () => {
  const r = applyDeckOps(deck(), brand(), [{ op: 'set_brand', background: '#FFFFFF', text: 'white', headingFont: 'georgia', bodyFont: 'Comic Sans', logo: 'data:x' }])
  assert.equal(r.brand.background, '#ffffff')
  assert.equal(r.brand.headingFont, 'Georgia')
  assert.equal(r.brand.text, DEFAULT_BRAND.text)
  assert.equal(r.brand.logo, '')
  assert.deepEqual(r.changes.map(c => c.sentence), ['Background #111111 → #ffffff', 'Heading font Outfit → Georgia'])
  assert.equal(r.refused.length, 3)
  assert.ok(agentFonts({ headingFont: 'Circular' }).includes('Circular'))
})

test('more than the cap: the rest are dropped and said so', () => {
  const d = deck()
  const ops = Array.from({ length: MAX_DECK_OPS + 3 }, (_, i) => ({ op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: `T${i}` }))
  const r = applyDeckOps(d, brand(), ops)
  assert.equal(r.changes.length, MAX_DECK_OPS)
  assert.match(r.refused.at(-1), /first 25/)
})

test('undo puts everything back when nothing changed since', () => {
  const d = deck()
  const b = brand()
  const ops = [
    { op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: 'X' },
    { op: 'add_slide', template: 'text', after_slide_id: d[0].id },
    { op: 'move_slide', slide_id: d[3].id, to_index: 0 },
    { op: 'remove_slide', slide_id: d[2].id },
    { op: 'add_block', slide_id: d[1].id, kind: 'Divider' },
    { op: 'remove_block', slide_id: d[0].id, block_id: d[0].blocks[2].id },
    { op: 'set_brand', background: '#ffffff' }
  ]
  const r = applyDeckOps(d, b, ops)
  assert.deepEqual(r.refused, [])
  const u = undoDeckOps(r.deck, r.brand, r.changes)
  assert.deepEqual(u.skipped, [])
  assert.equal(u.restored, r.changes.length)
  assert.deepEqual(u.deck, d)
  assert.deepEqual(u.brand, b)
})

test('undo keeps the user later edits and reports them', () => {
  const d = deck()
  const r = applyDeckOps(d, brand(), [
    { op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: 'Agent title' },
    { op: 'add_slide', template: 'text' },
    { op: 'set_brand', background: '#ffffff' }
  ])
  // the user edits the new title and the new page, and picks another background
  const edited = r.deck.map((s, i) => i === 0 ? { ...s, blocks: s.blocks.map(b => b.style === 'hero' ? { ...b, text: 'Mine' } : b) } : s)
  const added = edited.at(-1)
  edited[edited.length - 1] = { ...added, blocks: added.blocks.map(b => b.style === 'body' ? { ...b, text: 'My words' } : b) }
  const u = undoDeckOps(edited, { ...r.brand, background: '#222222' }, r.changes)
  assert.equal(hero(u.deck).text, 'Mine')
  assert.equal(u.deck.length, d.length + 1)
  assert.equal(u.restored, 0)
  assert.equal(u.skipped.length, 3)
})

test('a reply with edits and deck_ops: applied once, one undo reverts both', () => {
  const p = { fields: INPUT_FIELDS.map(f => f.key === 'engineers' ? { ...f, value: 500, source: { state: 'input' } } : f), deck: deck(), brand: brand(), agentLog: {} }
  const meta = {
    edits: [{ key: 'engineers', value: 1200, from_user: true }],
    deck_ops: [
      { op: 'set_text', slide_id: p.deck[0].id, block_id: hero(p.deck).id, value: 'STAMP Platform case' },
      { op: 'add_slide', template: 'bullets', after_slide_id: p.deck[0].id, texts: [{ style: 'title', text: 'Rollout plan' }, { style: 'body', text: '- One\n- Two\n- Three' }] },
      { op: 'set_brand', background: '#ffffff' }
    ]
  }
  const patch = applyAgentReply(p, 'm1', { edits: meta.edits, deckOps: meta.deck_ops }, { now: NOW })
  const q = { ...p, ...patch }
  assert.equal(q.fields.find(f => f.key === 'engineers').value, 1200)
  assert.equal(hero(q.deck).text, 'STAMP Platform case')
  assert.equal(q.deck[1].blocks[1].text, '- One\n- Two\n- Three')
  assert.equal(q.brand.background, '#ffffff')
  assert.equal(q.agentLog.m1.changes.length, 1)
  assert.equal(q.agentLog.m1.deckChanges.length, 3)
  assert.deepEqual(applyAgentReply(q, 'm1', { deckOps: meta.deck_ops }), {}) // never twice
  // a follow-up reply edits the new page's title; undoing the first reply keeps it
  const follow = applyAgentReply(q, 'm2', { deckOps: [{ op: 'set_text', slide_id: q.deck[1].id, block_id: q.deck[1].blocks[0].id, value: 'Rollout, in three steps' }] })
  const s = { ...q, ...follow }
  const undone = { ...s, ...undoAgentReply(s, 'm1') }
  assert.equal(undone.fields.find(f => f.key === 'engineers').value, 500)
  assert.equal(hero(undone.deck).text, '{company}')
  assert.equal(undone.brand.background, DEFAULT_BRAND.background)
  assert.equal(undone.deck.length, p.deck.length + 1) // the page the user (via m2) changed stays
  assert.equal(undone.agentLog.m1.undone, true)
  assert.deepEqual(undone.agentLog.m1.deckSkipped, ['Added a page "Rollout plan" after page 1'])
  assert.deepEqual(undoAgentReply(undone, 'm1'), {})
})

test('a reply with only field edits behaves as before', () => {
  const p = { fields: INPUT_FIELDS.map(f => ({ ...f })), deck: deck(), brand: brand() }
  const patch = applyAgentReply(p, 'm1', { edits: [{ key: 'engineers', value: 300, from_user: true }] })
  assert.deepEqual(Object.keys(patch).sort(), ['agentLog', 'fields'])
  assert.equal(patch.agentLog.m1.deckChanges, undefined)
})

test('brand template assets and section names apply, undo, redo and protect later edits', async () => {
  const { redoDeckOps } = await import('./agentDeckEdits.js')
  const { websiteSection } = await import('./export/websiteFramework.js')
  const d = deck(), b = brand(), image = 'data:image/png;base64,YWJj'
  const r = applyDeckOps(d, b, [
    {op:'set_brand',hideLogo:true,logo:image,heroImage:image,heroSource:'https://company.example/hero.png',heroAlt:'Campus'},
    {op:'set_section_name',slide_id:d[0].id,value:'Our case'}
  ])
  assert.equal(r.refused.length, 0)
  assert.equal(r.brand.hideLogo, true)
  assert.equal(websiteSection(r.deck[0]).nav, 'Our case')
  assert.equal(d[0].websiteNav, undefined)
  const undo = undoDeckOps(r.deck, r.brand, r.changes)
  assert.deepEqual(undo.deck, d); assert.deepEqual(undo.brand, b)
  const redo = redoDeckOps(undo.deck, undo.brand, r.changes)
  assert.deepEqual(redo.deck, r.deck); assert.deepEqual(redo.brand, r.brand)
  const conflict = undoDeckOps(r.deck.map((s,i)=>i ? s : {...s,websiteNav:'My name'}), {...r.brand,hideLogo:false}, r.changes)
  assert.equal(conflict.conflicts.length, 2)
  assert.equal(conflict.deck[0].websiteNav, 'My name')
})

test('brand template rejects remote URLs before preparation and invalid field values', () => {
  const r = applyDeckOps(deck(), brand(), [{op:'set_brand',logo:'https://company.example/logo.png',heroImage:'https://company.example/hero.png',heroSource:'http://company.example',hideLogo:'true',heroAlt:'x'.repeat(241)}])
  assert.equal(r.changes.length,0); assert.equal(r.refused.length,5)
  const stale = applyDeckOps(deck(), {hideLogo:false}, [{op:'set_brand',hideLogo:true,expect:{hideLogo:true}}])
  assert.equal(stale.changes.length,0); assert.equal(stale.refused.length,1)
})
