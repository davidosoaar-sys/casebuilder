// Scheduled: tasks the agent runs on its own, on a repeat. A task runs a skill
// (how the agent does a job) or your own prompt on one project; every run
// posts into the task's own chat in that case's Agent. Yours lists your
// tasks; Templates are a skill or prompt plus a schedule to start from.
// Backed by public.schedules + the per-minute runner.
import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import PageHead from './PageHead.jsx'
import { supabase } from '../supabase.js'
import { useModelKeys } from './Settings.jsx'
import { useSkills } from './Skills.jsx'
import { Dialog, EASE_OUT, Menu, PlusIcon, Select, Skeleton, SkillIcon, Tabs } from './ui.jsx'
import { prebuiltByKey, skillMessage, skillRef } from '../skills.js'
import { SCHEDULE_LIMIT, MAX_PROMPT, parseEvery, everyInterval, everyError, describeEvery, toLocalInput, defaultFirstRun, fmtWhen, fmtClock, nextAt, scheduleError } from '../schedules.js'

const SELECT = 'id, deal_id, title, kind, payload, every, timezone, next_run_at, enabled, created_at'
const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } })()
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// A skill or a prompt plus a schedule. The table has no weekday filter, so a
// weekday here only picks the first run; the repeat does the rest.
const TEMPLATES = [
  { id: 'brief', title: 'Pre-meeting brief', skill: 'pre_meeting_brief', every: { n: 1, unit: 'days' }, at: { hour: 8 },
    desc: 'At 8 AM daily: matching Calendar meetings in the next 24 hours, or the meeting details you enter.' },
  { id: 'news', title: 'Monday account news', skill: 'account_news', every: { n: 1, unit: 'weeks' }, at: { weekday: 1, hour: 9 },
    desc: 'What changed at the account last week: leadership, funding, launches, earnings.' },
  { id: 'map', title: 'Weekly stakeholder map', skill: 'stakeholder_map', every: { n: 1, unit: 'weeks' }, at: { weekday: 5, hour: 16 },
    desc: 'Refresh who matters on the deal and where each person stands, before the weekend.' },
  { id: 'questions', title: 'Daily open questions', kind: 'chat', every: { n: 1, unit: 'days' }, at: { hour: 9 },
    text: 'List the inputs on this deal that are still unconfirmed, most important first, and say who could confirm each.',
    desc: 'The inputs still unconfirmed on the deal, most important first, and who could confirm each.' },
  { id: 'objections', title: 'Objection prep refresh', skill: 'objection_prep', every: { n: 2, unit: 'weeks' }, at: { hour: 9 },
    desc: 'The objections the buyer is likely to raise now, with answers drawn from the case.' }
]
const RUNS = [['skill', 'Skill'], ['chat', 'Agent prompt'], ['research', 'Deep research']]
const optionValue = x => (x.prebuilt ? `k:${x.key}` : `i:${x.id}`)

function templateWhen(t) {
  const clock = fmtClock(t.at.hour, t.at.minute)
  if (t.at.weekday != null && t.every.n === 1 && t.every.unit === 'weeks') return `Every ${DAYS[t.at.weekday]}, ${clock}`
  return `${describeEvery(everyInterval(t.every))}, ${clock}`
}

export default function Scheduled({ projects = [], userId, onOpenChat, skillToSchedule, onSkillScheduled }) {
  const [list, setList] = useState(null)
  const [total, setTotal] = useState(0) // across all projects: the cap is per account
  const [lastRuns, setLastRuns] = useState({})
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | schedule
  const [tab, setTab] = useState(null) // null until chosen: Yours if any task, else Templates
  const [flipping, setFlipping] = useState({}) // schedule id -> enabled, until the reload lands
  const [starting, setStarting] = useState({}) // schedule id -> Run now in flight
  const { keys } = useModelKeys(userId)
  const { skills } = useSkills()
  const noKey = keys && keys.length === 0

  async function load() {
    const { data, error } = await supabase.from('schedules').select(SELECT).order('created_at', { ascending: true })
    if (error) { setError(error.message); setList([]); return }
    setList(data); setTotal(data.length)
    if (data.length) {
      const { data: jobs } = await supabase.from('jobs').select('schedule_id, status, created_at, error')
        .in('schedule_id', data.map(s => s.id)).order('created_at', { ascending: false }).limit(200)
      const last = {}
      for (const j of jobs || []) if (!last[j.schedule_id]) last[j.schedule_id] = j
      setLastRuns(last)
    }
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const projectName = id => projects.find(p => p.id === id)?.name || 'A case'
  // From the Skills page: open the form with that skill picked.
  useEffect(() => {
    if (!skillToSchedule) return
    setEditing({ example: true, title: skillToSchedule.skill.name, kind: skillToSchedule.skill.mode === 'research' ? 'research' : 'chat', every: '7 days', payload: {}, skill: skillToSchedule.skill, deal_id: skillToSchedule.dealId })
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
    if (error) setError(scheduleError(error.message)); else await load()
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
      const { error: em } = await supabase.from('chat_messages').insert({ deal_id: s.deal_id, owner_id: userId, chat_id: chatId, role: 'user', content: text, meta: s.kind === 'research' ? { research: true } : {} })
      if (em) { setError(em.message); return }
    }
    const { error } = await supabase.from('jobs').insert({ owner_id: userId, deal_id: s.deal_id, kind: s.kind, payload: { ...s.payload, title: s.title, run_now: true } })
    if (error) { setError(/rate|limit/i.test(error.message) ? 'Too many requests just now. Wait a minute and try again.' : error.message); return }
    if (s.payload?.chat_id) onOpenChat?.(s.deal_id, s.payload.chat_id)
  }
  // UI around the actions above: the switch moves at once, Run now shows it started.
  async function flip(s) {
    setFlipping(f => ({ ...f, [s.id]: !s.enabled }))
    await toggle(s)
    setFlipping(f => { const n = { ...f }; delete n[s.id]; return n })
  }
  async function start(s) {
    setStarting(r => ({ ...r, [s.id]: true }))
    await runNow(s)
    setStarting(r => { const n = { ...r }; delete n[s.id]; return n })
  }
  function fromTemplate(t) {
    const skill = t.skill ? (skills || []).find(x => x.key === t.skill) : null
    setEditing({ example: true, title: t.title, kind: skill ? (skill.mode === 'research' ? 'research' : 'chat') : t.kind, every: everyInterval(t.every),
      payload: t.text ? { message: t.text } : {}, skill, first: nextAt(t.at) })
  }

  const full = total >= SCHEDULE_LIMIT
  const blocked = full ? `${SCHEDULE_LIMIT} tasks is the most an account can have` : noKey ? 'Add an AI model key in Settings first' : !projects.length ? 'Create a case first' : ''
  const shown = tab ?? (list === null || list.length ? 'yours' : 'templates')
  const newTask = (label = 'New task') => (
    <button type="button" className="primary skill-new" onClick={() => setEditing('new')} disabled={!!blocked} title={blocked}><PlusIcon size={16} />{label}</button>
  )
  return (
    <MotionConfig reducedMotion="user">
      <section className="page scheduled-page">
        <PageHead title="Recurring tasks" sub="Have the agent run a skill or a prompt on its own, on a repeat. Results land in that case's Agent.">
          {newTask()}
        </PageHead>
        <Tabs tabs={[{ id: 'yours', label: 'Yours', count: list ? list.length : null }, { id: 'templates', label: 'Templates' }]}
          value={list === null && tab === null ? null : shown} onChange={setTab} layoutId="sched-tab-pill" idPrefix="sched" label="Recurring tasks" />
        {noKey && <p className="notice">Recurring tasks run on your own AI model key. Add one in Settings first.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <div id={`sched-panel-${shown}`} role="tabpanel" aria-labelledby={`sched-tab-${shown}`} className="skill-panel">
          {shown === 'templates' ? (
            <ul className="skill-grid" key="templates">{TEMPLATES.map((t, i) => (
              <motion.li key={t.id} initial={{ opacity: 0, transform: 'translateY(6px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }}
                transition={{ duration: 0.18, ease: EASE_OUT, delay: Math.min(i, 6) * 0.03 }}>
                <TemplateCard template={t} skills={skills} blocked={blocked} onUse={() => fromTemplate(t)} />
              </motion.li>
            ))}</ul>
          ) : list === null ? <Skeleton label="Loading scheduled tasks" rows={3} height={88} listClass="sched-list" /> : list.length === 0 ? (
            <div className="skill-empty sched-empty">
              <span className="skill-icon"><ClockIcon /></span>
              <h2>No scheduled tasks yet</h2>
              <p>Start from a template, or set one up yourself.</p>
              <div className="sched-empty-actions">
                <button type="button" className="primary" onClick={() => setTab('templates')}>Browse templates</button>
                <button type="button" className="ghost" onClick={() => setEditing('new')} disabled={!!blocked} title={blocked}>Set up manually</button>
              </div>
            </div>
          ) : (
            <ul className="sched-list" key="yours">
              <AnimatePresence initial={false}>
                {list.map((s, i) => (
                  <motion.li key={s.id} className="sched-item" initial={{ opacity: 0, transform: 'translateY(6px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }}
                    exit={{ opacity: 0, height: 0, paddingBottom: 0, overflow: 'hidden', transition: { duration: 0.2, ease: EASE_OUT } }}
                    transition={{ duration: 0.18, ease: EASE_OUT, delay: Math.min(i, 6) * 0.03 }}>
                    <TaskCard task={s} on={flipping[s.id] ?? s.enabled} last={lastRuns[s.id]} starting={!!starting[s.id]} noKey={noKey} skills={skills}
                      project={projectName(s.deal_id)} onEdit={() => setEditing(s)} onToggle={() => flip(s)} onRun={() => start(s)}
                      onDelete={() => remove(s)} onOpenChat={s.payload?.chat_id ? () => onOpenChat?.(s.deal_id, s.payload.chat_id) : null} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
        <p className="sched-foot">{total} of {SCHEDULE_LIMIT} scheduled tasks used. Times are in your time zone ({TZ}). Each run uses your AI key like a normal message.</p>

        <Dialog open={!!editing} onClose={() => setEditing(null)} className="sched-form-modal" title={editing && editing !== 'new' && !editing.example ? 'Edit task' : 'New scheduled task'}>
          {editing && <TaskForm projects={projects} userId={userId} skills={skills} initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setTab('yours'); load() }} />}
        </Dialog>
      </section>
    </MotionConfig>
  )
}

const hours = every => { const { n, unit } = parseEvery(every); return unit === 'weeks' ? n * 168 : unit === 'days' ? n * 24 : n }

function TemplateCard({ template: t, skills, blocked, onUse }) {
  const skill = t.skill ? (skills || []).find(x => x.key === t.skill) : null
  const needsSkill = t.skill && skills && !skill?.enabled
  const name = skill?.name || prebuiltByKey(t.skill)?.name
  const off = !!blocked || needsSkill || (t.skill && !skills)
  const why = blocked || (needsSkill ? `Add ${name} on the Skills page first` : '')
  return (
    <div className={`skill-card sched-example${off ? ' is-off' : ''}`}>
      <span className="skill-icon" aria-hidden="true">{t.skill ? <SkillIcon skillKey={t.skill} /> : <SparkleIcon />}</span>
      <button type="button" className="skill-open" onClick={onUse} disabled={off} title={why || undefined}>
        <strong>{t.title}</strong>
        <span className="skill-desc">{t.desc}</span>
        <span className="skill-meta"><span>{templateWhen(t)}</span>{t.skill ? `Skill: ${name}` : 'Agent prompt'}</span>
      </button>
      <div className="skill-card-actions">
        <button type="button" className="ghost skill-try" onClick={onUse} disabled={off} title={why || undefined} aria-label={needsSkill ? `Add ${name} first` : `Use template ${t.title}`}>
          {needsSkill ? 'Add skill first' : 'Use template'}
        </button>
      </div>
    </div>
  )
}

function TaskCard({ task: s, on, last, starting, noKey, skills, project, onEdit, onToggle, onRun, onDelete, onOpenChat }) {
  const key = s.payload?.skill_key
  const custom = s.payload?.skill_id ? (skills || []).find(x => x.id === s.payload.skill_id) : null
  const type = key ? `Skill: ${prebuiltByKey(key)?.name || 'Built-in skill'}` : s.payload?.skill_id ? `Skill: ${custom?.name || 'Your skill'}` : s.kind === 'research' ? 'Deep research' : 'Agent prompt'
  const icon = key || s.payload?.skill_id ? <SkillIcon skillKey={key} /> : s.kind === 'research' ? <GlobeIcon /> : <SparkleIcon />
  // A skill task's message is "Use skill: X" plus its inputs; the type line already names X.
  const body = s.payload?.question || s.payload?.message || ''
  const prompt = key || s.payload?.skill_id ? body.split('\n').slice(1).join(', ') : body
  const status = !last ? 'never' : last.status === 'failed' ? 'failed' : last.status === 'queued' || last.status === 'running' ? 'running' : 'ok'
  return (
    <div className={`sched-card${on ? '' : ' is-off'}`}>
      <span className="skill-icon" aria-hidden="true">{icon}</span>
      <button type="button" className="sched-open" onClick={onEdit} aria-label={`Edit ${s.title}`}>
        <strong>{s.title}</strong>
        <span className="sched-sub"><span className="sched-project">{project}</span><span>{type}</span></span>
        <span className="sched-prompt">{prompt}</span>
      </button>
      <div className="sched-when">
        <strong>{describeEvery(s.every)}</strong>
        <span>{on ? <>Next: {fmtWhen(s.next_run_at)}</> : 'Paused'}</span>
        <span className={`sched-last is-${starting ? 'running' : status}`} aria-live="polite">
          {starting ? <><Spinner />Starting…</>
            : <><i aria-hidden="true" />{last ? <>Last run: {fmtWhen(last.created_at)}{status === 'failed' ? ' (failed)' : status === 'running' ? ' (running)' : ''}</> : 'Not run yet'}</>}
        </span>
      </div>
      <div className="sched-controls">
        <button type="button" role="switch" aria-checked={on} className="sched-switch" onClick={onToggle}
          aria-label={`Run ${s.title} on schedule`} title={on ? 'Pause this task' : 'Resume this task'}><span /></button>
        <Menu label={`More for ${s.title}`} items={[
          onOpenChat && { label: 'Open chat', onSelect: onOpenChat },
          { label: 'Run now', onSelect: onRun, disabled: noKey || starting },
          { label: 'Edit', onSelect: onEdit },
          { label: 'Delete', onSelect: onDelete, danger: true }
        ].filter(Boolean)} />
      </div>
    </div>
  )
}

function TaskForm({ projects, userId, skills, initial, onClose, onSaved }) {
  const editing = initial && !initial.example
  // The project a task runs on. Fixed once saved: its chat lives in that project.
  const [dealId, setDealId] = useState(initial?.deal_id || projects[0]?.id || '')
  const project = projects.find(p => p.id === dealId) || { id: dealId }
  // A task can run a skill instead of a free prompt (value: 'k:<key>' or 'i:<id>').
  const initialSkill = initial?.skill ? (initial.skill.prebuilt ? `k:${initial.skill.key}` : `i:${initial.skill.id}`)
    : initial?.payload?.skill_key ? `k:${initial.payload.skill_key}` : initial?.payload?.skill_id ? `i:${initial.payload.skill_id}` : ''
  const added = (skills || []).filter(x => x.enabled)
  const [runs, setRuns] = useState(initialSkill ? 'skill' : initial?.kind || 'chat') // 'skill' | 'chat' | 'research'
  const [skillVal, setSkillVal] = useState(initialSkill)
  const [skillInputs, setSkillInputs] = useState(initial?.payload?.skill_inputs || {})
  const skill = runs === 'skill' ? skills?.find(x => optionValue(x) === skillVal) || null : null
  const [title, setTitle] = useState(initial?.title || '')
  const [kind, setKind] = useState(initial?.kind || 'chat')
  const [text, setText] = useState(initial?.payload?.question || initial?.payload?.message || '')
  const [every, setEvery] = useState(initial?.every ? parseEvery(initial.every) : { n: 1, unit: 'days' })
  const [first, setFirst] = useState(toLocalInput(editing ? new Date(Math.max(new Date(initial.next_run_at).getTime(), Date.now() + 120000)) : initial?.first || defaultFirstRun()))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const eErr = everyError(every)
  const radios = useRef({})

  function choose(r) {
    setRuns(r)
    if (r === 'skill') { if (!skillVal && added[0]) setSkillVal(optionValue(added[0])) }
    else setKind(r)
  }
  function onRunsKey(e) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const i = RUNS.findIndex(([k]) => k === runs)
    const next = RUNS[(i + step + RUNS.length) % RUNS.length][0]
    choose(next); radios.current[next]?.focus()
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!dealId) { setError('Pick a case.'); return }
    if (!title.trim() || (!text.trim() && !skill)) { setError(runs === 'skill' ? 'Give the task a name and pick a skill.' : 'Give the task a name and say what the agent should do.'); return }
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
    <form className="sched-form skill-modal-body" onSubmit={save} aria-label={editing ? 'Edit scheduled task' : 'New scheduled task'}>
      <div className="sched-field"><span>What runs</span>
        <div className="segmented sched-runs" role="radiogroup" aria-label="Task type" onKeyDown={onRunsKey}>
          {RUNS.map(([k, label]) => (
            <button key={k} ref={el => { radios.current[k] = el }} type="button" role="radio" aria-checked={runs === k} tabIndex={runs === k ? 0 : -1}
              className={runs === k ? 'seg-on' : ''} onClick={() => choose(k)} autoFocus={runs === k}>{label}</button>
          ))}
        </div>
        <small>{runs === 'skill' ? 'How the agent does a job, from your Skills page.' : runs === 'research' ? 'Searches widely and answers with numbered sources.' : 'Like a message to the agent. It can read and change this deal; every change can be undone.'}</small>
      </div>
      {runs === 'skill' ? <>
        <label className="sched-field"><span>Skill</span>
          <Select name="skill" value={skill ? skillVal : ''} onChange={setSkillVal} aria-label="Skill"
            options={[...(skill ? [] : [{ value: '', label: added.length ? 'Pick a skill' : 'No skills added yet' }]), ...added.map(x => ({ value: optionValue(x), label: x.name }))]} />
          {skill ? <small>{skill.description}</small> : !added.length && skills && <small>Add a skill on the Skills page first.</small>}
        </label>
        {skill && (skill.inputs || []).map(i => (
          <label key={i.key} className="sched-field"><span>{i.label}</span>
            <input type="text" name={`skill-${i.key}`} autoComplete="off" value={skillInputs[i.key] || ''} maxLength={500} placeholder={i.placeholder ? `${i.placeholder}…` : ''} onChange={e => setSkillInputs(v => ({ ...v, [i.key]: e.target.value }))} /></label>
        ))}
      </> : (
        <label className="sched-field"><span>{kind === 'research' ? 'Question' : 'What should the agent do?'}</span>
          <textarea name="prompt" rows={4} value={text} maxLength={MAX_PROMPT} onChange={e => setText(e.target.value)} placeholder={kind === 'research' ? 'e.g. What changed at this company in the last 7 days?' : 'e.g. List the inputs still unconfirmed, most important first.'} /></label>
      )}
      <label className="sched-field"><span>Case</span>
        <Select name="project" value={dealId} onChange={setDealId} disabled={!!editing} aria-label="Case"
          options={projects.map(p => ({ value: p.id, label: p.name || 'Untitled case' }))} />
        {editing && <small>A task stays on its case; its results are in that case's chat.</small>}
      </label>
      <label className="sched-field"><span>Name</span>
        <input name="title" autoComplete="off" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder="e.g. Monday account news…" /></label>
      <div className="sched-row">
        <label className="sched-field"><span>Repeat every</span>
          <span className="sched-every">
            <input type="number" name="every" inputMode="numeric" min={1} max={744} value={every.n} onChange={e => setEvery(v => ({ ...v, n: e.target.value }))} aria-label="How many" />
            <Select name="unit" value={every.unit} onChange={unit => setEvery(v => ({ ...v, unit }))} aria-label="Unit"
              options={[{ value: 'hours', label: 'hours' }, { value: 'days', label: 'days' }, { value: 'weeks', label: 'weeks' }]} />
          </span>
          {eErr && <small className="auth-error">{eErr}</small>}
        </label>
        <label className="sched-field"><span>{editing ? 'Next run' : 'First run'}</span>
          <input type="datetime-local" name="first-run" value={first} onChange={e => setFirst(e.target.value)} /></label>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="sched-form-actions">
        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Schedule it'}</button>
      </div>
    </form>
  )
}

function ClockIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 2" /></svg>
}

function SparkleIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M9 3c.5 3.2 1.8 4.5 5 5-3.2.5-4.5 1.8-5 5-.5-3.2-1.8-4.5-5-5 3.2-.5 4.5-1.8 5-5Z" /><path d="M15 12.5c.2 1.3.7 1.8 2 2-1.3.2-1.8.7-2 2-.2-1.3-.7-1.8-2-2 1.3-.2 1.8-.7 2-2Z" /></svg>
}

function GlobeIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M3 9h12M9 3c1.6 1.7 2.4 3.7 2.4 6S10.6 13.3 9 15M9 3C7.4 4.7 6.6 6.7 6.6 9s.8 4.3 2.4 6M13.5 13.5L17 17" /></svg>
}

function Spinner() {
  return <svg className="sched-spin" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 1.5A4.5 4.5 0 1 1 1.5 6" /></svg>
}
