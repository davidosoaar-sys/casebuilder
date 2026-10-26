import React from 'react'
import { backstageData } from '../coBrand.js'
import { safeAsset,normalizeBrand } from '../brand.js'
export default function DeckLogo({ brand }) {
  if (brand?.hideLogo) return null
  const logo = safeAsset(brand?.logo)
  return logo ? <span className="deck-co-brand" style={{display:'inline-flex',alignItems:'center',gap:18,maxWidth:'100%'}}><img className="deck-company-logo" src={logo} alt="Company logo" style={normalizeBrand(brand).logoBackground!=='transparent'?{background:normalizeBrand(brand).logoBackground,padding:8,borderRadius:4}:undefined} /><span aria-hidden="true">×</span><img src={backstageData} alt="Backstage" style={{width:110,height:32,objectFit:'contain',background:'#fff',padding:6,borderRadius:3}} /></span> : null
}
