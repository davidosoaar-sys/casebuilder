import {normalizeBrand} from '../brand.js'
// Company identity for the website cover. The project supplies its own logo.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export function landingArtwork({ company, logo, brand }) {
  const b=normalizeBrand(brand)
  const identity = b.hideLogo ? '' : logo || '<span class="landing-initial">' + esc(String(company || 'C').slice(0, 1)) + '</span>'
  if (b.hideLogo && !b.heroImage) return ''
  if(b.heroImage)return '<div class="landing-art cover-art has-brand-image"><figure class="brand-cover-image"><img src="'+b.heroImage+'" alt="'+esc(b.heroAlt||company+' brand image')+'"></figure>'+(identity?'<div class="landing-logo brand-logo-overlay">'+identity+'</div>':'')+'</div>'
  return '<div class="landing-art cover-art"><div class="landing-logo">'+identity+'</div></div>'
}
export { EDITORIAL_CSS as LANDING_CSS } from './websiteEditorial.js'