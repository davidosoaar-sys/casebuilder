import React, { useMemo, useRef, useState } from 'react'
import { resolve, AddStakeholder } from './Deck.jsx'
import Logo from './Logo.jsx'
import { defaultPositions, GUIDE_RINGS } from '../deck/mapLayout.js'

// A map of who has to say yes. The company sits in the middle, stakeholders
// around it. Drag them anywhere, add and remove as needed; "Tidy up" puts
// everyone back in the default arrangement. Positions are stored on the
// stakeholder as percentages of the map.

export default function StakeholderMap({
  company,
  stakeholders,
  people = {},
  onChange,
  onContinue,
  continueLabel = 'Continue',
  showStep = true,
  embedded = false
}) {
  const mapRef = useRef(null)
  const [dragKey, setDragKey] = useState(null)

  const items = stakeholders
    .map(s => {
      const r = resolve(s)
      return r && { ...r, pos: s.pos }
    })
    .filter(Boolean)
  const n = items.length
  // Default spots for everyone; a stakeholder you've dragged keeps its own.
  const defaults = useMemo(() => defaultPositions(n), [n])
  const where = (s, i) => s.pos || defaults[i]
  const moved = items.some(s => s.pos)

  function startDrag(e, key) {
    if (e.target.closest('.map-x')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragKey(key)
  }

  function drag(e, key) {
    if (dragKey !== key) return
    const box = mapRef.current.getBoundingClientRect()
    const x = clamp(((e.clientX - box.left) / box.width) * 100, 10, 90)
    const y = clamp(((e.clientY - box.top) / box.height) * 100, 8, 92)
    onChange(list => list.map(s => (s.key === key ? { ...s, pos: { x, y } } : s)))
  }

  const tidy = () =>
    onChange(list =>
      list.map(s => {
        const { pos, ...rest } = s
        return rest
      })
    )

  return (
    <div className={embedded ? 'map-embedded' : 'map-page'}>
      {embedded ? (
        <p className="sub embedded-sub">
          Drag people to arrange the map, add anyone this case has to convince, and remove anyone
          who doesn't belong.
        </p>
      ) : (
        <>
          <div className="topbar topbar-flush">
            <Logo height={26} />
          </div>
          <p className="mono-label">{showStep ? 'Step 2 of 3 · ' : ''}Stakeholder map</p>
          <h1>Who has to say yes at {company}?</h1>
          <p className="sub">
            Drag people to arrange the map, add anyone this case has to convince, and remove anyone
            who doesn't belong. You can change this any time from the project's Details.
          </p>
        </>
      )}

      <div className="map" ref={mapRef}>
        <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {GUIDE_RINGS.map(([rx, ry]) => (
            <ellipse key={rx} className="map-ring" cx="50" cy="50" rx={rx} ry={ry} vectorEffect="non-scaling-stroke" />
          ))}
          {items.map((s, i) => {
            const { x, y } = where(s, i)
            return <line key={s.key} x1="50" y1="50" x2={x} y2={y} vectorEffect="non-scaling-stroke" />
          })}
        </svg>

        <div className="map-center" style={{ left: '50%', top: '50%' }}>
          <span>{company}</span>
        </div>

        {items.map((s, i) => {
          const { x, y } = where(s, i)
          const found = (people[s.key] || []).length
          return (
            <div
              className={`map-node ${dragKey === s.key ? 'dragging' : ''}`}
              key={s.key}
              style={{ left: `${x}%`, top: `${y}%` }}
              onPointerDown={e => startDrag(e, s.key)}
              onPointerMove={e => drag(e, s.key)}
              onPointerUp={() => setDragKey(null)}
              onPointerCancel={() => setDragKey(null)}
            >
              <button
                className="map-x"
                title={`Remove ${s.role}`}
                aria-label={`Remove ${s.role}`}
                onClick={() => onChange(list => list.filter(x => x.key !== s.key))}
              >
                ×
              </button>
              <strong>{s.role}</strong>
              {found > 0 && (
                <span className="map-people">
                  {found} {found === 1 ? 'person' : 'people'} found
                </span>
              )}
            </div>
          )
        })}

        {n === 0 && <p className="map-empty">No stakeholders yet. Add one below.</p>}
      </div>

      <div className="map-actions">
        <div className="map-actions-left">
          <AddStakeholder existing={stakeholders} onAdd={s => onChange(list => [...list, s])} />
          {moved && (
            <button className="ghost" onClick={tidy} title="Put everyone back in the default arrangement">
              Tidy up
            </button>
          )}
        </div>
        {!embedded && (
          <button className="primary" onClick={onContinue}>
            {continueLabel}
          </button>
        )}
      </div>
    </div>
  )
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
