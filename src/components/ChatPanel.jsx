// The deal's chat with the agent. Docked on the right of every project page.
//
// Send: insert the user's message + a 'chat' job (the worker on the VM picks it
// up). Replies arrive over Supabase Realtime. A reply can carry edits; they are
// applied to the deal straight away (once: the deal records which replies it
// has applied, so a reload or a second tab never applies them twice) and shown
// as a change card with Undo.
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase.js'
import { describeValue } from '../agentEdits.js'
import { useModelKeys } from './Settings.jsx'

const POLL_MS = 4000

export default function ChatPanel({ project, userId, onApply, onUndo, onClose, onSettings }) {
  const dealId = project.id
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(null) // job id waiting for a reply
  const { keys } = useModelKeys(userId)
  const list = useRef(null)
  const applied = project.agentLog || {}

  // Load + subscribe.
  useEffect(() => {
    let alive = true
    setLoading(true); setMessages([])
    supabase.from('chat_messages').select('id, role, content, meta, job_id, created_at')
      .eq('deal_id', dealId).order('id', { ascending: true }).limit(200)
      .then(({ data, error }) => { if (!alive) return; if (error) setError(error.message); setMessages(data || []); setLoading(false) })
    const ch = supabase.channel(`chat-${dealId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `deal_id=eq.${dealId}` },
        payload => setMessages(ms => ms.some(m => m.id === payload.new.id) ? ms : [...ms, payload.new]))
      .subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [dealId])

  // Belt and braces: while waiting, poll the job, in case Realtime drops.
  useEffect(() => {
    if (!pending) return
    const t = setInterval(async () => {
      const { data: job } = await supabase.from('jobs').select('status, error').eq('id', pending).single()
      if (!job) return
      if (job.status === 'failed') { setPending(null); setError(job.error || 'The agent could not finish this request.') }
      if (job.status === 'done' || job.status === 'failed') {
        const { data } = await supabase.from('chat_messages').select('id, role, content, meta, job_id, created_at').eq('deal_id', dealId).order('id', { ascending: true }).limit(200)
        if (data) setMessages(data)
      }
    }, POLL_MS)
    return () => clearInterval(t)
  }, [pending, dealId])

  // A reply for the job we are waiting on ends the wait.
  useEffect(() => {
    if (pending && messages.some(m => m.role === 'assistant' && m.job_id === pending)) setPending(null)
  }, [messages, pending])

  // Apply each reply's edits exactly once.
  useEffect(() => {
    for (const m of messages) {
      const edits = m.meta?.edits
      if (m.role !== 'assistant' || !Array.isArray(edits) || !edits.length) continue
      if (applied[m.id]) continue
      onApply(m.id, edits)
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }) }, [messages.length, pending])

  async function send(e) {
    e?.preventDefault()
    const text = draft.trim()
    if (!text || sending || pending) return
    setSending(true); setError('')
    const { data: msg, error: e1 } = await supabase.from('chat_messages')
      .insert({ deal_id: dealId, owner_id: userId, role: 'user', content: text }).select('id, role, content, meta, job_id, created_at').single()
    if (e1) { setSending(false); setError(/foreign key|not present/i.test(e1.message) ? 'This deal has not finished saving yet. Try again in a second.' : e1.message); return }
    setMessages(ms => ms.some(m => m.id === msg.id) ? ms : [...ms, msg])
    const { data: job, error: e2 } = await supabase.from('jobs')
      .insert({ owner_id: userId, deal_id: dealId, kind: 'chat', payload: { message: text } }).select('id').single()
    setSending(false)
    if (e2) { setError(/rate|limit/i.test(e2.message) ? 'Too many requests just now. Wait a minute and try again.' : e2.message); return }
    setDraft('')
    setPending(job.id)
  }

  const noKey = keys && !keys.length

  return (
    <aside className="chat-panel" aria-label="Agent chat">
      <header className="chat-head">
        <div><p className="mono-label">Agent</p><h2>Ask or change anything</h2></div>
        <button type="button" className="chat-x" aria-label="Close chat" onClick={onClose}>×</button>
      </header>

      <div className="chat-list" ref={list}>
        {loading ? <p className="chat-empty">Loading…</p> : messages.length === 0 ? (
          <div className="chat-empty">
            <p>Ask a question about this deal, or tell the agent what to change. Changes apply straight away; every one can be undone.</p>
            <ul>
              <li>“They have 1,200 engineers.”</li>
              <li>“Use $120 an hour for engineer cost.”</li>
              <li>“Which numbers are still unconfirmed?”</li>
            </ul>
          </div>
        ) : messages.filter(m => m.role !== 'status').map(m => (
          <div key={m.id} className={`chat-msg chat-${m.role}`}>
            <div className="chat-bubble">{m.content}</div>
            {m.role === 'assistant' && <ChangeCard log={applied[m.id]} meta={m.meta} onUndo={() => onUndo(m.id)} />}
          </div>
        ))}
        {pending && <div className="chat-msg chat-assistant"><div className="chat-bubble chat-typing" role="status">Working on it…</div></div>}
      </div>

      {noKey && <p className="chat-note">The agent needs your API key first. <button type="button" className="link-btn" onClick={onSettings}>Add it in Settings</button></p>}
      {error && <p className="auth-error chat-error" role="alert">{error}</p>}
      <form className="chat-form" onSubmit={send}>
        <textarea
          id="chat-input"
          rows={2}
          placeholder={pending ? 'Waiting for the agent…' : 'Message the agent'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(e) }}
          disabled={!!pending}
        />
        <button className="primary" type="submit" disabled={!draft.trim() || sending || !!pending}>Send</button>
      </form>
    </aside>
  )
}

function ChangeCard({ log, meta, onUndo }) {
  const rejected = log?.refused?.length ? log.refused : meta?.rejected || []
  if (!log && !rejected.length) return null
  const changes = log?.changes || []
  return (
    <div className={`chat-changes${log?.undone ? ' is-undone' : ''}`}>
      {changes.length > 0 && <>
        <p className="mono-label">{log.undone ? 'Undone' : `Changed ${changes.length} ${changes.length === 1 ? 'input' : 'inputs'}`}</p>
        <ul>
          {changes.map(c => (
            <li key={c.key}>
              <span className="chg-label">{c.label}</span>
              <span className="chg-vals"><s>{describeValue(c.before.value, c.unit)}</s> → <strong>{describeValue(c.after.value, c.unit)}</strong></span>
              <span className={`chg-state chg-${c.after.source.state}`}>{c.after.source.state === 'suggestion' ? 'suggested' : 'your number'}</span>
            </li>
          ))}
        </ul>
        {log.undone
          ? (log.skipped?.length ? <p className="chg-note">Kept your later edits to {log.skipped.join(', ')}.</p> : null)
          : <button type="button" className="ghost chg-undo" onClick={onUndo}>Undo</button>}
      </>}
      {rejected.length > 0 && <p className="chg-note">Not changed: {rejected.join(' ')}</p>}
    </div>
  )
}
