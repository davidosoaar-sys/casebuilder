import React from 'react'
import StakeholderMap from './StakeholderMap.jsx'
import {lookupMapData} from '../lookupMap.js'

function Claim({claim}){
  return claim?.value&&/^https?:\/\//i.test(claim.sourceUrl||'')?<a href={claim.sourceUrl} target="_blank" rel="noreferrer noopener">{claim.value}</a>:<span className="lookup-missing">not found</span>
}
export default function LookupStakeholderMap({project,results}) {
  const data=lookupMapData(project,results)
  if(!data.people.length)return null
  return <section className="lookup-map-panel" aria-label="Internal stakeholder map">
    <header><h2>Where they fit</h2><p>Internal context · Looking someone up does not add them to your case.</p></header>
    <div className="lookup-map-readonly"><StakeholderMap embedded readOnly company={project?.name||'Looked-up people'} brand={project?.brand} stakeholders={data.stakeholders}/></div>
    <h3>Seniority and reporting relationships</h3>
    <p className="lookup-secondary">Ordered by title within each company. Seniority is inferred; only sourced reporting relationships are shown.</p>
    <ol className="lookup-hierarchy">{data.people.map(p=><li key={p.name.value+'|'+p.company}>
      <div><strong><Claim claim={p.name}/></strong><p><Claim claim={p.title}/>{p.companyClaim&&<> · <Claim claim={p.companyClaim}/></>}</p><small>{p.seniority.label} · inferred from title</small></div>
      <dl><div><dt>Reports to</dt><dd><Claim claim={p.reportsTo}/></dd></div><div><dt>Direct reports</dt><dd>{p.reports?.length?p.reports.map((r,i)=><span key={i}><Claim claim={r}/>{i<p.reports.length-1?'; ':''}</span>):<span className="lookup-missing">not found</span>}</dd></div></dl>
    </li>)}</ol>
  </section>
}
