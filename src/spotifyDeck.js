import { normalizeBrand } from './brand.js'
import { SPOTIFY_LOGO } from './spotifyLogo.js'

// A saved, editable preset for the requested Spotify sample. Apply once so
// subsequent customer edits survive reloads. No inputs or formulas are changed.
export function styleSpotifyDeck(project) {
  if(project.brand?.template==='company')return project
  if (!/^spotify$/i.test(project.name.trim()) || project.spotifyDesignVersion === 1) return project
  const green = '#1DB954'
  const typography = {
    hero: { fontSize: 112, weight: '900', color: green },
    headline: { fontSize: 80, weight: '800', color: green },
    title: { fontSize: 46, weight: '800', color: '#FFFFFF' },
    eyebrow: { fontSize: 12, weight: '700', color: green },
    label: { fontSize: 12, weight: '700', color: green },
    lede: { fontSize: 24, weight: '400', color: '#FFFFFF' },
    sub: { fontSize: 24, weight: '400', color: '#B3B3B3' },
    note: { fontSize: 15, weight: '400', color: '#B3B3B3' },
    forwhom: { fontSize: 12, weight: '700', color: '#B3B3B3' },
    tag: { fontSize: 12, weight: '700', color: green }
  }
  return {
    ...project,
    spotifyDesignVersion: 1,
    projectLogo: SPOTIFY_LOGO,
    updatedAt: Date.now(),
    brand: normalizeBrand({ ...project.brand, primary: green, background: '#121212', surface: '#202020', text: '#FFFFFF', muted: '#B3B3B3', headingFont: 'Arial', bodyFont: 'Arial', logo: SPOTIFY_LOGO, hideLogo: false, website: 'https://www.spotify.com/', status: 'ready', message: 'Spotify deck design applied. Colors, typography and individual pages remain editable.' }),
    deck: project.deck.map((slide, index) => ({
      ...slide,
      variant: 'plain',
      design: { ...slide.design, background: index === 0 ? '#000000' : index % 2 === 0 ? '#181818' : '#121212' },
      blocks: slide.blocks.map(block => block.type === 'text' ? { ...block, design: { ...block.design, font: 'Arial', ...(typography[block.style] || {}) } } : block)
    }))
  }
}
