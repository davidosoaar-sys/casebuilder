import React, {useState} from 'react'
import BrandPanel from './BrandPanel.jsx'
import BrandReview from './BrandReview.jsx'
import {normalizeBrand,brandVars,fontFaceCss} from '../brand.js'
import {AgentProgress,BrandPlaceholder,BRAND_STEPS} from './AgentProgress.jsx'
export default function BrandSetup({company,brand,onChange,onScan,onContinue}){
 const b=normalizeBrand(brand),[editing,setEditing]=useState(false)
 const scanning=b.status==='scanning'
 return <section className="page brand-setup"><h1>Make it look like {company}.</h1><p className="sub">Company assets are found and checked automatically. You can adjust them anytime.</p><style>{fontFaceCss(b)}</style>
 {scanning?<AgentProgress steps={BRAND_STEPS} every={7000} label={`Finding ${company}'s brand`}><BrandPlaceholder/></AgentProgress>:<>
 <div className="brand-setup-preview" style={brandVars(b)} aria-label="Company brand preview">
 {(b.logo||b.icon)?<div className="brand-setup-marks">{b.icon&&<img className="brand-setup-icon" src={b.icon} alt={company+' icon'}/>}{b.logo&&<img className="brand-setup-logo" style={b.logoBackground!=='transparent'?{background:b.logoBackground,padding:8,borderRadius:4}:undefined} src={b.logo} alt={company+' logo'}/>}</div>:<p role="status">No verified company logo found yet.</p>}
 <h2>{company}</h2><p>Your business case</p><div className="brand-setup-swatches" aria-label="Brand colors">{['primary','background','surface','text'].map(k=><span key={k} style={{background:b[k]}} title={k+': '+b[k]}/>)}</div></div>
 <p role="status" className="help">{b.message}</p></>}
 {b.website&&<p className="help">Official website: <a href={b.website} target="_blank" rel="noreferrer">{b.website}</a></p>}
 {b.linkedinUrl&&<p className="help"><a href={b.linkedinUrl} target="_blank" rel="noreferrer noopener">Company LinkedIn page</a></p>}{b.sourceNotes?.map((n,i)=><p key={i} className="help">{n.message} <a href={n.url} target="_blank" rel="noreferrer noopener">Source</a></p>)}
 {b.companyCandidates.map(c=><button className="ghost" key={c.website} onClick={()=>onScan(c.website)}>{c.name} · {new URL(c.website).hostname}</button>)}
 <BrandReview review={b.review}/>
 <div className="brand-setup-actions"><button className="ghost" onClick={()=>setEditing(v=>!v)} aria-expanded={editing}>{editing?'Hide brand controls':'Correct website or edit branding'}</button><button className="primary" onClick={onContinue} disabled={b.status==='scanning'}>{b.logo?'Use this branding':'Continue without a logo'}</button></div>
 {editing&&<BrandPanel brand={b} onChange={onChange} onScan={onScan} onClose={()=>setEditing(false)}/>}
 </section>
}
