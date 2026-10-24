import React, { useState } from 'react'
import { confidence } from '../valueModel.js'
import { safeAsset } from '../brand.js'
import { SPOTIFY_LOGO } from '../spotifyLogo.js'

// Landing page: start a new project (company name only), open or delete one.

export default function ProjectList({ user, onUser, projects, activeId, onCreate, onOpen, onDelete, onDuplicate }) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [who, setWho] = useState('')
  const [display, setDisplay] = useState(() => {
    try { return localStorage.getItem('casebuilder.project-view') === 'list' ? 'list' : 'cards' } catch { return 'cards' }
  })
  function changeDisplay(value) {
    setDisplay(value)
    try { localStorage.setItem('casebuilder.project-view', value) } catch {}
  }

  function close() {
    setCreating(false)
    setName('')
  }

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

  return (
    <div className="projects-page">
      <header className="projects-head">
        <p className="mono-label">Technology / Business case</p>
        {user ? (
          <>
            <h1>Hello, {user}.</h1>
            <p className="sub">
              Turn a customer's own numbers into an exec-ready business case for
              Spotify Portal.
            </p>
            <div className="head-actions">
              <button className="primary" onClick={() => setCreating(true)}>
                New project
              </button>
              <button className="link-btn" onClick={() => onUser('')}>
                Not {user}? Change name
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>Hello.</h1>
            <form
              className="hello-form"
              onSubmit={e => {
                e.preventDefault()
                if (who.trim()) onUser(who.trim())
              }}
            >
              <label htmlFor="user-name">What should we call you?</label>
              <div className="hello-row">
                <input
                  id="user-name"
                  type="text"
                  placeholder="Your first name"
                  value={who}
                  onChange={e => setWho(e.target.value)}
                  autoFocus
                />
                <button className="primary" type="submit" disabled={!who.trim()}>
                  Continue
                </button>
              </div>
            </form>
          </>
        )}
      </header>

      <section className="projects-body">
        <div className="project-list-heading"><p className="mono-label">Your projects · {projects.length}</p>
          <div className="project-view-switch" role="group" aria-label="Project view">
            <button className="ghost" aria-pressed={display === 'cards'} onClick={() => changeDisplay('cards')}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="2" y="2" width="4" height="4" rx=".5"/><rect x="10" y="2" width="4" height="4" rx=".5"/><rect x="2" y="10" width="4" height="4" rx=".5"/><rect x="10" y="10" width="4" height="4" rx=".5"/></svg>Cards</button>
            <button className="ghost" aria-pressed={display === 'list'} onClick={() => changeDisplay('list')}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 3h9M5 8h9M5 13h9M1 3h1M1 8h1M1 13h1"/></svg>List</button>
          </div>
        </div>
        {projects.length === 0 ? (
          <p className="empty">No projects yet. Start your first one.</p>
        ) : (
          <ul className={`project-grid ${display === 'list' ? 'project-list-view' : 'project-cards-view'}`} aria-label={display === 'list' ? 'Projects list' : 'Project cards'}>
            {[...projects].sort((a, b) => b.updatedAt - a.updatedAt).map(p => {
              const logo = safeAsset(p.projectLogo) || safeAsset(p.brand?.logo) || (/^spotify$/i.test(p.name) ? SPOTIFY_LOGO : '')
              return (
              <li key={p.id}>
                <div
                  className={`project-card ${p.id === activeId ? 'project-card-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(p.id)}
                  onKeyDown={e => e.target === e.currentTarget && e.key === 'Enter' && onOpen(p.id)}
                >
                  <div className="project-card-top">
                    <span className="project-meta">
                      Touched {new Date(p.updatedAt).toLocaleString()}
                    </span>
                    <button
                      className="icon-btn"
                      onClick={e => confirmDelete(e, p)}
                      title="Delete project"
                      aria-label={`Delete ${p.name}`}
                    >
                      ×
                    </button>
                  </div>
                  <div className="project-identity"><span className="project-company-logo">{logo ? <img src={logo} alt={`${p.name} logo`} /> : <span aria-hidden="true">{p.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}</span><strong>{p.name}</strong></div>
                  <div className="project-card-foot">
                    <span className="project-meta">{confidence(p.fields)}% confirmed</span>
                    <button className="link-btn" aria-label={`Duplicate ${p.name}`} onClick={e => { e.stopPropagation(); onDuplicate(p) }}>Duplicate</button>
                    <span className="go">Open →</span>
                  </div>
                </div>
              </li>
            )})}
          </ul>
        )}
      </section>

      {creating && (
        <div className="modal-backdrop" onClick={close}>
          <form
            className="modal"
            onClick={e => e.stopPropagation()}
            onSubmit={submit}
            onKeyDown={e => e.key === 'Escape' && close()}
          >
            <p className="mono-label">New project</p>
            <label htmlFor="company-name">What is the company called?</label>
            <input
              id="company-name"
              type="text"
              placeholder="e.g. Northwind Retail"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="primary" type="submit" disabled={!name.trim()}>
                Get started
              </button>
              <button className="ghost" type="button" onClick={close}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
