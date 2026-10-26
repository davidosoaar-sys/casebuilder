import ClaudeConnector from './ClaudeConnector.jsx'
import PageHead from './PageHead.jsx'
import React, { useState } from 'react'
import { CONNECTORS } from '../connectors.js'
import { LOGOS } from '../connectionLogos.js'
import { uid } from '../uid.js'
import { extractText, ACCEPT } from '../fileText.js'
import { Select } from './ui.jsx'

// Connections: what the agent is ALLOWED to read. Each switch is a permission for the
// agent. Everything starts off, and a connection that is off is never read and never
// named as an origin. The agent can always search the public web on its own, so that
// is not a permission.

export default function Connections({ project, projects=[],selectedProjectId='',onSelectProject,connections, documents, onConnections, onDocuments, embedded = false }) {
  const allowed = CONNECTORS.filter(c => connections[c.key]).length
  return (
    <div className={embedded ? 'connections-page connections-embedded' : 'connections-page'} data-testid="connections">
      {!embedded && <PageHead title="Connectors" />}
      <p className="sub">
        These are permissions for the agent. When you ask it to suggest values, it can only read the connections you switch on here.
        Everything is off until you allow it, and it can always search the public web on its own. {allowed ? `${allowed} allowed.` : 'None allowed yet.'}
      </p>
      <p className="help conn-build-note">
        Connect Claude to your saved projects below. Other connections take material you paste or upload.
      </p>
      {onSelectProject && <div className="connection-project-target"><label htmlFor="connection-project">Settings and material for</label><Select id="connection-project" aria-label="Connection project" value={project?.id || selectedProjectId} onChange={onSelectProject}
        options={[{ value: '', label: 'Default settings for new projects' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} /></div>}

      <div className="connector-list">
        <ClaudeConnector />
        {CONNECTORS.filter(c => c.key !== 'claude').sort((a, b) => a.label.localeCompare(b.label)).map((c, i) => (
          <section key={c.key} className={`connector stagger-in ${connections[c.key] ? 'connector-on' : ''}`} style={{ '--stagger': `${Math.min(i * 30, 200)}ms` }} data-connector={c.key}>
            <div className="connector-head">
              <img className="connector-logo" src={LOGOS[c.key]} alt="" width="36" height="36" />
              <div className="connector-title">
                <strong>{c.label}</strong>
                <span className="connector-blurb">{c.blurb}</span>
              </div>
              <span className="connector-status">{connections[c.key] ? 'Allowed' : 'Not allowed'}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={!!connections[c.key]}
                  onChange={e => onConnections(cs => ({ ...cs, [c.key]: e.target.checked }))}
                  aria-label={`Allow the agent to ${c.allows}`}
                />
                <span className="switch-track" aria-hidden="true" />
              </label>
            </div>
            <p className="connector-allow">{connections[c.key] ? `The agent may ${c.allows}.` : `The agent may not ${c.allows}.`}</p>

            {connections[c.key] &&
              (project ? (
                <Uploader
                  connector={c}
                  projectName={project.name}
                  docs={documents.filter(d => d.source === c.key)}
                  onDocuments={onDocuments}
                />
              ) : (
                <p className="help connector-body">Open a project to add {c.accepts} for it.</p>
              ))}
          </section>
        ))}
      </div>
    </div>
  )
}

function Uploader({ connector: c, projectName, docs, onDocuments }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const add = (n, t) => {
    if (!t.trim()) return setError('There is nothing to add.')
    setError('')
    onDocuments(list => [...list, { id: uid(), source: c.key, name: n.trim() || c.docLabel, text: t, addedAt: new Date().toISOString() }])
    setName('')
    setText('')
  }

  async function onFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      add(file.name, (await extractText(file)).text)
    } catch (err) {
      setError(err.message || 'That file could not be read.')
    }
    e.target.value = ''
  }

  return (
    <div className="connector-body">
      <p className="help">
        Add {c.accepts} for <strong>{projectName}</strong>. It stays in this project and is only read when you ask for suggestions.
      </p>
      <input type="text" placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} aria-label={`${c.label} document name`} />
      <textarea rows={4} placeholder="Paste here" value={text} onChange={e => setText(e.target.value)} aria-label={`${c.label} pasted text`} />
      <div className="connector-actions">
        <button className="ghost" onClick={() => add(name, text)}>
          Add pasted text
        </button>
        <label className="ghost file-btn">
          Upload a file
          <input type="file" accept={ACCEPT} hidden onChange={onFile} />
        </label>
      </div>
      {error && <p className="warn">{error}</p>}
      {docs.length > 0 && (
        <ul className="doc-list">
          {docs.map(d => (
            <li key={d.id}>
              <span>
                {d.name} <em>{d.text.length.toLocaleString()} characters</em>
              </span>
              <button className="icon-btn" onClick={() => onDocuments(list => list.filter(x => x.id !== d.id))} aria-label={`Remove ${d.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
