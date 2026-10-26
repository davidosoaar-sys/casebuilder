// Skills: the account's skill library. Discover lists the built-in skills,
// Yours lists the ones you added plus your own. "Added" is the row's enabled
// flag (built-ins default to added). Try opens a skill in a project's Agent.
// Backed by public.skills (migrations 0012, 0013) + prebuiltSkills.json.
import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import PageHead from './PageHead.jsx'
import { supabase } from '../supabase.js'
import { librarySkills, MAX_SKILL_INSTRUCTIONS, PREBUILT } from '../skills.js'

// Skills are the account's (migration 0013): one library across every project.
export async function loadSkillRows() {
  const { data, error } = await supabase.from('skills').select('id, prebuilt_key, name, description, instructions, settings, enabled').is('deal_id', null).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export function useSkills() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const reload = () => loadSkillRows().then(setRows).catch(e => { setError(e.message); setRows([]) })
  useEffect(() => { reload() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return { skills: rows ? librarySkills(rows) : null, rows, error, reload }
}

const EASE_OUT = [0.23, 1, 0.32, 1]
const EASE_IN_OUT = [0.77, 0, 0.175, 1]
const FEATURED = 'pre_meeting_brief'
const sid = s => s.key || s.id

// onSchedule is still passed by App.jsx; scheduling now lives on the Scheduled page.
export default function Skills({ userId, projects = [], onUse, onSchedule }) { // eslint-disable-line no-unused-vars
  const { skills, error: loadError, reload } = useSkills()
  const [tab, setTab] = useState('discover')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [optimistic, setOptimistic] = useState({}) // skill id -> added, until the reload lands
  const [detailId, setDetailId] = useState(null)
  const [picking, setPicking] = useState(null) // skill waiting for a project
  const [editing, setEditing] = useState(null) // null | 'new' | custom skill

  const isAdded = s => optimistic[sid(s)] ?? s.enabled
  const settle = k => setOptimistic(o => { const n = { ...o }; delete n[k]; return n })

  // Built-in skills have a row only once removed or configured.
  async function savePrebuilt(skill, patch) {
    setError('')
    const row = { name: skill.name, enabled: skill.enabled, settings: skill.settings, ...patch }
    const { error } = skill.id
      ? await supabase.from('skills').update(row).eq('id', skill.id)
      : await supabase.from('skills').insert({ ...row, owner_id: userId, prebuilt_key: skill.key })
    if (error) { setError(error.message); return false }
    await reload(); return true
  }
  async function removeCustom(skill) {
    if (!window.confirm(`Delete the skill “${skill.name}”? This can't be undone.`)) return false
    setError('')
    const { error } = await supabase.from('skills').delete().eq('id', skill.id)
    if (error) { setError(error.message); return false }
    await reload(); return true
  }
  // Add or remove from Yours. Removing your own skill deletes it.
  async function setAdded(skill, on) {
    if (!skill.prebuilt && !on) return removeCustom(skill)
    const k = sid(skill)
    setOptimistic(o => ({ ...o, [k]: on }))
    let ok
    if (skill.prebuilt) ok = await savePrebuilt(skill, { enabled: on })
    else {
      setError('')
      const { error } = await supabase.from('skills').update({ enabled: on }).eq('id', skill.id)
      if (error) setError(error.message); else await reload()
      ok = !error
    }
    settle(k)
    return ok
  }
  // Try: the worker only runs added skills, so trying one adds it first.
  async function launch(skill, dealId) {
    if (!isAdded(skill) && !(await setAdded(skill, true))) return
    setPicking(null); setDetailId(null)
    onUse?.(skill, dealId)
  }
  function tryIt(skill) {
    if (projects.length === 1) launch(skill, projects[0].id)
    else setPicking(skill)
  }

  const all = skills || []
  const q = query.trim().toLowerCase()
  const matches = s => !q || `${s.name} ${s.description || ''}`.toLowerCase().includes(q)
  const yours = all.filter(s => !s.prebuilt || isAdded(s))
  const list = (tab === 'discover' ? all.filter(s => s.prebuilt) : yours).filter(matches)
  const featured = all.find(s => s.key === FEATURED)
  const detail = detailId ? all.find(s => sid(s) === detailId) : null
  const card = s => <SkillCard key={sid(s)} skill={s} added={isAdded(s)} onOpen={() => setDetailId(sid(s))} onTry={() => tryIt(s)} onToggle={() => setAdded(s, !isAdded(s))} />

  return (
    <MotionConfig reducedMotion="user">
      <section className="page skills-page">
        <PageHead title="Skills" sub="How the agent does a job. Try one in any project, or add your own.">
          <label className="skill-search">
            <SearchIcon />
            <input type="search" name="skill-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search skills…" aria-label="Search skills" autoComplete="off" spellCheck={false} />
          </label>
          <button type="button" className="primary skill-new" onClick={() => setEditing('new')}><PlusIcon size={16} />New skill</button>
        </PageHead>
        <Tabs tab={tab} onTab={setTab} yoursCount={skills ? yours.length : null} />
        {(error || loadError) && <p className="auth-error" role="alert">{error || loadError}</p>}

        <div id={`skills-panel-${tab}`} role="tabpanel" aria-labelledby={`skills-tab-${tab}`} className="skill-panel">
          {skills === null ? <Skeleton /> : <>
            {tab === 'discover' && !q && featured && (
              <Featured skill={featured} added={isAdded(featured)} onTry={() => tryIt(featured)} onToggle={() => setAdded(featured, !isAdded(featured))} onOpen={() => setDetailId(sid(featured))} />
            )}
            {tab === 'discover' && list.length > 0 && <h2 className="skill-section">All skills</h2>}
            {list.length > 0 ? (
              <ul className="skill-grid" key={tab}>{list.map((s, i) => (
                <motion.li key={sid(s)} initial={{ opacity: 0, transform: 'translateY(6px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ duration: 0.18, ease: EASE_OUT, delay: Math.min(i, 6) * 0.03 }}>{card(s)}</motion.li>
              ))}</ul>
            ) : q ? (
              <p className="skill-nohits" role="status">No skills match “{query.trim()}”.</p>
            ) : tab === 'yours' && (
              <div className="skill-empty">
                <span className="skill-icon"><SkillIcon skillKey={null} /></span>
                <h2>No skills yet</h2>
                <p>Add a built-in skill from Discover, or write down how you like a job done.</p>
                <button type="button" className="primary" onClick={() => setEditing('new')}><PlusIcon size={16} />New skill</button>
              </div>
            )}
          </>}
        </div>

        <Dialog open={!!detail} onClose={() => setDetailId(null)} className="skill-modal" title={detail?.name} icon={detail && <SkillIcon skillKey={detail.key} />}>
          {detail && <SkillDetail skill={detail} added={isAdded(detail)} error={error}
            onSetting={(k, v) => savePrebuilt(detail, { settings: { ...detail.settings, [k]: v } })}
            onEdit={() => { setDetailId(null); setEditing(detail) }}
            onDelete={async () => { if (await removeCustom(detail)) setDetailId(null) }}
            onTry={() => tryIt(detail)} onToggle={() => setAdded(detail, !isAdded(detail))} />}
        </Dialog>
        <Dialog open={!!picking} onClose={() => setPicking(null)} className="skill-pick-modal" title={picking && `Try ${picking.name}`}>
          {picking && <ProjectPick projects={projects} skill={picking} action="use" onCancel={() => setPicking(null)} onPick={dealId => launch(picking, dealId)} />}
        </Dialog>
        <Dialog open={!!editing} onClose={() => setEditing(null)} className="skill-form-modal" title={editing === 'new' ? 'New skill' : 'Edit skill'}>
          {editing && <SkillForm userId={userId} initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
        </Dialog>
      </section>
    </MotionConfig>
  )
}

const settingsList = s => (s.prebuilt ? PREBUILT.find(p => p.key === s.key)?.settings : []) || []

function Tabs({ tab, onTab, yoursCount }) {
  const tabs = [['discover', 'Discover'], ['yours', 'Yours']]
  const refs = useRef({})
  function onKey(e) {
    const i = tabs.findIndex(([k]) => k === tab)
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = tabs[(i + step + tabs.length) % tabs.length][0]
    onTab(next); refs.current[next]?.focus()
  }
  return (
    <div className="skill-tabs" role="tablist" aria-label="Skills" onKeyDown={onKey}>
      {tabs.map(([k, label]) => (
        <button key={k} ref={el => { refs.current[k] = el }} type="button" role="tab" id={`skills-tab-${k}`} aria-controls={`skills-panel-${k}`}
          aria-selected={tab === k} tabIndex={tab === k ? 0 : -1} className="skill-tab" onClick={() => onTab(k)}>
          {tab === k && <motion.span layoutId="skills-tab-pill" className="skill-tab-pill" transition={{ duration: 0.25, ease: EASE_IN_OUT }} />}
          <span className="skill-tab-label">{label}{k === 'yours' && yoursCount !== null && <span className="skill-tab-count">{yoursCount}</span>}</span>
        </button>
      ))}
    </div>
  )
}

function SkillCard({ skill, added, onOpen, onTry, onToggle }) {
  return (
    <div className="skill-card">
      <span className="skill-icon" aria-hidden="true"><SkillIcon skillKey={skill.key} /></span>
      <button type="button" className="skill-open" onClick={onOpen}>
        <strong>{skill.name}</strong>
        <span className="skill-desc">{skill.description || skill.instructions?.slice(0, 160)}</span>
        <span className="skill-meta">{skill.prebuilt ? 'Built in' : 'Yours'}{skill.mode === 'research' && <span>Deep research</span>}</span>
      </button>
      <div className="skill-card-actions">
        <TryButton name={skill.name} onClick={onTry} />
        <AddButton skill={skill} added={added} onClick={onToggle} />
      </div>
    </div>
  )
}

function TryButton({ name, onClick, label = 'Try' }) {
  return (
    <button type="button" className="ghost skill-try" onClick={onClick} aria-label={`Try ${name}`}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 2.5V11.5H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" /></svg>
      {label}
    </button>
  )
}

function AddButton({ skill, added, onClick, withLabel }) {
  const label = added ? `Remove ${skill.name}` : `Add ${skill.name}`
  return (
    <button type="button" className={`skill-add${withLabel ? ' with-label' : ''}`} aria-pressed={added} aria-label={withLabel ? undefined : label} title={withLabel ? undefined : label} onClick={onClick}>
      <span className="skill-add-icon" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.span key={added ? 'on' : 'off'} initial={{ opacity: 0, transform: 'scale(0.7)' }} animate={{ opacity: 1, transform: 'scale(1)' }} exit={{ opacity: 0, transform: 'scale(0.7)' }} transition={{ duration: 0.15, ease: EASE_OUT }}>
            {added
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
              : <PlusIcon size={16} />}
          </motion.span>
        </AnimatePresence>
      </span>
      {withLabel && <span>{added ? 'Added' : 'Add'}</span>}
    </button>
  )
}

function Featured({ skill, added, onTry, onToggle, onOpen }) {
  return (
    <div className="skill-featured">
      <div className="skill-featured-text">
        <p className="skill-featured-label">Built in</p>
        <h2><button type="button" className="skill-featured-open" onClick={onOpen}>{skill.name}</button></h2>
        <p className="skill-featured-desc">{skill.description}</p>
        <div className="skill-featured-actions">
          <button type="button" className="primary skill-try" onClick={onTry} aria-label={`Try ${skill.name}`}>Try</button>
          <AddButton skill={skill} added={added} onClick={onToggle} withLabel />
        </div>
      </div>
      <svg className="skill-featured-art" viewBox="0 0 220 150" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="18" y="26" width="112" height="100" rx="10" />
        <path d="M18 50h112M44 16v20M104 16v20" />
        <g opacity=".45">
          <path d="M36 70h12M62 70h12M88 70h12M36 88h12M88 88h12M36 106h12M62 106h12" />
        </g>
        <rect x="58" y="82" width="20" height="12" rx="3" />
        <path d="M78 88c28 0 40-6 62-6" strokeDasharray="2 5" opacity=".6" />
        <circle cx="166" cy="66" r="15" />
        <path d="M138 124c2-20 13-32 28-32s26 12 28 32" />
        <path d="M184 34l5-5M192 46h7M176 27v-7" opacity=".6" />
      </svg>
    </div>
  )
}

function SkillDetail({ skill, added, error, onSetting, onEdit, onDelete, onTry, onToggle }) {
  const settings = settingsList(skill)
  return (
    <>
      <div className="skill-modal-body">
        <p className="skill-modal-desc">{skill.description || (skill.prebuilt ? '' : 'Your own skill.')}</p>
        <dl className="skill-facts">
          <div><dt>What it asks for</dt><dd>{skill.inputs.length
            ? <ul>{skill.inputs.map(i => <li key={i.key}>{i.label}</li>)}</ul>
            : 'Nothing. It works from the project\'s own material.'}</dd></div>
          <div><dt>Runs as</dt><dd>{skill.mode === 'research' ? 'Deep research' : 'Agent'}</dd></div>
        </dl>
        {settings.length > 0 && (
          <div className="skill-config">
            {settings.map(st => (
              <label key={st.key} className="sched-field"><span>{st.label}</span>
                <select value={skill.settings[st.key]} onChange={e => onSetting(st.key, e.target.value)}>
                  {st.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
        )}
        {!skill.prebuilt && skill.instructions && <div className="skill-instructions"><span>Instructions</span><p>{skill.instructions}</p></div>}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </div>
      <footer className="skill-modal-foot">
        {!skill.prebuilt && <>
          <button type="button" className="ghost" onClick={onEdit}>Edit</button>
          <button type="button" className="ghost skill-delete" onClick={onDelete}>Delete</button>
        </>}
        <span className="skill-modal-spacer" />
        {skill.prebuilt && <AddButton skill={skill} added={added} onClick={onToggle} withLabel />}
        {!skill.prebuilt && !added && <AddButton skill={skill} added={false} onClick={onToggle} withLabel />}
        <button type="button" className="primary skill-try" onClick={onTry} aria-label={`Try ${skill.name}`}>Try</button>
      </footer>
    </>
  )
}

function Skeleton() {
  return (
    <div className="skill-skeleton" aria-busy="true">
      <span className="visually-hidden">Loading skills</span>
      <div className="skill-skeleton-featured" />
      <ul className="skill-grid" aria-hidden="true">
        {[0, 1, 2, 3].map(i => <li key={i} className="skill-skeleton-card"><span /><span><i /><i /></span></li>)}
      </ul>
    </div>
  )
}

// Portal dialog shell: backdrop fade, scale-in panel, Escape and backdrop
// click close, focus moves inside and returns, body scroll locked.
const openDialogs = []
function Dialog({ open, onClose, title, icon, className = '', children }) {
  const titleId = useId()
  return createPortal(
    <AnimatePresence>
      {open && <DialogPanel key="d" onClose={onClose} title={title} icon={icon} className={className} titleId={titleId}>{children}</DialogPanel>}
    </AnimatePresence>,
    document.body
  )
}

function DialogPanel({ onClose, title, icon, className, titleId, children }) {
  const panel = useRef(null)
  const closeBtn = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const me = {}
    openDialogs.push(me)
    const before = document.activeElement
    if (!panel.current?.contains(document.activeElement)) closeBtn.current?.focus()
    const onKey = e => {
      if (openDialogs[openDialogs.length - 1] !== me) return
      if (e.key === 'Escape') { e.stopPropagation(); close.current() }
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll('button:not(:disabled), input, select, textarea, [href]')]
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      openDialogs.splice(openDialogs.indexOf(me), 1)
      // Hand focus back unless another dialog has already taken it.
      const now = document.activeElement
      const free = !now || now === document.body || panel.current?.contains(now)
      if (free && before && document.contains(before)) before.focus?.()
    }
  }, [])
  return (
    <motion.div className="skill-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
      <motion.div ref={panel} className={`skill-dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}
        initial={{ opacity: 0, transform: 'scale(0.96)' }} animate={{ opacity: 1, transform: 'scale(1)' }} exit={{ opacity: 0, transform: 'scale(0.96)' }}
        transition={{ duration: 0.2, ease: EASE_OUT }}>
        <header className="skill-dialog-head">
          {icon && <span className="skill-icon" aria-hidden="true">{icon}</span>}
          <h2 id={titleId}>{title}</h2>
          <button ref={closeBtn} className="overlay-x" type="button" onClick={onClose} aria-label="Close" title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" /></svg>
          </button>
        </header>
        {children}
      </motion.div>
    </motion.div>
  )
}

function SkillForm({ userId, initial, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [instructions, setInstructions] = useState(initial?.instructions || '')
  const [mode, setMode] = useState(initial?.mode || 'chat')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function save(e) {
    e.preventDefault()
    if (!name.trim() || !instructions.trim()) { setError('Give the skill a name and instructions.'); return }
    setSaving(true); setError('')
    const row = { name: name.trim().slice(0, 80), description: description.trim().slice(0, 300), instructions: instructions.trim().slice(0, MAX_SKILL_INSTRUCTIONS), settings: { mode } }
    const { error } = initial
      ? await supabase.from('skills').update(row).eq('id', initial.id)
      : await supabase.from('skills').insert({ ...row, owner_id: userId })
    setSaving(false)
    if (error) setError(/skill_limit/.test(error.message) ? 'You already have 50 skills of your own, the most an account can have.' : error.message); else onSaved()
  }
  return (
    <form className="sched-form skill-modal-body" onSubmit={save} aria-label={initial ? 'Edit skill' : 'New skill'}>
      <label className="sched-field"><span>Name</span><input name="skill-name" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="e.g. Champion check…" autoComplete="off" autoFocus /></label>
      <label className="sched-field"><span>One line on what it does (optional)</span><input name="skill-description" value={description} maxLength={300} onChange={e => setDescription(e.target.value)} placeholder="e.g. Who our champion is and how strong they are…" autoComplete="off" /></label>
      <div className="sched-field"><span>Runs as</span>
        <div className="segmented" role="radiogroup" aria-label="Skill runs as">
          <button type="button" role="radio" aria-checked={mode === 'chat'} className={mode === 'chat' ? 'seg-on' : ''} onClick={() => setMode('chat')}>Agent</button>
          <button type="button" role="radio" aria-checked={mode === 'research'} className={mode === 'research' ? 'seg-on' : ''} onClick={() => setMode('research')}>Deep research</button>
        </div>
      </div>
      <label className="sched-field"><span>Instructions for the agent</span>
        <textarea name="skill-instructions" rows={7} value={instructions} maxLength={MAX_SKILL_INSTRUCTIONS} onChange={e => setInstructions(e.target.value)} placeholder="Say what to do, what to look at, and how the answer should look. The agent follows this whenever you use the skill, on any project." />
        <small>{instructions.length} / {MAX_SKILL_INSTRUCTIONS}</small></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="sched-form-actions">
        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save' : 'Add skill'}</button>
      </div>
    </form>
  )
}

// Which project to try a skill in. The dialog around it carries the title.
export function ProjectPick({ projects, skill, action, onPick, onCancel }) {
  const [id, setId] = useState(projects[0]?.id || '')
  if (!projects.length) return <p className="notice skill-modal-body">Create a project first: a skill runs on a project's material.</p>
  return (
    <form className="sched-form skill-pick skill-modal-body" onSubmit={e => { e.preventDefault(); if (id) onPick(id) }} aria-label={`Pick a project for ${skill.name}`}>
      <label className="sched-field"><span>Project</span>
        <select name="project" value={id} onChange={e => setId(e.target.value)} aria-label="Project">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name || 'Untitled project'}</option>)}
        </select></label>
      <div className="sched-form-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">{action === 'use' ? 'Open the Agent' : 'Continue'}</button>
      </div>
    </form>
  )
}

// 20px stroke icons, one per built-in skill.
function SkillIcon({ skillKey }) {
  const p = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (skillKey === 'pre_meeting_brief') return <svg {...p}><rect x="3" y="4.5" width="14" height="12" rx="2" /><path d="M3 8.5h14M7 2.5v3M13 2.5v3M7 12h2" /></svg>
  if (skillKey === 'account_news') return <svg {...p}><path d="M4 4.5h10v10.5a1.5 1.5 0 0 0 1.5 1.5H5.5A1.5 1.5 0 0 1 4 15V4.5Z" /><path d="M14 8h2v7a1.5 1.5 0 0 1-3 0M7 8h4M7 11h4M7 14h2" /></svg>
  if (skillKey === 'stakeholder_map') return <svg {...p}><circle cx="10" cy="5" r="2" /><circle cx="4.5" cy="14.5" r="2" /><circle cx="15.5" cy="14.5" r="2" /><path d="M9 6.8l-3.5 5.9M11 6.8l3.5 5.9M6.5 14.5h7" /></svg>
  if (skillKey === 'objection_prep') return <svg {...p}><path d="M10 2.5l6 2.2v4.6c0 3.8-2.6 6.6-6 8.2-3.4-1.6-6-4.4-6-8.2V4.7l6-2.2Z" /><path d="M7.5 10l1.8 1.8 3.4-3.6" /></svg>
  return <svg {...p}><path d="M10 3v3M10 14v3M3 10h3M14 10h3M5.2 5.2l1.8 1.8M13 13l1.8 1.8M5.2 14.8L7 13M13 7l1.8-1.8" /></svg>
}

function PlusIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
}
