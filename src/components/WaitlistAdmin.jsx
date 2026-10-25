// Waitlist admin: who joined, and an Invite button for each. Admins only:
// the page is only in the menu for admins, and the database refuses the
// list and the invite to anyone else (RLS + invite_from_waitlist).
//
// Approving marks an email as allowed; it does not send an email. When that
// person enters the email on the waitlist form they go straight to choosing a
// password. The team tells them itself (every outbound message is reviewed by
// a person first).
import React, { useEffect, useMemo, useState } from 'react'
import PageHead from './PageHead.jsx'
import { supabase } from '../supabase.js'

export async function isAdmin(userId) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
  return data?.role === 'admin'
}

const when = iso => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
const appUrl = () => (typeof window !== 'undefined' ? window.location.origin : '')
export const joinLink = ref => `${appUrl()}/?waitlist${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`

export default function WaitlistAdmin() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('waiting')
  const [copied, setCopied] = useState('')
  const [ref, setRef] = useState('')
  const [approveEmail, setApproveEmail] = useState('')
  const [approved, setApproved] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('waitlist').select('id, email, name, company, role, use_case, source, status, created_at, invited_at, joined_at').order('created_at', { ascending: false })
    if (error) { setError(error.message); setRows([]) } else setRows(data)
  }
  useEffect(() => { load() }, [])

  // Team and pre-waitlist accounts are not demand: keep them out of the headline.
  const TEAM = ['existing account', 'team-created']
  const counts = useMemo(() => {
    const c = { waiting: 0, invited: 0, joined: 0, signups: 0 }
    for (const r of rows || []) { c[r.status]++; if (!TEAM.includes(r.source) && r.name) c.signups++ } // name = they filled the form; an admin pre-approval alone is not a sign-up
    return c
  }, [rows]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = (rows || []).filter(r => filter === 'all' || r.status === filter)

  async function invite(r) {
    setError('')
    const { error } = await supabase.rpc('invite_from_waitlist', { p_id: r.id })
    if (error) { setError(error.message); return }
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, status: 'invited', invited_at: new Date().toISOString() } : x))
  }
  async function approve(e) {
    e.preventDefault()
    setError(''); setApproved('')
    const em = approveEmail.trim().toLowerCase()
    const { error } = await supabase.rpc('approve_email', { p_email: em })
    if (error) { setError(/valid email/.test(error.message) ? 'Enter a valid email.' : error.message); return }
    await load()
    setApproved(em); setApproveEmail('')
  }
  async function copy(text, key) {
    try { await navigator.clipboard.writeText(text) } catch {}
    setCopied(key); setTimeout(() => setCopied(c => c === key ? '' : c), 1500)
  }

  return (
    <section className="page wl-page" aria-label="Waitlist">
      <PageHead title="Waitlist" sub="People who asked for access. Approve the ones you want testing it.">
        <button type="button" className="ghost" onClick={load}>Refresh</button>
      </PageHead>

      <section className="wl-stats" aria-label="Totals">
        <div><strong>{rows ? counts.signups : '…'}</strong><span>filled in the waitlist form</span></div>
        <div><strong>{rows ? counts.waiting : '…'}</strong><span>waiting</span></div>
        <div><strong>{rows ? counts.invited : '…'}</strong><span>approved, no account yet</span></div>
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

      <section className="wl-share wl-approve">
        <h2>Let someone in</h2>
        <p>Approve an email. When that person fills in the waitlist form with it, they go straight to choosing a password. They don't need to be on the list yet.</p>
        <form className="wl-share-row" onSubmit={approve}>
          <input type="email" value={approveEmail} onChange={e => setApproveEmail(e.target.value)} placeholder="name@company.com" aria-label="Email to approve" className="wl-approve-input" />
          <button type="submit" className="primary" disabled={!approveEmail.trim()}>Approve</button>
        </form>
        {approved && <p className="wl-approved" role="status">{approved} is approved. Send them the waitlist link; they'll go straight through.</p>}
      </section>

      <div className="wl-filters" role="tablist" aria-label="Filter">
        {['waiting', 'invited', 'joined', 'all'].map(f => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
            {({ waiting: 'Waiting', invited: 'Approved', joined: 'Has account', all: 'All' })[f]}{f !== 'all' && rows ? ` ${counts[f]}` : ''}
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
                <span>{r.role || 'No role given'}</span>
                {r.name && <small>{r.email}</small>}
              </div>
              <div className="wl-meta">
                <span>Joined {when(r.created_at)}{r.source ? ` · via ${r.source}` : ''}</span>
                {r.status === 'waiting' && <button type="button" className="primary" onClick={() => invite(r)}>Approve</button>}
                {r.status === 'invited' && <>
                  <span className="wl-badge">Approved {when(r.invited_at)}</span>
                  <button type="button" className="ghost" onClick={() => copy(joinLink(''), r.id)}>{copied === r.id ? 'Copied' : 'Copy link to send'}</button>
                </>}
                {r.status === 'joined' && <span className="wl-badge is-joined">Has an account</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="wl-note">Approving does not send an email. Tell them yourself; when they enter their email on the waitlist form, they go straight through.</p>
    </section>
  )
}
