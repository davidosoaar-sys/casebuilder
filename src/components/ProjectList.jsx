import React, { useEffect, useState } from 'react'
import { confidence } from '../valueModel.js'
import { safeAsset } from '../brand.js'
import PageHead from './PageHead.jsx'
import { Select, Skeleton } from './ui.jsx'

// Projects: a quiet, Claude-style index. Each deal is a compact row-card with
// its logo and name; Cards (two columns) or List (one column, more detail).

const SAMPLES = [{ value: 'nike', label: 'Nike · sample' }, { value: 'lovable', label: 'Lovable · sample' }, { value: 'fortnite', label: 'Fortnite · sample' }]

const fmtDate = ms => {
  const d = new Date(ms)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
}
const initials = name => name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

let handledCreate = 0

export default function ProjectList({ projects, loading = false, createRequest = 0, activeId, onCreate, onOpen, onDelete, onDuplicate, onCreateSample }) {
  // createRequest counts Dashboard "New case" clicks. Open the dialog only for a
  // click that has not been handled yet, so remounting Projects later does not
  // reopen it on top of the project list.
  const [creating, setCreating] = useState(() => createRequest > handledCreate)
  useEffect(() => { if (createRequest > handledCreate) { handledCreate = createRequest; setCreating(true) } }, [createRequest])
  const [name, setName] = useState('')
  const [display, setDisplay] = useState(() => {
    try { return localStorage.getItem('casebuilder.project-view') === 'list' ? 'list' : 'cards' } catch { return 'cards' }
  })
  function changeDisplay(value) {
    setDisplay(value)
    try { localStorage.setItem('casebuilder.project-view', value) } catch {}
  }
  function close() { setCreating(false); setName('') }
  function submit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
    close()
  }
  function confirmDelete(e, p) {
    e.stopPropagation()
    if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) onDelete(p.id)
  }

  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="page projects-page">
      <PageHead label="Cases" title="Cases">
        <div className="project-view-switch" role="group" aria-label="Case view">
          <button className="view-btn" aria-pressed={display === 'cards'} onClick={() => changeDisplay('cards')} title="Cards" aria-label="Cards">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
          </button>
          <button className="view-btn" aria-pressed={display === 'list'} onClick={() => changeDisplay('list')} title="List" aria-label="List">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 3.5h9M5 8h9M5 12.5h9M2 3.5h.5M2 8h.5M2 12.5h.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <button data-tour="project" className="primary" onClick={() => setCreating(true)}>New case</button>
        {onCreateSample && <Select aria-label="Add a sample project" className="sample-select" value="" placeholder="Add sample project" disabled={loading}
          onChange={key => { if (key) onCreateSample(key) }} options={SAMPLES} />}
      </PageHead>

      {loading ? (
        <Skeleton label="Loading your cases" rows={4} height={70} listClass={`project-grid ${display === 'list' ? 'project-list-view' : 'project-cards-view'}`} />
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <p>No cases yet.</p>
          <button className="primary" onClick={() => setCreating(true)}>Start your first one</button>
        </div>
      ) : (
        <ul className={`project-grid ${display === 'list' ? 'project-list-view' : 'project-cards-view'}`} aria-label={display === 'list' ? 'Cases list' : 'Case cards'}>
          {sorted.map((p, i) => {
            const logo = p.brand?.hideLogo ? '' : safeAsset(p.brand?.icon) || safeAsset(p.brand?.logo) || safeAsset(p.projectLogo)
            return (
              <li key={p.id} className="stagger-in" style={{ '--stagger': `${Math.min(i * 30, 200)}ms` }}>
                <div
                  className={`project-card ${p.id === activeId ? 'project-card-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(p.id)}
                  onKeyDown={e => e.target === e.currentTarget && e.key === 'Enter' && onOpen(p.id)}
                >
                  <span className="project-company-logo">{logo ? <img src={logo} alt="" /> : <span aria-hidden="true">{initials(p.name)}</span>}</span>
                  <span className="project-text">
                    <strong>{p.name}</strong>
                    <span className="project-meta">{fmtDate(p.updatedAt)} · {confidence(p.fields)}% confirmed</span>
                  </span>
                  <span className="project-actions">
                    <button className="icon-btn" aria-label={`Duplicate ${p.name}`} title="Duplicate" onClick={e => { e.stopPropagation(); onDuplicate(p) }}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5"/></svg>
                    </button>
                    <button className="icon-btn" onClick={e => confirmDelete(e, p)} title="Delete case" aria-label={`Delete ${p.name}`}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating && (
        <div className="modal-backdrop" onClick={close}>
          <form data-tour="project-form" className="modal" onClick={e => e.stopPropagation()} onSubmit={submit} onKeyDown={e => e.key === 'Escape' && close()}>
            <p className="mono-label">New case</p>
            <label htmlFor="company-name">What is the company called?</label>
            <input id="company-name" type="text" placeholder="e.g. Northwind Retail" value={name} onChange={e => setName(e.target.value)} autoFocus />
            <div className="modal-actions">
              <button className="primary" type="submit" disabled={!name.trim()}>Get started</button>
              <button className="ghost" type="button" onClick={close}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
