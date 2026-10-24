import React, { useState } from 'react'
import { confidence, unconfirmed, ARCHETYPES, INPUT_GROUPS, PAIRS, fmtDec, fmtMoneyFull } from '../valueModel.js'

// The inputs. Chris's mechanic, made visible: everything starts as an
// assumption and flips to a confirmed input once the customer says it on a
// call. Every figure is recomputed from these on each change.

const ACCESS_KEY = 'casebuilder.access'
const readCode = () => {
  try {
    return localStorage.getItem(ACCESS_KEY) || ''
  } catch {
    return ''
  }
}

export default function InputSheet({ fields, model, company, onChange, onToggle, onApply, onReset, onAdd, onRemove }) {
  const groups = INPUT_GROUPS.map(g => [g, fields.filter(f => f.group === g)]).filter(([, items]) => items.length)
  const custom = fields.filter(f => !INPUT_GROUPS.includes(f.group))
  if (custom.length) groups.push(['Custom', custom])
  const byKey = Object.fromEntries(fields.map(f => [f.key, f]))
  const pairBy = Object.fromEntries(PAIRS.map(p => [p.key, p]))

  const conf = confidence(fields)
  const archetype = byKey.archetype?.value
  const warnings = model.warnings

  const [suggesting, setSuggesting] = useState(false)
  const [suggestMsg, setSuggestMsg] = useState('')

  // The only place a model is involved: it proposes starting values for inputs
  // that are still assumptions. It never touches a figure.
  async function suggest() {
    const open = unconfirmed(fields).map(f => f.key)
    if (!open.length) return setSuggestMsg('Every input is confirmed, so there is nothing to suggest.')
    setSuggesting(true)
    setSuggestMsg('')
    try {
      const code = readCode()
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}) },
        body: JSON.stringify({ company, engineers: model.inputs.engineers, only: open })
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503) throw new Error('Suggestions are not set up here (no ANTHROPIC_API_KEY). Your current values are unchanged.')
      if (res.status === 401) throw new Error('Suggestions need the access code. Enter it on the People page first.')
      if (!res.ok) throw new Error(data.error || 'Suggestions are unavailable.')
      const values = data.values || {}
      const n = Object.keys(values).length
      if (!n) throw new Error('No usable suggestions came back. Your current values are unchanged.')
      onApply(values)
      setSuggestMsg(`Filled ${n} assumption${n === 1 ? '' : 's'}. Confirm each with the customer.`)
    } catch (err) {
      // offline or failing: nothing changes, and the case still works
      setSuggestMsg(
        err instanceof TypeError ? 'Could not reach the suggestion service. Your current values are unchanged.' : err.message
      )
    } finally {
      setSuggesting(false)
    }
  }

  function renderItem(f) {
    if (f.pair) {
      if (f.side !== 'today') return null
      const pair = pairBy[f.pair]
      return (
        <PairField
          key={pair.key}
          pair={pair}
          today={byKey[pair.today]}
          portal={byKey[pair.portal]}
          model={model}
          onChange={onChange}
          onToggle={onToggle}
        />
      )
    }
    const row = <Field key={f.key} field={f} onChange={onChange} onToggle={onToggle} onRemove={onRemove} />
    if (f.key === 'platformShare') {
      return (
        <React.Fragment key={f.key}>
          {row}
          <div className="derived" data-testid="platform-engineers">
            <span>Platform engineers (derived)</span>
            <strong>{fmtDec(model.figures.platformEngineers.value, 1)}</strong>
            <code>{model.figures.platformEngineers.equation}</code>
          </div>
        </React.Fragment>
      )
    }
    if (f.key === 'selfHostEngineers') {
      return (
        <React.Fragment key={f.key}>
          {row}
          {warnings
            .filter(w => w.inputs.includes('selfHostEngineers'))
            .map(w => (
              <p key={w.key} className="warn" role="alert">
                {w.message}
              </p>
            ))}
        </React.Fragment>
      )
    }
    return row
  }

  return (
    <div className="inputs-page">
      <div className="confidence">
        <div className="confidence-top">
          <span>Case confidence</span>
          <strong data-testid="confidence">{conf}%</strong>
        </div>
        <div className="bar">
          <div
            className="bar-fill"
            style={{ width: `${conf}%`, background: conf >= 70 ? '#9bf0de' : conf >= 40 ? '#ffba00' : '#e5399a' }}
          />
        </div>
        <p className="confidence-note">
          {conf >= 70
            ? 'Enough confirmed inputs to take this to an exec.'
            : 'Mostly assumptions. Confirm more on the next call before presenting upward.'}
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="warn-panel" role="alert" data-testid="warnings">
          {warnings.map(w => (
            <p key={w.key} className="warn">
              {w.message}
            </p>
          ))}
        </div>
      )}

      {model.invalidInputs.length > 0 && (
        <div className="warn-panel" role="alert">
          <p className="warn">
            {model.invalidInputs.map(i => `${byKey[i.key]?.label || i.key} (${i.problem})`).join(', ')}{' '}
            {model.invalidInputs.length === 1 ? 'was' : 'were'} not usable and counted as 0 or the nearest valid value.
          </p>
        </div>
      )}

      <div className="suggest-row">
        <button className="ghost" onClick={suggest} disabled={suggesting}>
          {suggesting ? 'Suggesting…' : 'Suggest starting values'}
        </button>
        <span className="help">
          Proposes values for unconfirmed inputs from the company and its engineer count. They stay assumptions until you
          confirm them.
        </span>
        {suggestMsg && <p className="help suggest-msg">{suggestMsg}</p>}
      </div>

      {archetype && ARCHETYPES[archetype] && (
        <div className="archetype-note">
          <strong>{archetype}</strong>
          <p>{ARCHETYPES[archetype].note}</p>
          <p className="alt">Their alternative: {ARCHETYPES[archetype].alternative}</p>
        </div>
      )}

      <div className="groups-grid">
        {groups.map(([group, items]) => (
          <section key={group} className="group">
            <h2>{group}</h2>
            {items.map(renderItem)}
          </section>
        ))}
      </div>

      <div className="inputs-actions">
        <AddInput onAdd={onAdd} />
        <button className="ghost" onClick={onReset} title="Reset inputs, stakeholders and deck to defaults">
          Reset project to defaults
        </button>
      </div>

      <p className="foot">
        Every figure is plain arithmetic in <code>src/model.js</code>. Nothing is generated: change an input and everything
        downstream recalculates.
      </p>
    </div>
  )
}

// Today and with-Portal side by side, with the live difference.
function PairField({ pair, today, portal, model, onChange, onToggle }) {
  const raw = model.inputs[pair.today] - model.inputs[pair.portal]
  const show = n => (pair.money ? fmtMoneyFull(n) : `${fmtDec(n, 2)}${pair.unit === '%' ? '%' : ''}`)
  const side = (f, label) => (
    <div className={`pair-side ${f.confirmed ? 'is-input' : 'is-assumption'}`}>
      <label htmlFor={f.key}>{label}</label>
      <input
        id={f.key}
        type="number"
        min="0"
        step={f.step || 1}
        value={f.value}
        onChange={e => onChange(f.key, e.target.value === '' ? 0 : Number(e.target.value))}
      />
      <button
        className={`pill ${f.confirmed ? 'pill-on' : ''}`}
        onClick={() => onToggle(f.key)}
        title={
          f.confirmed
            ? 'Confirmed by the customer. Click to mark as an assumption again.'
            : 'Still an assumption. Click when the customer confirms it.'
        }
      >
        {f.confirmed ? 'Input' : 'Assumption'}
      </button>
    </div>
  )
  return (
    <div className="pair" data-pair={pair.key}>
      <div className="pair-title">
        {pair.label} <span className="unit">({pair.unit})</span>
      </div>
      <div className="pair-grid">
        {side(today, 'today')}
        {side(portal, 'with Portal')}
      </div>
      <div className={`pair-diff ${raw < 0 ? 'is-bad' : ''}`} data-testid={`diff-${pair.key}`}>
        {raw < 0
          ? 'With Portal is higher than today, so this counts as 0 saved'
          : `${show(raw)} ${pair.saved}`}
      </div>
      {(today.help || portal.help) && <p className="help">{today.help || portal.help}</p>}
    </div>
  )
}

function Field({ field, onChange, onToggle, onRemove }) {
  const toggleable = (field.type === 'number' || field.type === 'percent') && !field.structural

  return (
    <div className={`field ${field.confirmed ? 'is-input' : 'is-assumption'}`}>
      <div className="field-row">
        <label htmlFor={field.key}>
          {field.label}
          {field.unit ? <span className="unit"> ({field.unit})</span> : null}
        </label>
        {field.custom && (
          <button className="icon-btn" onClick={() => onRemove(field.key)} title="Remove this input" aria-label={`Remove ${field.label}`}>
            ×
          </button>
        )}
        {toggleable && (
          <button
            className={`pill ${field.confirmed ? 'pill-on' : ''}`}
            onClick={() => onToggle(field.key)}
            title={
              field.confirmed
                ? 'Confirmed by the customer. Click to mark as an assumption again.'
                : 'Still an assumption. Click when the customer confirms it.'
            }
          >
            {field.confirmed ? 'Input' : 'Assumption'}
          </button>
        )}
      </div>

      {field.type === 'select' ? (
        <select id={field.key} value={field.value} onChange={e => onChange(field.key, e.target.value)}>
          {field.options.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === 'text' ? (
        <input id={field.key} type="text" value={field.value} onChange={e => onChange(field.key, e.target.value)} />
      ) : field.type === 'percent' ? (
        <div className="slider-row">
          <input
            id={field.key}
            type="range"
            min="0"
            max="100"
            value={field.value}
            onChange={e => onChange(field.key, Number(e.target.value))}
          />
          <span className="slider-val">{field.value}%</span>
        </div>
      ) : (
        <input
          id={field.key}
          type="number"
          min="0"
          step={field.step || 1}
          value={field.value}
          onChange={e => onChange(field.key, e.target.value === '' ? 0 : Number(e.target.value))}
        />
      )}

      {field.help && <p className="help">{field.help}</p>}
    </div>
  )
}

function AddInput({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [type, setType] = useState('number')
  const [unit, setUnit] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!label.trim()) return
    onAdd({
      label: label.trim(),
      type,
      unit: type === 'number' ? unit.trim() : '',
      value: type === 'text' ? '' : type === 'percent' ? 50 : 0,
      confirmed: false
    })
    setLabel('')
    setUnit('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="ghost add-btn" onClick={() => setOpen(true)}>
        + Add input
      </button>
    )
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <input type="text" placeholder="Input name" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="number">Number</option>
        <option value="percent">Percent</option>
        <option value="text">Text</option>
      </select>
      {type === 'number' && (
        <input type="text" placeholder="Unit (optional)" value={unit} onChange={e => setUnit(e.target.value)} />
      )}
      <div className="add-actions">
        <button className="primary" type="submit" disabled={!label.trim()}>
          Add
        </button>
        <button className="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
