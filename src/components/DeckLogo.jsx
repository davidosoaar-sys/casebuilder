import React from 'react'
import { partnerFor } from '../coBrand.js'
import { safeAsset,normalizeBrand } from '../brand.js'
export default function DeckLogo({ brand }) {
  if (brand?.hideLogo) return null
  const logo = safeAsset(brand?.logo)
  return logo ? <span className="deck-co-brand" style={{display:'inline-flex',alignItems:'center',gap:18,maxWidth:'100%'}}><img className="deck-company-logo" src={logo} alt="Company logo" style={normalizeBrand(brand).logoBackground!=='transparent'?{background:normalizeBrand(brand).logoBackground,padding:8,borderRadius:4}:undefined} /><span aria-hidden="true">×</span><PartnerMark brand={brand} /></span> : null
}

// The partner beside the customer's logo: Backstage, Spotify Portal or Spotify.
export function PartnerMark({ brand }) {
  const b = normalizeBrand(brand)
  const p = partnerFor(b.partnerLogo, b.background)
  const width = Math.min(110, Math.round(32 * p.ratio))
  return <img className="deck-partner-logo" data-partner={p.kind} src={p.src} alt={p.label} style={{ width, height: Math.round(width / p.ratio), objectFit: 'contain', background: 'transparent' }} />
}
