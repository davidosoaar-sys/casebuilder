// Company identity for the website cover. The project supplies its own logo.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export function landingArtwork({ company, logo }) {
  const identity = logo || '<span class="landing-initial">' + esc(String(company || 'C').slice(0, 1)) + '</span>'
  return '<div class="landing-art cover-art"><div class="landing-logo">' + identity + '</div></div>'
}
export { EDITORIAL_CSS as LANDING_CSS } from './websiteEditorial.js'