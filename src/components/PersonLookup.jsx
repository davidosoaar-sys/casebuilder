import React from 'react'
import PageHead from './PageHead.jsx'
import {ProfileAvatar,PublicProfileLinks} from './ProfileMedia.jsx'

function SearchIcon(){return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5" strokeLinecap="round"/></svg>}
function SourceLink({url,label='View source'}){
  if(!/^https?:\/\//i.test(url||''))return null
  return <a className="lookup-evidence-link" href={url} target="_blank" rel="noreferrer noopener" aria-label={label} title={url}><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 3H3v10h10v-3M8 2h6v6M7 9l7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></a>
}
function Evidence({claim,label}){
  if(!claim?.value||!/^https?:\/\//i.test(claim.sourceUrl||''))return <span className="lookup-missing">not found</span>
  return <span className="lookup-evidence">{claim.value}<SourceLink url={claim.sourceUrl} label={'Source for '+(label||String(claim.value).slice(0,80))}/></span>
}
const identityText=request=>request.name||request.email||request.linkedinUrl||'Person'

export default function PersonLookup({lookup,project,onAdd,onInput}){
  const {query,setQuery,demo,setDemo,results,run,choose,busy}=lookup
  return <section className="page person-lookup lookup-page no-print" aria-label="Person lookup">
    <PageHead title="Person lookup" sub="A little context before the conversation."/>
    <div className="lookup-body">
      <form className="lookup-search" onSubmit={e=>{e.preventDefault();run()}}>
        <div className="lookup-search-line">
          <span className="lookup-search-icon"><SearchIcon/></span>
          <input id="person-query" type="text" aria-label="Name, email or LinkedIn URL" aria-describedby="lookup-search-help" value={query} onChange={e=>setQuery(e.target.value)} onPaste={e=>{const pasted=e.clipboardData.getData('text');if(/[\r\n]/.test(pasted)){e.preventDefault();const input=e.currentTarget;setQuery(query.slice(0,input.selectionStart)+pasted.replace(/[\r\n]+/g,'; ')+query.slice(input.selectionEnd))}}} placeholder="Name, email or LinkedIn URL" autoComplete="off"/>
          <button className="primary" disabled={!query.trim()} type="submit">{busy?'Search again':'Look up'}<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
        <div className="lookup-search-meta">
          <p id="lookup-search-help">{project?<><span className="lookup-context-dot" aria-hidden="true"/>For <strong>{project.name}</strong><span className="lookup-meta-divider">·</span></>:null}Paste several names separated by semicolons.</p>
          <details className="lookup-test-options"><summary>Search options</summary><label className="lookup-demo"><input type="checkbox" checked={demo} onChange={e=>setDemo(e.target.checked)}/>Use fictional demo result</label></details>
        </div>
      </form>
      {demo&&<p className="lookup-demo-notice">Fictional demo · Uses the name you enter and example.com sources. No live search.</p>}
      {!results.length&&<div className="lookup-empty">
        <svg className="lookup-empty-symbol" width="76" height="62" viewBox="0 0 76 62" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><circle cx="30" cy="26" r="21"/><circle cx="30" cy="22" r="6"/><path d="M19 39c1-10 21-10 22 0m5 3 15 15" strokeLinecap="round"/><path d="M57 12h12m-6-6v12" strokeLinecap="round"/></svg>
        <h2>Who’s joining the conversation?</h2>
        <p>Start with a name. Get their role, stakeholder fit<br className="lookup-desktop-break"/> and relevant public activity, with sources.</p>
        <div className="lookup-empty-note"><span>One person or a whole invite list</span><span>Only sourced findings</span></div>
      </div>}
      <div className="lookup-results" aria-live="polite" aria-relevant="additions text">{results.map((result,i)=>{
        const p=result.person,ambiguous=!!p?.candidates?.length,pending=['queued','searching'].includes(result.status)
        const added=project?.stakeholders.some(s=>s.namedPeople?.some(n=>n.lookupId===`${p?.name?.value.toLowerCase()}|${(p?.company?.value||'').toLowerCase()}`))
        const disabled=p?.sourcesSkipped?.filter(s=>s.reason==='disabled')||[]
        return <article className="lookup-result" key={`${i}:${identityText(result.request)}`} aria-busy={pending}>
          <div className="lookup-result-status"><span className="lookup-request">{identityText(result.request)}</span><span>{pending?<span className="lookup-progress"><span aria-hidden="true"/>{result.status==='queued'?'Queued':p?.name?'Checking public context':'Finding identity'}</span>:result.cached?'From this session':result.error?'Search incomplete':'Brief ready'}</span></div>
          {result.error&&<div role="alert" className="lookup-error"><strong>Couldn’t complete this lookup.</strong><p>{result.error}</p><span>Your search and deal are unchanged.</span></div>}
          {ambiguous?<div className="lookup-ambiguity"><h3>Which person do you mean?</h3><p className="lookup-secondary">Several people match. Choose one to continue.</p>{p.candidates.map((candidate,n)=><div className="lookup-candidate" key={n}><div><strong><Evidence claim={candidate.name}/></strong><p><Evidence claim={candidate.title}/><span className="lookup-meta-divider">·</span><Evidence claim={candidate.company}/></p></div><button className="ghost" onClick={()=>choose(i,candidate)} aria-label={'Choose '+candidate.name.value}>Choose person</button></div>)}</div>:p&&<>
            <header className="lookup-person-head"><ProfileAvatar className="lookup-profile-avatar" photo={p.photo} name={p.name?.value||identityText(result.request)}/><div className="lookup-person-identity"><h2><Evidence claim={p.name}/></h2><p><Evidence claim={p.title}/><span className="lookup-meta-divider">·</span><Evidence claim={p.company}/></p>{p.tenure&&<div className="lookup-tenure"><Evidence claim={p.tenure} label="time in role"/> in role</div>}</div>{project&&p.name&&p.title&&p.roleMatch&&<button className={added?'ghost lookup-add':'primary lookup-add'} disabled={added||result.status==='error'} onClick={()=>onAdd(p)}>{added?'Added to deal':'Add to this deal'}{!added&&<span aria-hidden="true">+</span>}</button>}</header>
            <PublicProfileLinks links={p.links} email={p.email} linkedin={p.linkedin}/>
            <div className="lookup-brief-grid">
              <section className="lookup-primary-brief"><h3>Likely priorities <span className="lookup-inference-label">Inferred</span></h3><p className="lookup-care">{p.likelyCares?<Evidence claim={p.likelyCares} label="inferred priorities"/>:<span className="lookup-missing">{pending?'Checking relevant context…':'not found'}</span>}</p><h3>Relevant public activity</h3>{p.publicSignals.length?<ul className="lookup-signals">{p.publicSignals.map((claim,j)=><li key={j}><Evidence claim={claim}/></li>)}</ul>:<p className="lookup-missing">{pending?'Still checking public sources…':'not found'}</p>}</section>
              <aside className="lookup-role-brief"><h3>Stakeholder fit</h3>{p.roleMatch?<><p className="lookup-role-name">{p.roleMatch.role}<SourceLink url={p.roleMatch.sourceUrl} label="Source for stakeholder inference"/></p><span className="lookup-confidence">Inferred · {p.roleMatch.confidence} confidence</span><p className="lookup-secondary">{p.roleMatch.why}</p><p className="lookup-inference-note">Based on their title; not confirmed with this person.</p></>:<p className="lookup-missing">{pending?'Waiting for a sourced title…':'not found — a sourced title is needed.'}</p>}</aside>
            </div>
            {!!p.conversationStarters?.length && <section className="lookup-conversation"><h3>Conversation starters</h3><p className="lookup-secondary">Suggested questions · public professional context only</p>{p.conversationStarters.map((starter,j)=>(/^https?:\/\//i.test(starter.sourceUrl||''))&&<div className="lookup-conversation-item" key={j}><p>{starter.question}<SourceLink url={starter.sourceUrl} label="Context for conversation starter"/></p><small>{starter.kind==='role-based'?'Inferred from title':starter.context}</small></div>)}</section>}
            <details className="lookup-detail-section"><summary>Reporting relationships</summary><dl className="lookup-facts"><div><dt>Reports to</dt><dd><Evidence claim={p.reportsTo}/></dd></div><div><dt>Direct reports</dt><dd>{p.reports.length?p.reports.map((claim,j)=><p key={j}><Evidence claim={claim}/></p>):<span className="lookup-missing">not found</span>}</dd></div></dl></details>
            {p.suggestedInputs.length>0&&<section className="lookup-suggestions"><h3>Possible input updates</h3><p className="lookup-secondary">Review these before changing the case.</p>{p.suggestedInputs.map((suggestion,j)=><div key={j}><p>{suggestion.label}: <strong>{suggestion.value}</strong><SourceLink url={suggestion.sourceUrl} label={'Source for '+suggestion.label}/></p>{project&&<button className="ghost" onClick={()=>onInput(suggestion)}>Review suggested input</button>}</div>)}</section>}
          </>}
          {p&&<details className="lookup-detail-section lookup-coverage"><summary>Sources & search coverage <span>{disabled.length?`${disabled.length} disabled`:p.sourcesUsed.length?`${p.sourcesUsed.length} used`:'No sources yet'}</span></summary><div className="lookup-gaps"><p>Sources used: {p.sourcesUsed.map(s=>s==='web'?'Public web':s).join(', ')||'none yet'}.</p>{p.sourcesSkipped.map(s=><p key={s.source}>{s.reason==='disabled'?`${s.label} is disabled, so no ${s.source==='slack'?'internal context':s.label+' context'} was used.`:`${s.label} is enabled: ${s.reason}.`}</p>)}</div></details>}
        </article>
      })}</div>
    </div>
  </section>
}
