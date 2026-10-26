// The deal's chat with the agent. Two layouts, same component:
//   mode="full"  - its own "Agent" tab, chat fills the page
//   mode="split" - docked beside whatever tab is open, width adjustable
//
// Send: insert the user's message + a 'chat' job (the worker on the VM picks it
// up). Replies arrive over Supabase Realtime, with a job poll as a fallback.
// A reply can carry edits; they are applied straight away, once (the deal
// records which replies it has applied), and shown as a change card with Undo.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { supabase } from '../supabase.js'
import { extractSources } from '../research.js'
import { EASE_IN_OUT, EASE_OUT, Menu } from './ui.jsx'
import { describeValue } from '../agentEdits.js'
import { useModelKeys } from './Settings.jsx'
import { activeKey } from '../modelProviders.js'
import AgentComposer, { AGENT_MODELS } from './AgentComposer.jsx'
import CommandCards from './CommandCards.jsx'
import ToolTrace from './ToolTrace.jsx'
import { Answer, Sources } from './Research.jsx'
import { MAX_QUESTION } from '../research.js'
import { useSkills } from './Skills.jsx'
import { skillMessage, skillRef, missingInput } from '../skills.js'
import { resolveStakeholder } from '../deck/stakeholders.js'

const POLL_MS = 3000
const CHAT_PAGE = 50
const SELECT = 'id, role, content, meta, job_id, created_at'
// The list follows new messages only while you are this close to the bottom.
const NEAR_BOTTOM = 96
// Empty chat: two case prompts and two artifact prompts. A chip fills the box.
const STARTERS = ["What's still missing from this case?", 'Find the VP of Engineering', 'Make the title page punchier', 'Add a page on the rollout plan']
// New messages fade and rise; the one you send rises from the composer.
const ENTER = { initial: { opacity: 0, transform: 'translateY(6px)' }, animate: { opacity: 1, transform: 'translateY(0px)' }, transition: { duration: 0.15, ease: EASE_OUT } }
const SENT = { initial: { opacity: 0, transform: 'translateY(32px)' }, animate: { opacity: 1, transform: 'translateY(0px)' }, transition: { duration: 0.2, ease: EASE_OUT } }

// "3:42 PM" today, "Oct 25, 3:42 PM" before.
const stamp = iso => {
  const d = new Date(iso)
  const today = d.toDateString() === new Date().toDateString()
  return d.toLocaleString(undefined, { ...(today ? {} : { month: 'short', day: 'numeric' }), hour: 'numeric', minute: '2-digit' })
}

// The agent's mark at the start of each of its turns: the mascot's screen.
const AgentMark = () => <span className="agent-mark" aria-hidden="true"><i /><i /></span>

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
  chevron: <path d="M4.5 6.5L8 10l3.5-3.5" />,
  trash: <><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" /></>,
  down: <path d="M8 3v9.5M4 8.5l4 4 4-4" />
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

export default function ChatPanel({ project, userId, userName, mode = 'split', onApply, onUndo, onRedo, onRun, onPick, onClose, onSplit, onFull, onSettings, onFlush, onViewCase, skillRequest, onSkillRequestDone }) {
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
  // Chat history (migration 0010): a project has many chats. chatId null = a new,
  // unsaved chat; it is created when the first message is sent.
  const [chats, setChats] = useState(null)
  const [chatId, setChatIdState] = useState(null)
  const lastKey = `casebuilder.chat.${dealId}`
  const picked = useRef(false)
  const setChatId = id => { picked.current = true; setChatIdState(id); try { id ? localStorage.setItem(lastKey, id) : localStorage.removeItem(lastKey) } catch {} }
  const chat = chats?.find(c => c.id === chatId) || null
  // Deep research: per chat. A chat started in research mode stays in it; you can
  // switch either way at any time (each message records how it was asked).
  const [researchOn, setResearchOn] = useState(false)
  const { skills } = useSkills()
  const [skillPick, setSkillPick] = useState(null) // { skill, inputs } while filling a skill's details
  const [fill, setFill] = useState(null) // a starter chip's text, for the composer
  const [newBelow, setNewBelow] = useState(false) // a reply arrived while you were scrolled up
  const stick = useRef(true) // near the bottom: follow new messages
  const seen = useRef(null) // ids on screen when the chat opened: these don't animate in
  const sent = useRef(new Set()) // ids you sent here: these rise from the composer
  // Opened from the Skills page with "Use": start a new chat with that skill.
  useEffect(() => {
    if (!skillRequest || !skills || chats === null) return // after the chat list has opened its chat
    const sk = skills.find(x => (skillRequest.key && x.key === skillRequest.key) || (skillRequest.id && x.id === skillRequest.id))
    if (sk) { setChatId(null); setSkillPick({ skill: sk, inputs: {} }) }
    onSkillRequestDone?.()
  }, [skillRequest, skills, chats === null]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setResearchOn(chat?.kind === 'research') }, [chatId, chat?.kind])
  const applied = project.agentLog || {}
  const noKey = keys && keys.length === 0
  const provider = activeKey(keys)?.provider || 'anthropic'

  // The list loads a page at a time; "Show older" fetches the next page.
  const [chatLimit, setChatLimit] = useState(CHAT_PAGE)
  const [moreChats, setMoreChats] = useState(false)
  // open=true (first load): also pick the chat to open, in the same render as the
  // list, so nothing can run in between and see "list loaded, no chat open".
  const loadChats = async (limit = chatLimit, open = false) => {
    const { data, error } = await supabase.from('chats').select('id, title, kind, updated_at').eq('deal_id', dealId).order('updated_at', { ascending: false }).limit(limit + 1)
    if (error) { setError(error.message); setChats([]); return [] }
    setMoreChats(data.length > limit)
    const page = data.slice(0, limit)
    // Only the first load picks; once anything chose a chat (the user, "Use skill",
    // a duplicate dev-mode load), a later load never overrides it.
    if (open && !picked.current) {
      picked.current = true
      let last = null; try { last = localStorage.getItem(lastKey) } catch {}
      setChatIdState(page.find(c => c.id === last)?.id || page[0]?.id || null)
    }
    setChats(page); return page
  }
  const loadChatsRef = useRef(loadChats); loadChatsRef.current = () => loadChats()
  const showOlder = () => { const n = chatLimit + CHAT_PAGE; setChatLimit(n); loadChats(n) }
  // A slow load of chat A must never paint over chat B after a switch.
  const openChat = useRef(null)
  openChat.current = chatId
  const reload = async (id = chatId) => {
    if (!id) { setMessages([]); return [] }
    const { data, error } = await supabase.from('chat_messages').select(SELECT).eq('chat_id', id).order('id', { ascending: true }).limit(300)
    if (openChat.current !== id) return []
    if (error) setError(error.message)
    if (data) setMessages(data)
    return data || []
  }

  // Open the chat used last on this project, else the most recent, else a new one.
  useEffect(() => {
    setChats(null); setChatIdState(null); setChatLimit(CHAT_PAGE); picked.current = false
    loadChats(CHAT_PAGE, true)
    const ch = supabase.channel(`chats-${dealId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `deal_id=eq.${dealId}` }, () => loadChatsRef.current())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [dealId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load + subscribe. On load, pick up a job that is still running (e.g. the
  // user left and came back), so the typing indicator and the reply show.
  useEffect(() => {
    let alive = true
    setMessages([]); setPending(null); setEditing(null); setError('')
    seen.current = null; sent.current.clear(); firstScroll.current = true; stick.current = true; count.current = 0; setNewBelow(false)
    if (chats === null) { setLoading(true); return }
    if (!chatId) { seen.current = new Set(); setLoading(false); return }
    setLoading(true)
    ;(async () => {
      const data = await reload(chatId)
      if (!alive) return
      seen.current = new Set(data.map(m => m.id))
      setLoading(false)
      const { data: open } = await supabase.from('jobs').select('id').eq('deal_id', dealId).in('kind', ['chat', 'research']).eq('payload->>chat_id', chatId).in('status', ['queued', 'running']).order('created_at', { ascending: false }).limit(1)
      if (alive && open?.[0] && !data.some(m => m.job_id === open[0].id)) setPending(open[0].id)
    })()
    const ch = supabase.channel(`chat-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
        payload => setMessages(ms => ms.some(m => m.id === payload.new.id) ? ms : [...ms, payload.new]))
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') reload(chatId) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; supabase.removeChannel(ch); document.removeEventListener('visibilitychange', onVisible) }
  }, [chatId, chats === null]) // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [pending, chatId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pending && messages.some(m => m.role === 'assistant' && m.job_id === pending)) setPending(null)
  }, [messages, pending])

  // Apply each reply's edits exactly once; run each reply's commands once.
  const runs = project.agentRuns || {}
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== 'assistant') continue
      const edits = Array.isArray(m.meta?.edits) ? m.meta.edits : []
      const deckOps = Array.isArray(m.meta?.deck_ops) ? m.meta.deck_ops : []
      if ((edits.length || deckOps.length) && !applied[m.id]) onApply(m.id, edits, deckOps)
      const cmds = m.meta?.commands
      // Only fresh replies run by themselves; an old one never re-runs on reload.
      const fresh = Date.now() - new Date(m.created_at).getTime() < 10 * 60 * 1000
      if (Array.isArray(cmds) && cmds.length && !runs[m.id] && fresh) onRun?.(m.id, cmds)
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the conversation only if you are already at the bottom (or just
  // sent something); otherwise a "New message" pill offers the jump.
  const firstScroll = useRef(true)
  const follow = useRef(false) // set by send: always scroll to your own message
  const count = useRef(0)
  const toBottom = (smooth = true) => {
    const el = list.current
    if (!el) return
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !calm ? 'smooth' : 'auto' })
    stick.current = true; setNewBelow(false)
  }
  const onScroll = () => {
    const el = list.current
    if (!el) return
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM
    if (stick.current) setNewBelow(false)
  }
  useEffect(() => {
    if (loading || !list.current) return
    const grew = messages.length > count.current
    count.current = messages.length
    if (firstScroll.current || follow.current || stick.current) toBottom(!firstScroll.current)
    else if (grew) setNewBelow(true)
    firstScroll.current = false; follow.current = false
  }, [messages.length, pending, loading, live.length]) // eslint-disable-line react-hooks/exhaustive-deps

  async function send({ text, attachments = [], model, effort, web, research = false, skill = null, skillInputs = {} }) {
    if (skill) { research = skill.mode === 'research'; text = skillMessage(skill, skillInputs); attachments = [] }
    if (noKey) { setError('Add an AI model key in Settings first.'); return false }
    if (pending) return false
    setError('')
    // The worker reads the deal from the database: save a pending edit first, so
    // the agent works from the deck and inputs on screen. Never wait forever.
    await Promise.race([onFlush?.(), new Promise(r => setTimeout(r, 5000))])
    // First message of a new chat: create the chat, titled from the message.
    let id = chatId
    if (!id) {
      const title = (text || attachments[0]?.name || 'New chat').replace(/\s+/g, ' ').trim().slice(0, 60) || 'New chat'
      const { data: c, error: ec } = await supabase.from('chats').insert({ deal_id: dealId, owner_id: userId, title, kind: research ? 'research' : 'chat' }).select('id, title, kind, updated_at').single()
      if (ec) { setError(/foreign key|not present|violates row-level/i.test(ec.message) ? 'This deal has not finished saving yet. Try again in a second.' : ec.message); return false }
      id = c.id
      setChats(cs => [c, ...(cs || []).filter(x => x.id !== c.id)])
      setChatId(id)
    }
    const meta = attachments.length ? { attachments: attachments.map(a => ({ name: a.name, size: a.text.length })) } : {}
    if (model) meta.model = model
    if (effort) meta.effort = effort
    if (web === false && !research) meta.web = false
    if (research) meta.research = true
    if (skill) meta.skill = skill.name
    const { data: msg, error: e1 } = await supabase.from('chat_messages')
      .insert({ deal_id: dealId, owner_id: userId, chat_id: id, role: 'user', content: text || '(attached files)', meta }).select(SELECT).single()
    if (e1) { setError(/foreign key|not present|violates row-level/i.test(e1.message) ? 'This deal has not finished saving yet. Try again in a second.' : e1.message); return false }
    sent.current.add(msg.id); follow.current = true
    setMessages(ms => ms.some(m => m.id === msg.id) ? ms : [...ms, msg])
    const roles = (project.stakeholders || []).map(s => { const r = resolveStakeholder(s); return r ? { key: s.key, role: r.role || '', tag: r.tag || '' } : null }).filter(Boolean)
    const files = attachments.map(a => ({ name: a.name, text: a.text }))
    const ref = skill ? skillRef(skill, skillInputs) : {}
    const payload = research
      ? { chat_id: id, question: [text, ...files.map(f => `Attached ${f.name}:\n${f.text.slice(0, 8000)}`)].filter(Boolean).join('\n\n').slice(0, MAX_QUESTION), model, effort, ...ref }
      : { chat_id: id, message: text, model, effort, web: web !== false, roles, user_name: userName || '', attachments: files, ...ref }
    const { data: job, error: e2 } = await supabase.from('jobs').insert({ owner_id: userId, deal_id: dealId, kind: research ? 'research' : 'chat', payload }).select('id').single()
    if (e2) { setError(/rate|limit/i.test(e2.message) ? 'Too many requests just now. Wait a minute and try again.' : e2.message); return false }
    setPending(job.id)
    return true
  }

  async function renameChat(id, title) {
    const t = title.replace(/\s+/g, ' ').trim().slice(0, 120)
    if (!t) return
    setChats(cs => cs.map(c => c.id === id ? { ...c, title: t } : c))
    const { error } = await supabase.from('chats').update({ title: t }).eq('id', id)
    if (error) { setError(error.message); loadChats() }
  }
  async function deleteChat(id) {
    const c = chats?.find(x => x.id === id)
    if (!window.confirm(`Delete "${c?.title || 'this chat'}"? Its messages are deleted too. Changes it made to the deal stay.`)) return
    const { error } = await supabase.from('chats').delete().eq('id', id)
    if (error) { setError(error.message); return }
    const rest = (chats || []).filter(x => x.id !== id)
    setChats(rest)
    if (id === chatId) setChatId(rest[0]?.id || null)
  }

  const visible = messages.filter(m => m.role !== 'status' || m.meta?.scheduled)
  const empty = !loading && visible.length === 0
  const lastUser = visible.findLast?.(m => m.role === 'user')?.id ?? [...visible].reverse().find(m => m.role === 'user')?.id
  const company = (project.fields || []).find(f => f.key === 'companyName')?.value || project.name || 'this project'
  // Full page: the chat list is a rail once there are two chats; with fewer,
  // it lives in the header menu, like split screen.
  const rail = mode === 'full' && ((chats?.length || 0) >= 2 || moreChats)
  const listProps = { chats, chatId, more: moreChats, onOlder: showOlder, onPick: setChatId, onNew: () => setChatId(null), onRename: renameChat, onDelete: deleteChat }
  const enter = m => {
    if (!seen.current || (seen.current.has(m.id) && !sent.current.has(m.id))) return { initial: false }
    return m.role === 'user' && sent.current.has(m.id) ? SENT : ENTER
  }
  // An agent turn shows the mark unless the agent also spoke just before.
  const markAt = i => i === 0 || visible[i - 1].role === 'user'

  const panel = (
    <section className={`chat-panel chat-${mode}${empty ? ' is-empty' : ''}`} aria-label="Agent chat" data-deal={dealId}>
      <header className="chat-head">
        <div className="chat-title"><span className="chat-dot" aria-hidden="true" /><h2>Agent</h2>
          {rail ? <span className="chat-deal">{chat?.title || project.name}</span>
            : <ChatMenu {...listProps} pill={`chat-pill-menu-${mode}`} label={chat?.title || 'New chat'} count={chats?.length || 0} />}
        </div>
        <div className="chat-head-actions">
          <button type="button" className="icon-btn" onClick={() => setChatId(null)} disabled={!chatId} title="New chat" aria-label="New chat"><Icon d={icons.plus} /></button>
          {mode === 'full'
            ? <button type="button" className="icon-btn" onClick={onSplit} title="Split screen: show the agent beside your tabs" aria-label="Split screen"><Icon d={icons.split} /></button>
            : <>
              <button type="button" className="icon-btn" onClick={onFull} title="Open the agent full page" aria-label="Full page"><Icon d={icons.full} /></button>
              <button type="button" className="icon-btn" onClick={onClose} title="Close split screen" aria-label="Close split screen"><Icon d={icons.close} /></button>
            </>}
        </div>
      </header>

      <div className="chat-list" ref={list} onScroll={onScroll}>
        <div className="chat-inner">
          {loading ? <p className="chat-empty">Loading…</p> : visible.map((m, i) => m.role === 'status' ? (
            <motion.div key={m.id} className="chat-msg chat-assistant chat-scheduled-run" {...enter(m)}>
              {markAt(i) ? <AgentMark /> : <span className="agent-mark-gap" />}
              <div className="chat-turn">
                <p className="mono-label">Scheduled run{m.meta?.schedule_title ? ` · ${m.meta.schedule_title}` : ''} · {stamp(m.created_at)}</p>
                <div className="chat-bubble"><Reply text={m.content} /></div>
              </div>
            </motion.div>
          ) : m.role === 'user' ? (
            <motion.div key={m.id} className="chat-msg chat-user" {...enter(m)}>
              {editing?.id === m.id ? (
                <EditBox initial={editing.text} onCancel={() => setEditing(null)}
                  onSave={async t => { if (await send({ text: t, model: m.meta?.model, effort: m.meta?.effort, web: m.meta?.web, research: !!m.meta?.research })) setEditing(null) }} disabled={!!pending} />
              ) : <>
                {m.meta?.attachments?.length > 0 && <div className="chat-files">{m.meta.attachments.map((a, i) => <span key={i} className="chat-file"><Icon d={icons.file} size={13} />{a.name}</span>)}</div>}
                <div className="chat-bubble">{m.meta?.skill ? <span className="chat-research-ask">Skill</span> : m.meta?.research && <span className="chat-research-ask">Deep research</span>}{m.content}</div>
                <div className="msg-actions on-hover">
                  <time className="msg-time" dateTime={m.created_at}>{stamp(m.created_at)}</time>
                  <button type="button" className="icon-btn sm" onClick={() => copy(m.id, m.content)} title={copied === m.id ? 'Copied' : 'Copy'} aria-label="Copy message"><Icon d={copied === m.id ? icons.check : icons.copy} size={14} /></button>
                  {m.id === lastUser && <button type="button" className="icon-btn sm" onClick={() => setEditing({ id: m.id, text: m.content })} disabled={!!pending} title="Edit and resend" aria-label="Edit message"><Icon d={icons.edit} size={14} /></button>}
                </div>
              </>}
            </motion.div>
          ) : (
            <motion.div key={m.id} className={`chat-msg chat-assistant${m.meta?.error ? ' is-error' : ''}`} {...enter(m)}>
              {markAt(i) ? <AgentMark /> : <span className="agent-mark-gap" />}
              <div className="chat-turn">
                <ToolTrace steps={m.meta?.trace} />
                {m.meta?.research
                  ? <div className="chat-bubble chat-research"><p className="mono-label chat-research-tag">Deep research</p><Answer text={m.content} sources={m.meta.sources || []} /><Sources sources={m.meta.sources || []} dropped={m.meta.dropped_sources || 0} /></div>
                  : m.meta?.error ? <div className="chat-bubble">{m.content}</div>
                  : <div className="chat-bubble chat-md"><Reply text={m.content} /></div>}
                <ChangeCard log={applied[m.id]} meta={m.meta} onUndo={opts => onUndo(m.id, opts)} onRedo={onRedo && (() => onRedo(m.id))} onView={onViewCase} />
                {m.meta?.commands?.length > 0 && (runs[m.id]
                  ? <CommandCards run={runs[m.id]} commands={m.meta.commands} project={project} onPick={onPick} messageId={m.id} />
                  : <div className="cmd-cards"><div className="cmd-card"><p className="cmd-note">This research was not run. <button type="button" className="link-btn" onClick={() => onRun?.(m.id, m.meta.commands)}>Run it now</button></p></div></div>)}
                <div className="msg-actions on-hover">
                  <button type="button" className="icon-btn sm" onClick={() => copy(m.id, m.content)} title={copied === m.id ? 'Copied' : 'Copy'} aria-label="Copy reply"><Icon d={copied === m.id ? icons.check : icons.copy} size={14} /></button>
                  <time className="msg-time" dateTime={m.created_at}>{stamp(m.created_at)}</time>
                  {m.meta?.model && <span className="msg-meta">{AGENT_MODELS.find(x => x.id === m.meta.model)?.name || m.meta.model}{m.meta.seconds ? ` · ${Math.round(m.meta.seconds)}s` : ''}{m.meta.web === false ? ' · search off' : ''}{m.meta.research ? ` · ${(m.meta.sources || []).length} sources` : ''}</span>}
                </div>
              </div>
            </motion.div>
          ))}
          {pending && (
            <motion.div className="chat-msg chat-assistant chat-working" {...ENTER}>
              {visible.length && visible[visible.length - 1].role !== 'user' ? <span className="agent-mark-gap" /> : <AgentMark />}
              <div className="chat-turn">
                <ToolTrace steps={live} running defaultOpen>
                  <span className="chat-bubble chat-typing" role="status" aria-label="The agent is working"><span /><span /><span /></span>
                </ToolTrace>
              </div>
            </motion.div>
          )}
        </div>
        <AnimatePresence>
          {newBelow && (
            <motion.button key="new" type="button" className="chat-new-pill" onClick={() => toBottom()}
              initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} exit={{ opacity: 0, transform: 'translateY(8px)' }} transition={{ duration: 0.18, ease: EASE_OUT }}>
              <Icon d={icons.down} size={13} />New message
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="chat-bottom">
        {noKey && <p className="chat-note">The agent needs an AI model key first (Anthropic, OpenAI, Gemini or OpenRouter). <button type="button" className="link-btn" onClick={onSettings}>Add it in Settings</button></p>}
        {error && <p className="auth-error chat-error" role="alert">{error}</p>}
        {skillPick && (
          <SkillRun pick={skillPick} onChange={setSkillPick} busy={!!pending} disabled={noKey}
            onCancel={() => setSkillPick(null)}
            onRun={async () => {
              const miss = missingInput(skillPick.skill, skillPick.inputs)
              if (miss) { setError(`Fill in "${miss.label}" first.`); return }
              if (await send({ skill: skillPick.skill, skillInputs: skillPick.inputs, model: undefined })) setSkillPick(null)
            }} />
        )}
        <AgentComposer provider={provider} research={researchOn} onResearch={setResearchOn} disabled={noKey} busy={!!pending} onSend={send} showWelcome={empty}
          skills={skills ? skills.filter(x => x.enabled) : null} onSkill={x => setSkillPick({ skill: x, inputs: {} })} fill={fill}
          title={researchOn ? 'What should we research?' : `What do you want to work on for ${company}?`}
          subtitle={researchOn ? `Deep research searches widely, reads pages in full and cites every source. It reads ${project.name || 'this project'}'s files and connectors, and you can ask follow-ups.` : `Ask about ${project.name || 'this deal'}, or tell the agent what to change. Every change can be undone.`} />
        {empty && !researchOn && !skillPick && (
          <ul className="chat-starters" aria-label="Suggestions">
            {STARTERS.map((s, i) => (
              <motion.li key={s} initial={{ opacity: 0, transform: 'translateY(4px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ duration: 0.18, ease: EASE_OUT, delay: 0.04 * i }}>
                <button type="button" className="starter-chip" onClick={() => setFill({ text: s })}>{s}</button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
  const body = mode !== 'full' ? panel : (
    <div className={`chat-shell${rail ? '' : ' no-rail'}`}>
      {rail && <ChatRail {...listProps} />}
      {panel}
    </div>
  )
  return <MotionConfig reducedMotion="user">{body}</MotionConfig>
}

// An agent reply: the Markdown subset, with sources lifted out of the text into
// numbered chips (inline) and a chip row (the list).
function Reply({ text }) {
  const { text: body, sources } = useMemo(() => extractSources(text), [text])
  return <>
    <Answer text={body} sources={sources} chips />
    {sources.length > 0 && <Sources sources={sources} dropped={0} />}
  </>
}

const ago = iso => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// One row in the chat list: title and when, the open chat on a sliding pill
// (one layoutId per list), rename and delete in its "..." menu.
function ChatRow({ c, on, pill, onPick, onRename, onDelete }) {
  const [edit, setEdit] = useState(false)
  const [t, setT] = useState(c.title)
  useEffect(() => { setT(c.title) }, [c.title])
  if (edit) return (
    <li className="chat-row is-editing">
      <input autoFocus value={t} maxLength={120} aria-label="Chat name" onChange={e => setT(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { onRename(c.id, t); setEdit(false) } if (e.key === 'Escape') { setT(c.title); setEdit(false) } }}
        onBlur={() => { if (t.trim() && t !== c.title) onRename(c.id, t); setEdit(false) }} />
    </li>
  )
  return (
    <li className={`chat-row${on ? ' is-on' : ''}`}>
      {on && <motion.span layoutId={pill} className="chat-row-pill" aria-hidden="true" transition={{ duration: 0.2, ease: EASE_IN_OUT }} />}
      <button type="button" className="chat-row-open" onClick={() => onPick(c.id)} aria-current={on ? 'true' : undefined}>
        <span className="chat-row-title">{c.title}</span>
        <span className="chat-row-when">{c.kind === 'research' ? 'Deep research · ' : ''}{ago(c.updated_at)}</span>
      </button>
      <span className="chat-row-actions">
        <Menu label={`Options for ${c.title}`} title="Rename or delete" className="icon-btn sm chat-row-more"
          items={[{ label: 'Rename', onSelect: () => setEdit(true) }, { label: 'Delete', danger: true, onSelect: () => onDelete(c.id) }]} />
      </span>
    </li>
  )
}

function ChatList({ chats, chatId, onPick, onRename, onDelete, more, onOlder, pill }) {
  if (chats === null) return <p className="chat-rail-empty">Loading…</p>
  if (!chats.length) return <p className="chat-rail-empty">No chats yet. Your first message starts one.</p>
  return <>
    <ul className="chat-rows">{chats.map(c => <ChatRow key={c.id} c={c} on={c.id === chatId} pill={pill} onPick={onPick} onRename={onRename} onDelete={onDelete} />)}</ul>
    {more && <button type="button" className="link-btn chat-older" onClick={onOlder}>Show older chats</button>}
  </>
}

// Full page with two or more chats: the list sits on the left, like Claude.
function ChatRail(props) {
  return (
    <aside className="chat-rail" aria-label="Chats">
      <button type="button" className="ghost chat-rail-new" onClick={props.onNew}><Icon d={icons.plus} size={13} /> New chat</button>
      <p className="mono-label chat-rail-head">Chats <span className="chat-rail-count">{props.chats?.length || 0}{props.more ? '+' : ''}</span></p>
      <ChatList {...props} pill="chat-pill-rail" />
    </aside>
  )
}

// Split screen, and the full page with one chat or none: the same list in a
// dropdown under the chat's name.
function ChatMenu({ label, count = 0, pill, ...props }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    // A row's "..." menu is portalled; pressing in it must not close this one.
    const off = e => { if (!ref.current?.contains(e.target) && !e.target.closest?.('.sched-menu')) setOpen(false) }
    const esc = e => { if (e.key === 'Escape' && !document.querySelector('.sched-menu')) setOpen(false) }
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div className="chat-menu" ref={ref}>
      <button type="button" className="chat-menu-btn" onClick={() => setOpen(o => !o)} aria-haspopup="true" aria-expanded={open} title="Your chats on this project">
        <span>{label}</span>{count > 0 && <span className="chat-menu-count" aria-label={`${count} ${count === 1 ? 'chat' : 'chats'}`}>{count}</span>}<Icon d={icons.chevron} size={12} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="chat-menu-pop" role="menu" style={{ transformOrigin: 'top left' }}
            initial={{ opacity: 0, transform: 'scale(0.97)' }} animate={{ opacity: 1, transform: 'scale(1)' }} exit={{ opacity: 0, transform: 'scale(0.97)' }} transition={{ duration: 0.14, ease: EASE_OUT }}>
            <button type="button" className="ghost chat-rail-new" onClick={() => { props.onNew(); setOpen(false) }}><Icon d={icons.plus} size={13} /> New chat</button>
            <ChatList {...props} pill={pill} onPick={id => { props.onPick(id); setOpen(false) }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Filling in a skill's details before running it.
function SkillRun({ pick, onChange, onRun, onCancel, busy, disabled }) {
  const { skill, inputs } = pick
  return (
    <form className="chat-skillrun" onSubmit={e => { e.preventDefault(); onRun() }} aria-label={`Use ${skill.name}`}>
      <div className="chat-skillrun-head"><span className="mono-label">Skill</span><strong>{skill.name}</strong><span className="sched-kind">{skill.mode === 'research' ? 'Deep research' : 'Agent'}</span></div>
      {skill.description && <p className="chat-skillrun-desc">{skill.description}</p>}
      {(skill.inputs || []).map((i, n) => (
        <label key={i.key} className="sched-field"><span>{i.label}{i.required ? '' : ''}</span>
          <input autoFocus={n === 0} value={inputs[i.key] || ''} maxLength={500} placeholder={i.placeholder || ''} onChange={e => onChange({ skill, inputs: { ...inputs, [i.key]: e.target.value } })} /></label>
      ))}
      <div className="sched-form-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary" disabled={busy || disabled}>{busy ? 'Working…' : 'Run skill'}</button>
      </div>
    </form>
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

// "page 2", "page 2 and Engineers", "page 1, page 2 and 2 more"
const namePlaces = list => list.length <= 2 ? list.join(' and ') : list.length === 3 ? `${list[0]}, ${list[1]} and ${list[2]}` : `${list[0]}, ${list[1]} and ${list.length - 2} more`

// What a reply changed: inputs, then the case (deck and brand). One Undo for the
// whole reply, and it always undoes: if the user changed the same thing since,
// the card asks first. An undone reply offers Redo. "View" opens Case artifacts.
function ChangeCard({ log, meta, onUndo, onRedo, onView }) {
  const [ask, setAsk] = useState(null) // places the user edited since, while asking
  const rejected = log?.refused?.length ? log.refused : meta?.rejected || []
  const deckRejected = [...new Set([...(meta?.deck_rejected || []), ...(log?.deckRefused || [])])]
  if (!log && !rejected.length && !deckRejected.length) return null
  const changes = log?.changes || []
  const deck = log?.deckChanges || []
  const undo = () => { const r = onUndo() || {}; setAsk(r.conflicts?.length ? r.conflicts : null) }
  const hasChanges = changes.length > 0 || deck.length > 0
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
        {log.undone && log.skipped?.length > 0 && <p className="chg-note">Kept your later edits to {log.skipped.join(', ')}.</p>}
      </>}
      {rejected.length > 0 && <p className="chg-note">Not changed: {rejected.join(' ')}</p>}
      {deck.length > 0 && <div className={changes.length ? 'chg-case-sec' : undefined}>
        <p className="mono-label">{log.undone ? (changes.length ? 'Case changes undone' : 'Undone') : 'Changed the case'}</p>
        <ul className="chg-case">{deck.map((c, i) => <li key={i}>{c.sentence}</li>)}</ul>
        {log.undone && log.deckSkipped?.length > 0 && <p className="chg-note">Could not put back: {log.deckSkipped.join('; ')}.</p>}
      </div>}
      {hasChanges && (ask
        ? <div className="chg-ask" role="alert">
            <p>You edited {namePlaces(ask)} since. Undo anyway?</p>
            <div className="chg-actions">
              <button type="button" className="ghost chg-undo chg-undo-anyway" onClick={() => { onUndo({ force: true }); setAsk(null) }}>Undo anyway</button>
              <button type="button" className="ghost chg-undo" onClick={() => setAsk(null)}>Keep mine</button>
            </div>
          </div>
        : <div className="chg-actions">
            {log.undone
              ? onRedo && <button type="button" className="ghost chg-undo" onClick={onRedo}>Redo</button>
              : <button type="button" className="ghost chg-undo" onClick={undo}>Undo</button>}
            {deck.length > 0 && onView && <button type="button" className="ghost chg-undo" onClick={onView}>View</button>}
          </div>)}
      {deckRejected.length > 0 && <p className="chg-note">Not changed in the case: {deckRejected.join(' ')}</p>}
    </div>
  )
}
