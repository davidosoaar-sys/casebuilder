// "Used N tools": what the agent actually did for a reply or a research
// answer. The steps come from the worker, which reads them back from the
// agent's own session log after the run (worker.py session_trace), so this
// shows real searches, real page reads and the connectors that were read,
// never the model's own account of its work.
//
// Collapsed: stacked tool icons + "Used N tools". Open: a timeline, one row
// per step; each row opens to its input and output.
import React, { useState } from 'react'
import { LOGOS } from '../connectionLogos.js'

const host = u => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }

const glyph = {
  web_search: <><circle cx="7" cy="7" r="4.2" /><path d="M10.2 10.2l3.3 3.3" /></>,
  web_extract: <><path d="M4 1.8h5.2l2.8 2.8v9.6H4z" /><path d="M9 1.8v3h3M6 8h4M6 10.5h4" /></>,
  memory: <><path d="M3 3.5h10v9H3z" /><path d="M5.5 6.5h5M5.5 9h3" /></>,
  todo: <><path d="M3 4.5l1.3 1.3L6.6 3.5M3 9.5l1.3 1.3 2.3-2.3" /><path d="M8.5 5h4.5M8.5 10h4.5" /></>,
  tool: <><circle cx="8" cy="8" r="2.2" /><path d="M8 2v2M8 12v2M2 8h2M12 8h2" /></>
}

function StepIcon({ step, size = 30 }) {
  const logo = step.tool === 'connector' && LOGOS[step.connector]
  return (
    <span className={`trace-icon trace-${step.tool === 'connector' ? 'connector' : step.tool}`} style={{ width: size, height: size }} aria-hidden="true">
      {logo
        ? <img src={logo} alt="" />
        : <svg viewBox="0 0 16 16" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{glyph[step.tool] || glyph.tool}</svg>}
    </span>
  )
}

const Chevron = ({ open }) => (
  <svg className={`trace-chev${open ? ' is-open' : ''}`} viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 6.5L8 10l3.5-3.5" /></svg>
)

function Step({ step, last }) {
  const [open, setOpen] = useState(false)
  const input = step.input?.query ? { query: step.input.query } : step.input?.urls?.length ? { urls: step.input.urls } : null
  const hasDetail = !!(input || step.output || step.results?.length)
  return (
    <li className={`trace-step${last ? ' is-last' : ''}${step.ok === false ? ' is-failed' : ''}`}>
      <StepIcon step={step} />
      <div className="trace-step-body">
        <button type="button" className="trace-step-head" onClick={() => hasDetail && setOpen(o => !o)} aria-expanded={hasDetail ? open : undefined} disabled={!hasDetail}>
          <span className="trace-step-title">{step.title}</span>
          {hasDetail && <Chevron open={open} />}
        </button>
        <span className="trace-step-provider">{step.provider}{step.ok === false ? ' · failed' : ''}</span>
        {open && (
          <div className="trace-detail">
            {input && <><p className="trace-detail-label">Input</p><pre className="trace-input">{JSON.stringify(input, null, 2)}</pre></>}
            {(step.output || step.results?.length > 0) && <>
              <p className="trace-detail-label">Output</p>
              {step.output && <p className="trace-output">{step.output}</p>}
              {step.results?.length > 0 && (
                <ol className="trace-results">
                  {step.results.map((r, i) => (
                    <li key={i}><a href={r.url} target="_blank" rel="noreferrer noopener" title={r.url}><span>{r.title || host(r.url)}</span><small>{host(r.url)}</small></a></li>
                  ))}
                </ol>
              )}
            </>}
          </div>
        )}
      </div>
    </li>
  )
}

export default function ToolTrace({ steps, defaultOpen = false, running = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!Array.isArray(steps) || (!steps.length && !running)) return null
  // One icon per kind of tool, in the order first used (max 4).
  const kinds = []
  for (const s of steps) { const k = s.tool === 'connector' ? `c:${s.connector}` : s.tool; if (!kinds.some(x => x.k === k)) kinds.push({ k, s }) }
  const n = steps.length
  return (
    <div className={`tool-trace${open ? ' is-open' : ''}`}>
      <button type="button" className="trace-summary" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {kinds.length > 0 && <span className="trace-stack">{kinds.slice(0, 4).map(({ k, s }) => <StepIcon key={k} step={s} size={26} />)}</span>}
        <span className="trace-count">{running && !n ? 'Working…' : `Used ${n} ${n === 1 ? 'tool' : 'tools'}`}{running && n ? '…' : ''}</span>
        {n > 0 && <Chevron open={open} />}
      </button>
      {open && n > 0 && <ol className="trace-steps">{steps.map((s, i) => <Step key={i} step={s} last={i === n - 1} />)}</ol>}
    </div>
  )
}
