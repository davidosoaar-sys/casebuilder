import React,{useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {needsWelcome,finishWelcome} from '../firstVisit.js'
import {tipsFor,tipSeen,markTipSeen} from '../tourTips.js'
import './FirstVisit.css'

export default function FirstVisit({userId,context={view:'dashboard'},suspended=false,force=false}){
 const[revision,refresh]=useState(0),[position,setPosition]=useState(null),[targetReady,setTargetReady]=useState(false)
 const localSeen=useRef(new Set()),mainSkipped=useRef(false),card=useRef(null)
 const enabled=!mainSkipped.current&&(force||needsWelcome(userId))
 const candidates=tipsFor(context,enabled)
 const s=candidates.find(t=>!localSeen.current.has(t.id)&&(force||!tipSeen(userId,t.id)))
 const id=s?.id,target=s?.target
 useEffect(()=>{setTargetReady(false);if(!s||suspended)return;let highlighted
 const locate=()=>{highlighted?.classList.remove('tour-highlight');highlighted=[...document.querySelectorAll(target)].find(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0});const blocked=document.querySelector('[data-tour="project-form"], [aria-modal="true"]');if(!highlighted||blocked){setTargetReady(false);return}const r=highlighted.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight){setTargetReady(false);return}setTargetReady(true);highlighted.classList.add('tour-highlight');const width=Math.min(320,innerWidth-32),height=card.current?.offsetHeight||220;if(innerWidth<650||r.width>innerWidth-100){setPosition(null);return}const left=Math.min(innerWidth-width-16,Math.max(16,r.right+16)),top=Math.min(innerHeight-height-16,Math.max(16,r.top));setPosition(prev=>prev?.left===left&&prev?.top===top?prev:{left,top})}
 locate();const observer=new MutationObserver(locate);observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});window.addEventListener('resize',locate);window.addEventListener('scroll',locate,true);return()=>{highlighted?.classList.remove('tour-highlight');observer.disconnect();window.removeEventListener('resize',locate);window.removeEventListener('scroll',locate,true)}},[id,target,suspended,context.stage,context.view,revision])
 const dismiss=()=>{if(!s)return;localSeen.current.add(s.id);if(!force)markTipSeen(userId,s.id);refresh(n=>n+1)}
 const skip=()=>{if(s?.kind==='page'){dismiss();return}mainSkipped.current=true;if(!force)finishWelcome(userId);refresh(n=>n+1)}
 if(!userId||!s||suspended||!targetReady)return null
 const more=candidates.some(t=>t.id!==s.id&&!localSeen.current.has(t.id)&&(force||!tipSeen(userId,t.id)))
 return createPortal(<aside ref={card} className="guided-card" style={position?{...position,bottom:'auto',right:'auto'}:undefined} aria-label="CaseBuilder page guide" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();dismiss()}}}><div className="guided-card-top"><span>{s.kind==='page'?'A QUICK POINTER':'QUICK START'}</span><button type="button" className="icon-btn" aria-label="Dismiss this tip" onClick={dismiss}>×</button></div><h2>{s.title}</h2><p>{s.text}</p><footer>{s.kind==='main'?<button type="button" className="link-btn" onClick={skip}>Skip tour</button>:<span className="guided-once">Just once, then out of your way.</span>}<button type="button" className="primary" onClick={dismiss}>{more?'Next tip':'Got it'}</button></footer></aside>,document.body)
}
