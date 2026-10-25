import React from 'react'
import { safeAsset,normalizeBrand } from '../brand.js'
export default function DeckLogo({ brand }) {
  if (brand?.hideLogo) return null
  const logo = safeAsset(brand?.logo)
  return logo ? <img className="deck-company-logo" src={logo} alt="Company logo" style={normalizeBrand(brand).logoBackground!=='transparent'?{background:normalizeBrand(brand).logoBackground,padding:8,borderRadius:4}:undefined} /> : null
}
