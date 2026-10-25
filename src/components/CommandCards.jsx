// Cards for the results of commands the agent ran (Find people, Suggest
// values, Person lookup, Find branding). Proposals only: each has its own
// Add / Use button, and nothing is written until the user picks.
import React from 'react'
import {ProfileAvatar,PublicProfileLinks} from './ProfileMedia.jsx'
import { COMMAND_LABEL, describeCommand } from '../agentRunner.js'
import { describeValue } from '../agentEdits.js'

const host = u => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const Sources = ({ urls = [] }) => urls.filter(Boolean).length ? (
  <span className="cmd-sources">{urls.filter(Boolean).slice(0, 3).map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer">{host(u)}</a>)}</span>
) : null

export default function CommandCards({ run, commands, project, onPick, messageId }) {
  const results = run?.results || []
  const picked = run?.picked || {}
  const pick = p => onPick(messageId, p)
  return (
    <div className="cmd-cards">
      {commands.map((cmd, i) => {
        const r = results[i]
        const pending = !r && run?.status !== 'done'
        return (
          <div key={i} className="cmd-card">
            <div className="cmd-head">
              <span className="cmd-tag">{COMMAND_LABEL[cmd.command] || cmd.command}</span>
              <span className="cmd-title">{describeCommand(cmd, project)}</span>
              {pending && <span className="cmd-spin" role="status" aria-label="Running" />}
            </div>
            {!r ? (pending ? <p className="cmd-note">{run ? 'Running…' : 'Starting…'}</p> : null)
              : r.error ? <p className="cmd-error">{r.error}</p>
              : r.kind === 'people' ? <PeopleResult r={r} picked={picked} pick={pick} i={i} />
              : r.kind === 'values' ? <ValuesResult r={r} picked={picked} pick={pick} i={i} />
              : r.kind === 'person' ? <PersonResult r={r} picked={picked} pick={pick} i={i} />
              : r.kind === 'brand' ? <BrandResult r={r} picked={picked} pick={pick} i={i} />
              : null}
          </div>
        )
      })}
    </div>
  )
}

function PeopleResult({ r, picked, pick, i }) {
  const any = r.groups.some(g => g.people.length)
  return (
    <div className="cmd-body">
      {r.groups.map(g => (
        <div key={g.roleKey} className="cmd-group">
          {r.groups.length > 1 && <p className="cmd-sub">{g.role}</p>}
          {g.error ? <p className="cmd-error">{g.error}</p>
            : g.people.length === 0 ? <p className="cmd-note">{g.note || 'No one could be confirmed from public sources.'}</p>
            : g.people.map(p => {
              const id = `${i}:person:${g.roleKey}:${p.name.toLowerCase()}`
              return (
                <div key={id} className="cmd-row">
                  <ProfileAvatar photo={p.photo} name={p.name}/><div className="cmd-main">
                    <strong>{p.name}</strong><span className="cmd-dim">{p.title}</span>
                    {p.bio && <p className="cmd-bio">{p.bio}</p>}
                    <PublicProfileLinks links={p.links?.filter(link=>link.url!==p.linkedin)}/>
                    <div className="cmd-meta">
                      {p.confidence && <span className={`cmd-conf cmd-${p.confidence}`}>{p.confidence}</span>}
                      {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                      {p.email && <span>{p.email}</span>}
                      <Sources urls={p.sources || p.source_urls} />
                    </div>
                  </div>
                  <PickButton done={picked[id]} label="Add to deal" doneLabel="Added" onClick={() => pick({ id, type: 'person', roleKey: g.roleKey, person: p })} />
                </div>
              )
            })}
        </div>
      ))}
      {any && <p className="cmd-foot">Check each person before you reach out. Added people appear under People on the input sheet.</p>}
    </div>
  )
}

function ValuesResult({ r, picked, pick, i }) {
  return (
    <div className="cmd-body">
      {r.note && <p className="cmd-note">{r.note}</p>}
      {r.suggestions.map(s => {
        const id = `${i}:value:${s.key}`
        return (
          <div key={id} className="cmd-row">
            <div className="cmd-main">
              <strong>{s.label}</strong><span className="cmd-val">{describeValue(s.value, s.unit)}</span>
              {s.quote && <p className="cmd-quote">“{s.quote}”</p>}
              <div className="cmd-meta">{s.origin && <span>{s.origin}</span>}{s.confidence && <span className={`cmd-conf cmd-${s.confidence}`}>{s.confidence}</span>}<Sources urls={[s.link]} /></div>
            </div>
            <PickButton done={picked[id]} label="Use" doneLabel="Used" onClick={() => pick({ id, type: 'value', key: s.key, suggestion: s, enabled: r.enabled })} />
          </div>
        )
      })}
      {r.gaps?.length > 0 && <p className="cmd-note">Nothing found for {r.gaps.map(g => g.label).join(', ')}.</p>}
      {r.agent === 'unavailable' && <p className="cmd-note">The research agent was unavailable, so only values worked out from your other inputs are shown.</p>}
    </div>
  )
}

function PersonResult({ r, picked, pick, i }) {
  const p = r.person
  if (!p) return <p className="cmd-note">The lookup returned nothing.</p>
  if (p.candidates?.length > 1) return (
    <div className="cmd-body">
      <p className="cmd-note">Several people match. Open Research, then Person, to choose the right one:</p>
      {p.candidates.slice(0, 4).map((c, k) => <p key={k} className="cmd-dim">{c.name?.value} · {c.title?.value} · {c.company?.value}</p>)}
    </div>
  )
  if (!p.name) return <p className="cmd-note">No one could be confirmed from the sources.</p>
  const id = `${i}:lookup:${p.name.value.toLowerCase()}`
  return (
    <div className="cmd-body">
      <div className="cmd-row">
        <ProfileAvatar photo={p.photo} name={p.name.value}/><div className="cmd-main">
          <strong>{p.name.value}</strong><span className="cmd-dim">{p.title?.value}{p.company?.value ? ` · ${p.company.value}` : ''}</span>
          {p.roleMatch?.role && <p className="cmd-bio">Likely the {p.roleMatch.role} ({p.roleMatch.confidence}, inferred from title)</p>}
          {p.likelyCares?.value && <p className="cmd-bio">Probably cares about: {p.likelyCares.value}</p>}
          <PublicProfileLinks links={p.links} email={p.email} linkedin={p.linkedin}/>
          <div className="cmd-meta"><Sources urls={[p.name.sourceUrl, p.title?.sourceUrl]} /></div>
        </div>
        <PickButton done={picked[id]} label="Add to deal" doneLabel="Added" disabled={!p.roleMatch} onClick={() => pick({ id, type: 'lookup', person: p })} />
      </div>
    </div>
  )
}

function BrandResult({ r, picked, pick, i }) {
  const b = r.brand || {}
  const id = `${i}:brand`
  const colours = [b.primary, b.background, b.surface, b.text, b.muted].filter(c => typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c)).filter((c, k, a) => a.indexOf(c) === k)
  return (
    <div className="cmd-body">
      <div className="cmd-row">
        <div className="cmd-main">
          {b.logo && <img className="cmd-logo" src={b.logo} alt="" />}
          <div className="cmd-swatches">{colours.map(c => <span key={c} style={{ background: c }} title={c} />)}</div>
          <p className="cmd-dim">{[b.headingFont, b.bodyFont].filter(Boolean).join(' / ') || 'No font names found'}</p>
          <div className="cmd-meta"><Sources urls={[...new Set([b.website, ...(b.sources || [])])]} /></div>
        </div>
        <PickButton done={picked[id]} label="Use branding" doneLabel="Applied" onClick={() => pick({ id, type: 'brand', brand: b })} />
      </div>
    </div>
  )
}

function PickButton({ done, label, doneLabel, onClick, disabled }) {
  return done
    ? <span className="cmd-done">✓ {doneLabel}</span>
    : <button type="button" className="ghost cmd-pick" onClick={onClick} disabled={disabled}>{label}</button>
}
