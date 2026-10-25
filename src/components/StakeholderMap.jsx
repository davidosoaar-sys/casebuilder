import React, { useMemo, useRef, useState } from 'react'
import { resolve, AddStakeholder } from './Deck.jsx'
import AppLogo from './AppLogo.jsx'
import { defaultPositions } from '../deck/mapLayout.js'

// A map of who has to say yes. The company sits in the middle, stakeholders
// around it. Drag them anywhere, add and remove as needed; "Tidy up" puts
// everyone back in the default arrangement. Positions are stored on the
// stakeholder as percentages of the map.

// Up to two capitals from a role name: "Director / VP Engineering" -> "DV".
const initials = role =>
  String(role || '?')
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')

export default function StakeholderMap({
  company,
  brand,
  stakeholders,
  people = {},
  onChange,
  onContinue,
  continueLabel = 'Continue',
  showStep = true,
  embedded = false,
  onOpen
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
    if (e.target.closest('.map-x, .map-open')) return
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
            <AppLogo height={26} />
          </div>
          <p className="mono-label">{showStep ? 'Step 2 of 4 · ' : ''}Stakeholder map</p>
          <h1>Who has to say yes at {company}?</h1>
          <p className="sub">
            Drag people to arrange the map, add anyone this case has to convince, and remove anyone
            who doesn't belong. You can change this any time from the project's Details.
          </p>
        </>
      )}

      <div className="map" ref={mapRef}>
        <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {items.map((s, i) => {
            const { x, y } = where(s, i)
            return <line key={s.key} x1="50" y1="50" x2={x} y2={y} vectorEffect="non-scaling-stroke" />
          })}
        </svg>

        <div className="map-center" style={{ left: '50%', top: '50%' }}>
          {brand?.logo && <img src={brand.logo} alt={company+' logo'} style={{maxWidth:100,maxHeight:40,objectFit:'contain'}}/>}
            <small>{brand?.status === 'scanning' ? 'Finding branding…' : 'Customer'}</small>
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
              <span className="map-badge" aria-hidden="true">{initials(s.role)}</span>
              <span className="map-text">
                <strong>{s.role}</strong>
                <span className="map-people">
                  {found > 0 ? `${found} ${found === 1 ? 'person' : 'people'} found` : 'No one found yet'}
                </span>
                {onOpen && <button type="button" className="link-btn map-open" onClick={() => onOpen(s.key)} aria-label={`Open the brief for ${s.role}`}>Brief →</button>}
              </span>
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
