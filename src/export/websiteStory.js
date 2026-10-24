import { websiteSection } from './websiteFramework.js'

// The website's reading order is independent of the editable client deck.
// Original block/slide IDs remain attached so in-place edits still save correctly.
export function websiteStory(slides) {
  const groups = {}
  for (const slide of slides) {
    const kind = websiteSection(slide).kind
    ;(groups[kind] ||= []).push(...slide.blocks.filter(b=>!(b.type==='text'&&b.style==='label')).map(b=>({...b,sourceSlideId:slide.id})))
  }
  const block = (type,props={})=>({id:'website-'+type,type,...props})
  const text = (style,value)=>block('text',{style,text:value})
  const section = (kind,nav,blocks)=>({id:'website-'+kind,websiteKind:kind,websiteNav:nav,variant:kind==='cover'?'hero':'plain',blocks})
  const hero=groups.overview||[]
  const identity=hero.filter(b=>b.type==='logo'||(b.type==='text'&&b.style==='hero'))
  const introduction=hero.filter(b=>!identity.includes(b))
  const ensure=(kind,title,type)=>groups[kind]?.length ? groups[kind] : [text('title',title),block(type)]
  return [
    section('cover','Welcome',[{...identity.find(b=>b.style==='hero'),id:'website-company-name',type:'text',style:'hero',text:'{company}',sourceSlideId:undefined}]),
    section('overview','Overview',[text('title','Overview'),...introduction,...(groups.content||[]),block('overviewFacts')]),
    section('impact','Business impact',ensure('impact','Business impact','stats')),
    section('drivers','Value drivers',ensure('drivers','Value drivers','drivers')),
    section('comparison','What changes',ensure('comparison','What changes','pairs')),
    section('alternative','The alternative',ensure('alternative','The alternative','versus')),
    section('stakeholder','Stakeholders',[text('title','Stakeholders'),block('stakeholderMap')])
  ]
}
