import React,{useState} from 'react'
import DeckLogo from './DeckLogo.jsx'
import {prepareTemplateBrand} from '../deck/template.js'

export default function TemplateSetup({company,brand,onBack,onContinue}){
 const [choice,setChoice]=useState(brand?.template==='backstage'?'backstage':'company')
 const [previews,setPreviews]=useState({}),[busy,setBusy]=useState(false)
 React.useEffect(()=>{let active=true;Promise.all(['company','backstage'].map(async key=>[key,await prepareTemplateBrand(brand,key)])).then(rows=>{if(active)setPreviews(Object.fromEntries(rows))});return()=>{active=false}},[brand])
 return <section className="page template-setup" data-tour="theme"><h1>How should the case look?</h1><p className="sub">Choose a starting theme for {company}. You can change it later in Deck design.</p>
 <fieldset className="template-setup-options"><legend>Deck theme</legend>{[
 ['company','Company branding','A white canvas with the company’s logo, fonts and brand accents.'],
 ['backstage','Backstage theme','The complete dark Backstage palette and typography, with a light customer mark.']
 ].map(([key,label,description])=>{const b=previews[key];return <label className="template-setup-option" key={key}><input type="radio" name="case-theme" value={key} checked={choice===key} onChange={()=>setChoice(key)}/><strong>{label}</strong><span className="template-setup-swatch" style={{background:b?.background|| (key==='company'?'#ffffff':'#111111'),color:b?.text|| (key==='company'?'#111111':'#e3e3e3'),fontFamily:b?.headingFont}}>{b&&<DeckLogo brand={b}/>}<span style={{borderBottom:`3px solid ${b?.primary||'#9bf0de'}`}}>Business case</span></span><span>{description}</span></label>})}</fieldset>
 <p className="help">Backstage’s mark stays green in both themes. Single-color black/white customer marks adapt to the canvas; multicolor and opaque artwork stay intact.</p>
 <div className="brand-setup-actions"><button type="button" className="ghost" onClick={onBack} disabled={busy}>Back to stakeholders</button><button type="button" className="primary" disabled={busy||!previews[choice]} onClick={async()=>{setBusy(true);try{await onContinue(choice)}finally{setBusy(false)}}}>{busy?'Preparing theme…':'Create case with this theme'}</button></div></section>
}
