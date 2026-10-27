// Settings: profile, password, and the account's own model API key.
// The key is written straight to Supabase Vault (set_model_key). Nobody can
// read it back, including this page: it only ever shows provider + last 4.
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase.js'
import ChangePassword from './ChangePassword.jsx'

import { MODEL_PROVIDERS as PROVIDERS, activeKey, providerById } from '../modelProviders.js'

export function useModelKeys(userId) {
  const [keys, setKeys] = useState(null) // null = loading
  const [error, setError] = useState('')
  const load = async () => {
    const { data, error } = await supabase.from('model_keys').select('provider, last4, updated_at, preferred').eq('owner_id', userId)
    if (error) { setError(error.message); setKeys([]) } else { setError(''); setKeys(data) }
  }
  useEffect(() => { load() }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps
  return { keys, error, reload: load }
}

export default function Settings({ account, name, onName, theme, onTheme, onClose, isAdminAccount = false, adminView = true, onAdminView, onRestartTour}) {
  const user = account.session.user
  const { keys, error: keysError, reload } = useModelKeys(user.id)
  const [pwOpen, setPwOpen] = useState(false)
  const [draftName, setDraftName] = useState(name || '')
  const [nameSaved, setNameSaved] = useState(false)
  useEffect(() => { setDraftName(name || '') }, [name])
  // Esc closes (unless the password dialog on top is open); lock page scroll.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !pwOpen) onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose, pwOpen])

  return createPortal(
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="overlay-card settings-card-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="overlay-head">
          <h2 id="settings-title">Settings</h2>
          <button className="overlay-x" type="button" onClick={onClose} aria-label="Close settings" title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="overlay-body">
          <section className="settings-section">
            <h3>Profile</h3>
            <form className="settings-row" onSubmit={e => { e.preventDefault(); onName(draftName.trim()); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000) }}>
              <label htmlFor="settings-name">Name</label>
              <div className="settings-inline">
                <input id="settings-name" type="text" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Your first name" />
                <button className="ghost" type="submit" disabled={!draftName.trim() || draftName.trim() === name}>{nameSaved ? 'Saved' : 'Save'}</button>
              </div>
            </form>
            <div className="settings-row">
              <span className="settings-label">Email</span>
              <span className="settings-value">{user.email}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Password</span>
              <button className="ghost" type="button" onClick={() => setPwOpen(true)}>Change password</button>
            </div>
          </section>

          <section className="settings-section">
            <h3>Appearance</h3>
            <div className="settings-row">
              <span className="settings-label">Theme</span>
              <div className="segmented" role="radiogroup" aria-label="Theme">
                {[['dark', 'Dark'], ['light', 'Light']].map(([id, label]) => (
                  <button key={id} type="button" role="radio" aria-checked={theme === id} className={theme === id ? 'seg-on' : ''} onClick={() => onTheme(id)}>{label}</button>
                ))}
              </div>
            </div>
          </section>

          {isAdminAccount && (
            <section className="settings-section">
              <h3>Admin</h3>
              <div className="settings-row">
                <span className="settings-label">View</span>
                <div className="segmented" role="radiogroup" aria-label="Admin view">
                  {[[true, 'Admin'], [false, 'Regular user']].map(([on, label]) => (
                    <button key={label} type="button" role="radio" aria-checked={adminView === on} className={adminView === on ? 'seg-on' : ''} onClick={() => onAdminView(on)}>{label}</button>
                  ))}
                </div>
              </div>
              <p className="settings-help">Regular user hides admin-only pages (like Waitlist) so you see what everyone else sees. Only you see this switch.</p>
              <div className="settings-row">
                <span className="settings-label">Tour</span>
                <button type="button" className="ghost" onClick={() => onRestartTour && onRestartTour()}>Restart tour</button>
              </div>
              <p className="settings-help">Shows the guided tour again from the first step, the way a new account sees it.</p>
            </section>
          )}

          <section className="settings-section" id="api-key">
            <h3>AI model keys</h3>
            <p className="settings-help">Your agent runs on your own API key, from any of these providers. Keys are stored encrypted and only used for your jobs. Nobody can read them back, including you, so keep your own copy.</p>
            {keysError && <p className="auth-error" role="alert">Could not load your key status: {keysError}</p>}
            <ActiveProvider keys={keys} onChange={reload} />
            {PROVIDERS.map(p => <KeyRow key={p.id} provider={p} saved={keys?.find(k => k.provider === p.id)} loading={keys === null} onChange={reload} />)}
          </section>

          <section className="settings-section">
            <h3>Session</h3>
            <div className="settings-row">
              <span className="settings-label">Signed in as {user.email}</span>
              <button className="ghost" type="button" onClick={account.signOut}>Sign out</button>
            </div>
          </section>
        </div>
      </div>
      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
    </div>,
    document.body
  )
}

function KeyRow({ provider, saved, loading, onChange }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.rpc('set_model_key', { p_provider: provider.id, p_key: value.trim() })
    setBusy(false)
    if (error) { setError(error.message.replace(/^.*?:\s*/, '') || 'Could not save the key.'); return }
    setValue(''); setEditing(false); onChange()
  }
  async function remove() {
    if (!window.confirm(`Remove your ${provider.short} key?`)) return
    setBusy(true); setError('')
    const { error } = await supabase.rpc('delete_model_key', { p_provider: provider.id })
    setBusy(false)
    if (error) setError(error.message); else onChange()
  }

  return (
    <div className="key-row">
      <div className="key-row-head">
        <span className="settings-label">{provider.name}</span>
        {loading ? <span className="key-status">Checking…</span>
          : saved ? <span className="key-status key-ok">Saved · ends in …{saved.last4}</span>
          : <span className="key-status key-missing">No key yet</span>}
      </div>
      {editing || (!saved && !loading) ? (
        <form className="settings-inline" onSubmit={save}>
          <input type="password" autoComplete="off" spellCheck={false} placeholder={`${provider.prefix}…`} value={value} onChange={e => setValue(e.target.value)} aria-label={`${provider.name} API key`} />
          <button className="primary" type="submit" disabled={busy || value.trim().length < 20}>{busy ? 'Saving…' : 'Save key'}</button>
          {saved && <button className="ghost" type="button" onClick={() => { setEditing(false); setValue(''); setError('') }}>Cancel</button>}
        </form>
      ) : saved && (
        <div className="settings-inline">
          <button className="ghost" type="button" onClick={() => setEditing(true)}>Replace key</button>
          <button className="ghost" type="button" onClick={remove} disabled={busy}>Remove</button>
        </div>
      )}
      {!saved && !loading && <p className="settings-help">Get one at {provider.where}. Usage is billed by {provider.short}, separately from any chat subscription.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  )
}

// Which saved key the agent uses. Only shown once there is a choice to make.
function ActiveProvider({ keys, onChange }) {
  const [error, setError] = useState('')
  if (!keys?.length) return <p className="settings-help key-none">No key saved yet. Add one below to turn the agent on.</p>
  const active = activeKey(keys)
  const name = providerById(active.provider)?.short || active.provider
  if (keys.length === 1) return <p className="settings-help key-active">The agent runs on your <strong>{name}</strong> key.</p>
  async function choose(id) {
    setError('')
    const { error } = await supabase.rpc('set_preferred_model_key', { p_provider: id })
    if (error) setError(error.message); else onChange()
  }
  return (
    <div className="settings-row key-active">
      <span className="settings-label">The agent uses</span>
      <div className="segmented" role="radiogroup" aria-label="Provider the agent uses">
        {PROVIDERS.filter(p => keys.some(k => k.provider === p.id)).map(p => (
          <button key={p.id} type="button" role="radio" aria-checked={active.provider === p.id} className={active.provider === p.id ? 'seg-on' : ''} onClick={() => choose(p.id)}>{p.short}</button>
        ))}
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  )
}
