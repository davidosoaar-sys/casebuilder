// Dashboard: what a seller needs at a glance.
// 1. Pipeline numbers  2. What needs attention  3. Recent deals  4. Agent status.
// Everything is computed from the account's own deals with the same model the
// deck uses, so a number here always matches the deck.
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase.js'
import { computeModel } from '../model.js'
import { confidence, unconfirmed } from '../valueModel.js'
import { fmtMoney } from '../format.js'
import { useModelKeys } from './Settings.jsx'
import PageHead from './PageHead.jsx'

function dealStats(deal) {
  const inputs = Object.fromEntries(deal.fields.map(f => [f.key, f.value]))
  let value = null
  try {
    const m = computeModel(inputs)
    const v = m.figures.totalValue?.value
    if (Number.isFinite(v) && v > 0) value = v
  } catch {}
  return { deal, value, confidence: confidence(deal.fields), open: unconfirmed(deal.fields).length }
}

const ago = ms => {
  const s = Math.round((Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} d ago`
}

export default function Dashboard({ account, name, deals, loading, onOpen, onNav, onSettings, onCreate }) {
  const stats = useMemo(() => deals.map(dealStats), [deals])
  const { keys } = useModelKeys(account.session.user.id)
  const [jobs, setJobs] = useState(null)
  useEffect(() => {
    supabase.from('jobs').select('id, kind, status, created_at, finished_at, deal_id, last_error')
      .eq('owner_id', account.session.user.id).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setJobs(data || []))
  }, [account.session.user.id])

  const valued = stats.filter(s => s.value !== null)
  const pipeline = valued.reduce((sum, s) => sum + s.value, 0)
  const avgConf = stats.length ? Math.round(stats.reduce((a, s) => a + s.confidence, 0) / stats.length) : 0
  const attention = [...stats].filter(s => s.open > 0).sort((a, b) => a.confidence - b.confidence).slice(0, 4)
  const recent = [...stats].sort((a, b) => b.deal.updatedAt - a.deal.updatedAt).slice(0, 5)
  const hasKey = Boolean(keys?.length)
  const dealName = id => deals.find(d => d.id === id)?.name || 'a deal'

  return (
    <div className="page dashboard">
      <PageHead label="Dashboard" title={name ? `Hello, ${name}.` : 'Hello.'}>
        <button className="primary" onClick={onCreate}>New project</button>
      </PageHead>

      {keys && !hasKey && (
        <div className="dash-banner" role="status">
          <span>Your agent needs an API key before it can research or write. </span>
          <button className="link-btn" onClick={onSettings}>Add it in Settings →</button>
        </div>
      )}

      <section className="dash-stats" aria-label="Pipeline">
        <Stat label="Open deals" value={loading ? '…' : String(stats.length)} />
        <Stat label="Pipeline value" value={loading ? '…' : valued.length ? fmtMoney(pipeline) : '—'} note={!loading && valued.length < stats.length ? `${valued.length} of ${stats.length} deals have enough inputs to value` : 'yearly value across your deals'} />
        <Stat label="Avg. confirmed" value={loading ? '…' : `${avgConf}%`} note="inputs backed by a customer source" />
      </section>

      <div className="dash-grid">
        <section className="dash-card">
          <h2>Needs attention</h2>
          {loading ? <p className="empty">Loading…</p> : attention.length === 0 ? <p className="empty">Nothing waiting on you.</p> : (
            <ul className="dash-list">
              {attention.map(s => (
                <li key={s.deal.id}>
                  <button className="dash-row" onClick={() => onOpen(s.deal.id)}>
                    <strong>{s.deal.name}</strong>
                    <span>{s.open} input{s.open === 1 ? '' : 's'} to confirm · {s.confidence}% confirmed</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card">
          <h2>Recent deals</h2>
          {loading ? <p className="empty">Loading…</p> : recent.length === 0 ? <p className="empty">No deals yet.</p> : (
            <ul className="dash-list">
              {recent.map(s => (
                <li key={s.deal.id}>
                  <button className="dash-row" onClick={() => onOpen(s.deal.id)}>
                    <strong>{s.deal.name}</strong>
                    <span>{s.value !== null ? `${fmtMoney(s.value)}/yr · ` : ''}{ago(s.deal.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button className="link-btn dash-more" onClick={() => onNav('projects')}>All projects →</button>
        </section>

        <section className="dash-card">
          <h2>Agent</h2>
          <p className="dash-agent-status">
            <span className={`dot ${hasKey ? 'dot-ok' : 'dot-off'}`} aria-hidden="true" />
            {keys === null ? 'Checking…' : hasKey ? `Ready · key ends in …${keys[0].last4}` : 'Not set up'}
          </p>
          {jobs === null ? <p className="empty">Loading…</p> : jobs.length === 0 ? <p className="empty">No agent activity yet.</p> : (
            <ul className="dash-list">
              {jobs.map(j => (
                <li key={j.id} className="dash-job">
                  <strong>{j.kind === 'chat' ? 'Chat reply' : j.kind[0].toUpperCase() + j.kind.slice(1).replace(/_/g, ' ')}</strong>
                  <span>{j.deal_id ? `${dealName(j.deal_id)} · ` : ''}{j.status === 'done' ? 'done' : j.status === 'failed' ? 'failed' : j.status} · {ago(new Date(j.created_at).getTime())}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, note }) {
  return (
    <div className="dash-stat">
      <span className="mono-label">{label}</span>
      <strong>{value}</strong>
      {note && <span className="dash-note">{note}</span>}
    </div>
  )
}
