import test from 'node:test'
import assert from 'node:assert/strict'
import { websiteStory } from './websiteStory.js'
import { defaultDeck } from '../deck/model.js'
import { buildWebsite } from './html.js'

const kinds=['cover','overview','impact','drivers','comparison','alternative','stakeholder']
test('website has the requested seven stages and retains original edit destinations without modifying the deck',()=>{
  const deck=defaultDeck(),before=structuredClone(deck)
  const story=websiteStory(deck)
  assert.deepEqual(story.map(s=>s.websiteKind),kinds)
  assert.ok(story[0].blocks.every(b=>b.type==='logo'||b.style==='hero'))
  assert.ok(story[1].blocks.some(b=>b.style==='lede'))
  assert.ok(story.at(-1).blocks.some(b=>b.type==='stakeholderMap'))
  const intro=story[1].blocks.find(b=>b.sourceSlideId)
  assert.ok(deck.find(s=>s.id===intro.sourceSlideId).blocks.some(b=>b.id===intro.id))
  assert.deepEqual(deck,before)
})

test('a sparse website still has all seven stages and contains no invented zero-value figure',()=>{
  const html=buildWebsite({company:'Example',slides:[],stakeholders:[],inputs:{},vmSource:''})
  const data=JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1])
  assert.deepEqual(data.layout.map(s=>s.kind),kinds)
  assert.equal(html.includes('>$0<'),false)
  assert.equal(data.artwork.includes('landing-node'),false)
  assert.ok(data.artwork.includes('landing-logo'))
})

test('custom section names survive the Live room reading-order projection', () => {
  const deck = defaultDeck()
  const drivers = deck.find(s=>s.blocks.some(b=>b.type==='drivers'))
  drivers.websiteNav = 'Where time goes'
  const story = websiteStory(deck)
  assert.equal(story.find(s=>s.websiteKind==='drivers').websiteNav,'Where time goes')
  const html=buildWebsite({company:'Example',slides:deck,stakeholders:[],inputs:{},vmSource:''})
  const data=JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1])
  assert.equal(data.layout.find(s=>s.kind==='drivers').nav,'Where time goes')
})
