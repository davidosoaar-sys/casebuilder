import React from 'react'
import { confidence, ARCHETYPES } from '../valueModel.js'

// The input sheet. Chris's mechanic, made visible: everything starts as an
// assumption and flips to a confirmed input once the customer says it on a
// call. The deck on the right regenerates on every keystroke.

export default function InputSheet({ fields, onChange, onToggle, onReset }) {
  const groups = fields.reduce((acc, f) => {
    ;(acc[f.group] ||= []).push(f)
    return acc
  }, {})

  const conf = confidence(fields)
  const archetype = fields.find(f => f.key === 'archetype')?.value

  return (
    <aside className="sheet">
      <header className="sheet-head">
        <div>
          <h1>CaseBuilder</h1>
          <p className="sub">Inputs to exec deck, live</p>
        </div>
        <button className="ghost" onClick={onReset} title="Reset to defaults">
          Reset
        </button>
      </header>

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
              background: conf >= 70 ? '#1db954' : conf >= 40 ? '#f0a500' : '#e0533d'
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

      {Object.entries(groups).map(([group, items]) => (
        <section key={group} className="group">
          <h2>{group}</h2>
          {items.map(f => (
            <Field key={f.key} field={f} onChange={onChange} onToggle={onToggle} />
          ))}
        </section>
      ))}

      <p className="foot">
        Every figure feeds a formula in <code>src/valueModel.js</code>. Change the
        model there, not in the slides.
      </p>
    </aside>
  )
}

function Field({ field, onChange, onToggle }) {
  const toggleable = field.type === 'number' || field.type === 'percent'

  return (
    <div className={`field ${field.confirmed ? 'is-input' : 'is-assumption'}`}>
      <div className="field-row">
        <label htmlFor={field.key}>
          {field.label}
          {field.unit ? <span className="unit"> ({field.unit})</span> : null}
        </label>
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
