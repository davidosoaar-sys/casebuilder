import React, { useRef, useState } from 'react'
import { confidence } from '../valueModel.js'
import { checkCaseFile, caseFileToProject } from '../caseFile.js'

// Landing page: start a new project (company name only), open or delete one.

export default function ProjectList({ user, onUser, projects, activeId, onCreate, onOpen, onDelete, onImport }) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [who, setWho] = useState('')
  const [problem, setProblem] = useState(null) // { title, lines } when an import fails
  const fileRef = useRef(null)

  // Import a .case.json made by the CaseBuilder plugin or exported from the app.
  async function importFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      const { errors, warnings } = checkCaseFile(raw)
      if (errors.length) return setProblem({ title: `${file.name} can't be imported`, lines: errors })
      setProblem(null)
      onImport(caseFileToProject(raw))
      if (warnings.length) window.alert(['Imported, with notes:', ...warnings.map(w => `- ${w}`)].join('\n'))
    } catch (err) {
      setProblem({ title: `${file.name} is not a case file`, lines: [err.message] })
    }
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
              <button className="ghost" onClick={() => fileRef.current?.click()} title="Open a .case.json from the CaseBuilder plugin or another copy of the app">
                Import case file
              </button>
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importFile} />
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

      {problem && (
        <div className="projects-head import-problem" role="alert">
          <div className="notice">
            <strong>{problem.title}.</strong>
            <ul>
              {problem.lines.map(l => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <button className="ghost" onClick={() => setProblem(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <section className="projects-body">
        <p className="mono-label">Your projects · {projects.length}</p>
        {projects.length === 0 ? (
          <p className="empty">No projects yet. Start your first one.</p>
        ) : (
          <ul className="project-grid">
            {projects.map(p => (
              <li key={p.id}>
                <div
                  className={`project-card ${p.id === activeId ? 'project-card-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(p.id)}
                  onKeyDown={e => e.key === 'Enter' && onOpen(p.id)}
                >
                  <div className="project-card-top">
                    <span className="project-meta">
                      {new Date(p.updatedAt).toLocaleDateString()}
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
                  <strong>{p.name}</strong>
                  <div className="project-card-foot">
                    <span className="project-meta">{confidence(p.fields)}% confirmed</span>
                    <span className="go">Open →</span>
                  </div>
                </div>
              </li>
            ))}
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
