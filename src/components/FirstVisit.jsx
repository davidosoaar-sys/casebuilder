import React,{useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {needsWelcome,finishWelcome,needsIntroduction,finishIntroduction} from '../firstVisit.js'
import {tipsFor,tipSeen,markTipSeen} from '../tourTips.js'
import {coachPlacement} from '../coachPlacement.js'
import './FirstVisit.css'

export default function FirstVisit({userId,userName='',onName,context={view:'dashboard'},suspended=false,force=false}){
 const [revision,refresh]=useState(0),[intro,setIntro]=useState(()=>force||needsIntroduction(userId)),[name,setName]=useState(userName),[saving,setSaving]=useState(false),[error,setError]=useState(''),[geometry,setGeometry]=useState(null)
 const seen=useRef(new Set()),skipped=useRef(false),card=useRef(null),targetNode=useRef(null)
 const enabled=!skipped.current&&(force||needsWelcome(userId))
 const tip=tipsFor(context,enabled).find(t=>!seen.current.has(t.id)&&(force||!tipSeen(userId,t.id)))
 const welcome=!!(intro&&enabled&&userId&&!suspended)
 const target=tip?.target,id=tip?.id
 const dismiss=()=>{if(!tip)return;seen.current.add(tip.id);if(!force)markTipSeen(userId,tip.id);refresh(n=>n+1)}
 const skip=()=>{skipped.current=true;setIntro(false);if(!force){finishIntroduction(userId);finishWelcome(userId)}if(tip?.kind==='page')dismiss();else refresh(n=>n+1)}
 useEffect(()=>{
  setGeometry(null);targetNode.current=null
  if(!target||suspended||welcome)return
  let scrolled=false,frame
  const locate=()=>{
   const node=[...document.querySelectorAll(target)].find(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0})
   const blocked=document.querySelector('[data-tour="project-form"], [aria-modal="true"]:not(.onboarding-dialog)')
   if(!node||blocked){setGeometry(null);return}
   targetNode.current=node
   let rect=node.getBoundingClientRect()
   if(!scrolled&&(rect.bottom<0||rect.top>innerHeight)){scrolled=true;node.scrollIntoView({block:'center',behavior:'instant'});rect=node.getBoundingClientRect()}
   const pad=6,left=Math.max(8,rect.left-pad),top=Math.max(8,rect.top-pad),right=Math.min(innerWidth-8,rect.right+pad),bottom=Math.min(innerHeight-8,rect.bottom+pad)
   if(right<=left||bottom<=top){setGeometry(null);return}
   const hole={left,top,right,bottom,width:right-left,height:bottom-top}
   const measure=card.current?.getBoundingClientRect()
   const place=coachPlacement(hole,Math.min(330,innerWidth-32),measure?.height||220,{width:innerWidth,height:innerHeight})
   const next={hole,place,actionable:node.matches('button,a,[role="button"]')}
   setGeometry(prev=>JSON.stringify(prev)===JSON.stringify(next)?prev:next)
  }
  locate();frame=requestAnimationFrame(locate)
  const observer=new MutationObserver(locate);observer.observe(document.body,{childList:true,subtree:true})
  const resize=new ResizeObserver(locate);if(card.current)resize.observe(card.current)
  const click=e=>{if(targetNode.current?.contains(e.target)&&targetNode.current.matches('button,a,[role="button"]'))dismiss()}
  document.addEventListener('click',click,true);window.addEventListener('resize',locate);window.addEventListener('scroll',locate,true)
  return()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();document.removeEventListener('click',click,true);window.removeEventListener('resize',locate);window.removeEventListener('scroll',locate,true)}
 },[target,id,suspended,welcome,context.stage,context.view,revision])
 const visible=welcome||!!(userId&&tip&&!suspended&&geometry)
 useEffect(()=>{
  if(!visible)return
  const previous=document.activeElement,root=document.getElementById('root'),wasInert=root?.inert
  if(welcome&&root)root.inert=true
  card.current?.focus()
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();skip();return}
   if(e.key!=='Tab')return
   const nodes=[...(card.current?.querySelectorAll('button,input')||[]),...(!welcome&&targetNode.current?[targetNode.current,...targetNode.current.querySelectorAll('button,input,select,textarea,a,summary,[tabindex="0"]')]:[])].filter((e,i,a)=>a.indexOf(e)===i&&!e.disabled&&e.getBoundingClientRect().width>0&&(e.matches('button,input,select,textarea,a,summary,[tabindex="0"]')))
   if(!nodes.length)return
   const at=nodes.indexOf(document.activeElement),next=e.shiftKey?(at<=0?nodes.length-1:at-1):(at+1)%nodes.length
   e.preventDefault();nodes[next].focus()
  }
  document.addEventListener('keydown',key,true)
  return()=>{if(welcome&&root)root.inert=wasInert;document.removeEventListener('keydown',key,true);if(previous?.isConnected)previous.focus?.()}
 },[visible,welcome,id])
 if(!visible)return null
 const submit=async e=>{e.preventDefault();if(!name.trim()||saving)return;setSaving(true);setError('');try{await onName?.(name.trim());if(!force)finishIntroduction(userId);setIntro(false)}catch{setError('Could not save your name. Please try again.')}finally{setSaving(false)}}
 const h=geometry?.hole,p=geometry?.place
 return createPortal(<div className={'onboarding-dialog'+(welcome?' onboarding-welcome':' onboarding-spotlight')} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
  {welcome?<div className="onboarding-scrim"/>:<><div className="coach-shade" style={{left:0,top:0,right:0,height:h.top}}/><div className="coach-shade" style={{left:0,top:h.bottom,right:0,bottom:0}}/><div className="coach-shade" style={{left:0,top:h.top,width:h.left,height:h.height}}/><div className="coach-shade" style={{left:h.right,right:0,top:h.top,height:h.height}}/><div className="coach-hole" style={{left:h.left,top:h.top,width:h.width,height:h.height}}/></>}
  <section ref={card} tabIndex={-1} className={'guided-card onboarding-card'+(!welcome?' coach-card':'')} style={!welcome?{left:p.left,top:p.top}:undefined} aria-label="CaseBuilder page guide">
   {!welcome&&p.side&&<span className={'coach-arrow coach-arrow-'+p.side} aria-hidden="true"/>}
   {welcome?<form onSubmit={submit}><h2 id="onboarding-title">Hello, welcome to CaseBuilder.</h2><p>What should we call you?</p><label htmlFor="welcome-name">Your name</label><input id="welcome-name" autoComplete="given-name" value={name} maxLength={80} onChange={e=>setName(e.target.value)} autoFocus/>{error&&<p role="alert">{error}</p>}<footer><button type="button" className="link-btn" onClick={skip}>Skip tour</button><button className="primary" disabled={!name.trim()||saving}>{saving?'Saving…':'Continue'}</button></footer></form>:<><h2 id="onboarding-title">{tip.title}</h2><p>{tip.text}</p><footer><button className="link-btn" onClick={skip}>Skip tour</button>{geometry.actionable?<span className="coach-action">Click the highlighted button</span>:<button className="primary" onClick={dismiss}>Continue</button>}</footer></>}
  </section>
 </div>,document.body)
}
