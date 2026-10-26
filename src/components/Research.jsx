// Research: ask anything, the account's own agent researches it (Tavily search
// and full-page reads, plus any connectors switched on for a chosen project),
// and the answer comes back with numbered sources and the tools it used.
// "Person" switches the same page to the person lookup.
import React, { useEffect, useRef, useState } from 'react'
import PageHead from './PageHead.jsx'
import ToolTrace from './ToolTrace.jsx'
import { supabase } from '../supabase.js'
import { useModelKeys } from './Settings.jsx'
import { listResearch, getResearch, startResearch, isRunning, researchTitle, parseMarkdown, parseInline, MAX_QUESTION } from '../research.js'

const POLL_MS = 2500
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
// The page part of a URL, for a source with no title ("/wiki/Spotify").
const path = u => { try { const x = new URL(u); return decodeURIComponent(x.pathname + x.search).replace(/\/$/, '') } catch { return '' } }
const when = iso => {
  const d = new Date(iso), mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// chips: chat replies show each citation as "[1] host.com" (the full title or
// URL in a tooltip on hover and focus), and keep a "[7]" that has no source as
// plain text. Research answers show the number alone and drop unverified ones.
function Inline({ text, sources, chips }) {
  return parseInline(text).map((x, i) => {
    if (x.t === 'b') return <strong key={i}>{x.v}</strong>
    if (x.t === 'i') return <em key={i}>{x.v}</em>
    if (x.t === 'code') return <code key={i}>{x.v}</code>
    if (x.t === 'link') return <a key={i} href={x.href} target="_blank" rel="noreferrer noopener">{x.v}</a>
    if (x.t === 'cite') {
      const s = sources.find(s => s.n === x.n)
      if (!s) return chips ? <React.Fragment key={i}>[{x.n}]</React.Fragment> : null // a citation with no verified source is not shown
      if (chips && s.url) return (
        <a key={i} className="src-chip" href={s.url} target="_blank" rel="noreferrer noopener" data-tip={s.title || s.url} aria-label={`Source ${x.n}: ${s.title || s.url}`}>
          <span className="src-chip-n">{x.n}</span><span className="src-chip-host">{host(s.url)}</span>
        </a>
      )
      return s.url
        ? <a key={i} className="research-cite" href={s.url} target="_blank" rel="noreferrer noopener" title={s.title || s.url}>{x.n}</a>
        : <span key={i} className="research-cite" title={s.title}>{x.n}</span>
    }
    return <React.Fragment key={i}>{x.v}</React.Fragment>
  })
}

export function Answer({ text, sources = [], chips = false }) {
  return (
    <div className="research-answer">
      {parseMarkdown(text).map((b, i) => {
        if (b.type === 'h') return React.createElement(b.level <= 2 ? 'h3' : 'h4', { key: i }, <Inline text={b.text} sources={sources} chips={chips} />)
        if (b.type === 'ul' || b.type === 'ol') return React.createElement(b.type, { key: i }, b.items.map((it, j) => <li key={j}><Inline text={it} sources={sources} chips={chips} /></li>))
        return <p key={i}><Inline text={b.text} sources={sources} chips={chips} /></p>
      })}
    </div>
  )
}

// Numbered two-line chips (title, then host) in a wrapping row.
export function Sources({ sources, dropped }) {
  if (!sources.length && !dropped) return null
  return (
    <section className="research-sources" aria-label="Sources">
      <h3>Sources</h3>
      <ol className="src-row">
        {sources.map(s => (
          <li key={s.n}>
            {s.url
              ? <a className="src-card" href={s.url} target="_blank" rel="noreferrer noopener" data-tip={s.url}>
                  <span className="src-chip-n">{s.n}</span><span className="src-card-text"><span>{s.title || host(s.url)}</span><small>{s.title ? host(s.url) : path(s.url) || host(s.url)}</small></span>
                </a>
              : <span className="src-card is-conn"><span className="src-chip-n">{s.n}</span><span className="src-card-text"><span>{s.title}</span><small>Connector</small></span></span>}
          </li>
        ))}
      </ol>
      {dropped > 0 && <p className="research-dropped">{dropped} cited {dropped === 1 ? 'source was' : 'sources were'} removed: the agent's searches never returned {dropped === 1 ? 'it' : 'them'}.</p>}
    </section>
  )
}

function Result({ job, projects }) {
  const r = job.result || {}
  const project = projects.find(p => p.id === job.deal_id)
  const running = isRunning(job)
  return (
    <article className="research-result" aria-busy={running}>
      <header className="research-q">
        <h2>{job.payload?.question}</h2>
        <p>{project ? <>For <strong>{project.name}</strong> · </> : null}{when(job.created_at)}{r.seconds ? ` · ${Math.round(r.seconds)}s` : ''}</p>
      </header>
      <ToolTrace steps={r.trace || []} running={running} defaultOpen={running} key={running ? 'live' : 'done'} />
      {running
        ? <p className="research-working" role="status"><span className="cmd-spin" aria-hidden="true" />{job.status === 'queued' ? 'Waiting for the agent…' : 'Researching…'}</p>
        : job.status === 'failed' || job.status === 'cancelled'
          ? <div role="alert" className="lookup-error"><strong>This research could not finish.</strong><p>{job.error || 'The agent stopped.'}</p></div>
          : r.error === 'no_key'
            ? <div role="alert" className="lookup-error"><strong>No AI model key on your account.</strong><p>Add one in Settings and ask again.</p></div>
            : <><Answer text={r.text || ''} sources={r.sources || []} /><Sources sources={r.sources || []} dropped={r.dropped_sources || 0} /></>}
    </article>
  )
}

export default function Research({ userId, projects = [], project, personPage, onSettings }) {
  const [mode, setMode] = useState('ask')
  const [question, setQuestion] = useState('')
  const dealId = project?.id || ''
  const [history, setHistory] = useState([])
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const { keys } = useModelKeys(userId)
  const noKey = keys && keys.length === 0
  const box = useRef(null)

  useEffect(() => {
    let alive = true
    listResearch(supabase, userId).then(list => { if (alive) setHistory(dealId ? list.filter(j => j.deal_id === dealId) : list) }).catch(e => alive && setError(e.message))
    return () => { alive = false }
  }, [userId, dealId])

  const open = history.find(j => j.id === openId)
  // Poll whichever jobs are still running (the open one updates live).
  const runningIds = history.filter(isRunning).map(j => j.id).join(',')
  useEffect(() => {
    if (!runningIds) return
    const t = setInterval(async () => {
      for (const id of runningIds.split(',')) {
        try { const j = await getResearch(supabase, id); setHistory(h => h.map(x => x.id === id ? j : x)) } catch {}
      }
    }, POLL_MS)
    return () => clearInterval(t)
  }, [runningIds])

  async function ask(e) {
    e?.preventDefault()
    if (noKey) { setError('Add an AI model key in Settings first.'); return }
    if (!question.trim() || sending) return
    setSending(true); setError('')
    try {
      const job = await startResearch(supabase, { userId, question, dealId })
      setHistory(h => [job, ...h])
      setOpenId(job.id)
      setQuestion('')
    } catch (err) {
      setError(/foreign key|row-level/i.test(err.message) ? 'That project has not finished saving yet. Try again in a second.' : err.message)
    } finally { setSending(false) }
  }

  const newResearch = () => { setOpenId(null); setMode('ask'); setTimeout(() => box.current?.focus(), 0) }

  return (
    <section className="page research-page no-print" aria-label="Research">
      <PageHead title="Research" sub={`Ask anything about ${project?.name || 'an account'}, its market or its people. Every answer shows its sources and the work behind it.`} />
      <div className="research-layout">
        <aside className="research-history" aria-label="Past research">
          <button type="button" className="ghost research-new" onClick={newResearch}><span aria-hidden="true">+</span> New research</button>
          {history.length === 0
            ? <p className="research-history-empty">Your research will appear here.</p>
            : <ul>{history.map(j => (
              <li key={j.id}>
                <button type="button" className={j.id === openId ? 'is-on' : ''} onClick={() => { setOpenId(j.id); setMode('ask') }} aria-current={j.id === openId ? 'true' : undefined}>
                  <span>{researchTitle(j)}</span>
                  <small>{isRunning(j) ? 'Researching…' : j.status === 'failed' ? 'Failed' : when(j.created_at)}</small>
                </button>
              </li>
            ))}</ul>}
        </aside>

        <div className="research-main">
          <div className="research-modes" role="tablist" aria-label="Research type">
            <button type="button" role="tab" aria-selected={mode === 'ask'} className={mode === 'ask' ? 'is-on' : ''} onClick={() => setMode('ask')}>Ask</button>
            <button type="button" role="tab" aria-selected={mode === 'person'} className={mode === 'person' ? 'is-on' : ''} onClick={() => setMode('person')}>Person</button>
          </div>

          {mode === 'person' ? personPage : open ? <Result job={open} projects={projects} /> : <>
            <form className="research-ask" onSubmit={ask}>
              <textarea ref={box} value={question} maxLength={MAX_QUESTION} rows={3} aria-label="Research question"
                placeholder="What do you want to know? e.g. How is Spotify's platform engineering team organised?"
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) ask(e) }} />
              <div className="research-ask-bar">
                <span className="research-project">Reads this project's files and connectors</span>
                <button type="submit" className="primary" disabled={!question.trim() || sending || noKey}>{sending ? 'Starting…' : 'Research'}</button>
              </div>
              <p className="research-hint">Searches the web with Tavily and reads pages in full. Usually 30 to 90 seconds.</p>
            </form>
            {noKey && <p className="chat-note">Research runs on your own AI model key. <button type="button" className="link-btn" onClick={onSettings}>Add it in Settings</button></p>}
            {!history.length && <div className="lookup-empty research-empty">
              <h2>Start with a question</h2>
              <p>Who owns developer experience at a company, what changed in their last earnings call, how a competitor prices. You get an answer, the sources, and every search the agent ran.</p>
            </div>}
          </>}
          {error && <p className="auth-error" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  )
}
