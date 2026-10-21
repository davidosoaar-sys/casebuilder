import React, { useState } from 'react'
import { confidence } from '../valueModel.js'

// Landing page: create, open and delete projects.

export default function ProjectList({ projects, onCreate, onOpen, onDelete }) {
  const [name, setName] = useState('')

  function submit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setName('')
  }

  function confirmDelete(e, p) {
    e.stopPropagation()
    if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) onDelete(p.id)
  }

  return (
    <div className="projects-page">
      <header className="projects-head">
        <h1>CaseBuilder</h1>
        <p className="sub">Pick a project, or start a new one.</p>
      </header>

      <form className="project-new" onSubmit={submit}>
        <input
          type="text"
          placeholder="New project name, e.g. Northwind Retail"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label="New project name"
        />
        <button className="primary" type="submit" disabled={!name.trim()}>
          Add project
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="empty">No projects yet. Add your first one above.</p>
      ) : (
        <ul className="project-grid">
          {projects.map(p => (
            <li key={p.id}>
              <div
                className="project-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpen(p.id)}
                onKeyDown={e => e.key === 'Enter' && onOpen(p.id)}
              >
                <div className="project-card-top">
                  <strong>{p.name}</strong>
                  <button
                    className="icon-btn"
                    onClick={e => confirmDelete(e, p)}
                    title="Delete project"
                    aria-label={`Delete ${p.name}`}
                  >
                    ×
                  </button>
                </div>
                <span className="project-meta">
                  {confidence(p.fields)}% confirmed ·{' '}
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
