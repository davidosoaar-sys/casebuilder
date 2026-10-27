import { normalizeBrand } from './brand.js'
import { publicProfileUrl } from './profileMedia.js'

// Resolve only media operations before synchronous application. Failed media
// never replaces the existing asset; independent edits can still be applied.
export async function prepareBrandOps(ops, brand, resolveAsset) {
  const b = normalizeBrand(brand), refused = [], prepared = []
  for (const original of (ops || []).slice(0, 25)) {
    if (original?.op !== 'set_brand') { prepared.push(original); continue }
    const op = { ...original, expect: { ...original.expect } }
    for (const key of ['logo', 'heroImage']) {
      if (op[key] === '') {
        op.expect[key] = brand?.[key] ?? null
        if (key === 'heroImage') {
          op.heroSource = ''; op.heroAlt = ''
          if (!Object.hasOwn(op.expect, 'heroSource')) op.expect.heroSource = brand?.heroSource ?? null
          if (!Object.hasOwn(op.expect, 'heroAlt')) op.expect.heroAlt = brand?.heroAlt ?? null
        }
        continue
      }
      if (!op[key]) continue
      try {
        const match = typeof op[key] === 'string' && op[key].match(/^candidate:(logo|heroImage):(\d)$/)
        let data, source, alt
        if (match && match[1] === key) {
          const candidate = (key === 'logo' ? b.logoVariants : b.heroCandidates)[Number(match[2])]
          if (!candidate) throw Error('That discovered candidate is no longer available.')
          data = candidate[key]; source = candidate.heroSource || candidate.sourceUrl; alt = candidate.heroAlt
        } else {
          if (!publicProfileUrl(op[key])) throw Error('Use a discovered candidate or a public HTTPS image.')
          const asset = await resolveAsset(op[key], key)
          data = asset.data; source = asset.source
        }
        op[key] = data
        op.expect[key] = brand?.[key] ?? null
        if (key === 'heroImage') {
          op.heroSource = source
          if (!Object.hasOwn(op.expect, 'heroSource')) op.expect.heroSource = brand?.heroSource ?? null
          if (op.heroAlt === undefined) op.heroAlt = alt || ''
          if (!Object.hasOwn(op.expect, 'heroAlt')) op.expect.heroAlt = brand?.heroAlt ?? null
        }
      } catch (error) {
        delete op[key]
        if (key === 'heroImage') { delete op.heroSource; delete op.heroAlt }
        refused.push(`Could not change ${key === 'logo' ? 'the logo' : 'the brand image'}: ${error.message}`)
      }
    }
    prepared.push(op)
  }
  return { deckOps: prepared, deckRefused: refused }
}

// Artifact claims are derived from application, including stale/failed edits.
export function artifactReplyText(text, meta, log) {
  if (!meta?.deck_requested && !meta?.deck_ops?.length && !meta?.deck_rejected?.length) return text
  if (!log) return meta.deck_ops?.length ? 'Checking the requested case changes…' : 'No case changes were applied. See the details below.'
  if (log.undone) return 'These case changes were undone.'
  const changes = log.deckChanges || []
  if (!changes.length) return 'No case changes were applied. See the details below.'
  return `${changes.map(c => c.sentence).join('. ')}.${(log.deckRefused?.length || meta.deck_rejected?.length) ? ' Some changes could not be applied; see the details below.' : ''} Published snapshots update when republished.`
}
