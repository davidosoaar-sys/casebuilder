import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PARTNER_KEYS, PARTNERS, partnerFor, partnerKind, coBrandHtml, backstageData } from './coBrand.js'
import { SPOTIFY_LOGO } from './spotifyLogo.js'
import { PORTAL_SVG, PORTAL_INK_SVG } from './portalLogo.js'
import { normalizeBrand, brandLogoHtml, brandDocument } from './brand.js'
import { templateBrand } from './deck/template.js'
import { buildWebsite } from './export/html.js'
import { websiteIdentity } from './export/websiteFramework.js'
import { DEMO_VALUES } from './valueModel.js'
import { resolveStakeholder } from './deck/stakeholders.js'
import { defaultDeck } from './deck/model.js'

const decode = uri => Buffer.from(uri.split(',')[1], 'base64').toString('utf8')
const logo = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 6"><rect width="20" height="6" fill="#e50914"/></svg>').toString('base64')

test('the partner logo can be Backstage, Spotify Portal or Spotify', () => {
  assert.deepEqual(PARTNER_KEYS, ['backstage', 'portal', 'spotify'])
  assert.deepEqual(PARTNER_KEYS.map(k => PARTNERS[k].label), ['Backstage', 'Spotify Portal', 'Spotify'])
  assert.equal(partnerKind('portal'), 'portal')
  assert.equal(partnerKind('nonsense'), 'backstage')
  assert.equal(partnerKind(undefined), 'backstage')
})

test('each partner resolves to its own artwork', () => {
  assert.equal(partnerFor('backstage', '#111111').src, backstageData)
  assert.equal(partnerFor('spotify', '#111111').src, SPOTIFY_LOGO)
  assert.equal(partnerFor('spotify', '#ffffff').src, SPOTIFY_LOGO)
  const dark = decode(partnerFor('portal', '#111111').src)
  assert.equal(dark, PORTAL_SVG)
  // the Spotify Portal artwork is the site's own: rounded square, mark and the word Portal
  assert.match(dark, /viewBox="0 0 124 42"/)
  assert.ok(!/(width|height)="/.test(dark.slice(0, 120)))
})

test('the Portal logo is white on dark pages and the same artwork in ink on light pages', () => {
  const light = decode(partnerFor('portal', '#ffffff').src)
  assert.equal(light, PORTAL_INK_SVG)
  assert.notEqual(light, PORTAL_SVG)
  const colours = s => [...new Set(s.match(/#[0-9A-F]{6}/g))].sort()
  assert.deepEqual(colours(light), colours(PORTAL_SVG)) // same two colours, swapped
  const first = s => s.match(/<path[^>]*fill="(#[0-9A-F]{6})"/)[1]
  assert.notEqual(first(light), first(PORTAL_SVG))
})

test('the choice is saved with the brand, defaults to Backstage and survives a design switch', () => {
  assert.equal(normalizeBrand({}).partnerLogo, 'backstage')
  assert.equal(normalizeBrand({ partnerLogo: 'portal' }).partnerLogo, 'portal')
  assert.equal(normalizeBrand({ partnerLogo: '<script>' }).partnerLogo, 'backstage')
  for (const kind of PARTNER_KEYS) {
    for (const template of ['company', 'backstage']) assert.equal(templateBrand({ partnerLogo: kind, logo }, template).partnerLogo, kind)
  }
})

test('the co-brand lockup shows the chosen partner', () => {
  const html = k => brandLogoHtml(normalizeBrand({ logo, partnerLogo: k, background: '#111111' }))
  assert.match(html('backstage'), /data-partner="backstage"[^>]*alt="Backstage"/)
  assert.match(html('portal'), /data-partner="portal"[^>]*alt="Spotify Portal"/)
  assert.match(html('spotify'), /data-partner="spotify"[^>]*alt="Spotify"/)
  assert.ok(html('backstage').includes(backstageData))
  assert.ok(html('portal').includes(partnerFor('portal', '#111111').src))
  assert.ok(html('spotify').includes(SPOTIFY_LOGO))
  // the lockup is the customer mark × partner: no partner without a customer logo
  assert.equal(brandLogoHtml(normalizeBrand({ partnerLogo: 'portal' })), '')
  assert.equal(coBrandHtml('', '#111111', 'portal'), '')
})

test('every partner keeps its proportions in the lockup', () => {
  for (const k of PARTNER_KEYS) {
    const h = coBrandHtml('<i></i>', '#111111', k)
    const height = Number(h.match(/data-partner[^>]*style="height:(\d+)px/)[1])
    const max = Number(h.match(/max-width:(\d+)px;object-fit/)[1])
    assert.ok(height > 0 && max > 0 && max <= 120)
    assert.ok(Math.abs(max / height - PARTNERS[k].ratio) < 0.2, `${k}: ${max}x${height}`)
  }
})

const source = ['format.js', 'model.js', 'source.js', 'valueModel.js'].map(f => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8')).join('\n')
const finance = { ...resolveStakeholder({ key: 'finance', builtin: true }), builtin: true }
function liveRoom(brandIn, template) {
  const deck = defaultDeck()
  const brand = websiteIdentity(templateBrand(normalizeBrand({ logo, primary: '#e50914', ...brandIn }), template), deck)
  return brandDocument(buildWebsite({ company: 'Acme', slides: deck, stakeholders: [finance], activeKey: 'finance', inputs: { ...DEMO_VALUES }, sliders: [], vmSource: source, viewMode: 'website', websiteBrand: brand, logoSvg: brandLogoHtml(brand, '') }), brand)
}

test('Backstage design: the Live Room shows the Backstage mark in its own colour, not blended into the dark page', () => {
  const html = liveRoom({}, 'backstage')
  assert.ok(html.includes(backstageData))
  // a multiply blend turned the mint mark near-black on the dark theme
  assert.equal(/co-brand-partner[^}]*mix-blend-mode/.test(html), false)
  assert.equal(html.includes('mix-blend-mode:multiply'), false)
})

test('the Live Room carries the chosen partner in either design', () => {
  for (const template of ['company', 'backstage']) {
    for (const [kind, alt] of [['backstage', 'Backstage'], ['portal', 'Spotify Portal'], ['spotify', 'Spotify']]) {
      const html = liveRoom({ partnerLogo: kind }, template)
      assert.ok(html.includes(`data-partner="${kind}"`) && html.includes(`alt="${alt}"`), `${template} / ${kind}`)
    }
  }
  // dark Backstage design gets the white Portal artwork; the company's white page gets the ink one
  assert.ok(liveRoom({ partnerLogo: 'portal' }, 'backstage').includes(partnerFor('portal', '#111111').src))
  assert.ok(liveRoom({ partnerLogo: 'portal' }, 'company').includes(partnerFor('portal', '#ffffff').src))
})

test('the cover sizes the partner by height, so Spotify is not stretched to the customer logo width', () => {
  const html = liveRoom({ partnerLogo: 'spotify' }, 'backstage')
  assert.match(html, /\.landing-logo \.co-brand-partner\{height:clamp\([^}]*width:auto!important/)
  // the customer-logo size rules no longer catch the partner mark
  assert.ok(html.includes('.landing-logo img:not(.co-brand-partner)'))
  assert.equal(/\.landing-logo img,\.landing-logo svg\{width:clamp/.test(html), false)
})
