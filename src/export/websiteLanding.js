import {normalizeBrand} from '../brand.js'
// Company identity for the website cover. The project supplies its own logo.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export function landingArtwork({ company, logo, brand }) {
  const identity = logo || '<span class="landing-initial">' + esc(String(company || 'C').slice(0, 1)) + '</span>'
  const b=normalizeBrand(brand)
  if(b.heroImage)return '<div class="landing-art cover-art has-brand-image"><figure class="brand-cover-image"><img src="'+b.heroImage+'" alt="'+esc(b.heroAlt||company+' brand image')+'">'+(b.heroSource?'<figcaption><a href="'+esc(b.heroSource)+'" target="_blank" rel="noreferrer noopener">Image source</a></figcaption>':'')+'</figure><div class="landing-logo brand-logo-overlay">'+identity+'</div></div>'
  return '<div class="landing-art cover-art"><div class="landing-logo">'+identity+'</div></div>'
}
export { EDITORIAL_CSS as LANDING_CSS } from './websiteEditorial.js'