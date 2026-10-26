// Scheduled: tasks the agent runs on its own for this project, on a repeat.
// Each task is a prompt (an agent message) or a Deep research question. Runs
// post into the task's own chat, so results pile up in one place you can read
// in the Agent. Backed by public.schedules + the per-minute runner.
import React, { useEffect, useState } from 'react'
import PageHead from './PageHead.jsx'
import { supabase } from '../supabase.js'
import { useModelKeys } from './Settings.jsx'
import { useSkills } from './Skills.jsx'
import { skillMessage, skillRef } from '../skills.js'
import { SCHEDULE_LIMIT, MAX_PROMPT, parseEvery, everyInterval, everyError, describeEvery, toLocalInput, defaultFirstRun, fmtWhen, scheduleError } from '../schedules.js'

const SELECT = 'id, title, kind, payload, every, timezone, next_run_at, enabled, created_at'
const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } })()
const EXAMPLES = [
  { title: 'Monday account news', kind: 'research', every: { n: 1, unit: 'weeks' }, text: 'What changed at this company in the last 7 days? Leadership, funding, layoffs, product launches, earnings. Only real news with dates.' },
  { title: 'Daily open questions', kind: 'chat', every: { n: 1, unit: 'days' }, text: 'List the inputs on this deal that are still unconfirmed, most important first, and say who could confirm each.' }
]

export default function Scheduled({ project, userId, onOpenChat, skillToSchedule, onSkillScheduled }) {
  const [list, setList] = useState(null)
  const [total, setTotal] = useState(0) // across all projects: the cap is per account
  const [lastRuns, setLastRuns] = useState({})
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | schedule
  const { keys } = useModelKeys(userId)
  const noKey = keys && keys.length === 0

  async function load() {
    const [{ data, error }, { count }] = await Promise.all([
      supabase.from('schedules').select(SELECT).eq('deal_id', project.id).order('created_at', { ascending: true }),
      supabase.from('schedules').select('id', { count: 'exact', head: true })
    ])
    if (error) { setError(error.message); setList([]); return }
    setList(data); setTotal(count || 0)
    if (data.length) {
      const { data: jobs } = await supabase.from('jobs').select('schedule_id, status, created_at, error')
        .in('schedule_id', data.map(s => s.id)).order('created_at', { ascending: false }).limit(200)
      const last = {}
      for (const j of jobs || []) if (!last[j.schedule_id]) last[j.schedule_id] = j
      setLastRuns(last)
    }
  }
  useEffect(() => { setList(null); load() }, [project.id]) // eslint-disable-line react-hooks/exhaustive-deps
  // From the Skills page: open the form with that skill picked.
  useEffect(() => {
    if (!skillToSchedule) return
    setEditing({ example: true, title: skillToSchedule.name, kind: skillToSchedule.mode === 'research' ? 'research' : 'chat', every: '7 days', payload: {}, skill: skillToSchedule })
    onSkillScheduled?.()
  }, [skillToSchedule]) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(s) {
    setError('')
    const patch = { enabled: !s.enabled }
    // Resuming after the next slot passed: start again at the next slot from now.
    if (!s.enabled && new Date(s.next_run_at) < new Date()) {
      let t = new Date(s.next_run_at).getTime(); const step = hours(s.every) * 3600000
      while (t < Date.now() + 60000) t += step
      patch.next_run_at = new Date(t).toISOString()
    }
    const { error } = await supabase.from('schedules').update(patch).eq('id', s.id)
    if (error) setError(scheduleError(error.message)); else load()
  }
  async function remove(s) {
    if (!window.confirm(`Delete "${s.title}"? Its chat and earlier results stay in the Agent.`)) return
    const { error } = await supabase.from('schedules').delete().eq('id', s.id)
    if (error) setError(error.message); else load()
  }
  async function runNow(s) {
    setError('')
    // Like typing the prompt into the task's chat yourself: the prompt goes in as
    // your message, then the job (so the reply reads in context).
    const text = s.payload?.question || s.payload?.message || ''
    const chatId = s.payload?.chat_id
    if (chatId) {
      const { error: em } = await supabase.from('chat_messages').insert({ deal_id: project.id, owner_id: userId, chat_id: chatId, role: 'user', content: text, meta: s.kind === 'research' ? { research: true } : {} })
      if (em) { setError(em.message); return }
    }
    const { error } = await supabase.from('jobs').insert({ owner_id: userId, deal_id: project.id, kind: s.kind, payload: { ...s.payload, title: s.title, run_now: true } })
    if (error) { setError(/rate|limit/i.test(error.message) ? 'Too many requests just now. Wait a minute and try again.' : error.message); return }
    if (s.payload?.chat_id) onOpenChat?.(s.payload.chat_id)
  }

  const full = total >= SCHEDULE_LIMIT
  return (
    <section className="page scheduled-page">
      <PageHead label={project.name} title="Scheduled" sub="Tasks the agent runs for this project on a repeat. Each one has its own chat in the Agent, where every result lands.">
        <button type="button" className="primary" onClick={() => setEditing('new')} disabled={full || noKey} title={full ? `${SCHEDULE_LIMIT} tasks is the most an account can have` : ''}>New task</button>
      </PageHead>
      {noKey && <p className="notice">Scheduled tasks run on your own AI model key. Add one in Settings first.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {editing && <TaskForm project={project} userId={userId} initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}

      {list === null ? <p className="pf-empty">Loading…</p> : list.length === 0 && !editing ? (
        <div className="sched-empty">
          <p>No scheduled tasks on this project yet. Start from an example, or make your own.</p>
          <div className="sched-examples">
            {EXAMPLES.map(x => (
              <button key={x.title} type="button" className="sched-example" disabled={noKey || full} onClick={() => setEditing({ example: true, title: x.title, kind: x.kind, every: everyInterval(x.every), payload: x.kind === 'research' ? { question: x.text } : { message: x.text } })}>
                <strong>{x.title}</strong><span>{describeEvery(everyInterval(x.every))} · {x.kind === 'research' ? 'Deep research' : 'Agent prompt'}</span><small>{x.text}</small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="sched-list">
          {list.map(s => {
            const last = lastRuns[s.id]
            return (
              <li key={s.id} className={`sched-card${s.enabled ? '' : ' is-off'}`}>
                <div className="sched-main">
                  <div className="sched-title"><strong>{s.title}</strong><span className="sched-kind">{s.payload?.skill_key || s.payload?.skill_id ? 'Skill' : s.kind === 'research' ? 'Deep research' : 'Agent prompt'}</span></div>
                  <p className="sched-prompt">{s.payload?.question || s.payload?.message}</p>
                  <p className="sched-meta">
                    <span>{describeEvery(s.every)}</span>
                    <span>{s.enabled ? <>Next: {fmtWhen(s.next_run_at)}</> : 'Paused'}</span>
                    <span>{last ? <>Last run: {fmtWhen(last.created_at)}{last.status === 'failed' ? ' (failed)' : last.status === 'queued' || last.status === 'running' ? ' (running)' : ''}</> : 'Not run yet'}</span>
                  </p>
                </div>
                <div className="sched-actions">
                  {s.payload?.chat_id && <button type="button" className="ghost" onClick={() => onOpenChat?.(s.payload.chat_id)}>Open chat</button>}
                  <button type="button" className="ghost" onClick={() => runNow(s)} disabled={noKey}>Run now</button>
                  <label className="pf-toggle" title={s.enabled ? 'Pause this task' : 'Resume this task'}>
                    <input type="checkbox" checked={s.enabled} onChange={() => toggle(s)} aria-label={`${s.title} on`} />
                    <span>{s.enabled ? 'On' : 'Paused'}</span>
                  </label>
                  <button type="button" className="ghost" onClick={() => setEditing(s)}>Edit</button>
                  <button type="button" className="icon-btn sm" onClick={() => remove(s)} aria-label={`Delete ${s.title}`} title="Delete">×</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="sched-foot">{total} of {SCHEDULE_LIMIT} scheduled tasks used across your projects. Times are in your time zone ({TZ}). Each run uses your AI key like a normal message.</p>
    </section>
  )
}

const hours = every => { const { n, unit } = parseEvery(every); return unit === 'weeks' ? n * 168 : unit === 'days' ? n * 24 : n }

function TaskForm({ project, userId, initial, onClose, onSaved }) {
  const editing = initial && !initial.example
  const { skills } = useSkills(project.id)
  // A task can run a skill instead of a free prompt (value: 'k:<key>' or 'i:<id>').
  const initialSkill = initial?.skill ? (initial.skill.prebuilt ? `k:${initial.skill.key}` : `i:${initial.skill.id}`)
    : initial?.payload?.skill_key ? `k:${initial.payload.skill_key}` : initial?.payload?.skill_id ? `i:${initial.payload.skill_id}` : ''
  const [skillVal, setSkillVal] = useState(initialSkill)
  const [skillInputs, setSkillInputs] = useState(initial?.payload?.skill_inputs || {})
  const skill = skills?.find(x => (x.prebuilt ? `k:${x.key}` : `i:${x.id}`) === skillVal) || null
  const [title, setTitle] = useState(initial?.title || '')
  const [kind, setKind] = useState(initial?.kind || 'chat')
  const [text, setText] = useState(initial?.payload?.question || initial?.payload?.message || '')
  const [every, setEvery] = useState(initial?.every ? parseEvery(initial.every) : { n: 1, unit: 'days' })
  const [first, setFirst] = useState(toLocalInput(editing ? new Date(Math.max(new Date(initial.next_run_at).getTime(), Date.now() + 120000)) : defaultFirstRun()))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const eErr = everyError(every)

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!title.trim() || (!text.trim() && !skill)) { setError('Give the task a name and say what the agent should do.'); return }
    const miss = skill && (skill.inputs || []).find(i => i.required && !String(skillInputs[i.key] || '').trim())
    if (miss) { setError(`Fill in "${miss.label}" for the skill.`); return }
    if (eErr) { setError(eErr); return }
    const when = new Date(first)
    if (!(when > new Date())) { setError('The first run has to be in the future.'); return }
    setSaving(true)
    try {
      // Each task has its own chat, created with the task, where every run lands.
      let chatId = initial?.payload?.chat_id
      if (!chatId) {
        const { data: c, error: ec } = await supabase.from('chats').insert({ deal_id: project.id, owner_id: userId, title: title.trim().slice(0, 120), kind: (skill ? skill.mode : kind) === 'research' ? 'research' : 'chat' }).select('id').single()
        if (ec) throw ec
        chatId = c.id
      }
      const runKind = skill ? (skill.mode === 'research' ? 'research' : 'chat') : kind
      const body = skill ? skillMessage(skill, skillInputs) : text.trim().slice(0, MAX_PROMPT)
      const ref = skill ? skillRef(skill, skillInputs) : {}
      const payload = runKind === 'research'
        ? { question: body, chat_id: chatId, title: title.trim(), ...ref }
        : { message: body, chat_id: chatId, title: title.trim(), web: true, ...ref }
      const row = { title: title.trim().slice(0, 120), kind: runKind, payload, every: everyInterval(every), timezone: TZ }
      const nextChanged = !editing || Math.abs(new Date(initial.next_run_at) - when) > 59000
      if (nextChanged) row.next_run_at = when.toISOString()
      const q = editing
        ? supabase.from('schedules').update(row).eq('id', initial.id)
        : supabase.from('schedules').insert({ ...row, owner_id: userId, deal_id: project.id, next_run_at: when.toISOString() })
      const { error } = await q
      if (error) throw error
      onSaved()
    } catch (err) { setError(scheduleError(err.message)) } finally { setSaving(false) }
  }

  return (
    <form className="sched-form pf-section" onSubmit={save} aria-label={editing ? 'Edit scheduled task' : 'New scheduled task'}>
      <div className="pf-section-head"><h2>{editing ? 'Edit task' : 'New scheduled task'}</h2></div>
      <label className="sched-field"><span>Name</span>
        <input value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder="e.g. Monday account news" autoFocus /></label>
      <label className="sched-field"><span>Run a skill (optional)</span>
        <select value={skillVal} onChange={e => setSkillVal(e.target.value)} aria-label="Skill">
          <option value="">No skill: write the prompt yourself</option>
          {(skills || []).filter(x => x.enabled).map(x => <option key={x.key || x.id} value={x.prebuilt ? `k:${x.key}` : `i:${x.id}`}>{x.name}</option>)}
        </select>
        {skill && <small>{skill.description}</small>}
      </label>
      {skill && (skill.inputs || []).map(i => (
        <label key={i.key} className="sched-field"><span>{i.label}</span>
          <input value={skillInputs[i.key] || ''} maxLength={500} placeholder={i.placeholder || ''} onChange={e => setSkillInputs(v => ({ ...v, [i.key]: e.target.value }))} /></label>
      ))}
      {!skill && <>
      <div className="sched-field"><span>Type</span>
        <div className="segmented" role="radiogroup" aria-label="Task type">
          <button type="button" role="radio" aria-checked={kind === 'chat'} className={kind === 'chat' ? 'seg-on' : ''} onClick={() => setKind('chat')}>Agent prompt</button>
          <button type="button" role="radio" aria-checked={kind === 'research'} className={kind === 'research' ? 'seg-on' : ''} onClick={() => setKind('research')}>Deep research</button>
        </div>
        <small>{kind === 'research' ? 'Searches widely and answers with numbered sources.' : 'Like a message to the agent. It can read and change this deal; every change can be undone.'}</small>
      </div>
      <label className="sched-field"><span>{kind === 'research' ? 'Question' : 'What should the agent do?'}</span>
        <textarea rows={4} value={text} maxLength={MAX_PROMPT} onChange={e => setText(e.target.value)} placeholder={kind === 'research' ? 'e.g. What changed at this company in the last 7 days?' : 'e.g. List the inputs still unconfirmed, most important first.'} /></label>
      </>}
      <div className="sched-row">
        <label className="sched-field"><span>Repeat every</span>
          <span className="sched-every">
            <input type="number" min={1} max={744} value={every.n} onChange={e => setEvery(v => ({ ...v, n: e.target.value }))} aria-label="How many" />
            <select value={every.unit} onChange={e => setEvery(v => ({ ...v, unit: e.target.value }))} aria-label="Unit">
              <option value="hours">hours</option><option value="days">days</option><option value="weeks">weeks</option>
            </select>
          </span>
          {eErr && <small className="auth-error">{eErr}</small>}
        </label>
        <label className="sched-field"><span>{editing ? 'Next run' : 'First run'}</span>
          <input type="datetime-local" value={first} onChange={e => setFirst(e.target.value)} /></label>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="sched-form-actions">
        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Schedule it'}</button>
      </div>
    </form>
  )
}
