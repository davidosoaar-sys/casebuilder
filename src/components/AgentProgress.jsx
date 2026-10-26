import React, { useEffect, useState } from 'react'

// A long agent task (brand discovery, finding people) shown as it runs: a
// shimmering placeholder in the shape of the result, and the steps the agent
// goes through, ticking forward on a timer. The steps are the real phases of
// the job, but the timing is an estimate: the last step waits for the result
// instead of finishing early, so it never claims to be done when it is not.
export function AgentProgress({ steps, every = 6000, label, children, compact = false }) {
  const [at, setAt] = useState(0)
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const t0 = Date.now()
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000)
      setSecs(s)
      setAt(Math.min(steps.length - 1, Math.floor((s * 1000) / every)))
    }, 500)
    return () => clearInterval(id)
  }, [steps.length, every])
  return (
    <div className={`agent-progress${compact ? ' is-compact' : ''}`} role="status" aria-live="polite" aria-label={label}>
      {children}
      <ol className="agent-progress-steps">
        {steps.map((s, i) => (
          <li key={s} className={i < at ? 'is-done' : i === at ? 'is-now' : 'is-next'} aria-current={i === at ? 'step' : undefined}>
            <span className="agent-progress-dot" aria-hidden="true">
              {i < at ? <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
            </span>
            <span className="agent-progress-text">{s}</span>
          </li>
        ))}
      </ol>
      <p className="agent-progress-time">{secs < 5 ? 'Starting…' : `${secs}s`}</p>
    </div>
  )
}

// Placeholder shapes for the brand preview and a person card.
export function BrandPlaceholder() {
  return (
    <div className="agent-ghost agent-ghost-brand" aria-hidden="true">
      <div className="agent-ghost-row"><span className="ghost-box ghost-icon" /><span className="ghost-box ghost-logo" /></div>
      <span className="ghost-box ghost-title" />
      <span className="ghost-box ghost-line" />
      <div className="agent-ghost-row">{[0, 1, 2, 3].map(i => <span key={i} className="ghost-box ghost-swatch" />)}</div>
    </div>
  )
}

export function PersonPlaceholder({ count = 2 }) {
  return (
    <div className="agent-ghost-people" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="agent-ghost agent-ghost-person">
          <span className="ghost-box ghost-avatar" />
          <div className="agent-ghost-col"><span className="ghost-box ghost-name" /><span className="ghost-box ghost-line" /></div>
        </div>
      ))}
    </div>
  )
}

export const BRAND_STEPS = ['Finding the official website', 'Reading the logo and icon', 'Picking out the colours', 'Matching the fonts', 'Checking it all against the source']
export const PEOPLE_STEPS = ['Searching the web for this role', 'Reading company pages and profiles', 'Checking each name against its source', 'Leaving out anything unconfirmed']
