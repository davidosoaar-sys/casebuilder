import test from 'node:test'
import assert from 'node:assert/strict'
import { websiteTheme, contrast, websiteSection, websiteBlockDesign } from './websiteFramework.js'
import { brandDocument } from '../brand.js'
import { buildWebsite } from './html.js'

test('website theme guarantees readable page, card and button text across brand palettes', () => {
  for (const background of ['#000000', '#ffffff', '#777777', '#dbeafe', '#201044']) {
    for (const primary of ['#ffff00', '#1DB954', '#ffffff', '#000000', '#8855dd']) {
      const brand = { background, primary, text: background, muted: background, surface: '#ffffff' }
      const original = structuredClone(brand)
      const t = websiteTheme(brand)
      assert.ok(contrast(t.text, t.background) >= 4.5)
      assert.ok(contrast(t.text, t.surface) >= 4.5)
      assert.ok(contrast(t.muted, t.background) >= 4.5)
      assert.ok(contrast(t.onPrimary, primary) >= 4.5)
      assert.deepEqual(brand, original)
    }
  }
})

test('website sections derive semantic layout without changing authored blocks', () => {
  for (const [type, kind] of [['stats','impact'],['drivers','drivers'],['pairs','comparison'],['versus','alternative'],['room','stakeholder']]) {
    const slide = { blocks: [{ type }, { type: 'text', style: 'title', text: 'A very long custom title' }] }
    const original = structuredClone(slide)
    assert.equal(websiteSection(slide).kind, kind)
    assert.deepEqual(slide, original)
  }
  assert.equal(websiteSection({ blocks: [{ type:'text', style:'hero',text:'Any company' }] }).nav, 'Overview')
})

test('unreadable block overrides get website-only contrast correction', () => {
  const original = { color:'#ffffff', background:'#ffffff', font:'Arial',fontSize:90 }
  const result = websiteBlockDesign(original, { background:'#ffffff' })
  assert.ok(contrast(result.color,result.background) >= 4.5)
  assert.equal(original.color,'#ffffff')
  assert.equal(result.fontSize,90)
})

test('contrast safeguards apply only to the website and unsafe brand strings are rejected', () => {
  const brand = { background: '#ffffff', primary: '#ffff00', text: '#ffffff' }
  const website = brandDocument('<html><head></head><body class="view-website"></body></html>',brand)
  const slides = brandDocument('<html><head></head><body class="view-slides"></body></html>',brand)
  assert.ok(website.includes('--site-on-primary:'))
  assert.equal(slides.includes('--site-on-primary:'), false)
  assert.equal(websiteTheme({ primary: '</style><script>' }).primary, '#9bf0de')
})

test('empty website includes a deliberate empty state and no fabricated financial value', () => {
  const html = buildWebsite({company:'A & B', slides:[], stakeholders:[], inputs:{}, vmSource:''})
  assert.ok(html.includes('Your business case is taking shape.'))
  assert.equal(html.includes('>$0<'),false)
  assert.equal(html.includes('>undefined<'),false)
  assert.ok(html.includes('A &amp; B'))
})
