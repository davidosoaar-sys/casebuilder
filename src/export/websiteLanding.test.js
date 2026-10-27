import test from 'node:test'
import assert from 'node:assert/strict'
import { landingArtwork } from './websiteLanding.js'
import { buildWebsite } from './html.js'

test('landing identity uses only the customer logo, without decorative stakeholder tiles', () => {
  const roles=[{key:'finance',role:'Finance & Procurement'},{key:'security',role:'Security'}]
  const html=landingArtwork({company:'A & B',logo:'<svg id="customer-logo"></svg>',roles})
  assert.ok(html.includes('<div class="landing-logo"><svg id="customer-logo">'))
  assert.equal(html.includes('data-perspective'),false)
  assert.equal(html.includes('Finance'),false)
  assert.equal(html.includes('undefined'),false)
  assert.equal(html.includes('<img'),false)
  const empty=landingArtwork({company:'<Unknown>',roles:[]})
  assert.ok(empty.includes('landing-initial'))
  assert.equal(empty.includes('landing-node node-'),false)
  assert.equal(empty.includes('<Unknown>'),false)
})

test('landing website uses document scrolling without changing PDF or Slides markup', () => {
  const args={company:'Example',slides:[],stakeholders:[],inputs:{},vmSource:''}
  const website=buildWebsite({...args,viewMode:'website'})
  assert.ok(website.includes('body.view-website{display:block'))
  assert.ok(website.includes('section-copy'))
  assert.equal(website.includes('Explore the business case'),false)
  assert.equal(website.includes('Explore the case ↗'),false)
  assert.ok(website.includes('cover-scroll-hint'))
  for(const viewMode of ['pdf','slides']) {
    const html=buildWebsite({...args,viewMode})
    assert.equal(html.includes('body.view-website{display:block'),false)
    assert.equal(JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]).artwork,'')
  }
})

test('hidden logo removes the Live room identity including its fallback, retaining photography', () => {
  assert.equal(landingArtwork({company:'Example',logo:'<svg id="logo"/>',brand:{hideLogo:true}}),'')
  const html=landingArtwork({company:'Example',logo:'<svg id="logo"/>',brand:{hideLogo:true,heroImage:'data:image/png;base64,YWJj',heroSource:'https://company.example/hero.png'}})
  assert.ok(html.includes('brand-cover-image'))
  assert.equal(html.includes('id="logo"'),false)
  assert.equal(html.includes('landing-initial'),false)
})
