import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { LOGOS } from '../connectionLogos.js'

export default function ClaudeConnector() {
  const [tokens,setTokens] = useState([])
  const [url,setUrl] = useState('')
  const [busy,setBusy] = useState(true)
  const [error,setError] = useState('')
  const [copied,setCopied] = useState(false)
  async function refresh() {
    if (!supabase) throw Error('Sign in to connect Claude.')
    const {data,error} = await supabase.from('mcp_tokens').select('id,created_at,last_used_at').is('revoked_at',null)
    if (error) throw Error('Claude connector is unavailable. Its database migration must be installed first.')
    setTokens(data || [])
  }
  useEffect(() => { refresh().catch(e => setError(e.message)).finally(() => setBusy(false)) },[])
  async function run(fn) { setBusy(true); setError(''); try { await fn() } catch(e) { setError(e.message) } finally { setBusy(false) } }
  async function connect() {
    const {data:{user}} = await supabase.auth.getUser()
    if (!user) throw Error('Sign in to connect Claude.')
    const hex = bytes => Array.from(bytes,b => b.toString(16).padStart(2,'0')).join('')
    const token = hex(crypto.getRandomValues(new Uint8Array(32)))
    const token_hash = hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))))
    const {error} = await supabase.from('mcp_tokens').insert({owner_id:user.id,token_hash})
    if (error) throw Error('Could not create connector. Try again.')
    setUrl(`${window.location.origin}/api/mcp?k=${token}`); setCopied(false)
    await refresh()
  }
  async function revoke(id) {
    const {error} = await supabase.from('mcp_tokens').update({revoked_at:new Date().toISOString()}).eq('id',id)
    if (error) throw Error('Could not revoke connector. Try again.')
    setUrl(''); await refresh()
  }
  return <section className="connector" data-connector="claude">
    <div className="connector-head"><img className="connector-logo" src={LOGOS.claude} alt="" width="36" height="36"/><div className="connector-title"><strong>Claude</strong><span className="connector-blurb">Read your saved deals and apply reviewed inputs from Claude</span></div><span className="connector-status">{tokens.length ? 'Connected' : 'Not connected'}</span></div>
    <div className="connector-body">
      <p className="help">Connects Claude to all your saved projects in this account. Input changes and context notes require your approval in Claude. Reload an open project after Claude changes it.</p>
      <button className="ghost" disabled={busy || !supabase} onClick={() => run(connect)}>{busy ? 'Please wait…' : 'Connect to Claude'}</button>
      {url && <div><p className="help">Copy this private URL now. It is shown only here and grants access to your projects.</p><input type="text" aria-label="Claude connector URL" readOnly value={url}/><button className="ghost" onClick={() => run(async () => { await navigator.clipboard.writeText(url); setCopied(true) })}>{copied ? 'Copied' : 'Copy URL'}</button></div>}
      <ol><li>In Claude, open Settings → Connectors.</li><li>Choose Add custom connector.</li><li>Paste the copied URL and connect.</li></ol>
      {tokens.map(t => <div className="connector-actions" key={t.id}><span>Created {new Date(t.created_at).toLocaleString()}</span><button className="ghost" disabled={busy} onClick={() => run(() => revoke(t.id))}>Revoke</button></div>)}
      {error && <p className="warn" role="alert">{error}</p>}
    </div>
  </section>
}
