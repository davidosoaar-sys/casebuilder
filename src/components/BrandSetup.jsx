import React, {useState} from 'react'
import BrandPanel from './BrandPanel.jsx'
import BrandReview from './BrandReview.jsx'
import {normalizeBrand,brandVars,fontFaceCss} from '../brand.js'
export default function BrandSetup({company,brand,onChange,onScan,onContinue}){
 const b=normalizeBrand(brand),[editing,setEditing]=useState(false)
 return <section className="page brand-setup"><h1>Make it look like {company}.</h1><p className="sub">Review the company logo, colors and typography before building the case.</p><style>{fontFaceCss(b)}</style>
 <div className="brand-setup-preview" style={brandVars(b)} aria-label="Company brand preview">
 {(b.logo||b.icon)?<div className="brand-setup-marks">{b.icon&&<img className="brand-setup-icon" src={b.icon} alt={company+' icon'}/>}{b.logo&&<img className="brand-setup-logo" style={b.logoBackground!=='transparent'?{background:b.logoBackground,padding:8,borderRadius:4}:undefined} src={b.logo} alt={company+' logo'}/>}</div>:<p role="status">{b.status==='scanning'?'Finding the official company logo…':'No verified company logo found yet.'}</p>}
 <h2>{company}</h2><p>Your business case</p><div className="brand-setup-swatches" aria-label="Brand colors">{['primary','background','surface','text'].map(k=><span key={k} style={{background:b[k]}} title={k+': '+b[k]}/>)}</div></div>
 <p role="status" className="help">{b.message}</p>
 {b.website&&<p className="help">Official website: <a href={b.website} target="_blank" rel="noreferrer">{b.website}</a></p>}
 {b.linkedinUrl&&<p className="help"><a href={b.linkedinUrl} target="_blank" rel="noreferrer noopener">Company LinkedIn page</a></p>}{b.sourceNotes?.map((n,i)=><p key={i} className="help">{n.message} <a href={n.url} target="_blank" rel="noreferrer noopener">Source</a></p>)}
 <BrandReview review={b.review}/>
 <div className="brand-setup-actions"><button className="ghost" onClick={()=>setEditing(v=>!v)} aria-expanded={editing}>{editing?'Hide brand controls':'Correct website or edit branding'}</button><button className="primary" onClick={onContinue} disabled={b.status==='scanning'}>{b.logo?'Use this branding':'Continue without a logo'}</button></div>
 {editing&&<BrandPanel brand={b} onChange={onChange} onScan={onScan} onClose={()=>setEditing(false)}/>}
 </section>
}
