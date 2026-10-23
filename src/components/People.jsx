import React, { useState } from 'react'
import { resolve } from './Deck.jsx'
import Logo from './Logo.jsx'
import { uid } from '../projects.js'

// The people step. For each stakeholder role an AI agent searches the public
// web for who holds it at the company and returns names, titles, public emails,
// LinkedIn profiles and a short professional bio, each with its sources. You
// can also add people yourself and edit anything the agent found.

const ACCESS_KEY = 'casebuilder.access'
const readCode = () => {
  try {
    return localStorage.getItem(ACCESS_KEY) || ''
  } catch {
    return ''
  }
}

export default function People({
  company,
  stakeholders,
  people,
  onPeople,
  onContinue,
  continueLabel,
  showStep,
  embedded = false
}) {
  const roles = stakeholders.map(resolve).filter(Boolean)
  const [busy, setBusy] = useState({})
  const [errors, setErrors] = useState({})
  const [notes, setNotes] = useState({})
  const [setup, setSetup] = useState(false)
  const [needCode, setNeedCode] = useState(false)
  const [code, setCode] = useState(readCode)

  const setPeopleFor = (key, fn) => onPeople(all => ({ ...all, [key]: fn(all[key] || []) }))

  async function find(role) {
    setBusy(b => ({ ...b, [role.key]: true }))
    setErrors(e => ({ ...e, [role.key]: '' }))
    setNotes(n => ({ ...n, [role.key]: '' }))
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}) },
        body: JSON.stringify({ company, role: role.role })
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503) return setSetup(true)
      if (res.status === 401) return setNeedCode(true)
      if (!res.ok) throw new Error(data.error || 'The search failed.')
      setSetup(false)
      setNeedCode(false)

      const found = (data.people || []).map(p => ({ ...p, id: uid(), found: true }))
      setPeopleFor(role.key, existing => {
        const names = new Set(existing.map(p => p.name.toLowerCase()))
        return [...existing, ...found.filter(p => !names.has(p.name.toLowerCase()))]
      })
      if (!found.length) {
        setNotes(n => ({ ...n, [role.key]: data.note || 'No one could be confirmed from public sources.' }))
      }
    } catch (err) {
      setErrors(e => ({ ...e, [role.key]: err.message || 'The search failed.' }))
    } finally {
      setBusy(b => ({ ...b, [role.key]: false }))
    }
  }

  function saveCode(e) {
    e.preventDefault()
    try {
      localStorage.setItem(ACCESS_KEY, code.trim())
    } catch {
      // ignore: the code just won't persist
    }
    setCode(code.trim())
    setNeedCode(false)
  }

  const anyBusy = Object.values(busy).some(Boolean)

  return (
    <div className={embedded ? 'people-embedded' : 'map-page people-page'}>
      {embedded ? (
        <p className="sub embedded-sub">
          An AI agent searches public web pages for the people who hold each role. Every result comes
          with its sources, and anything it can't confirm is left blank. Check each person before you
          reach out.
        </p>
      ) : (
        <>
          <div className="topbar topbar-flush">
            <Logo height={26} />
          </div>
          <p className="mono-label">{showStep ? 'Step 3 of 3 · ' : ''}People</p>
          <h1>Who are they at {company}?</h1>
          <p className="sub">
            An AI agent searches public web pages for the people who hold each role. Every result
            comes with its sources, and anything it can't confirm is left blank. Check each person
            before you reach out.
          </p>
        </>
      )}

      {setup && (
        <div className="notice">
          <strong>The AI agent isn't connected yet.</strong> It needs an Anthropic API key. Locally,
          put <code>ANTHROPIC_API_KEY=your-key</code> in a file called <code>.env.local</code> and
          restart the dev server. On Vercel, add it under Project Settings → Environment Variables
          and redeploy.
        </div>
      )}

      {needCode && (
        <form className="notice" onSubmit={saveCode}>
          <strong>This agent is protected.</strong> Enter the access code to use it.
          <div className="notice-row">
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Access code"
              autoFocus
            />
            <button className="primary" type="submit" disabled={!code.trim()}>
              Save code
            </button>
          </div>
        </form>
      )}

      <div className="people-actions">
        <button
          className="primary"
          disabled={anyBusy || !roles.length}
          onClick={() => roles.forEach(find)}
        >
          {anyBusy ? 'Searching…' : 'Find everyone'}
        </button>
        {!embedded && (
          <button className="ghost" onClick={onContinue}>
            {continueLabel}
          </button>
        )}
      </div>

      {roles.length === 0 && <p className="empty">Add stakeholders on the map first.</p>}

      {roles.map(role => {
        const list = people[role.key] || []
        return (
          <section className="role-block" key={role.key}>
            <div className="role-head">
              <h2>{role.role}</h2>
              <button className="ghost" disabled={busy[role.key]} onClick={() => find(role)}>
                {busy[role.key] ? 'Searching…' : list.length ? 'Search again' : 'Find people'}
              </button>
            </div>

            {busy[role.key] && (
              <p className="role-status">Searching the web for this role. This can take up to a minute.</p>
            )}
            {errors[role.key] && <p className="role-error">{errors[role.key]}</p>}
            {notes[role.key] && <p className="role-status">{notes[role.key]}</p>}

            <div className="person-list">
              {list.map(p => (
                <PersonCard
                  key={p.id}
                  person={p}
                  onChange={next => setPeopleFor(role.key, l => l.map(x => (x.id === p.id ? next : x)))}
                  onRemove={() => setPeopleFor(role.key, l => l.filter(x => x.id !== p.id))}
                />
              ))}
            </div>

            <AddPerson onAdd={p => setPeopleFor(role.key, l => [...l, p])} />
          </section>
        )
      })}

      {!embedded && (
        <div className="map-actions">
          <span />
          <button className="primary" onClick={onContinue}>
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function PersonCard({ person: p, onChange, onRemove }) {
  const [editing, setEditing] = useState(false)
  const set = (field, value) => onChange({ ...p, [field]: value })
  const host = u => {
    try {
      return new URL(u).hostname.replace(/^www\./, '')
    } catch {
      return u
    }
  }

  return (
    <article className="person">
      <div className="person-top">
        <div>
          {editing ? (
            <input className="person-edit" value={p.name} onChange={e => set('name', e.target.value)} placeholder="Name" />
          ) : (
            <strong className="person-name">{p.name}</strong>
          )}
          {editing ? (
            <input className="person-edit" value={p.title} onChange={e => set('title', e.target.value)} placeholder="Title" />
          ) : (
            <span className="person-title">{p.title}</span>
          )}
        </div>
        <div className="person-tools">
          {p.found && <span className={`badge badge-${p.confidence}`}>{p.confidence} confidence</span>}
          {!p.found && <span className="badge">Added by you</span>}
          <button className="tool tool-text" onClick={() => setEditing(e => !e)}>
            {editing ? 'Done' : 'Edit'}
          </button>
          <button className="tool tool-danger" onClick={onRemove} aria-label={`Remove ${p.name}`} title="Remove">
            ✕
          </button>
        </div>
      </div>

      {editing ? (
        <div className="person-fields">
          <input className="person-edit" value={p.email || ''} onChange={e => set('email', e.target.value)} placeholder="Email" />
          <input className="person-edit" value={p.linkedin || ''} onChange={e => set('linkedin', e.target.value)} placeholder="LinkedIn URL" />
          <textarea className="person-edit" rows={3} value={p.bio || ''} onChange={e => set('bio', e.target.value)} placeholder="A little about them" />
        </div>
      ) : (
        <>
          {p.bio && <p className="person-bio">{p.bio}</p>}
          <dl className="person-meta">
            <div>
              <dt>Email</dt>
              <dd>{p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : <span className="none">Not publicly listed</span>}</dd>
            </div>
            <div>
              <dt>LinkedIn</dt>
              <dd>
                {p.linkedin ? (
                  <a href={p.linkedin} target="_blank" rel="noreferrer noopener">
                    {p.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                ) : (
                  <span className="none">Not found</span>
                )}
              </dd>
            </div>
          </dl>
          {p.sources?.length > 0 && (
            <p className="person-sources">
              Sources:{' '}
              {p.sources.map((u, i) => (
                <span key={u}>
                  {i > 0 && ' · '}
                  <a href={u} target="_blank" rel="noreferrer noopener">
                    {host(u)}
                  </a>
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </article>
  )
}

function AddPerson({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ id: uid(), name: name.trim(), title: title.trim(), email: '', linkedin: '', bio: '', sources: [], found: false })
    setName('')
    setTitle('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="tab tab-add person-add" onClick={() => setOpen(true)}>
        + Add a person
      </button>
    )
  }
  return (
    <form className="stake-add person-add-form" onSubmit={submit}>
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <button className="primary" type="submit" disabled={!name.trim()}>
        Add
      </button>
      <button className="ghost" type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  )
}
