import React from 'react'
import { safeAsset } from '../brand.js'
export default function DeckLogo({ brand }) {
  if (brand?.hideLogo) return null
  const logo = safeAsset(brand?.logo)
  return logo ? <img className="deck-company-logo" src={logo} alt="Company logo" /> : null
}
