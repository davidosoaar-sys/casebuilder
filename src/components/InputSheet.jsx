import React, { useState } from 'react'
import InputInfo from './InputInfo.jsx'
import {
  confidence,
  unconfirmed,
  completeness,
  ARCHETYPES,
  INPUT_GROUPS,
  PAIRS,
  fmtDec,
  fmtMoneyFull
} from '../valueModel.js'
import { stateOf, isBlank, withValue, withState, withOrigin } from '../source.js'
import { suggestValues, applySuggestions, emptyKeys, fetchAgent } from '../suggest.js'
import { enabledLabels } from '../connectors.js'
import { editInput, restoreInput } from '../inputEditing.js'
import { Select } from './ui.jsx'

// The inputs: CHRIS'S VIEW. Every number shows where it came from, on the face of the
// field. None of this (states, origins, confidence, gaps) appears on the client deck.

const ACCESS_KEY = 'casebuilder.access'
const readCode = () => {
  try {
    return localStorage.getItem(ACCESS_KEY) || ''
  } catch {
    return ''
  }
}

const STATE_LABEL = { empty: 'Empty', input: 'Input', assumption: 'Assumption', suggestion: 'Suggestion' }
const when = iso => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function InputSheet({ fields, model, company, connectors, documents, onFields, onAdd, onRemove, onReset }) {
  const visible = fields.filter(f => !f.deleted)
  const groups = INPUT_GROUPS.map(g => [g, visible.filter(f => f.group === g)]).filter(([, items]) => items.length)
  const custom = visible.filter(f => !INPUT_GROUPS.includes(f.group))
  if (custom.length) groups.push(['Custom', custom])
  const byKey = Object.fromEntries(fields.map(f => [f.key, f]))
  const pairBy = Object.fromEntries(PAIRS.map(p => [p.key, p]))

  const conf = confidence(fields)
  const open = unconfirmed(fields)
  const done = completeness(model)
  const archetype = byKey.archetype?.value
  const warnings = model.warnings
  const on = enabledLabels(connectors)

  const [busy, setBusy] = useState('') // '' | 'all' | a field key
  const [msg, setMsg] = useState('')

  const change = (key, value) => onFields(fs => fs.map(f => (f.key === key ? withValue(f, value) : f)))
  const setState = (key, state) => onFields(fs => fs.map(f => (f.key === key ? withState(f, state) : f)))
  const setOrigin = (key, origin) => onFields(fs => fs.map(f => (f.key === key ? withOrigin(f, origin) : f)))

  // The suggestion engine proposes values for inputs. It never touches a figure: the
  // model does the arithmetic, and the agent is never between an input and a number.
  async function suggest(keys, scope) {
    if (!keys.length) return setMsg('Every field already has a value.')
    setBusy(scope)
    setMsg('')
    const labels = Object.fromEntries(fields.map(f => [f.key, `${f.label}${f.unit ? ` (${f.unit})` : ''}`]))
    try {
      const result = await suggestValues({
        company,
        fields,
        keys,
        connectors,
        documents,
        model,
        agent: payload => fetchAgent({ ...payload, labels }, { code: readCode() })
      })
      onFields(fs => applySuggestions(fs, result, { keys, now: new Date().toISOString() }))
      const n = Object.keys(result.suggestions).length
      const gaps = keys.length - n
      setMsg(
        n
          ? `Filled ${n} field${n === 1 ? '' : 's'}.${gaps ? ` ${gaps} had nothing to suggest, and each says why.` : ''}`
          : 'Nothing to suggest right now. Each empty field says why.'
      )
    } catch {
      setMsg('Suggestions could not run. Your values are unchanged.')
    } finally {
      setBusy('')
    }
  }

  const fieldProps = { onChange: change, onState: setState, onOrigin: setOrigin, onSuggest: k => suggest([k], k), onRemove, onEdit: (key, patch) => onFields(fs => editInput(fs, key, patch)), busy }

  function renderItem(f) {
    if (f.pair) {
      const pair = pairBy[f.pair]
      const today = byKey[pair.today], portal = byKey[pair.portal]
      if (today && portal && !today.deleted && !portal.deleted) {
        if (f.side !== 'today') return null
        return <PairField key={pair.key} pair={pair} today={today} portal={portal} model={model} {...fieldProps} />
      }
    }
    const row = <Field key={f.key} field={f} onRemove={onRemove} {...fieldProps} />
    if (f.key === 'platformShare') {
      return (
        <React.Fragment key={f.key}>
          {row}
          <div className="derived" data-testid="platform-engineers">
            <span>Platform engineers (derived)</span>
            <strong>{model.figures.platformEngineers.incomplete ? '—' : fmtDec(model.figures.platformEngineers.value, 1)}</strong>
            {!model.figures.platformEngineers.incomplete && <code>{model.figures.platformEngineers.equation}</code>}
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
      <header className="inputs-toolbar"><div><h2>Inputs</h2><p>Build the case with your numbers, or suggest values for empty fields.</p></div><button type="button" className="primary" onClick={() => suggest(emptyKeys(fields), 'all')} disabled={!!busy}>{busy ? 'Suggesting…' : 'Suggest values'}</button></header>
      {msg && <p className="suggest-msg" role="status">{msg}</p>}
      <div className="internal-note">Only you see this page. Nothing on it (sources, states, confidence) appears on the client deck.</div>

      <div className="inputs-status">
      <div className="confidence">
        <div className="confidence-top">
          <span>Case confidence</span>
          <strong data-testid="confidence">{conf}%</strong>
        </div>
        <div className="bar">
          <div className="bar-fill" style={{ width: `${conf}%`, background: conf >= 70 ? '#9bf0de' : conf >= 40 ? '#ffba00' : '#e5399a' }} />
        </div>
        <p className="confidence-note">
          Counts inputs only: what the customer stated or a public source shows. Assumptions and suggestions do not count.
        </p>
      </div>

      <div className="summary-panel" data-testid="summary">
        <p>
          <strong>{done.done}</strong> of <strong>{done.total}</strong> figures can be computed
          {done.total - done.done > 0 ? ` and are in the deck. ${done.total - done.done} still missing, so they are left out of the deck and the total.` : '.'}
        </p>
        {done.waiting.length > 0 && (
          <details className="input-waiting"><summary>Missing inputs for {done.waiting.length} figures</summary><ul className="waiting-list">
            {done.waiting.map(w => (
              <li key={w.key}>
                <strong>{w.label}</strong> is waiting on {w.missing.map(k => byKey[k]?.label || k).join(', ')}
              </li>
            ))}
          </ul></details>
        )}
        <p className="summary-sources">Connectors the agent may read: {on.length ? on.join(', ') : 'none (all are off)'}.</p>
        <details>
          <summary>Still unconfirmed ({open.length})</summary>
          <ul className="waiting-list">
            {open.map(f => (
              <li key={f.key}>
                {f.label}: <em>{STATE_LABEL[stateOf(f)].toLowerCase()}</em>
              </li>
            ))}
          </ul>
        </details>
      </div>

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



      {archetype && ARCHETYPES[archetype] && (
        <div className="archetype-note">
          <strong>{archetype}</strong>
          <p>{ARCHETYPES[archetype].note}</p>
          <p className="alt">Their alternative: {ARCHETYPES[archetype].alternative}</p>
        </div>
      )}

      <nav className="input-group-nav" aria-label="Input sections">{groups.map(([group, items], index) => <a key={group} href={`#inputs-group-${index}`}>{group}<span>{items.length}</span></a>)}</nav>
      <div className="groups-grid">
        {groups.map(([group, items]) => (
          <section key={group} className="group" id={`inputs-group-${groups.findIndex(([name]) => name === group)}`}>
            <h2>{group}</h2>
            <div className="input-group-fields">{items.map(renderItem)}</div>
          </section>
        ))}
      </div>

      <div className="inputs-actions">
        <AddInput onAdd={onAdd} />
        <button className="ghost" onClick={onReset} title="Reset inputs, stakeholders and deck to defaults">
          Reset project to defaults
        </button>
      </div>
      {fields.some(f => f.deleted) && <details className="removed-inputs"><summary>Removed inputs ({fields.filter(f => f.deleted).length})</summary>{fields.filter(f => f.deleted).map(f => <div key={f.key}><span>{f.label}</span><button className="ghost" onClick={() => onFields(fs => restoreInput(fs, f.key))}>Restore {f.label}</button></div>)}</details>}

      <p className="foot">
        Every figure is plain arithmetic in <code>src/model.js</code>. Nothing is generated: change an input and everything
        downstream recalculates.
      </p>
    </div>
  )
}

// The state, origin and gaps of one number, on the face of its field.
export function SourceLine({ field, onState, onOrigin, onSuggest, busy }) {
  const state = stateOf(field)
  const s = field.source || {}
  const notes = s.notes || []
  if (state === 'empty') {
    return (
      <div className="source source-empty" data-state="empty">
        <div className="source-row">
          <span className="state state-empty">Empty</span>

        </div>
        {notes.map(n => (
          <p key={n} className="source-note">
            {n}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className={`source source-${state}`} data-state={state}>
      <div className="source-row">
        {state === 'suggestion' ? <><span className="state state-suggestion">Suggestion</span><button type="button" className="link-btn" onClick={() => onState(field.key, 'input')}>Mark as input</button></> : <button type="button" className={`state state-toggle ${state === 'input' ? 'state-verified' : 'state-assumed'}`} aria-pressed={state === 'input'} aria-label={`${field.label}: ${STATE_LABEL[state]}. Click to mark as ${state === 'input' ? 'assumption' : 'input'}`} onClick={() => onState(field.key, state === 'input' ? 'assumption' : 'input')}>{STATE_LABEL[state]}</button>}
      </div>
        {state === 'suggestion' && <details className="source-details suggestion-source">
        <summary>Source notes</summary><div className="suggestion-source-body">
          {s.origin && <p className="source-origin" data-testid="origin">{s.origin}</p>}
          {s.quote && <blockquote>{s.quote}</blockquote>}
          {s.link && /^https?:\/\//i.test(s.link) && <a href={s.link} target="_blank" rel="noreferrer noopener">View source</a>}
          {s.pinnedAt && <p className="source-meta">Pinned {when(s.pinnedAt)}</p>}
          {notes.map(n => <p key={n} className="source-note">{n}</p>)}
          {!s.origin && !s.link && !s.quote && !notes.length && <p className="source-note">No source was supplied. Verify this suggestion before using it.</p>}
        </div></details>}
    </div>
  )
}

// Today and with-Portal side by side, with the live difference.
function PairField({ pair, today, portal, model, onChange, onEdit, onRemove, ...rest }) {
  const both = !isBlank(today.value) && !isBlank(portal.value)
  const raw = model.inputs[pair.today] - model.inputs[pair.portal]
  const show = n => (pair.money ? fmtMoneyFull(n) : `${fmtDec(n, 2)}${pair.unit === '%' ? '%' : ''}`)
  const side = (f, label) => (
    <div className={`pair-side is-${stateOf(f)}`}>
      <div className="input-label-with-info"><label htmlFor={f.key}>{label}</label><InputInfo field={f}/></div>
      <InputActions field={f} onEdit={onEdit} onRemove={onRemove} />
      <SourceLine field={f} {...rest} />
      <input
        id={f.key}
        type="number"
        min="0"
        step={f.step || 1}
        value={f.value}
        onChange={e => onChange(f.key, e.target.value === '' ? '' : Number(e.target.value))}
      />
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
      <div className={`pair-diff ${both && raw < 0 ? 'is-bad' : ''}`} data-testid={`diff-${pair.key}`}>
        {!both
          ? 'Enter both to see the saving'
          : raw < 0
            ? 'With Portal is higher than today, so this counts as 0 saved'
            : `${show(raw)} ${pair.saved}`}
      </div>
      {(today.help || portal.help) && <p className="help">{today.help || portal.help}</p>}
    </div>
  )
}

function Field({ field, onChange, onRemove, onEdit, ...rest }) {
  const number = (field.type === 'number' || field.type === 'percent') && !field.structural

  return (
    <div className={`field is-${number ? stateOf(field) : 'input'}`}>
      <div className="field-row">
        <label htmlFor={field.key}>
          {field.label}
          {field.unit ? <span className="unit"> ({field.unit})</span> : null}
        </label>
        <InputInfo field={field}/>
        <InputActions field={field} onEdit={onEdit} onRemove={onRemove} />
      </div>

      {number && <SourceLine field={field} {...rest} />}
      {field.type === 'select' ? (
        <Select id={field.key} aria-label={field.label} value={field.value} onChange={v => onChange(field.key, v)} options={field.options.map(o => ({ value: o, label: o }))} />
      ) : field.type === 'text' ? (
        <input id={field.key} type="text" value={field.value} onChange={e => onChange(field.key, e.target.value)} />
      ) : field.type === 'percent' ? (
        <div className="slider-row">
          <input
            id={field.key}
            type="range"
            min="0"
            max="100"
            value={isBlank(field.value) ? 0 : field.value}
            onChange={e => onChange(field.key, Number(e.target.value))}
          />
          <span className="slider-val">{isBlank(field.value) ? '—' : `${field.value}%`}</span>
        </div>
      ) : (
        <input
          id={field.key}
          type="number"
          min="0"
          step={field.step || 1}
          value={field.value}
          onChange={e => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
        />
      )}

      {field.help && <p className="help">{field.help}</p>}
    </div>
  )
}

function InputActions({ field, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  return <div className="input-field-actions">
    <button type="button" className="input-action" aria-label={`Edit ${field.label}`} onClick={() => { setDraft({ label: field.label, unit: field.unit || '', help: field.help || '' }); setEditing(true) }}>Edit</button>
    <button type="button" className="input-action input-action-delete" aria-label={`Delete ${field.label}`} onClick={() => onRemove(field.key)}>Delete</button>
    {editing && <div className="input-edit-panel" role="group" aria-label={`Edit input ${field.label}`}>
      <label>Input name<input aria-label="Input name" value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} /></label>
      <label>Unit<input aria-label="Input unit" value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))} /></label>
      <label>Description<textarea aria-label="Input description" value={draft.help} onChange={e => setDraft(d => ({ ...d, help: e.target.value }))} /></label>
      <button type="button" className="primary" disabled={!draft.label.trim()} onClick={() => { onEdit(field.key, draft); setEditing(false) }}>Apply changes</button>
      <button type="button" className="ghost" onClick={() => setEditing(false)}>Cancel</button>
    </div>}
  </div>
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
      value: type === 'text' ? '' : type === 'percent' ? 50 : 0
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
      <Select aria-label="Input type" value={type} onChange={setType} options={[{ value: 'number', label: 'Number' }, { value: 'percent', label: 'Percent' }, { value: 'text', label: 'Text' }]} />
      {type === 'number' && <input type="text" placeholder="Unit (optional)" value={unit} onChange={e => setUnit(e.target.value)} />}
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
