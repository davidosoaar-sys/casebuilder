// Waitlist admin: who joined, and an Invite button for each. Admins only:
// the page is only in the menu for admins, and the database refuses the
// list and the invite to anyone else (RLS + invite_from_waitlist).
//
// Inviting marks them invited; it does not send an email. Copy the invite
// link and send it from your own inbox (Amr's rule: every outbound message is
// reviewed by a person first).
import React, { useEffect, useMemo, useState } from 'react'
import PageHead from './PageHead.jsx'
import { supabase } from '../supabase.js'

export async function isAdmin(userId) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
  return data?.role === 'admin'
}

const when = iso => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
const appUrl = () => (typeof window !== 'undefined' ? window.location.origin : '')
export const inviteLink = email => `${appUrl()}/?invited&email=${encodeURIComponent(email)}`
export const joinLink = ref => `${appUrl()}/?waitlist${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`

export default function WaitlistAdmin() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('waiting')
  const [copied, setCopied] = useState('')
  const [ref, setRef] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('waitlist').select('id, email, name, company, role, use_case, source, status, created_at, invited_at, joined_at').order('created_at', { ascending: false })
    if (error) { setError(error.message); setRows([]) } else setRows(data)
  }
  useEffect(() => { load() }, [])

  // Team and pre-waitlist accounts are not demand: keep them out of the headline.
  const TEAM = ['existing account', 'team-created']
  const counts = useMemo(() => {
    const c = { waiting: 0, invited: 0, joined: 0, signups: 0 }
    for (const r of rows || []) { c[r.status]++; if (!TEAM.includes(r.source)) c.signups++ }
    return c
  }, [rows]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = (rows || []).filter(r => filter === 'all' || r.status === filter)

  async function invite(r) {
    setError('')
    const { error } = await supabase.rpc('invite_from_waitlist', { p_id: r.id })
    if (error) { setError(error.message); return }
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, status: 'invited', invited_at: new Date().toISOString() } : x))
  }
  async function copy(text, key) {
    try { await navigator.clipboard.writeText(text) } catch {}
    setCopied(key); setTimeout(() => setCopied(c => c === key ? '' : c), 1500)
  }

  return (
    <section className="page wl-page" aria-label="Waitlist">
      <PageHead title="Waitlist" sub="People who asked for access. Invite the ones you want testing it.">
        <button type="button" className="ghost" onClick={load}>Refresh</button>
      </PageHead>

      <section className="wl-stats" aria-label="Totals">
        <div><strong>{rows ? counts.signups : '…'}</strong><span>signed up via the waitlist</span></div>
        <div><strong>{rows ? counts.waiting : '…'}</strong><span>waiting</span></div>
        <div><strong>{rows ? counts.invited : '…'}</strong><span>invited, not signed up</span></div>
        <div><strong>{rows ? counts.joined : '…'}</strong><span>have an account</span></div>
      </section>

      <section className="wl-share">
        <h2>Share the waitlist</h2>
        <p>Send this link. Add a tag to see where people came from, e.g. <code>aleena-followup</code>.</p>
        <div className="wl-share-row">
          <input value={ref} onChange={e => setRef(e.target.value.replace(/[^a-z0-9-]/gi, '').slice(0, 40))} placeholder="tag (optional)" aria-label="Source tag" />
          <code className="wl-link">{joinLink(ref)}</code>
          <button type="button" className="primary" onClick={() => copy(joinLink(ref), 'join')}>{copied === 'join' ? 'Copied' : 'Copy link'}</button>
        </div>
      </section>

      <div className="wl-filters" role="tablist" aria-label="Filter">
        {['waiting', 'invited', 'joined', 'all'].map(f => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}{f !== 'all' && rows ? ` ${counts[f]}` : ''}
          </button>
        ))}
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {rows === null ? <p className="pf-empty">Loading…</p> : shown.length === 0 ? <p className="pf-empty">Nobody here yet.</p> : (
        <ul className="wl-list">
          {shown.map(r => (
            <li key={r.id} className="wl-row">
              <div className="wl-who">
                <strong>{r.name || r.email}</strong>
                <span>{[r.role, r.company].filter(Boolean).join(' · ') || (r.name ? r.email : '')}</span>
                {r.name && <small>{r.email}</small>}
                {r.use_case && <p className="wl-use">“{r.use_case}”</p>}
              </div>
              <div className="wl-meta">
                <span>Joined {when(r.created_at)}{r.source ? ` · via ${r.source}` : ''}</span>
                {r.status === 'waiting' && <button type="button" className="primary" onClick={() => invite(r)}>Invite</button>}
                {r.status === 'invited' && <>
                  <span className="wl-badge">Invited {when(r.invited_at)}</span>
                  <button type="button" className="ghost" onClick={() => copy(inviteLink(r.email), r.id)}>{copied === r.id ? 'Copied' : 'Copy invite link'}</button>
                </>}
                {r.status === 'joined' && <span className="wl-badge is-joined">Has an account</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="wl-note">Invite only marks them as allowed. Send the invite link yourself, so every message is one you've read.</p>
    </section>
  )
}
