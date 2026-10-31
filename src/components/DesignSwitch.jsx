import React, { useState } from 'react'
import { normalizeBrand } from '../brand.js'

// Switch the whole case between the company's own design and the Backstage design in
// one click, from the deck editor or the Live Room. Same change as picking the
// template in Deck design: the company's palette and fonts are remembered, so
// switching back restores them.
const OPTIONS = [
  ['company', 'Company'],
  ['backstage', 'Backstage']
]

export default function DesignSwitch({ brand, onBrand, label = 'Design' }) {
  const b = normalizeBrand(brand)
  const [busy, setBusy] = useState(false)
  async function pick(template) {
    if (busy || b.template === template) return
    setBusy(true)
    try { await onBrand({ ...b, template }) } finally { setBusy(false) }
  }
  return (
    <div className="design-switch" role="radiogroup" aria-label={`${label}: company or Backstage`}>
      <span className="design-switch-label">{label}</span>
      {OPTIONS.map(([key, name]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={b.template === key}
          className={`design-switch-option ${b.template === key ? 'design-switch-on' : ''}`}
          onClick={() => pick(key)}
          disabled={busy}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
