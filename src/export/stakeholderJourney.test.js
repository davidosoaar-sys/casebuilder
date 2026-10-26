import test from 'node:test'
import assert from 'node:assert/strict'
import { journeyIndex,stakeholderJourneyHtml,mountStakeholderJourney } from './stakeholderJourney.js'
import { defaultPositions } from '../deck/mapLayout.js'
import { websiteIdentity } from './websiteFramework.js'

test('scroll stops start at the full map, then advance through every stakeholder',()=>{
  assert.equal(journeyIndex(0,4),-1)
  assert.equal(journeyIndex(.27,4),0)
  assert.equal(journeyIndex(.47,4),1)
  assert.equal(journeyIndex(.67,4),2)
  assert.equal(journeyIndex(1,4),3)
  assert.equal(journeyIndex(-1,4),-1)
  assert.equal(journeyIndex(20,4),3)
  assert.equal(journeyIndex(1,0),-1)
})

test('website map reuses the original radial layout and retains saved positions',()=>{
  const people=[{key:'a',role:'Engineering',pos:{x:28,y:20},requirements:[{id:'r',text:'Capacity',status:'In progress'}],needsToSee:['Private inferred need'],objection:'Budget',counter:'Hiring plan'},{key:'b',role:'Security'}]
  const before=structuredClone(people),positions=defaultPositions(2)
  const html=stakeholderJourneyHtml('Example','',people)
  assert.ok(html.includes('data-x="28" data-y="20"'))
  assert.ok(html.includes('data-x="'+Math.min(84,Math.max(16,positions[1].x))+'"'))
  assert.ok(html.includes('relation-center'))
  assert.ok(html.includes('Capacity'))
  assert.deepEqual(people,before)
})

test('stakeholder narrative escapes user text and handles missing briefing fields',()=>{
  const html=stakeholderJourneyHtml('<Acme>','',[{key:'a',role:'<Finance>',namedPeople:[{name:'A & B'}]}])
  assert.equal(html.includes('<Finance>'),false)
  assert.ok(html.includes('A &amp; B'))
  // The client page has no empty placeholder: no requirements, no block.
  assert.equal(html.includes('No requirements recorded yet.'),false)
  assert.equal(html.includes('client-requirements'),false)
  assert.equal(html.includes('<h4>Requirements</h4>'),false)
  assert.equal(stakeholderJourneyHtml('Empty','',[]).includes('data-journey-node='),false)
})

test('the requirements block renders for the client when requirements exist',()=>{
  const html=stakeholderJourneyHtml('Acme','',[{key:'a',role:'Finance',requirements:[{id:'r1',text:'SOC 2 report',status:'Actioned'}]}])
  assert.ok(html.includes('<h4>Requirements</h4><ul class="client-requirements">'))
  assert.ok(html.includes('SOC 2 report'))
  assert.ok(html.includes('requirement-box is-done'))
})

test('flat website background follows the authored company cover without changing its fonts or palette',()=>{
  const brand={background:'#121212',headingFont:'Arial',bodyFont:'Arial',primary:'#1DB954'}
  assert.equal(websiteIdentity(brand,[{variant:'hero',design:{background:'#000000'}}]).background,'#000000')
  assert.equal(brand.background,'#121212')
  const light=websiteIdentity({...brand,background:'#ffffff'},[])
  assert.equal(light.background,'#ffffff')
  assert.equal(light.headingFont,'Arial')
})

test('real scroll handler alternates map sides and briefs, then removes its listeners',()=>{
  const classes=()=>{const set=new Set();return {toggle:(key,on)=>on?set.add(key):set.delete(key),contains:key=>set.has(key)}}
  const stage={classList:classes(),dataset:{},offsetHeight:500,setAttribute(){},focus(){}}
  const copy={innerHTML:'',hidden:false,focus(){}}
  const nodes=Array.from({length:2},(_,i)=>({dataset:{x:String(i?76:24),y:'25'},style:{},classList:classes(),setAttribute(){}}))
  const label={},next={}
  const handlers=new Map(),queue=[]
  const env={innerWidth:1200,scrollY:0,matchMedia:()=>({matches:true}),requestAnimationFrame:fn=>(queue.push(fn),queue.length),cancelAnimationFrame(){},addEventListener:(key,fn)=>handlers.set(key,fn),removeEventListener:key=>handlers.delete(key),scrollTo:({top})=>{env.scrollY=top}}
  const journey={offsetHeight:3000,getBoundingClientRect:()=>({top:1000-env.scrollY}),querySelector:selector=>selector==='.journey-stage'?stage:selector==='.journey-copy'?copy:selector==='.journey-step-label'?label:selector==='[data-journey-next]'?next:null,querySelectorAll:selector=>selector==='template'?[{innerHTML:'Engineering brief'},{innerHTML:'Finance brief'}]:nodes,addEventListener(){},removeEventListener(){}}
  const cleanup=mountStakeholderJourney({querySelector:()=>journey},env)
  assert.equal(stage.dataset.active,'-1')
  const scroll=progress=>{env.scrollY=904+2500*progress;handlers.get('scroll')();while(queue.length)queue.shift()()}
  scroll(.5)
  assert.equal(stage.dataset.active,'0')
  assert.equal(stage.classList.contains('map-on-right'),false)
  assert.equal(copy.innerHTML,'Engineering brief')
  scroll(.9)
  assert.equal(stage.dataset.active,'1')
  assert.equal(stage.classList.contains('map-on-right'),true)
  assert.equal(copy.innerHTML,'Finance brief')
  cleanup()
  assert.equal(handlers.size,0)
})
