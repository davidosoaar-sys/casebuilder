import React, { useState } from 'react'
import { confidence, ARCHETYPES } from '../valueModel.js'

// The inputs. Chris's mechanic, made visible: everything starts as an
// assumption and flips to a confirmed input once the customer says it on a
// call. The deck regenerates from these on every change.

export default function InputSheet({
  fields,
  onChange,
  onToggle,
  onReset,
  onAdd,
  onRemove
}) {
  const groups = fields.reduce((acc, f) => {
    ;(acc[f.group] ||= []).push(f)
    return acc
  }, {})

  const conf = confidence(fields)
  const archetype = fields.find(f => f.key === 'archetype')?.value

  return (
    <div className="inputs-page">

      <div className="confidence">
        <div className="confidence-top">
          <span>Case confidence</span>
          <strong>{conf}%</strong>
        </div>
        <div className="bar">
          <div
            className="bar-fill"
            style={{
              width: `${conf}%`,
              background: conf >= 70 ? '#36baa2' : conf >= 40 ? '#ffba00' : '#f0686d'
            }}
          />
        </div>
        <p className="confidence-note">
          {conf >= 70
            ? 'Enough confirmed inputs to take this to an exec.'
            : 'Mostly assumptions. Confirm more on the next call before presenting upward.'}
        </p>
      </div>

      {archetype && ARCHETYPES[archetype] && (
        <div className="archetype-note">
          <strong>{archetype}</strong>
          <p>{ARCHETYPES[archetype].note}</p>
          <p className="alt">
            Their alternative: {ARCHETYPES[archetype].alternative}
          </p>
        </div>
      )}

      <div className="groups-grid">
        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className="group">
            <h2>{group}</h2>
            {items.map(f => (
              <Field
                key={f.key}
                field={f}
                onChange={onChange}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
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
        Every figure feeds a formula in <code>src/valueModel.js</code>. Change the
        model there, not in the slides.
      </p>
    </div>
  )
}

function Field({ field, onChange, onToggle, onRemove }) {
  const toggleable = field.type === 'number' || field.type === 'percent'

  return (
    <div className={`field ${field.confirmed ? 'is-input' : 'is-assumption'}`}>
      <div className="field-row">
        <label htmlFor={field.key}>
          {field.label}
          {field.unit ? <span className="unit"> ({field.unit})</span> : null}
        </label>
        {field.custom && (
          <button
            className="icon-btn"
            onClick={() => onRemove(field.key)}
            title="Remove this input"
            aria-label={`Remove ${field.label}`}
          >
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
        <select
          id={field.key}
          value={field.value}
          onChange={e => onChange(field.key, e.target.value)}
        >
          {field.options.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === 'text' ? (
        <input
          id={field.key}
          type="text"
          value={field.value}
          onChange={e => onChange(field.key, e.target.value)}
        />
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
          step={field.step || 1}
          value={field.value}
          onChange={e => onChange(field.key, Number(e.target.value))}
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
      <input
        type="text"
        placeholder="Input name"
        value={label}
        onChange={e => setLabel(e.target.value)}
        autoFocus
      />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="number">Number</option>
        <option value="percent">Percent</option>
        <option value="text">Text</option>
      </select>
      {type === 'number' && (
        <input
          type="text"
          placeholder="Unit (optional)"
          value={unit}
          onChange={e => setUnit(e.target.value)}
        />
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
