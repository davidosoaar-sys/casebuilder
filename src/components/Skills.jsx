// Skills: the project's skill library. Prebuilt skills (switch on/off, configure)
// and your own (name + instructions). Use a skill from the Agent ("Use skill")
// or schedule it. Backed by public.skills (migration 0012) + prebuiltSkills.json.
import React, { useEffect, useState } from 'react'
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

export default function Skills({ userId, projects = [], onUse, onSchedule }) {
  const { skills, error: loadError, reload } = useSkills()
  const [using, setUsing] = useState(null) // { skill, action } while picking a project
  const [error, setError] = useState('')
  const [configuring, setConfiguring] = useState(null) // skill key
  const [editing, setEditing] = useState(null) // null | 'new' | custom skill

  // Prebuilt skills have a row only once switched off or configured.
  async function savePrebuilt(skill, patch) {
    setError('')
    const row = { name: skill.name, enabled: skill.enabled, settings: skill.settings, ...patch }
    const { error } = skill.id
      ? await supabase.from('skills').update(row).eq('id', skill.id)
      : await supabase.from('skills').insert({ ...row, owner_id: userId, prebuilt_key: skill.key })
    if (error) setError(error.message); else reload()
  }
  async function toggleCustom(skill) {
    const { error } = await supabase.from('skills').update({ enabled: !skill.enabled }).eq('id', skill.id)
    if (error) setError(error.message); else reload()
  }
  async function removeCustom(skill) {
    if (!window.confirm(`Delete the skill "${skill.name}"?`)) return
    const { error } = await supabase.from('skills').delete().eq('id', skill.id)
    if (error) setError(error.message); else reload()
  }

  const pre = skills?.filter(s => s.prebuilt) || []
  const custom = skills?.filter(s => !s.prebuilt) || []
  return (
    <section className="page skills-page">
      <PageHead title="Skills" sub="Ready-made ways of working the agent can follow, and your own. They work in every project: use one from a project's Agent, or schedule it.">
        <button type="button" className="primary" onClick={() => setEditing('new')}>New skill</button>
      </PageHead>
      {(error || loadError) && <p className="auth-error" role="alert">{error || loadError}</p>}
      {using && <ProjectPick projects={projects} skill={using.skill} action={using.action} onCancel={() => setUsing(null)}
        onPick={dealId => { const u = using; setUsing(null); (u.action === 'use' ? onUse : onSchedule)?.(u.skill, dealId) }} />}
      {editing && <SkillForm userId={userId} initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
      {skills === null ? <p className="pf-empty">Loading…</p> : <>
        <h2 className="skills-head">Built in</h2>
        <ul className="skill-grid">
          {pre.map(s => (
            <li key={s.key} className={`skill-card${s.enabled ? '' : ' is-off'}`}>
              <div className="skill-top">
                <strong>{s.name}</strong>
                <label className="pf-toggle" title={s.enabled ? 'Switch off' : 'Switch on'}>
                  <input type="checkbox" checked={s.enabled} onChange={() => savePrebuilt(s, { enabled: !s.enabled })} aria-label={`${s.name} on`} />
                  <span>{s.enabled ? 'On' : 'Off'}</span>
                </label>
              </div>
              <p className="skill-desc">{s.description}</p>
              <p className="skill-meta">{s.mode === 'research' ? 'Deep research' : 'Agent'}{s.inputs.length ? ` · asks for ${s.inputs.filter(i => i.required).length ? 'details' : 'optional details'}` : ''}</p>
              {configuring === s.key && settingsList(s).length > 0 && (
                <div className="skill-config">
                  {settingsList(s).map(st => (
                    <label key={st.key} className="sched-field"><span>{st.label}</span>
                      <select value={s.settings[st.key]} onChange={e => savePrebuilt(s, { settings: { ...s.settings, [st.key]: e.target.value } })}>
                        {st.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              <div className="skill-actions">
                <button type="button" className="ghost" disabled={!s.enabled} onClick={() => setUsing({ skill: s, action: 'use' })}>Use</button>
                <button type="button" className="ghost" disabled={!s.enabled} onClick={() => setUsing({ skill: s, action: 'schedule' })}>Schedule</button>
                {settingsList(s).length > 0 && <button type="button" className="link-btn" onClick={() => setConfiguring(c => c === s.key ? null : s.key)}>{configuring === s.key ? 'Done' : 'Configure'}</button>}
              </div>
            </li>
          ))}
        </ul>
        <h2 className="skills-head">Yours</h2>
        {custom.length === 0 ? <p className="pf-empty">No skills of your own yet. Write down how you like something done once, and reuse it on every project.</p> : (
          <ul className="skill-grid">
            {custom.map(s => (
              <li key={s.id} className={`skill-card${s.enabled ? '' : ' is-off'}`}>
                <div className="skill-top">
                  <strong>{s.name}</strong>
                  <label className="pf-toggle"><input type="checkbox" checked={s.enabled} onChange={() => toggleCustom(s)} aria-label={`${s.name} on`} /><span>{s.enabled ? 'On' : 'Off'}</span></label>
                </div>
                <p className="skill-desc">{s.description || s.instructions.slice(0, 140)}</p>
                <p className="skill-meta">{s.mode === 'research' ? 'Deep research' : 'Agent'} · yours</p>
                <div className="skill-actions">
                  <button type="button" className="ghost" disabled={!s.enabled} onClick={() => setUsing({ skill: s, action: 'use' })}>Use</button>
                  <button type="button" className="ghost" disabled={!s.enabled} onClick={() => setUsing({ skill: s, action: 'schedule' })}>Schedule</button>
                  <button type="button" className="link-btn" onClick={() => setEditing(s)}>Edit</button>
                  <button type="button" className="icon-btn sm" onClick={() => removeCustom(s)} aria-label={`Delete ${s.name}`} title="Delete">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>}
    </section>
  )
}

const settingsList = s => (s.prebuilt ? PREBUILT.find(p => p.key === s.key)?.settings : []) || []

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
    <form className="sched-form pf-section" onSubmit={save} aria-label={initial ? 'Edit skill' : 'New skill'}>
      <div className="pf-section-head"><h2>{initial ? 'Edit skill' : 'New skill'}</h2></div>
      <label className="sched-field"><span>Name</span><input value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="e.g. Champion check" autoFocus /></label>
      <label className="sched-field"><span>One line on what it does (optional)</span><input value={description} maxLength={300} onChange={e => setDescription(e.target.value)} placeholder="e.g. Who our champion is and how strong they are" /></label>
      <div className="sched-field"><span>Runs as</span>
        <div className="segmented" role="radiogroup" aria-label="Skill runs as">
          <button type="button" role="radio" aria-checked={mode === 'chat'} className={mode === 'chat' ? 'seg-on' : ''} onClick={() => setMode('chat')}>Agent</button>
          <button type="button" role="radio" aria-checked={mode === 'research'} className={mode === 'research' ? 'seg-on' : ''} onClick={() => setMode('research')}>Deep research</button>
        </div>
      </div>
      <label className="sched-field"><span>Instructions for the agent</span>
        <textarea rows={7} value={instructions} maxLength={MAX_SKILL_INSTRUCTIONS} onChange={e => setInstructions(e.target.value)} placeholder="Say what to do, what to look at, and how the answer should look. The agent follows this whenever you use the skill, on any project." />
        <small>{instructions.length} / {MAX_SKILL_INSTRUCTIONS}</small></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="sched-form-actions">
        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save' : 'Add skill'}</button>
      </div>
    </form>
  )
}

// Which project to use or schedule a skill in.
export function ProjectPick({ projects, skill, action, onPick, onCancel }) {
  const [id, setId] = useState(projects[0]?.id || '')
  if (!projects.length) return <p className="notice">Create a project first: a skill runs on a project's material.</p>
  return (
    <form className="sched-form pf-section skill-pick" onSubmit={e => { e.preventDefault(); if (id) onPick(id) }} aria-label="Pick a project">
      <div className="pf-section-head"><h2>{action === 'use' ? `Use ${skill.name} on…` : `Schedule ${skill.name} on…`}</h2></div>
      <label className="sched-field"><span>Project</span>
        <select value={id} onChange={e => setId(e.target.value)} aria-label="Project">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name || 'Untitled project'}</option>)}
        </select></label>
      <div className="sched-form-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">{action === 'use' ? 'Open the Agent' : 'Continue'}</button>
      </div>
    </form>
  )
}
