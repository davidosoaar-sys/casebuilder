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
  trash: <><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" /></>
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

export default function ChatPanel({ project, userId, userName, mode = 'split', onApply, onUndo, onRun, onPick, onClose, onSplit, onFull, onSettings, onFlush, onViewCase, skillRequest, onSkillRequestDone }) {
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
  const [skillMenu, setSkillMenu] = useState(false)
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
    if (chats === null) { setLoading(true); return }
    if (!chatId) { setLoading(false); return }
    setLoading(true)
    ;(async () => {
      const data = await reload(chatId)
      if (!alive) return
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

  const firstScroll = useRef(true)
  useEffect(() => {
    if (loading || !list.current) return
    list.current.scrollTo({ top: list.current.scrollHeight, behavior: firstScroll.current ? 'auto' : 'smooth' })
    firstScroll.current = false
  }, [messages.length, pending, loading])

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

  const panel = (
    <section className={`chat-panel chat-${mode}${!loading && visible.length === 0 ? ' is-empty' : ''}`} aria-label="Agent chat" data-deal={dealId}>
      <header className="chat-head">
        <div className="chat-title"><span className="chat-dot" aria-hidden="true" /><h2>Agent</h2>
          {mode === 'full' ? <span className="chat-deal">{chat?.title || project.name}</span>
            : <ChatMenu chats={chats} chatId={chatId} more={moreChats} onOlder={showOlder} onPick={setChatId} onNew={() => setChatId(null)} onRename={renameChat} onDelete={deleteChat} label={chat?.title || 'New chat'} />}
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

      <div className="chat-list" ref={list}>
        <div className="chat-inner">
          {loading ? <p className="chat-empty">Loading…</p> : visible.length === 0 ? (mode === 'full' ? null : (
            <div className="chat-empty">
              <p>Ask a question about this deal, or tell the agent what to change. Changes apply straight away, and every one can be undone.</p>
              <ul>
                <li>“They have 1,200 engineers.”</li>
                <li>“Use $120 an hour for engineer cost.”</li>
                <li>“Which numbers are still unconfirmed?”</li>
                <li>“Make the title page punchier.”</li>
                <li>“Add a page on the rollout plan.”</li>
              </ul>
            </div>
          )) : visible.map(m => m.role === 'status' ? (
            <div key={m.id} className="chat-msg chat-scheduled-run">
              <p className="mono-label">Scheduled run{m.meta?.schedule_title ? ` · ${m.meta.schedule_title}` : ''} · {new Date(m.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
              <div className="chat-bubble">{m.content}</div>
            </div>
          ) : m.role === 'user' ? (
            <div key={m.id} className="chat-msg chat-user">
              {editing?.id === m.id ? (
                <EditBox initial={editing.text} onCancel={() => setEditing(null)}
                  onSave={async t => { if (await send({ text: t, model: m.meta?.model, effort: m.meta?.effort, web: m.meta?.web, research: !!m.meta?.research })) setEditing(null) }} disabled={!!pending} />
              ) : <>
                {m.meta?.attachments?.length > 0 && <div className="chat-files">{m.meta.attachments.map((a, i) => <span key={i} className="chat-file"><Icon d={icons.file} size={13} />{a.name}</span>)}</div>}
                <div className="chat-bubble">{m.meta?.skill ? <span className="chat-research-ask">Skill</span> : m.meta?.research && <span className="chat-research-ask">Deep research</span>}{m.content}</div>
                <div className="msg-actions on-hover">
                  <button type="button" className="icon-btn sm" onClick={() => copy(m.id, m.content)} title="Copy" aria-label="Copy message"><Icon d={copied === m.id ? icons.check : icons.copy} size={14} /></button>
                  <button type="button" className="icon-btn sm" onClick={() => setEditing({ id: m.id, text: m.content })} disabled={!!pending} title="Edit and resend" aria-label="Edit message"><Icon d={icons.edit} size={14} /></button>
                </div>
              </>}
            </div>
          ) : (
            <div key={m.id} className={`chat-msg chat-assistant${m.meta?.error ? ' is-error' : ''}`}>
              <ToolTrace steps={m.meta?.trace} />
              {m.meta?.research
                ? <div className="chat-bubble chat-research"><p className="mono-label chat-research-tag">Deep research</p><Answer text={m.content} sources={m.meta.sources || []} /><Sources sources={m.meta.sources || []} dropped={m.meta.dropped_sources || 0} /></div>
                : <div className="chat-bubble">{m.content}</div>}
              <ChangeCard log={applied[m.id]} meta={m.meta} onUndo={() => onUndo(m.id)} onView={onViewCase} />
              {m.meta?.commands?.length > 0 && (runs[m.id]
                ? <CommandCards run={runs[m.id]} commands={m.meta.commands} project={project} onPick={onPick} messageId={m.id} />
                : <div className="cmd-cards"><div className="cmd-card"><p className="cmd-note">This research was not run. <button type="button" className="link-btn" onClick={() => onRun?.(m.id, m.meta.commands)}>Run it now</button></p></div></div>)}
              <div className="msg-actions">
                <button type="button" className="icon-btn sm" onClick={() => copy(m.id, m.content)} title="Copy" aria-label="Copy reply"><Icon d={copied === m.id ? icons.check : icons.copy} size={14} /></button>
                {m.meta?.model && <span className="msg-meta">{AGENT_MODELS.find(x => x.id === m.meta.model)?.name || m.meta.model}{m.meta.seconds ? ` · ${Math.round(m.meta.seconds)}s` : ''}{m.meta.web === false ? ' · search off' : ''}{m.meta.research ? ` · ${(m.meta.sources || []).length} sources` : ''}</span>}
              </div>
            </div>
          ))}
          {pending && <div className="chat-msg chat-assistant">{live.length > 0 && <ToolTrace steps={live} running defaultOpen />}<div className="chat-bubble chat-typing" role="status" aria-label="The agent is working"><span /><span /><span /></div></div>}
        </div>
      </div>

      <div className="chat-bottom">
        {noKey && <p className="chat-note">The agent needs an AI model key first (Anthropic, OpenAI, Gemini or OpenRouter). <button type="button" className="link-btn" onClick={onSettings}>Add it in Settings</button></p>}
        {error && <p className="auth-error chat-error" role="alert">{error}</p>}
        {skillPick ? (
          <SkillRun pick={skillPick} onChange={setSkillPick} busy={!!pending} disabled={noKey}
            onCancel={() => setSkillPick(null)}
            onRun={async () => {
              const miss = missingInput(skillPick.skill, skillPick.inputs)
              if (miss) { setError(`Fill in "${miss.label}" first.`); return }
              if (await send({ skill: skillPick.skill, skillInputs: skillPick.inputs, model: undefined })) setSkillPick(null)
            }} />
        ) : (
          <div className="chat-skillbar">
            <div className="chat-menu">
              <button type="button" className="link-btn chat-skill-btn" onClick={() => setSkillMenu(o => !o)} disabled={noKey || !skills} aria-haspopup="true" aria-expanded={skillMenu}>Use a skill</button>
              {skillMenu && skills && (
                <div className="chat-menu-pop chat-skill-pop" role="menu">
                  {skills.filter(x => x.enabled).map(x => (
                    <button key={x.key || x.id} type="button" role="menuitem" className="chat-skill-opt" onClick={() => { setSkillPick({ skill: x, inputs: {} }); setSkillMenu(false) }}>
                      <strong>{x.name}</strong><small>{x.description || (x.instructions || '').slice(0, 90)}</small>
                    </button>
                  ))}
                  {skills.every(x => !x.enabled) && <p className="chat-rail-empty">All skills are switched off for this project.</p>}
                </div>
              )}
            </div>
          </div>
        )}
        <AgentComposer provider={provider} research={researchOn} onResearch={setResearchOn} disabled={noKey} busy={!!pending} onSend={send} showWelcome={!loading && visible.length === 0}
          title={researchOn ? 'What should we research?' : `What should we work on${userName ? ', ' + userName.split(' ')[0] : ''}?`}
          subtitle={researchOn ? `Deep research searches widely, reads pages in full and cites every source. It reads ${project.name || 'this project'}'s files and connectors, and you can ask follow-ups.` : `Ask about ${project.name || 'this deal'}, or tell the agent what to change. Every change can be undone.`} />
      </div>
    </section>
  )
  if (mode !== 'full') return panel
  return (
    <div className="chat-shell">
      <ChatRail chats={chats} chatId={chatId} more={moreChats} onOlder={showOlder} onPick={setChatId} onNew={() => setChatId(null)} onRename={renameChat} onDelete={deleteChat} />
      {panel}
    </div>
  )
}

const ago = iso => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// One row in the chat list: click to open, pencil to rename inline, bin to delete.
function ChatRow({ c, on, onPick, onRename, onDelete }) {
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
      <button type="button" className="chat-row-open" onClick={() => onPick(c.id)} aria-current={on ? 'true' : undefined}>
        <span className="chat-row-title">{c.title}</span>
        <span className="chat-row-when">{c.kind === 'research' ? 'Deep research · ' : ''}{ago(c.updated_at)}</span>
      </button>
      <span className="chat-row-actions">
        <button type="button" className="icon-btn sm" onClick={() => setEdit(true)} title="Rename" aria-label={`Rename ${c.title}`}><Icon d={icons.edit} size={13} /></button>
        <button type="button" className="icon-btn sm" onClick={() => onDelete(c.id)} title="Delete" aria-label={`Delete ${c.title}`}><Icon d={icons.trash} size={13} /></button>
      </span>
    </li>
  )
}

function ChatList({ chats, chatId, onPick, onRename, onDelete, more, onOlder }) {
  if (chats === null) return <p className="chat-rail-empty">Loading…</p>
  if (!chats.length) return <p className="chat-rail-empty">No chats yet. Your first message starts one.</p>
  return <>
    <ul className="chat-rows">{chats.map(c => <ChatRow key={c.id} c={c} on={c.id === chatId} onPick={onPick} onRename={onRename} onDelete={onDelete} />)}</ul>
    {more && <button type="button" className="link-btn chat-older" onClick={onOlder}>Show older chats</button>}
  </>
}

// Full page: the list sits on the left, like Claude.
function ChatRail(props) {
  return (
    <aside className="chat-rail" aria-label="Chats">
      <button type="button" className="ghost chat-rail-new" onClick={props.onNew}><Icon d={icons.plus} size={13} /> New chat</button>
      <p className="mono-label chat-rail-head">Chats</p>
      <ChatList {...props} />
    </aside>
  )
}

// Split screen: the same list in a dropdown under the chat's name.
function ChatMenu({ label, ...props }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div className="chat-menu" ref={ref}>
      <button type="button" className="chat-menu-btn" onClick={() => setOpen(o => !o)} aria-haspopup="true" aria-expanded={open} title="Your chats on this project">
        <span>{label}</span><Icon d={icons.chevron} size={12} />
      </button>
      {open && (
        <div className="chat-menu-pop" role="menu">
          <button type="button" className="ghost chat-rail-new" onClick={() => { props.onNew(); setOpen(false) }}><Icon d={icons.plus} size={13} /> New chat</button>
          <ChatList {...props} onPick={id => { props.onPick(id); setOpen(false) }} />
        </div>
      )}
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

// What a reply changed: inputs, then the case (deck and brand). One Undo for the
// whole reply; "View" opens Case artifacts on the Live room.
function ChangeCard({ log, meta, onUndo, onView }) {
  const rejected = log?.refused?.length ? log.refused : meta?.rejected || []
  const deckRejected = [...new Set([...(meta?.deck_rejected || []), ...(log?.deckRefused || [])])]
  if (!log && !rejected.length && !deckRejected.length) return null
  const changes = log?.changes || []
  const deck = log?.deckChanges || []
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
          : !deck.length && <button type="button" className="ghost chg-undo" onClick={onUndo}>Undo</button>}
      </>}
      {rejected.length > 0 && <p className="chg-note">Not changed: {rejected.join(' ')}</p>}
      {deck.length > 0 && <div className={changes.length ? 'chg-case-sec' : undefined}>
        <p className="mono-label">{log.undone ? (changes.length ? 'Case changes undone' : 'Undone') : 'Changed the case'}</p>
        <ul className="chg-case">{deck.map((c, i) => <li key={i}>{c.sentence}</li>)}</ul>
        {log.undone && log.deckSkipped?.length > 0 && <p className="chg-note">Kept your later edits: {log.deckSkipped.join('; ')}.</p>}
        <div className="chg-actions">
          {!log.undone && <button type="button" className="ghost chg-undo" onClick={onUndo}>Undo</button>}
          {onView && <button type="button" className="ghost chg-undo" onClick={onView}>View</button>}
        </div>
      </div>}
      {deckRejected.length > 0 && <p className="chg-note">Not changed in the case: {deckRejected.join(' ')}</p>}
    </div>
  )
}
