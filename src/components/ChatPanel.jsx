// The deal's chat with the agent. Two layouts, same component:
//   mode="full"  - its own "Agent" tab, chat fills the page
//   mode="split" - docked beside whatever tab is open, width adjustable
//
// Send: insert the user's message + a 'chat' job (the worker on the VM picks it
// up). Replies arrive over Supabase Realtime, with a job poll as a fallback.
// A reply can carry edits; they are applied straight away, once (the deal
// records which replies it has applied), and shown as a change card with Undo.
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase.js'
import { describeValue } from '../agentEdits.js'
import { useModelKeys } from './Settings.jsx'
import AgentComposer, { AGENT_MODELS } from './AgentComposer.jsx'
import CommandCards from './CommandCards.jsx'
import ToolTrace from './ToolTrace.jsx'
import { resolveStakeholder } from '../deck/stakeholders.js'

const POLL_MS = 3000
const SELECT = 'id, role, content, meta, job_id, created_at'

const Icon = ({ d, size = 15 }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const icons = {
  copy: <><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5V3.8c0-.7-.6-1.3-1.3-1.3H3.8c-.7 0-1.3.6-1.3 1.3v5.4c0 .7.6 1.3 1.3 1.3h1.7" /></>,
  check: <path d="M3 8.5l3 3 7-7" />,
  edit: <><path d="M10.5 2.8l2.7 2.7-7.6 7.6H2.9v-2.7z" /><path d="M9.2 4.1l2.7 2.7" /></>,
  plus: <path d="M8 3v10M3 8h10" />,
  mic: <><rect x="6" y="2" width="4" height="7.5" rx="2" /><path d="M3.8 7.8a4.2 4.2 0 008.4 0M8 12v2" /></>,
  up: <path d="M8 13V3.5M4 7.5l4-4 4 4" />,
  stop: <rect x="4.5" y="4.5" width="7" height="7" rx="1" fill="currentColor" stroke="none" />,
  split: <><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M9.5 3v10" /></>,
  full: <><path d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10" /></>,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  file: <><path d="M4 1.8h5l3 3v9.4H4z" /><path d="M9 1.8v3h3" /></>,
  chevron: <path d="M4.5 6.5L8 10l3.5-3.5" />
}

function useCopy() {
  const [copied, setCopied] = useState(null)
  return [copied, async (id, text) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopied(id); setTimeout(() => setCopied(c => (c === id ? null : c)), 1400)
  }]
}

export default function ChatPanel({ project, userId, userName, mode = 'split', onApply, onUndo, onRun, onPick, onClose, onSplit, onFull, onSettings }) {
  const dealId = project.id
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(null) // job id waiting for a reply
  const [live, setLive] = useState([]) // tool steps of the running job, as the worker reports them
  const [editing, setEditing] = useState(null) // { id, text }
  const [copied, copy] = useCopy()
  const { keys } = useModelKeys(userId)
  const list = useRef(null)
  const applied = project.agentLog || {}
  const noKey = keys && !keys.some(k => k.provider === 'anthropic')

  const reload = async () => {
    const { data, error } = await supabase.from('chat_messages').select(SELECT).eq('deal_id', dealId).order('id', { ascending: true }).limit(300)
    if (error) setError(error.message)
    if (data) setMessages(data)
    return data || []
  }

  // Load + subscribe. On load, pick up a job that is still running (e.g. the
  // user left and came back), so the typing indicator and the reply show.
  useEffect(() => {
    let alive = true
    setLoading(true); setMessages([]); setPending(null)
    ;(async () => {
      const data = await reload()
      if (!alive) return
      setLoading(false)
      const { data: open } = await supabase.from('jobs').select('id').eq('deal_id', dealId).eq('kind', 'chat').in('status', ['queued', 'running']).order('created_at', { ascending: false }).limit(1)
      if (alive && open?.[0] && !data.some(m => m.job_id === open[0].id)) setPending(open[0].id)
    })()
    const ch = supabase.channel(`chat-${dealId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `deal_id=eq.${dealId}` },
        payload => setMessages(ms => ms.some(m => m.id === payload.new.id) ? ms : [...ms, payload.new]))
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') reload() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; supabase.removeChannel(ch); document.removeEventListener('visibilitychange', onVisible) }
  }, [dealId]) // eslint-disable-line react-hooks/exhaustive-deps

  // While waiting, poll the job too, in case Realtime drops.
  useEffect(() => {
    setLive([])
    if (!pending) return
    const t = setInterval(async () => {
      const { data: job } = await supabase.from('jobs').select('status, error, result').eq('id', pending).single()
      if (!job) return
      if (job.status === 'running' && Array.isArray(job.result?.trace)) setLive(job.result.trace)
      if (job.status === 'done' || job.status === 'failed' || job.status === 'cancelled') {
        const data = await reload()
        if (!data.some(m => m.job_id === pending)) {
          setPending(null)
          if (job.status !== 'done') setError(job.error || 'The agent could not finish this request.')
        }
      }
    }, POLL_MS)
    return () => clearInterval(t)
  }, [pending, dealId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pending && messages.some(m => m.role === 'assistant' && m.job_id === pending)) setPending(null)
  }, [messages, pending])

  // Apply each reply's edits exactly once; run each reply's commands once.
  const runs = project.agentRuns || {}
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== 'assistant') continue
      const edits = m.meta?.edits
      if (Array.isArray(edits) && edits.length && !applied[m.id]) onApply(m.id, edits)
      const cmds = m.meta?.commands
      // Only fresh replies run by themselves; an old one never re-runs on reload.
      const fresh = Date.now() - new Date(m.created_at).getTime() < 10 * 60 * 1000
      if (Array.isArray(cmds) && cmds.length && !runs[m.id] && fresh) onRun?.(m.id, cmds)
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  const firstScroll = useRef(true)
  useEffect(() => {
    if (loading || !list.current) return
    list.current.scrollTo({ top: list.current.scrollHeight, behavior: firstScroll.current ? 'auto' : 'smooth' })
    firstScroll.current = false
  }, [messages.length, pending, loading])

  async function send({ text, attachments = [], model, effort, web }) {
    if (noKey) { setError('Add your Anthropic API key in Settings first.'); return false }
    if (pending) return false
    setError('')
    const meta = attachments.length ? { attachments: attachments.map(a => ({ name: a.name, size: a.text.length })) } : {}
    if (model) meta.model = model
    if (effort) meta.effort = effort
    if (web === false) meta.web = false
    const { data: msg, error: e1 } = await supabase.from('chat_messages')
      .insert({ deal_id: dealId, owner_id: userId, role: 'user', content: text || '(attached files)', meta }).select(SELECT).single()
    if (e1) { setError(/foreign key|not present|violates row-level/i.test(e1.message) ? 'This deal has not finished saving yet. Try again in a second.' : e1.message); return false }
    setMessages(ms => ms.some(m => m.id === msg.id) ? ms : [...ms, msg])
    const roles = (project.stakeholders || []).map(s => { const r = resolveStakeholder(s); return r ? { key: s.key, role: r.role || '', tag: r.tag || '' } : null }).filter(Boolean)
    const payload = { message: text, model, effort, web: web !== false, roles, user_name: userName || '', attachments: attachments.map(a => ({ name: a.name, text: a.text })) }
    const { data: job, error: e2 } = await supabase.from('jobs').insert({ owner_id: userId, deal_id: dealId, kind: 'chat', payload }).select('id').single()
    if (e2) { setError(/rate|limit/i.test(e2.message) ? 'Too many requests just now. Wait a minute and try again.' : e2.message); return false }
    setPending(job.id)
    return true
  }

  const visible = messages.filter(m => m.role !== 'status')

  return (
    <section className={`chat-panel chat-${mode}${!loading && visible.length === 0 ? ' is-empty' : ''}`} aria-label="Agent chat">
      <header className="chat-head">
        <div className="chat-title"><span className="chat-dot" aria-hidden="true" /><h2>Agent</h2><span className="chat-deal">{project.name}</span></div>
        <div className="chat-head-actions">
          {mode === 'full'
            ? <button type="button" className="icon-btn" onClick={onSplit} title="Split screen: show the agent beside your tabs" aria-label="Split screen"><Icon d={icons.split} /></button>
            : <>
              <button type="button" className="icon-btn" onClick={onFull} title="Open the agent full page" aria-label="Full page"><Icon d={icons.full} /></button>
              <button type="button" className="icon-btn" onClick={onClose} title="Close split screen" aria-label="Close split screen"><Icon d={icons.close} /></button>
            </>}
        </div>
      </header>

      <div className="chat-list" ref={list}>
        <div className="chat-inner">
          {loading ? <p className="chat-empty">Loading…</p> : visible.length === 0 ? (mode === 'full' ? null : (
            <div className="chat-empty">
              <p>Ask a question about this deal, or tell the agent what to change. Changes apply straight away, and every one can be undone.</p>
              <ul>
                <li>“They have 1,200 engineers.”</li>
                <li>“Use $120 an hour for engineer cost.”</li>
                <li>“Which numbers are still unconfirmed?”</li>
              </ul>
            </div>
          )) : visible.map(m => m.role === 'user' ? (
            <div key={m.id} className="chat-msg chat-user">
              {editing?.id === m.id ? (
                <EditBox initial={editing.text} onCancel={() => setEditing(null)}
                  onSave={async t => { if (await send({ text: t, model: m.meta?.model, effort: m.meta?.effort, web: m.meta?.web })) setEditing(null) }} disabled={!!pending} />
              ) : <>
                {m.meta?.attachments?.length > 0 && <div className="chat-files">{m.meta.attachments.map((a, i) => <span key={i} className="chat-file"><Icon d={icons.file} size={13} />{a.name}</span>)}</div>}
                <div className="chat-bubble">{m.content}</div>
                <div className="msg-actions on-hover">
                  <button type="button" className="icon-btn sm" onClick={() => copy(m.id, m.content)} title="Copy" aria-label="Copy message"><Icon d={copied === m.id ? icons.check : icons.copy} size={14} /></button>
                  <button type="button" className="icon-btn sm" onClick={() => setEditing({ id: m.id, text: m.content })} disabled={!!pending} title="Edit and resend" aria-label="Edit message"><Icon d={icons.edit} size={14} /></button>
                </div>
              </>}
            </div>
          ) : (
            <div key={m.id} className={`chat-msg chat-assistant${m.meta?.error ? ' is-error' : ''}`}>
              <ToolTrace steps={m.meta?.trace} />
              <div className="chat-bubble">{m.content}</div>
              <ChangeCard log={applied[m.id]} meta={m.meta} onUndo={() => onUndo(m.id)} />
              {m.meta?.commands?.length > 0 && (runs[m.id]
                ? <CommandCards run={runs[m.id]} commands={m.meta.commands} project={project} onPick={onPick} messageId={m.id} />
                : <div className="cmd-cards"><div className="cmd-card"><p className="cmd-note">This research was not run. <button type="button" className="link-btn" onClick={() => onRun?.(m.id, m.meta.commands)}>Run it now</button></p></div></div>)}
              <div className="msg-actions">
                <button type="button" className="icon-btn sm" onClick={() => copy(m.id, m.content)} title="Copy" aria-label="Copy reply"><Icon d={copied === m.id ? icons.check : icons.copy} size={14} /></button>
                {m.meta?.model && <span className="msg-meta">{AGENT_MODELS.find(x => x.id === m.meta.model)?.name || m.meta.model}{m.meta.seconds ? ` · ${Math.round(m.meta.seconds)}s` : ''}{m.meta.web === false ? ' · search off' : ''}</span>}
              </div>
            </div>
          ))}
          {pending && <div className="chat-msg chat-assistant">{live.length > 0 && <ToolTrace steps={live} running defaultOpen />}<div className="chat-bubble chat-typing" role="status" aria-label="The agent is working"><span /><span /><span /></div></div>}
        </div>
      </div>

      <div className="chat-bottom">
        {noKey && <p className="chat-note">The agent needs your Anthropic API key first. <button type="button" className="link-btn" onClick={onSettings}>Add it in Settings</button></p>}
        {error && <p className="auth-error chat-error" role="alert">{error}</p>}
        <AgentComposer disabled={noKey} busy={!!pending} onSend={send} showWelcome={!loading && visible.length === 0}
          title={`What should we work on${userName ? ', ' + userName.split(' ')[0] : ''}?`}
          subtitle={`Ask about ${project.name || 'this deal'}, or tell the agent what to change. Every change can be undone.`} />
      </div>
    </section>
  )
}

function EditBox({ initial, onSave, onCancel, disabled }) {
  const [t, setT] = useState(initial)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.setSelectionRange(t.length, t.length) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="chat-edit">
      <textarea ref={ref} value={t} onChange={e => setT(e.target.value)} rows={3}
        onKeyDown={e => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (t.trim()) onSave(t.trim()) } }} />
      <div className="chat-edit-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="primary" disabled={!t.trim() || disabled} onClick={() => onSave(t.trim())}>Send</button>
      </div>
    </div>
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
