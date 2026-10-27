import React from 'react'
const steps=[['map','Stakeholders'],['brand','Company assets'],['people','People'],['theme','Theme']]
export default function SetupProgress({stage}){
 const active=steps.findIndex(([key])=>key===stage)
 return <nav aria-label="New case setup" className="setup-progress"><ol>{steps.map(([key,label],i)=><li key={key} aria-current={key===stage?'step':undefined}><span aria-hidden="true">{i<active?'✓':i+1}</span>{label}</li>)}</ol><p>Step {active+1} of {steps.length} · Your changes save automatically.</p></nav>
}
