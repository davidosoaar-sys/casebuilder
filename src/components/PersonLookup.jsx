import React from 'react'

function Evidence({ claim }) {
  if (!claim) return <span className="lookup-missing">not found</span>
  return <>{claim.value} <a href={claim.sourceUrl} target="_blank" rel="noreferrer noopener">source</a></>
}
export default function PersonLookup({ lookup, project, onAdd, onInput }) {
  const { query, setQuery, demo, setDemo, results, run, choose, busy } = lookup
  return <section className="person-lookup lookup-page no-print" aria-label="Person lookup">
    <h1>Person lookup</h1>
    <div className="lookup-body">
      <form onSubmit={e => { e.preventDefault(); run() }}>
        <div className="lookup-search-line">
          <input id="person-query" type="text" aria-label="Name, email or LinkedIn URL" value={query} onChange={e => setQuery(e.target.value)} onPaste={e => { const pasted = e.clipboardData.getData('text'); if (/[\r\n]/.test(pasted)) { e.preventDefault(); const input = e.currentTarget; setQuery(query.slice(0, input.selectionStart) + pasted.replace(/[\r\n]+/g, '; ') + query.slice(input.selectionEnd)) } }} placeholder="Paste a name, email or LinkedIn URL" autoComplete="off" />
          <button className="primary" disabled={!query.trim()} type="submit">{busy ? 'Search again' : 'Look up'}</button>
        </div>
        {project && <p className="lookup-hint">Searching in {project.name}</p>}
        <details className="lookup-test-options"><summary>Demo options</summary><label className="lookup-demo"><input type="checkbox" checked={demo} onChange={e => setDemo(e.target.checked)} />Use fictional demo result</label></details>
      </form>
      {demo && <p className="lookup-hint">Demo uses the name you entered. Role and background are fictional, with example.com links. It performs no search.</p>}
      <div className="lookup-results" aria-live="polite">{results.map((result, i) => {
        const p = result.person, ambiguous = !!p?.candidates.length
        const added = project?.stakeholders.some(s => s.namedPeople?.some(n => n.lookupId === `${p?.name?.value.toLowerCase()}|${(p?.company?.value || '').toLowerCase()}`))
        return <article className="lookup-result" key={`${i}:${result.request.name}:${result.request.email || ''}`}>
          <p className="lookup-request">Lookup: {result.request.name || result.request.email || result.request.linkedinUrl}</p>
          {result.status === 'queued' && <p>Queued…</p>}
          {result.status === 'searching' && <p className="lookup-hint">{p?.name ? 'Identity ready; checking public context…' : 'Finding a sourced identity…'} You can keep working.</p>}
          {result.cached && <p className="lookup-hint">From this session’s cache</p>}
          {result.error && <p role="alert" className="lookup-error">{result.error}</p>}
          {ambiguous ? <div><strong>Several matches. Which person?</strong>{p.candidates.map((c, n) => <div className="lookup-candidate" key={n}><p><Evidence claim={c.name} /><br /><Evidence claim={c.title} /><br /><Evidence claim={c.company} /></p><button className="ghost" onClick={() => choose(i, c)}>Choose {c.name.value}</button></div>)}</div> : p && <>
            <h3><Evidence claim={p.name} /></h3>
            <dl className="lookup-facts">{[['Title', p.title], ['Company', p.company], ['Time in role', p.tenure]].map(([label, claim]) => <div key={label}><dt>{label}</dt><dd><Evidence claim={claim} /></dd></div>)}</dl>
            <div className="lookup-mapping"><strong>Stakeholder mapping</strong>{p.roleMatch ? <p>{p.roleMatch.role} · {p.roleMatch.confidence} confidence<br />Inferred from title, not confirmed. {p.roleMatch.why} <a href={p.roleMatch.sourceUrl} target="_blank" rel="noreferrer noopener">title source</a></p> : <p>not found — a sourced title is needed.</p>}</div>
            {project && p.name && p.title && p.roleMatch && <button className="primary" disabled={added || result.status === 'error'} onClick={() => onAdd(p)}>{added ? 'Added to this deal' : 'Add to this deal'}</button>}
            <dl className="lookup-facts"><div><dt>Reports to</dt><dd><Evidence claim={p.reportsTo} /></dd></div><div><dt>Reports</dt><dd>{p.reports.length ? p.reports.map((c, j) => <p key={j}><Evidence claim={c} /></p>) : 'not found'}</dd></div><div><dt>Likely cares about (inferred)</dt><dd><Evidence claim={p.likelyCares} /></dd></div></dl>
            <h4>Public statements and activity</h4>{p.publicSignals.length ? p.publicSignals.map((c, j) => <p key={j}><Evidence claim={c} /></p>) : <p className="lookup-missing">{result.status === 'searching' ? 'Still checking…' : 'not found'}</p>}
            {p.suggestedInputs.length > 0 && <div className="lookup-suggestions"><h4>Suggested inputs</h4>{p.suggestedInputs.map((s, j) => <div key={j}><p>{s.label}: {s.value} <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener">source</a></p>{project && <button className="ghost" onClick={() => onInput(s)}>Review suggested input</button>}</div>)}</div>}
          </>}
          {p && <div className="lookup-gaps"><p>Sources used: {p.sourcesUsed.map(s => s === 'web' ? 'Public web' : s).join(', ') || 'none yet'}.</p>{p.sourcesSkipped.map(s => <p key={s.source}>{s.reason === 'disabled' ? `${s.label} is disabled, so no ${s.source === 'slack' ? 'internal context' : s.label + ' context'} was used.` : `${s.label} is enabled: ${s.reason}.`}</p>)}</div>}
        </article>
      })}</div>
    </div>
  </section>
}
