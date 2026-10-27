import PageHead from './PageHead.jsx'
import React, { useState, useEffect } from 'react'
import { CONNECTORS, LIVE_TOOLKITS } from '../connectors.js'
import { apiHeaders } from '../apiAuth.js'
import { LOGOS } from '../connectionLogos.js'
import { uid } from '../uid.js'
import { extractText, ACCEPT } from '../fileText.js'
import { Select } from './ui.jsx'

// Connections: what the agent is ALLOWED to read. Each switch is a permission for the
// agent. Everything starts off, and a connection that is off is never read and never
// named as an origin. The agent can always search the public web on its own, so that
// is not a permission.

export default function Connections({ project, projects=[],selectedProjectId='',onSelectProject,connections, documents, onConnections, onDocuments, embedded = false }) {
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  async function refresh() {
    const res = await fetch('/api/connect', { headers: await apiHeaders(), cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not check connections.')
    setLive(data)
  }
  useEffect(() => {
    let active = true
    const load = () => { if (active) refresh().catch(e => active && setError(e.message)) }
    load()
    window.addEventListener('focus', load)
    const params = new URLSearchParams(window.location.search)
    if (params.has('connector_callback')) {
      if (params.get('status') === 'failed') setError('Sign-in was not completed. You can try Connect again.')
      for (const key of ['connector_callback', 'status', 'connected_account_id']) params.delete(key)
      window.history.replaceState(null, '', window.location.pathname + (params.size ? `?${params}` : '') + window.location.hash)
    }
    return () => { active = false; window.removeEventListener('focus', load) }
  }, [])
  async function changeLive(toolkit, action) {
    setBusy(toolkit); setError('')
    try {
      const res = await fetch('/api/connect', { method: 'POST', headers: await apiHeaders(), body: JSON.stringify({ toolkit, action }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Connection failed.')
      if (action === 'connect') window.location.assign(data.redirect_url)
      else await refresh()
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }
  const allowed = CONNECTORS.filter(c => connections[c.key]).length
  return (
    <div className={embedded ? 'connections-page connections-embedded' : 'connections-page'} data-testid="connections">
      {!embedded && <PageHead title="Connectors" />}
      <p className="sub">
        Connect an account to let the agent read it for your deals and scheduled skills. You can disconnect at any time.
        Public web search is also available. {allowed ? `${allowed} upload sources allowed.` : 'Upload sources are off until you allow them.'}
      </p>
      <p className="help conn-build-note">
        Live connections authorize account-wide server reads for the agent and scheduled skills. Upload permissions below apply to the selected project. Unconfigured services use upload or paste only.
      </p>
      {error && <p className="warn connector-error" role="alert">{error} <button className="ghost" onClick={() => refresh().then(() => setError('')).catch(e => setError(e.message))}>Retry</button></p>}
      {onSelectProject && <div className="connection-project-target"><label htmlFor="connection-project">Settings and material for</label><Select id="connection-project" aria-label="Connection project" value={project?.id || selectedProjectId} onChange={onSelectProject}
        options={[{ value: '', label: 'Default settings for new projects' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} /></div>}

      <div className="connector-list">
        {[...CONNECTORS].sort((a, b) => a.label.localeCompare(b.label)).map((c, i) => (
          <section key={c.key} className={`connector stagger-in ${connections[c.key] ? 'connector-on' : ''}`} style={{ '--stagger': `${Math.min(i * 30, 200)}ms` }} data-connector={c.key}>
            <div className="connector-head">
              {LOGOS[c.key] ? <img className="connector-logo" src={LOGOS[c.key]} alt="" width="36" height="36" /> : <span className="connector-logo" aria-hidden="true">▦</span>}
              <div className="connector-title">
                <strong>{c.label}</strong>
                <span className="connector-blurb">{c.blurb}</span>
              </div>
              <span className="connector-status">{connections[c.key] ? 'Uploads on' : 'Uploads off'}</span>
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
            {LIVE_TOOLKITS.includes(c.key) && <div className="connector-live">
              {!live ? <p className="help">{error ? 'Live status unavailable.' : 'Checking live connection…'}</p> : live.configured.includes(c.key) ? (() => {
                const on = live.connections.some(a => a.toolkit === c.key)
                return <>
                  <span className={`connector-live-state${on ? ' is-on' : ''}`}>{on ? 'Account connected' : 'Account not connected'}</span>
                  <button className={on ? 'ghost' : 'primary'} disabled={!!busy} onClick={() => changeLive(c.key, on ? 'disconnect' : 'connect')}>
                    {busy === c.key ? 'Working…' : on ? 'Disconnect' : 'Connect'}
                  </button>
                </>
              })() : <p className="help">Live connection not configured. Upload or paste only.</p>}
            </div>}
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
