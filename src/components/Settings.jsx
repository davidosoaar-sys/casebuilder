// Settings: profile, password, and the account's own model API key.
// The key is written straight to Supabase Vault (set_model_key). Nobody can
// read it back, including this page: it only ever shows provider + last 4.
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import ChangePassword from './ChangePassword.jsx'

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', prefix: 'sk-ant-', where: 'platform.claude.com → API Keys' }
]

export function useModelKeys(userId) {
  const [keys, setKeys] = useState(null) // null = loading
  const [error, setError] = useState('')
  const load = async () => {
    const { data, error } = await supabase.from('model_keys').select('provider, last4, updated_at').eq('owner_id', userId)
    if (error) { setError(error.message); setKeys([]) } else { setError(''); setKeys(data) }
  }
  useEffect(() => { load() }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps
  return { keys, error, reload: load }
}

export default function Settings({ account, name, onName }) {
  const user = account.session.user
  const { keys, error: keysError, reload } = useModelKeys(user.id)
  const [pwOpen, setPwOpen] = useState(false)
  const [draftName, setDraftName] = useState(name || '')
  const [nameSaved, setNameSaved] = useState(false)
  useEffect(() => { setDraftName(name || '') }, [name])

  return (
    <div className="settings-page">
      <header className="page-head">
        <p className="mono-label">Settings</p>
        <h1>Your account</h1>
      </header>

      <section className="settings-card">
        <h2>Profile</h2>
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

      <section className="settings-card" id="api-key">
        <h2>AI model key</h2>
        <p className="settings-help">Your agent runs on your own API key. It is stored encrypted and is only used for your jobs. Nobody can read it back, including you, so keep your own copy.</p>
        {keysError && <p className="auth-error" role="alert">Could not load your key status: {keysError}</p>}
        {PROVIDERS.map(p => <KeyRow key={p.id} provider={p} saved={keys?.find(k => k.provider === p.id)} loading={keys === null} onChange={reload} />)}
      </section>

      <section className="settings-card">
        <h2>Session</h2>
        <div className="settings-row">
          <span className="settings-label">Signed in as {user.email}</span>
          <button className="ghost" type="button" onClick={account.signOut}>Sign out</button>
        </div>
      </section>

      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
    </div>
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
    if (!window.confirm(`Remove your ${provider.name} key? Your agent stops working until you add one again.`)) return
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
      {!saved && !loading && <p className="settings-help">Get one at {provider.where}. API usage is billed by the provider, separately from any Claude subscription.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  )
}
