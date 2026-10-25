import React,{useMemo,useState} from 'react'
import {buildEvidenceReview} from '../evidenceReview.js'
export default function EvidenceReview({project}){
 const review=useMemo(()=>buildEvidenceReview(project),[project]),[filter,setFilter]=useState('all'),[copy,setCopy]=useState('')
 const rows=filter==='open'?review.questions:review.rows
 async function copyQuestions(){try{await navigator.clipboard.writeText(review.questionText);setCopy('Questions copied')}catch{setCopy('Copy unavailable. Select the questions below to copy them.')}}
 return <section className="evidence-review no-print" aria-label="Private evidence review">
  <header><div><h2>Evidence review</h2><p>For Chris only. Check the inputs behind the case without adding source notes to the client deck.</p></div><button className="ghost" disabled={!review.questions.length} onClick={copyQuestions}>Copy open questions</button></header>
  {copy&&<p role="status">{copy}</p>}
  <div className="evidence-filter" role="group" aria-label="Inputs to review"><button className="ghost" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All inputs ({review.rows.length})</button><button className="ghost" aria-pressed={filter==='open'} onClick={()=>setFilter('open')}>Open questions ({review.questions.length})</button></div>
  <p className="help">A source link records provenance, not independent verification. Engineering capacity value is not automatically a cash saving.</p>
  <div className="evidence-rows">{rows.map(row=><article key={row.key}><div className="evidence-row-head"><h3>{row.label}</h3><strong>{row.value}</strong><span>{row.missing?'Not entered':row.state==='input'?'Input':row.state==='assumption'?'Assumption':'Suggestion'}</span></div>
   <p>{row.origin||(!row.missing&&row.state==='input'?'Entered by Chris; no supporting note recorded.':'No source note recorded.')}</p>
   {row.quote&&<blockquote>{row.quote}</blockquote>}
   {row.link&&<a href={row.link} target="_blank" rel="noreferrer noopener">Open source</a>}
   {row.pinnedAt&&<p className="help">Recorded {row.pinnedAt}</p>}
   {row.affected.length>0&&<p className="help">Used in: {row.affected.join(' · ')}</p>}
  </article>)}</div>
  {!rows.length&&<p>No inputs need review.</p>}
  <details className="evidence-calculations"><summary>Calculated figures and arithmetic ({review.figures.length})</summary>{review.figures.map(f=><article key={f.key}><h3>{f.label} · {f.value}</h3><p><code>{f.expression}</code></p><p><code>{f.arithmetic}</code></p>{f.flag&&<p className="help">Model flag: {f.flag}</p>}</article>)}</details>
  {review.pending.length>0&&<details className="evidence-calculations"><summary>Figures waiting for inputs ({review.pending.length})</summary>{review.pending.map(f=><p key={f.key}><strong>{f.label}:</strong> {f.missing.join(', ')}</p>)}</details>}
 </section>
}
