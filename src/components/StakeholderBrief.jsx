// One stakeholder's page: a brief synthesised by the agent from this project's
// files and connector material. Where they stand, what they care about, what was
// decided, what they are waiting on, and their own words (each quote checked
// word for word against the material by the worker). Not a transcript.
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { listFiles } from '../projectFiles.js'
import { latestBriefs, getBrief, startBrief, briefRunning, ASK_STATUS, STANCE, briefSources } from '../stakeholderBriefs.js'

const when = iso => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function StakeholderBrief({ project, stakeholder, userId, onBack, onFiles }) {
  const [job, setJob] = useState(undefined)
  const [error, setError] = useState('')
  const [files, setFiles] = useState(null)

  useEffect(() => {
    let alive = true
    latestBriefs(supabase, project.id).then(m => alive && setJob(m[stakeholder.key] || null)).catch(e => { if (alive) { setError(e.message); setJob(null) } })
    listFiles(supabase, project.id).then(l => alive && setFiles(l.filter(f => f.kind !== 'instructions' && f.enabled).length)).catch(() => alive && setFiles(0))
    return () => { alive = false }
  }, [project.id, stakeholder.key])

  useEffect(() => {
    if (!briefRunning(job)) return
    const t = setInterval(async () => { try { setJob(await getBrief(supabase, job.id)) } catch {} }, 2500)
    return () => clearInterval(t)
  }, [job?.id, job?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    setError('')
    try { setJob(await startBrief(supabase, { userId, dealId: project.id, stakeholder })) } catch (e) { setError(e.message) }
  }

  const src = briefSources(project, files || 0)
  const nothing = files !== null && src.files === 0 && src.connectorDocs === 0
  const b = job?.result?.brief
  const running = briefRunning(job)
  const failed = job && !running && (job.status === 'failed' || !b)
  const named = (stakeholder.namedPeople || []).map(p => p.name).filter(Boolean)
  const people = named.length ? named : (b?.people || [])

  return (
    <section className="sb-page" aria-label={`Brief for ${stakeholder.role}`}>
      <button type="button" className="link-btn sb-back" onClick={onBack}>← Stakeholder map</button>
      <header className="sb-head">
        <div>
          <h2>{stakeholder.role}</h2>
          <p>{people.length ? people.join(', ') : 'No named person yet'}{b ? <> · <span className={`sb-stance sb-stance-${b.stance}`}>{STANCE[b.stance] || STANCE.unknown}</span></> : null}</p>
        </div>
        <div className="sb-head-actions">
          {job?.updated_at && !running && b && <small>Updated {when(job.updated_at)}</small>}
          <button type="button" className={b ? 'ghost' : 'primary'} onClick={run} disabled={running || job === undefined || nothing}>
            {running ? 'Reading the material…' : b ? 'Refresh brief' : 'Write the brief'}
          </button>
        </div>
      </header>

      {error && <p className="auth-error" role="alert">{error}</p>}
      {nothing && <p className="sb-empty">Nothing to read yet. Add call transcripts or meeting notes in <button type="button" className="link-btn" onClick={onFiles}>Files</button> or a connector, then write the brief.</p>}
      {!nothing && job === null && <p className="sb-empty">The agent reads this project's {src.files} file{src.files === 1 ? '' : 's'}{src.connectorDocs ? ` and ${src.connectorDocs} connector item${src.connectorDocs === 1 ? '' : 's'}` : ''} and writes what they show about the {stakeholder.role}: where they stand, what was decided, what they are waiting on. It does not search the web.</p>}
      {running && <p className="sb-empty" role="status"><span className="cmd-spin" aria-hidden="true" /> Reading the material for the {stakeholder.role}. Usually 20 to 60 seconds.</p>}
      {failed && <p className="auth-error" role="alert">{job.result?.error || job.error || 'The brief could not be written. Try again.'}</p>}

      {b && !running && <div className="sb-body">
        <p className="sb-summary">{b.summary}</p>
        {b.next_step && <p className="sb-next"><strong>Before the next conversation:</strong> {b.next_step}</p>}

        <div className="sb-grid">
          <section className="sb-card">
            <h3>Cares about</h3>
            {b.cares_about.length ? <ul className="sb-chips">{b.cares_about.map((c, i) => <li key={i}>{c}</li>)}</ul> : <p className="sb-none">Nothing in the material.</p>}
          </section>
          <section className="sb-card">
            <h3>Concerns</h3>
            {b.concerns.length ? <ul>{b.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul> : <p className="sb-none">None raised in the material.</p>}
          </section>
        </div>

        <section className="sb-card">
          <h3>Requirements and open asks</h3>
          {b.open_asks.length ? <ul className="sb-asks">{b.open_asks.map((a, i) => (
            <li key={i}><span className={`sb-status sb-status-${a.status}`}>{ASK_STATUS[a.status] || ASK_STATUS.open}</span><span>{a.text}</span><small>{a.owner === 'them' ? 'On them' : 'On us'}{a.source ? ` · ${a.source}` : ''}</small></li>
          ))}</ul> : <p className="sb-none">No open asks in the material.</p>}
        </section>

        <section className="sb-card">
          <h3>Decisions</h3>
          {b.decisions.length ? <ul className="sb-decisions">{b.decisions.map((d, i) => (
            <li key={i}><span>{d.text}</span><small>{[d.date, d.source].filter(Boolean).join(' · ')}</small></li>
          ))}</ul> : <p className="sb-none">No decisions recorded yet.</p>}
        </section>

        {b.quotes.length > 0 && <section className="sb-card">
          <h3>In their words</h3>
          {b.quotes.map((q, i) => <blockquote key={i}>“{q.text}”{q.source && <cite>{q.source}</cite>}</blockquote>)}
        </section>}
        {job.result?.dropped_quotes > 0 && <p className="sb-note">{job.result.dropped_quotes} quote{job.result.dropped_quotes === 1 ? ' was' : 's were'} left out because {job.result.dropped_quotes === 1 ? 'it was' : 'they were'} not word for word in the material.</p>}
      </div>}
    </section>
  )
}
