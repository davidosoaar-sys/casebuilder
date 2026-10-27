import React,{useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {needsWelcome,finishWelcome} from '../firstVisit.js'
import {tipsFor,tipSeen,markTipSeen} from '../tourTips.js'
import './FirstVisit.css'

export default function FirstVisit({userId,context={view:'dashboard'},suspended=false,force=false}){
 const [revision,refresh]=useState(0),[ready,setReady]=useState(false)
 const seen=useRef(new Set()),skipped=useRef(false),card=useRef(null)
 const enabled=!skipped.current&&(force||needsWelcome(userId))
 const candidates=tipsFor(context,enabled)
 const tip=candidates.find(t=>!seen.current.has(t.id)&&(force||!tipSeen(userId,t.id)))
 const acknowledged=candidates.find(t=>seen.current.has(t.id)||( !force&&tipSeen(userId,t.id)))
 const target=tip?.target||acknowledged?.target
 const id=tip?.id
 useEffect(()=>{
  setReady(false)
  if(!target||suspended)return
  let highlighted
  const locate=()=>{
   const next=[...document.querySelectorAll(target)].find(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0})
   const blocked=document.querySelector('[data-tour="project-form"], [aria-modal="true"]:not(.onboarding-dialog)')
   if(highlighted!==next||blocked)highlighted?.classList.remove('tour-highlight')
   highlighted=blocked?null:next
   highlighted?.classList.add('tour-highlight')
   setReady(!!highlighted)
  }
  locate()
  const observer=new MutationObserver(locate)
  observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true})
  window.addEventListener('resize',locate)
  return()=>{observer.disconnect();highlighted?.classList.remove('tour-highlight');window.removeEventListener('resize',locate)}
 },[target,id,suspended,context.stage,context.view,revision])
 const visible=!!(userId&&tip&&!suspended&&ready)
 useEffect(()=>{
  if(!visible)return
  const root=document.getElementById('root'),wasInert=root?.inert,previous=document.activeElement,overflow=document.body.style.overflow
  if(root)root.inert=true
  document.body.style.overflow='hidden'
  card.current?.focus()
  return()=>{if(root)root.inert=wasInert;document.body.style.overflow=overflow;previous?.focus?.()}
 },[visible,id])
 const dismiss=()=>{
  if(!tip)return
  seen.current.add(tip.id)
  if(!force)markTipSeen(userId,tip.id)
  refresh(n=>n+1)
 }
 const skip=()=>{if(tip?.kind==='page'){dismiss();return}skipped.current=true;if(!force)finishWelcome(userId);refresh(n=>n+1)}
 if(!visible)return null
 const keyboard=e=>{
  if(e.key==='Escape'){e.preventDefault();dismiss()}
  if(e.key==='Tab'){
   const buttons=[...card.current.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1)
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===card.current)){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
 }
 return createPortal(<div className="onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" onKeyDown={keyboard}>
  <div className="onboarding-scrim"/>
  <section ref={card} tabIndex={-1} className="guided-card onboarding-card" aria-label="CaseBuilder page guide">
   <button className="icon-btn onboarding-close" aria-label="Dismiss this tip" onClick={dismiss}>×</button>
   <h2 id="onboarding-title">{tip.title}</h2><p>{tip.text}</p>
   <footer>{tip.kind==='main'?<button className="link-btn" onClick={skip}>Skip tour</button>:<span className="guided-once">Only on your first visit.</span>}<button className="primary" onClick={dismiss}>Okay</button></footer>
  </section>
 </div>,document.body)
}
