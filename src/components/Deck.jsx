import React, { useState } from 'react'
import { uid } from '../projects.js'
import {
  allDrivers,
  totalBenefit,
  netValue,
  paybackMonths,
  roiMultiple,
  fiveYearValue,
  versusSelfHost,
  driverValue,
  unconfirmed,
  STAKEHOLDERS,
  fmtMoney,
  fmtMoneyFull,
  fmtNum
} from '../valueModel.js'

// The deck. Nothing here is written by hand per deal: every slide is a function
// of the inputs and the selected stakeholder. Change a number on the left and
// the whole thing moves.

const NO_ONE = {
  key: 'none',
  role: 'No stakeholder selected',
  tag: 'Add a stakeholder above',
  cares: 'Add the people this case has to convince',
  lead: [],
  headline: i => `${fmtMoney(totalBenefit(i))} of annual value`,
  objection: '-',
  counter: '-',
  needsToSee: []
}

// Stored stakeholders are plain data. Built-ins resolve to the model's
// definition; custom ones get a generic headline and lead drivers.
function resolve(s) {
  if (s.builtin) return STAKEHOLDERS.find(b => b.key === s.key)
  return {
    lead: ['productivity', 'tooling'],
    headline: i => `${fmtMoney(totalBenefit(i))} of annual value`,
    needsToSee: [],
    ...s
  }
}

export default function Deck({ inputs, fields, stakeholders, onStakeholders }) {
  const available = stakeholders.map(resolve).filter(Boolean)
  const [activeKey, setActiveKey] = useState(available[0]?.key)
  const active = available.find(s => s.key === activeKey) || available[0] || NO_ONE

  const drivers = allDrivers(inputs)
  const total = totalBenefit(inputs)
  const open = unconfirmed(fields)

  return (
    <main className="deck-wrap">
      <nav className="toolbar no-print">
        <div className="who">
          <span className="who-label">Stakeholders</span>
          <div className="who-tabs">
            {available.map(s => (
              <span
                key={s.key}
                className={`tab tab-group ${s.key === active.key ? 'tab-on' : ''}`}
              >
                <button className="tab-name" onClick={() => setActiveKey(s.key)}>
                  {s.role}
                </button>
                <button
                  className="tab-x"
                  title={`Remove ${s.role}`}
                  aria-label={`Remove ${s.role}`}
                  onClick={() =>
                    onStakeholders(list => list.filter(x => x.key !== s.key))
                  }
                >
                  ×
                </button>
              </span>
            ))}
            <AddStakeholder
              existing={stakeholders}
              onAdd={s => {
                onStakeholders(list => [...list, s])
                setActiveKey(s.key)
              }}
            />
          </div>
        </div>
        <button className="primary" onClick={() => window.print()}>
          Export PDF
        </button>
      </nav>

      <div className="deck">
        <TitleSlide inputs={inputs} active={active} />
        <HeadlineSlide inputs={inputs} active={active} total={total} />
        <DriversSlide drivers={drivers} total={total} active={active} />
        <SelfHostSlide inputs={inputs} />
        <StakeholderSlide active={active} />
        <AssumptionsSlide inputs={inputs} open={open} />
      </div>
    </main>
  )
}

function Slide({ children, label }) {
  return (
    <section className="slide">
      {label && <div className="slide-label">{label}</div>}
      {children}
    </section>
  )
}

function TitleSlide({ inputs, active }) {
  return (
    <Slide>
      <div className="title-slide">
        <p className="eyebrow">Business case</p>
        <h1>{inputs.companyName}</h1>
        <p className="lede">
          Spotify Portal for Backstage, costed against {inputs.companyName}'s own
          numbers.
        </p>
        <p className="for-whom">
          Prepared for {active.role} · {inputs.archetype}
        </p>
      </div>
    </Slide>
  )
}

function HeadlineSlide({ inputs, active, total }) {
  const net = netValue(inputs)
  const roi = roiMultiple(inputs)

  return (
    <Slide label="The number">
      <h2 className="headline">{active.headline(inputs)}</h2>
      <p className="headline-sub">{active.cares}</p>

      <div className="stats">
        <Stat label="Annual value" value={fmtMoney(total)} />
        <Stat label="Portal cost" value={fmtMoney(inputs.portalCost)} />
        <Stat label="Net, year one" value={fmtMoney(net)} tone={net > 0 ? 'good' : 'bad'} />
        <Stat label="Payback" value={`${paybackMonths(inputs)} mo`} />
        <Stat label="Return" value={`${roi.toFixed(1)}x`} />
        <Stat label="Five-year net" value={fmtMoney(fiveYearValue(inputs))} />
      </div>
    </Slide>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </div>
  )
}

function DriversSlide({ drivers, total, active }) {
  const max = Math.max(...drivers.map(d => d.value), 1)

  return (
    <Slide label="Where the value comes from">
      <h2>Five drivers, their numbers</h2>
      <p className="note">
        Ordered by size. The two {active.role} cares about most are marked.
      </p>

      <div className="chart">
        {drivers.map(d => {
          const lead = active.lead.includes(d.key)
          return (
            <div key={d.key} className={`bar-row ${lead ? 'bar-lead' : ''}`}>
              <div className="bar-label">
                {d.label}
                {lead && <span className="lead-dot" title="Leads for this stakeholder" />}
              </div>
              <div className="bar-track">
                <div
                  className="bar-bar"
                  style={{
                    width: `${(d.value / max) * 100}%`,
                    background: d.color,
                    opacity: lead ? 1 : 0.45
                  }}
                />
              </div>
              <div className="bar-value">{fmtMoney(d.value)}</div>
              <div className="bar-detail">{d.detail}</div>
            </div>
          )
        })}
      </div>

      <div className="total-row">
        <span>Total annual value</span>
        <strong>{fmtMoneyFull(total)}</strong>
      </div>
    </Slide>
  )
}

function SelfHostSlide({ inputs }) {
  const v = versusSelfHost(inputs)
  const maxVal = Math.max(v.selfHost, v.portal, 1)

  return (
    <Slide label="Against the alternative">
      <h2>Backstage is free. Running it is not.</h2>
      <p className="note">
        The comparison that decides most deals is Portal against self-hosting the
        open-source project, not Portal against doing nothing.
      </p>

      <div className="versus">
        <div className="versus-row">
          <span className="versus-name">Self-host open source</span>
          <div className="versus-track">
            <div
              className="versus-bar versus-bad"
              style={{ width: `${(v.selfHost / maxVal) * 100}%` }}
            />
          </div>
          <span className="versus-num">{fmtMoney(v.selfHost)}/yr</span>
        </div>
        <div className="versus-row">
          <span className="versus-name">Spotify Portal</span>
          <div className="versus-track">
            <div
              className="versus-bar versus-good"
              style={{ width: `${(v.portal / maxVal) * 100}%` }}
            />
          </div>
          <span className="versus-num">{fmtMoney(v.portal)}/yr</span>
        </div>
      </div>

      <p className="versus-note">
        {inputs.selfHostEngineers} platform engineers at{' '}
        {fmtMoney(inputs.selfHostSalary)} fully loaded, permanently, for upgrades,
        patches and infrastructure.{' '}
        {v.cheaper === 'portal' ? (
          <strong>
            Portal is {fmtMoney(Math.abs(v.delta))}/yr cheaper before any of the
            value above.
          </strong>
        ) : (
          <strong>
            On these figures self-hosting is cheaper. The case has to rest on the
            value drivers, not on cost avoidance.
          </strong>
        )}
      </p>
    </Slide>
  )
}

function StakeholderSlide({ active }) {
  return (
    <Slide label="This room">
      <h2>{active.role}</h2>
      <p className="tag">{active.tag}</p>

      <div className="two-col">
        <div>
          <h3>What they need to see</h3>
          <ul>
            {active.needsToSee.map(n => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>The objection</h3>
          <blockquote>{active.objection}</blockquote>
          <h3>The counter</h3>
          <p>{active.counter}</p>
        </div>
      </div>
    </Slide>
  )
}

function AssumptionsSlide({ inputs, open }) {
  return (
    <Slide label="Honesty slide">
      <h2>What is confirmed and what is not</h2>
      <p className="note">
        Finance will ask. Showing it first is stronger than being caught by it.
      </p>

      {open.length === 0 ? (
        <p className="all-good">
          Every material input is confirmed. This case is ready to go upward.
        </p>
      ) : (
        <>
          <p className="still-open">
            {open.length} input{open.length === 1 ? '' : 's'} still assumed:
          </p>
          <ul className="assumption-list">
            {open.map(f => (
              <li key={f.key}>
                <strong>{f.label}</strong>
                <span className="assumed-val">
                  assumed at {f.type === 'percent' ? `${f.value}%` : fmtNum(f.value)}
                </span>
              </li>
            ))}
          </ul>
          <p className="note">
            Each one is a question for the next call. Confirming them is what turns
            this from a pitch into a case.
          </p>
        </>
      )}
    </Slide>
  )
}

function AddStakeholder({ existing, onAdd }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const have = new Set(existing.map(s => s.key))
  const removed = STAKEHOLDERS.filter(s => !have.has(s.key))

  function addCustom(e) {
    e.preventDefault()
    const name = role.trim()
    if (!name) return
    onAdd({
      key: `custom_${uid()}`,
      role: name,
      tag: 'Custom stakeholder',
      cares: 'What they care about',
      objection: '-',
      counter: '-'
    })
    setRole('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="tab tab-add" onClick={() => setOpen(true)}>
        + Add
      </button>
    )
  }

  return (
    <form className="stake-add" onSubmit={addCustom}>
      {removed.map(s => (
        <button
          key={s.key}
          type="button"
          className="tab"
          onClick={() => {
            onAdd({ key: s.key, builtin: true })
            setOpen(false)
          }}
        >
          + {s.role}
        </button>
      ))}
      <input
        type="text"
        placeholder="Or a new role"
        value={role}
        onChange={e => setRole(e.target.value)}
        autoFocus
      />
      <button className="primary" type="submit" disabled={!role.trim()}>
        Add
      </button>
      <button className="ghost" type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  )
}
