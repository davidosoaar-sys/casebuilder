import {clientStakeholder,requirementListHtml} from '../stakeholderRequirements.js'
import { defaultPositions } from '../deck/mapLayout.js'

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export function journeyIndex(progress,count) {
  if (!count) return -1
  return Math.max(-1,Math.min(count-1,Math.floor(Math.max(0,Number(progress)||0)*(count+1))-1))
}

export function stakeholderJourneyHtml(company,logo,stakeholders) {
  stakeholders=stakeholders.map(clientStakeholder)
  const positions=defaultPositions(stakeholders.length)
  const nodes=stakeholders.map((s,i)=>{
    const pos=s.pos&&Number.isFinite(s.pos.x)&&Number.isFinite(s.pos.y)?s.pos:positions[i]
    const x=Math.min(84,Math.max(16,pos.x)),y=Math.min(88,Math.max(12,pos.y))
    const name=(s.namedPeople||[]).map(p=>p.name).filter(Boolean).join(', ')
    return {s,i,x,y,name}
  })
  const initial=s=>String(s).split(/[^a-zA-Z]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const diagram='<div class="relation-map" aria-label="Stakeholder map"><svg class="relation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+nodes.map(n=>'<line data-line="'+n.i+'" x1="50" y1="50" x2="'+n.x+'" y2="'+n.y+'" vector-effect="non-scaling-stroke"/>').join('')+'</svg><div class="relation-center">'+(logo?'<div>'+logo+'</div>':'')+'<small>Customer</small><strong>'+esc(company)+'</strong></div>'+nodes.map(n=>'<button class="relation-node" data-journey-node="'+n.i+'" data-x="'+n.x+'" data-y="'+n.y+'" style="left:'+n.x+'%;top:'+n.y+'%" aria-label="Explore '+esc(n.name||n.s.role)+'" aria-pressed="false"><span class="relation-badge" aria-hidden="true">'+((n.s.namedPeople||[]).find(p=>p.photo)?.photo?'<img src="'+n.s.namedPeople.find(p=>p.photo).photo.dataUrl+'" alt="'+esc(n.name)+'">':esc(initial(n.s.role)))+'</span><span><strong>'+esc(n.name||n.s.role)+'</strong>'+(n.name?'<small>'+esc(n.s.role)+'</small>':'')+'</span></button>').join('')+'</div>'
  const briefs=nodes.map(n=>'<template data-journey-brief="'+n.i+'"><article class="journey-brief"><h3>'+esc(n.name||n.s.role)+'</h3><p>'+esc(n.s.role)+'</p>'+requirementListHtml(n.s,'<h4>Requirements</h4>')+'</article></template>').join('')
  return '<div class="stakeholder-journey" data-count="'+nodes.length+'" style="--journey-stops:'+Math.max(1,nodes.length+1)+'"><div class="journey-stage"><div class="journey-map">'+diagram+'</div><div class="journey-copy" tabindex="-1" aria-label="Stakeholder brief"></div><div class="journey-controls"><button data-journey-reset>Full map</button><span class="journey-step-label">Scroll to explore</span><button data-journey-next>Next stakeholder ↓</button></div></div>'+briefs+'</div>'
}

// Serialized into the exported website. Scroll position drives one persistent map;
// clicking and keyboard navigation use the same stops. No deal state is written.
export function mountStakeholderJourney(root,env=window) {
  const journey=root.querySelector('.stakeholder-journey')
  if(!journey)return ()=>{}
  const stage=journey.querySelector('.journey-stage'),copy=journey.querySelector('.journey-copy')
  const nodes=Array.from(journey.querySelectorAll('[data-journey-node]'))
  const templates=Array.from(journey.querySelectorAll('template'))
  const preference=env.matchMedia('(prefers-reduced-motion: reduce)')
  let current=-2,frame=0,wireFrame=0,manual=-1
  const mobile=()=>env.innerWidth<800
  function followWires(start){
    const bounds=journey.querySelector('.relation-map').getBoundingClientRect()
    if(bounds.width&&bounds.height)nodes.forEach((node,i)=>{
      const rect=node.getBoundingClientRect(),line=journey.querySelector('[data-line="'+i+'"]')
      line?.setAttribute('x2',String((rect.left+rect.width/2-bounds.left)/bounds.width*100))
      line?.setAttribute('y2',String((rect.top+rect.height/2-bounds.top)/bounds.height*100))
    })
    if(!preference.matches&&env.performance.now()-start<720)wireFrame=env.requestAnimationFrame(()=>followWires(start))
    else wireFrame=0
  }
  function show(index){
    if(index===current)return
    current=index
    stage.classList.toggle('has-focus',index>=0)
    stage.classList.toggle('map-on-right',index>=0&&index%2===1)
    stage.dataset.active=String(index)
    copy.innerHTML=index>=0&&templates[index]?templates[index].innerHTML:''
    copy.hidden=index<0
    nodes.forEach((node,i)=>{
      const selected=i===index,right=index%2===1
      const x=index<0||mobile()?Number(node.dataset.x):selected?(right?14:86):Math.min(84,Math.max(16,Number(node.dataset.x)+(right?7:-7)))
      node.style.left=x+'%';node.style.top=(selected&&!mobile()?50:Number(node.dataset.y))+'%'
      node.classList.toggle('is-selected',selected)
      node.setAttribute('aria-pressed',String(selected))
      const line=journey.querySelector('[data-line="'+i+'"]')
      line?.setAttribute('x2',String(x));line?.setAttribute('y2',selected&&!mobile()?'50':node.dataset.y)
      line?.classList.toggle('is-selected',selected)
    })
    journey.querySelector('.journey-step-label').textContent=index<0?'Scroll to explore':String(index+1).padStart(2,'0')+' / '+String(nodes.length).padStart(2,'0')
    journey.querySelector('[data-journey-next]').disabled=!nodes.length
    if(wireFrame)env.cancelAnimationFrame(wireFrame)
    if(!preference.matches)wireFrame=env.requestAnimationFrame(()=>followWires(env.performance.now()))
  }
  function update(){
    frame=0
    if(mobile()){show(manual);return}
    const rect=journey.getBoundingClientRect(),top=96,travel=Math.max(1,journey.offsetHeight-stage.offsetHeight)
    const progress=Math.max(0,Math.min(1,(top-rect.top)/travel))
    const index=Math.max(-1,Math.min(nodes.length-1,Math.floor(progress*(nodes.length+1))-1))
    show(index)
  }
  function schedule(){if(!frame)frame=env.requestAnimationFrame(update)}
  function navigate(index){
    const target=Math.max(-1,Math.min(nodes.length-1,index));manual=target
    if(mobile()){show(target);if(target>=0){copy.scrollIntoView({block:'start',behavior:'instant'});copy.focus({preventScroll:true})}return}
    const travel=Math.max(1,journey.offsetHeight-stage.offsetHeight)
    const progress=target<0?0:(target+1.35)/(nodes.length+1)
    env.scrollTo({top:journey.getBoundingClientRect().top+env.scrollY-96+progress*travel,behavior:'instant'})
    show(target)
    if(target>=0)copy.focus({preventScroll:true})
    else{stage.setAttribute('tabindex','-1');stage.focus({preventScroll:true})}
  }
  function click(e){
    const node=e.target.closest('[data-journey-node]')
    if(node){navigate(Number(node.dataset.journeyNode));return}
    if(e.target.closest('[data-journey-reset]'))navigate(-1)
    if(e.target.closest('[data-journey-next]'))navigate(current>=nodes.length-1?-1:current+1)
  }
  function key(e){if(e.key==='Escape'){navigate(-1);nodes[0]?.focus({preventScroll:true})}}
  journey.addEventListener('click',click);journey.addEventListener('keydown',key)
  env.addEventListener('scroll',schedule,{passive:true});env.addEventListener('resize',schedule)
  update()
  return ()=>{if(frame)env.cancelAnimationFrame(frame);if(wireFrame)env.cancelAnimationFrame(wireFrame);env.removeEventListener('scroll',schedule);env.removeEventListener('resize',schedule);journey.removeEventListener('click',click);journey.removeEventListener('keydown',key)}
}
