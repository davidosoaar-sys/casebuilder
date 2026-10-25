import React,{useState} from 'react'
import {REQUIREMENT_STATUS,clientRequirements} from '../stakeholderRequirements.js'
import {resolveStakeholder} from '../deck/stakeholders.js'
import {uid} from '../uid.js'
export default function StakeholderRequirements({stakeholders,onChange}){
 const[drafts,setDrafts]=useState({})
 const patch=(key,fn)=>onChange(list=>list.map(s=>s.key===key?fn(s):s))
 const status=(key,id,value)=>patch(key,s=>({...s,requirements:clientRequirements(s).map(r=>r.id===id?{...r,status:value}:r)}))
 function add(e,key){e.preventDefault();const text=(drafts[key]||'').trim();if(!text)return;patch(key,s=>({...s,requirements:[...clientRequirements(s),{id:uid(),text,status:'Not started'}]}));setDrafts(d=>({...d,[key]:''}))}
 return <section className="stakeholder-requirements">
  <h2>Client requirements</h2><p className="help">Record what each stakeholder has actually asked for. These requirements and statuses appear in client artifacts. Preparation notes stay private.</p>
  {stakeholders.map(s=><article key={s.key}>
   <h3>{resolveStakeholder(s)?.role||s.role}</h3>
   {clientRequirements(s).map(r=><div className="requirement-edit" key={r.id}>
    <input type="checkbox" aria-label={'Actioned: '+r.text} checked={r.status==='Actioned'} onChange={e=>status(s.key,r.id,e.target.checked?'Actioned':'Not started')}/><span>{r.text}</span>
    <select aria-label={'Status: '+r.text} value={r.status} onChange={e=>status(s.key,r.id,e.target.value)}>{REQUIREMENT_STATUS.map(v=><option key={v}>{v}</option>)}</select>
    <button className="ghost" aria-label={'Remove requirement: '+r.text} onClick={()=>patch(s.key,x=>({...x,requirements:clientRequirements(x).filter(q=>q.id!==r.id)}))}>Remove</button>
   </div>)}
   <form onSubmit={e=>add(e,s.key)}><input aria-label={'New requirement for '+(resolveStakeholder(s)?.role||s.role)} value={drafts[s.key]||''} maxLength={1000} onChange={e=>setDrafts(d=>({...d,[s.key]:e.target.value}))} placeholder="What did this stakeholder ask for?"/><button className="ghost" disabled={!(drafts[s.key]||'').trim()}>Add requirement</button></form>
   <label>Private preparation notes<textarea value={s.privateNotes||''} onChange={e=>patch(s.key,x=>({...x,privateNotes:e.target.value}))} placeholder="Chris’s own meeting notes; never included in client outputs."/></label>
  </article>)}
 </section>
}
