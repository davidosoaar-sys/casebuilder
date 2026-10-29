import test from 'node:test'
import assert from 'node:assert/strict'
import { websiteStory } from './websiteStory.js'
import { defaultDeck } from '../deck/model.js'
import { buildWebsite } from './html.js'

const kinds=['cover','overview','impact','drivers','comparison','alternative']
test('website has six client stages and retains original edit destinations without modifying the deck',()=>{
  const deck=defaultDeck(),before=structuredClone(deck)
  const story=websiteStory(deck)
  assert.deepEqual(story.map(s=>s.websiteKind),kinds)
  assert.ok(story[0].blocks.every(b=>b.type==='logo'||b.style==='hero'))
  assert.ok(story[1].blocks.some(b=>b.style==='lede'))
  assert.equal(story.some(s=>s.blocks.some(b=>b.type==='stakeholderMap')),false)
  const intro=story[1].blocks.find(b=>b.sourceSlideId)
  assert.ok(deck.find(s=>s.id===intro.sourceSlideId).blocks.some(b=>b.id===intro.id))
  assert.deepEqual(deck,before)
})

test('a sparse website still has all six client stages and contains no invented zero-value figure',()=>{
  const html=buildWebsite({company:'Example',slides:[],stakeholders:[],inputs:{},vmSource:''})
  const data=JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1])
  assert.deepEqual(data.layout.map(s=>s.kind),kinds)
  assert.equal(html.includes('>$0<'),false)
  assert.equal(data.artwork.includes('landing-node'),false)
  assert.ok(data.artwork.includes('landing-logo'))
})

test('Live Room omits the stakeholder map and named people from embedded data, while slides retain their framing',()=>{
  const stakeholders=[{key:'finance',role:'Finance',namedPeople:[{name:'Private Person',title:'CFO'}],privateNotes:'Internal sales strategy',requirements:[{text:'Private requirement'}]}]
  const args={company:'Example',slides:defaultDeck(),stakeholders,activeKey:'finance',inputs:{},vmSource:''}
  const html=buildWebsite(args)
  const data=JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1])
  assert.deepEqual(data.stakeholders,[])
  assert.equal(data.activeKey,null)
  assert.equal(data.journeyHtml,'')
  assert.equal(html.includes('Private Person'),false)
  assert.equal(html.includes('Internal sales strategy'),false)
  assert.equal(html.includes('Private requirement'),false)
  const slideHtml=buildWebsite({...args,viewMode:'slides'})
  const slideData=JSON.parse(slideHtml.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1])
  assert.equal(slideData.stakeholders[0].role,'Finance')
  assert.equal(args.stakeholders[0].namedPeople[0].name,'Private Person')
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
