import React from 'react'
export default function BrandReview({review}){
 if(!review)return null
 return <details className="brand-review"><summary>Brand decisions and checks</summary>
 <p>{review.mode==='agent-selected'?'The agent selected from verified asset candidates.':'Extracted assets are shown as a fallback; no validated agent selection was available.'} Source details are available below.</p>
 <dl>{review.decisions.map((d,i)=><div key={i}><dt>{d.field}</dt><dd>{d.value} <small>{d.origin==='observed'?'From source':d.origin==='fallback'?'Fallback':'Readability adjustment'}</small>{d.sourceUrl&&<a href={d.sourceUrl} target="_blank" rel="noreferrer noopener">Source</a>}</dd></div>)}</dl>
 {review.adjustments.map((text,i)=><p key={'adjustment-'+i}>{text}</p>)}{review.warnings.map((text,i)=><p className="help" key={'warning-'+i}>{text}</p>)}
 <p className="help">{review.checks?.displayCheckPerformed ? (review.checks.logoVisible?'Logo decoding and visibility checked automatically.':'The logo did not pass the display check.') : 'Automated source and contrast checks are not a visual approval.'} Font and source limitations are recorded here.</p>
 </details>
}
