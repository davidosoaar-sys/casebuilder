// Dashboard: which deal needs me before my next meeting?
// Needs attention (least confirmed first, one next action each), then what
// changed since the last visit, then the other deals. Every figure comes from
// the same model the deck uses (src/dashboard.js), and value is a range.
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase.js'
import { safeAsset } from '../brand.js'
import { useModelKeys } from './Settings.jsx'
import { Skeleton, SkeletonText } from './ui.jsx'
import {
  READINESS, dealSummary, triage, coverageLine, fmtRange,
  readSeen, writeSeen, changesSince, ago, sinceLabel
} from '../dashboard.js'

const initials = name => (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
const stagger = i => ({ '--stagger': `${Math.min(i * 40, 200)}ms` })
const greeting = (h = new Date().getHours()) => h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
const today = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

// The hero: greeting, the one deal that needs you first, every deal that needs
// something as a pill with its next action, and three numbers on their own row.
function Hero({ name, loading, summaries, attention, feed, onOpen, onAct, onCreate }) {
  const first = attention[0]
  const valued = summaries.filter(s => s.range)
  const total = valued.length ? fmtRange({ low: valued.reduce((a, s) => a + s.range.low, 0), high: valued.reduce((a, s) => a + s.range.high, 0) }) : null
  const counts = summaries.reduce((a, s) => { a.c += s.readiness.counts.input; a.t += s.readiness.total; return a }, { c: 0, t: 0 })
  const confirmed = counts.t ? Math.round(counts.c / counts.t * 100) : 0
  return (
    <section className="dash-hero" aria-labelledby="dash-hello">
      <div className="dash-aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="dash-hero-inner">
        <div className="dash-hero-top"><p className="dash-date">{today()}</p><button data-tour="project" className="primary" onClick={onCreate}>New project</button></div>
        <h1 id="dash-hello" className="dash-hello">{name ? <>{greeting()},<br /><em>{name}</em>.</> : <>{greeting()}.</>}</h1>
        <p className="dash-lede">{loading ? <SkeletonText label="Loading" width="28ch" />
          : first ? <><strong>{first.deal.name}</strong> needs you before anything else today.</>
          : summaries.length ? 'Every case is confirmed, staffed and branded.' : 'Start your first case with New project.'}</p>
        {!loading && attention.length > 0 && (
          <ul className="dash-pills" aria-label="Next actions">
            {attention.map((s, i) => (
              <li key={s.deal.id} className="stagger-in" style={stagger(i)}>
                <button type="button" className={`dash-pill${i === 0 ? ' is-first' : ''}`} onClick={() => s.action ? onAct(s) : onOpen(s.deal.id)}>
                  <DealMark deal={s.deal} /><b>{s.deal.name}</b><span>{s.action?.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <dl className="dash-figures">
          <div><dt>Pipeline</dt><dd>{loading ? <SkeletonText width="9ch" /> : total ? `${total}` : 'Not valued yet'}</dd>
            {!loading && summaries.length > 0 && <dd className="dash-fig-note">{valued.length} of {summaries.length} {summaries.length === 1 ? 'deal' : 'deals'} valued</dd>}</div>
          <div><dt>Confirmed</dt><dd>{loading ? <SkeletonText width="4ch" /> : `${confirmed}%`}</dd><dd className="dash-fig-note">of inputs, all deals</dd></div>
          <div><dt>New since you looked</dt><dd>{loading ? <SkeletonText width="2ch" /> : feed.length}</dd><dd className="dash-fig-note">{feed.length === 1 ? 'change' : 'changes'}</dd></div>
        </dl>
      </div>
    </section>
  )
}

function DealMark({ deal }) {
  const logo = deal.brand?.hideLogo ? '' : safeAsset(deal.brand?.icon) || safeAsset(deal.brand?.logo) || safeAsset(deal.projectLogo)
  return <span className="dash-logo">{logo ? <img src={logo} alt="" /> : <span aria-hidden="true">{initials(deal.name)}</span>}</span>
}

export default function Dashboard({ account, name, deals, loading, onOpen, onSettings, onCreate, onReview, onFind, onRescan }) {
  const userId = account.session.user.id
  const { keys } = useModelKeys(userId)
  const hasKey = Boolean(keys?.length)
  const summaries = useMemo(() => deals.map(dealSummary), [deals])
  const { attention, rest } = useMemo(() => triage(summaries), [summaries])

  // "Last looked" is read once and only moved forward when you leave, so the
  // list does not empty itself while you read it.
  const [seen] = useState(() => readSeen(localStorage, userId))
  useEffect(() => () => writeSeen(localStorage, userId), [userId])
  const [files, setFiles] = useState([])
  const ids = deals.map(d => d.id).join(',')
  useEffect(() => {
    if (!ids) return
    let live = true
    supabase.from('project_files').select('deal_id, name, created_at').in('deal_id', ids.split(','))
      .gt('created_at', new Date(seen).toISOString()).order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (live) setFiles(data || []) })
    return () => { live = false }
  }, [ids, seen])
  const feed = useMemo(() => changesSince(deals, seen, files), [deals, seen, files])

  const act = s => {
    const a = s.action
    if (a.kind === 'find') onFind(s.deal.id, a.prompt)
    else if (a.kind === 'rescan') onRescan(s.deal.id)
    else onReview(s.deal.id)
  }

  return (
    <div className="page dashboard">
      <Hero name={name} loading={loading} summaries={summaries} attention={attention} feed={feed} onOpen={onOpen} onAct={act} onCreate={onCreate} />

      {keys && !hasKey && (
        <div className="dash-banner" role="status">
          <span>Your agent needs an API key before it can research or write.</span>
          <button className="link-btn" onClick={onSettings}>Add it in Settings</button>
        </div>
      )}

      <section className="dash-section" aria-labelledby="dash-attention">
        <div className="dash-section-head">
          <h2 id="dash-attention">Needs attention</h2>
          {!loading && attention.length > 0 && <span className="dash-hint">Least confirmed first</span>}
          <Legend />
        </div>
        {loading ? <Skeleton label="Loading deals" rows={3} height={64} listClass="dash-list dash-skeleton" /> : attention.length === 0 ? (
          <p className="dash-empty">{deals.length ? 'Nothing needs you right now. Every case is confirmed, staffed and branded.' : 'No deals yet. Start one with New project.'}</p>
        ) : (
          <ul className="dash-rows" aria-label="Deals that need attention">
            {attention.map((s, i) => <DealRow key={s.deal.id} s={s} i={i} onOpen={onOpen} onAct={act} />)}
          </ul>
        )}
      </section>

      <section className="dash-section" aria-labelledby="dash-since">
        <div className="dash-section-head"><h2 id="dash-since">Since you last looked</h2></div>
        {loading ? <Skeleton label="Loading changes" rows={2} height={40} listClass="dash-list dash-skeleton" /> : feed.length === 0 ? (
          <p className="dash-empty">Nothing new since {sinceLabel(seen)}.</p>
        ) : (
          <ul className="dash-feed">
            {feed.map((it, i) => (
              <li key={`${it.dealId}-${it.kind}`} className="stagger-in" style={stagger(i)}>
                <span className={`dash-feed-dot feed-${it.kind}`} aria-hidden="true" />
                <button type="button" className="dash-feed-deal" onClick={() => onOpen(it.dealId)}>{it.dealName}</button>
                <span className="dash-feed-text">{it.text}</span>
                <time className="dash-feed-time" dateTime={new Date(it.at).toISOString()}>{ago(it.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loading && rest.length > 0 && (
        <section className="dash-section" aria-labelledby="dash-rest">
          <div className="dash-section-head"><h2 id="dash-rest">Other deals</h2></div>
          <ul className="dash-rows dash-rows-compact" aria-label="Other deals">
            {rest.map((s, i) => <DealRow key={s.deal.id} s={s} i={i} onOpen={onOpen} compact />)}
          </ul>
        </section>
      )}
    </div>
  )
}

function DealRow({ s, i, onOpen, onAct, compact = false }) {
  const { deal, readiness: r, coverage: c, range, action } = s
  const scanning = deal.brand?.status === 'scanning'
  const open = () => onOpen(deal.id)
  return (
    <li className="dash-deal stagger-in" style={stagger(i)} onClick={open} data-deal={deal.id} data-confirmed={r.confirmedShare.toFixed(4)}>
      <DealMark deal={deal} />
      <span className="dash-deal-name">
        <button type="button" className="dash-deal-open" onClick={e => { e.stopPropagation(); open() }}>{deal.name}</button>
        <span className="dash-people">{coverageLine(c)}</span>
      </span>
      <ReadinessBar r={r} delay={Math.min(i * 40, 200)} />
      <span className={`dash-value${range ? '' : ' dash-value-none'}`}>{range ? fmtRange(range) : 'Not enough inputs to value yet'}</span>
      {!compact && (
        <span className="dash-action">
          {action && (
            <button type="button" className="ghost dash-action-btn" data-kind={action.kind} disabled={action.kind === 'rescan' && scanning}
              onClick={e => { e.stopPropagation(); onAct(s) }}>
              {action.kind === 'rescan' && scanning ? 'Finding branding' : action.label}
            </button>
          )}
        </span>
      )}
    </li>
  )
}

function ReadinessBar({ r, delay }) {
  const pct = Math.round(r.confirmedShare * 100)
  const summary = READINESS.map(x => `${r.counts[x.state]} ${x.label.toLowerCase()}`).join(', ')
  return (
    <span className="dash-ready" tabIndex={0} aria-label={`${pct}% confirmed: ${summary}, of ${r.total} inputs`}>
      <span className="dash-bar" style={{ '--bar-delay': `${delay}ms` }} aria-hidden="true">
        {r.segments.filter(x => x.share > 0).map(x => (
          <span key={x.state} className={`dash-seg seg-${x.state}`} data-state={x.state} data-count={x.count} style={{ width: `${x.share}%` }} />
        ))}
      </span>
      <span className="dash-ready-pct" aria-hidden="true">{pct}% confirmed</span>
      <span className="dash-ready-tip" role="tooltip">
        {READINESS.map(x => (
          <span key={x.state}><i className={`seg-${x.state}`} />{x.label}<b>{r.counts[x.state]}</b></span>
        ))}
      </span>
    </span>
  )
}

function Legend() {
  return (
    <span className="dash-legend" aria-hidden="true">
      {READINESS.map(x => <span key={x.state}><i className={`seg-${x.state}`} />{x.label}</span>)}
    </span>
  )
}
