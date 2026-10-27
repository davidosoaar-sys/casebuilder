// The agent changes the case artifacts: the deck (pages of blocks) and the
// brand. Same rules as agentEdits.js: check every operation again (never trust
// the worker), apply it straight away, and keep what it replaced so it can be
// undone. Undo only puts a part back while it still holds what the agent wrote;
// if the user has edited it since, the user's edit wins. Pure functions.
//
// worker/worker.py parse_deck_ops checks the same operations before they get
// here; keep the two in step.
import { publicProfileUrl } from './profileMedia.js'
import { TEXT_STYLES, SLIDE_TEMPLATES, BLOCK_MENU, TOKENS, textBlock, fill } from './deck/model.js'
import { COLOR_KEYS, BRAND_FONTS, cleanFont, normalizeBrand, safeAsset } from './brand.js'
import { applyAgentEdits, undoAgentEdits, redoAgentEdits, editedSince } from './agentEdits.js'

export const MAX_DECK_OPS = 25
export const MAX_TEXT = 2000
export const MAX_SLIDES = 40
export const MAX_BLOCKS = 30
export const MAX_SLIDE_TEXTS = 8
// What the agent may add. No Image (it would need a URL) and no Logo.
export const AGENT_BLOCK_KINDS = ['Text', 'Heading', 'Bullet list', 'Quote', 'Two columns', 'Key numbers', 'Value drivers chart',
  'Today vs with Portal', 'Portal vs self-hosting', 'Stakeholder brief', 'Divider', 'Spacer']
const TEXT_KINDS = ['Text', 'Heading', 'Bullet list', 'Quote']
const TEXTS_TEMPLATES = ['blank', 'text', 'bullets']
const TEXT_FIELDS = { text: ['text'], quote: ['text'], columns: ['left', 'right'], image: ['caption'] }
const STYLE_KEYS = TEXT_STYLES.map(([k]) => k)
const BRAND_FONT_KEYS = ['headingFont', 'bodyFont']
const BRAND_NAMES = { hideLogo: 'Logo visibility', logo: 'Company logo', heroImage: 'Brand image', heroAlt: 'Image description', heroSource: 'Image source', primary: 'Primary colour', background: 'Background', surface: 'Surface colour', text: 'Text colour', muted: 'Muted text colour', headingFont: 'Heading font', bodyFont: 'Body font' }
const BLOCK_NAMES = { stats: 'key numbers', drivers: 'value drivers chart', pairs: 'today vs with Portal comparison', versus: 'Portal vs self-hosting comparison',
  room: 'stakeholder brief', logo: 'logo', image: 'image', divider: 'divider', spacer: 'spacer', quote: 'quote', columns: 'two columns' }

// Fonts the agent may pick: the brand panel's list plus whatever the brand already uses.
export function agentFonts(brand) {
  const b = brand && typeof brand === 'object' ? brand : {}
  const own = [b.headingFont, b.bodyFont, b.fontName, ...(Array.isArray(b.fontFaces) ? b.fontFaces.map(f => f?.family) : [])].map(cleanFont).filter(Boolean)
  return [...new Set([...BRAND_FONTS, ...own])]
}

const styleName = style => {
  const label = (TEXT_STYLES.find(([k]) => k === style) || [])[1] || 'text'
  return style === 'body' ? 'text' : label.toLowerCase()
}
const partName = (b, field) =>
  b.type === 'text' ? styleName(b.style)
    : b.type === 'columns' ? `${field} column`
    : b.type === 'image' ? 'image caption'
    : BLOCK_NAMES[b.type] || b.type
const blockName = b => (b.type === 'text' ? styleName(b.style) : BLOCK_NAMES[b.type] || b.type)
const short = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > 40 ? t.slice(0, 39).trimEnd() + '…' : t }
// A page's name for a sentence: its heading, else its label. Text without
// tokens first; a token left over reads as what it stands for.
const TOKEN_NAMES = Object.fromEntries(TOKENS.map(([k, label]) => [k, label]))
export function slideName(slide) {
  const texts = (slide?.blocks || []).filter(b => b.type === 'text' && String(b.text || '').trim())
  const plain = texts.filter(b => !/\{\w+\}/.test(b.text))
  const pick = list => ['hero', 'headline', 'title', 'label', 'eyebrow'].map(st => list.find(b => b.style === st)).find(Boolean)
  const head = pick(plain) || pick(texts) || plain[0] || texts[0]
  return head ? short(fill(head.text, TOKEN_NAMES)) : 'Untitled page'
}

// Figures the agent must not type: money, percentages, scaled amounts
// ("4.2M", "3 million") and grouped numbers ("12,000"). Numbers on slides come
// from the live blocks and tokens, which are computed from the inputs. Plain
// counts and years ("3 steps", "Q3 2026") are fine.
export const FIGURE = /[$€£¥]\s?\d|\d\s?%|\d(?:\.\d+)?\s?(?:k|m|bn|b|million|billion|thousand)\b|\d{1,3}(?:,\d{3})+/i
export const FIGURE_REFUSAL = 'The agent cannot type figures into the case. Numbers come from the inputs, through number blocks and tokens.'

// Plain text: no control characters except new lines and tabs, no typed figures.
function cleanText(v) {
  if (typeof v !== 'string') return { error: 'The new text was not text.' }
  const t = v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\s+$/, '')
  if (!t.trim()) return { error: 'The new text was empty. To take something out, remove the block.' }
  if (t.length > MAX_TEXT) return { error: `The new text is longer than ${MAX_TEXT} characters.` }
  if (FIGURE.test(t.replace(/\{\w+\}/g, ''))) return { error: FIGURE_REFUSAL }
  return { value: t }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
// Change records are saved in the deal's agentLog: never share objects with the deck.
const clone = x => (x === undefined ? x : JSON.parse(JSON.stringify(x)))
const findSlide = (deck, id) => deck.findIndex(s => s.id === id)

// Apply a list of operations. Returns the new deck and brand, one change per
// thing that changed (a sentence for the user, plus what undo needs), and the
// refused operations as sentences.
export function applyDeckOps(deck, brand, ops, { now = new Date().toISOString() } = {}) {
  let d = Array.isArray(deck) ? deck.map(s => ({ ...s, blocks: Array.isArray(s.blocks) ? [...s.blocks] : [] })) : []
  let br = brand && typeof brand === 'object' ? { ...brand } : {}
  const changes = []
  const refused = []
  const list = Array.isArray(ops) ? ops : []
  const fonts = agentFonts(brand)
  const missingPage = 'A page the agent named is not in the deck any more.'
  const missingBlock = 'A block the agent named is not on that page any more.'
  const record = (op, c) => changes.push({ ...c, reason: typeof op.reason === 'string' ? op.reason.slice(0, 300) : '', at: now })

  for (const op of list.slice(0, MAX_DECK_OPS)) {
    if (!op || typeof op !== 'object') { refused.push('One change was not readable.'); continue }
    const si = op.slide_id != null ? findSlide(d, op.slide_id) : -1
    const slide = si >= 0 ? d[si] : null
    const page = si + 1
    switch (op.op) {
      case 'set_text': {
        if (!slide) { refused.push(missingPage); break }
        const bi = slide.blocks.findIndex(b => b.id === op.block_id)
        if (bi < 0) { refused.push(missingBlock); break }
        const b = slide.blocks[bi]
        const field = op.field || (TEXT_FIELDS[b.type] || [])[0]
        if (!(TEXT_FIELDS[b.type] || []).includes(field)) { refused.push(`The ${blockName(b)} on page ${page} has no text the agent can change.`); break }
        // The worker sends the text it saw ("expect"). If the user changed it
        // while the agent was working, the user's edit wins.
        if (op.expect !== undefined && (b[field] ?? '') !== op.expect) { refused.push(`You changed the ${partName(b, field)} on page ${page} while the agent was working, so yours was kept.`); break }
        const t = cleanText(op.value)
        if (t.error) { refused.push(`Page ${page}: ${t.error}`); break }
        if (b[field] === t.value) break
        slide.blocks[bi] = { ...b, [field]: t.value }
        record(op, { op: 'set_text', slideId: slide.id, blockId: b.id, field, before: b[field], after: t.value, sentence: `Changed the ${partName(b, field)} on page ${page}` })
        break
      }
      case 'set_style': {
        if (!slide) { refused.push(missingPage); break }
        const bi = slide.blocks.findIndex(b => b.id === op.block_id)
        if (bi < 0) { refused.push(missingBlock); break }
        const b = slide.blocks[bi]
        if (b.type !== 'text') { refused.push(`Only text has a style; the ${blockName(b)} on page ${page} does not.`); break }
        if (!STYLE_KEYS.includes(op.style)) { refused.push(`"${String(op.style).slice(0, 40)}" is not a text style.`); break }
        if (op.expect !== undefined && (b.style ?? '') !== op.expect) { refused.push(`You changed the ${styleName(b.style)} on page ${page} while the agent was working, so yours was kept.`); break }
        if (b.style === op.style) break
        slide.blocks[bi] = { ...b, style: op.style }
        record(op, { op: 'set_style', slideId: slide.id, blockId: b.id, field: 'style', before: b.style, after: op.style, sentence: `Made the ${styleName(b.style)} on page ${page} a ${styleName(op.style)}` })
        break
      }
      case 'add_slide': {
        const tpl = SLIDE_TEMPLATES.find(t => t.key === op.template)
        if (!tpl) { refused.push(`"${String(op.template).slice(0, 40)}" is not a page template.`); break }
        if (d.length >= MAX_SLIDES) { refused.push(`The deck already has ${MAX_SLIDES} pages.`); break }
        let at = d.length
        if (op.after_slide_id != null) {
          const ai = findSlide(d, op.after_slide_id)
          if (ai < 0) { refused.push(missingPage); break }
          at = ai + 1
        }
        let made = tpl.make()
        if (op.texts != null) {
          if (!TEXTS_TEMPLATES.includes(tpl.key)) { refused.push(`Only blank, text and bullet pages take the agent's own text, not "${tpl.name}".`); break }
          if (!Array.isArray(op.texts) || !op.texts.length || op.texts.length > MAX_SLIDE_TEXTS) { refused.push(`A new page takes 1 to ${MAX_SLIDE_TEXTS} pieces of text.`); break }
          const blocks = []
          let bad = ''
          for (const x of op.texts) {
            if (!x || !STYLE_KEYS.includes(x.style)) { bad = `"${String(x?.style).slice(0, 40)}" is not a text style.`; break }
            const t = cleanText(x.text)
            if (t.error) { bad = t.error; break }
            blocks.push(textBlock(x.style, t.value))
          }
          if (bad) { refused.push(`New page: ${bad}`); break }
          made = { ...made, blocks }
        }
        d.splice(at, 0, made)
        const after = op.after_slide_id != null ? ` after page ${at}` : ' at the end'
        record(op, { op: 'add_slide', slide: clone(made), index: at, sentence: `Added a page "${slideName(made)}"${after}` })
        break
      }
      case 'remove_slide': {
        if (!slide) { refused.push(missingPage); break }
        if (d.length <= 1) { refused.push('The deck needs at least one page.'); break }
        d.splice(si, 1)
        record(op, { op: 'remove_slide', slide: clone(slide), index: si, sentence: `Removed page ${page}, "${slideName(slide)}"` })
        break
      }
      case 'move_slide': {
        if (!slide) { refused.push(missingPage); break }
        if (!Number.isInteger(op.to_index) || op.to_index < 0) { refused.push('The new place for a page was not a page number.'); break }
        const to = Math.min(op.to_index, d.length - 1)
        if (to === si) break
        d.splice(si, 1)
        d.splice(to, 0, slide)
        record(op, { op: 'move_slide', slideId: slide.id, from: si, to, sentence: `Moved "${slideName(slide)}" to page ${to + 1}` })
        break
      }
      case 'add_block': {
        if (!slide) { refused.push(missingPage); break }
        if (!AGENT_BLOCK_KINDS.includes(op.kind)) { refused.push(`The agent cannot add "${String(op.kind).slice(0, 40)}".`); break }
        if (slide.blocks.length >= MAX_BLOCKS) { refused.push(`Page ${page} already has ${MAX_BLOCKS} blocks.`); break }
        let at = slide.blocks.length
        if (op.after_block_id != null) {
          const ai = slide.blocks.findIndex(b => b.id === op.after_block_id)
          if (ai < 0) { refused.push(missingBlock); break }
          at = ai + 1
        }
        let made = BLOCK_MENU.find(m => m.name === op.kind).make()
        if (op.text != null) {
          if (!TEXT_KINDS.includes(op.kind)) { refused.push(`A ${op.kind.toLowerCase()} block has no text of its own.`); break }
          const t = cleanText(op.text)
          if (t.error) { refused.push(`Page ${page}: ${t.error}`); break }
          made = { ...made, text: t.value }
        }
        if (op.kind === 'Two columns') {
          let bad = ''
          for (const side of ['left', 'right']) {
            if (op[side] == null) continue
            const t = cleanText(op[side])
            if (t.error) { bad = t.error; break }
            made = { ...made, [side]: t.value }
          }
          if (bad) { refused.push(`Page ${page}: ${bad}`); break }
        }
        slide.blocks.splice(at, 0, made)
        record(op, { op: 'add_block', slideId: slide.id, block: clone(made), index: at, sentence: `Added ${/^[aeiou]/i.test(op.kind) ? 'an' : 'a'} ${op.kind.toLowerCase()} to page ${page}` })
        break
      }
      case 'remove_block': {
        if (!slide) { refused.push(missingPage); break }
        const bi = slide.blocks.findIndex(b => b.id === op.block_id)
        if (bi < 0) { refused.push(missingBlock); break }
        const b = slide.blocks[bi]
        slide.blocks.splice(bi, 1)
        record(op, { op: 'remove_block', slideId: slide.id, block: clone(b), index: bi, sentence: `Removed the ${blockName(b)} from page ${page}` })
        break
      }
      case 'set_section_name': {
        if (!slide) { refused.push(missingPage); break }
        const value = typeof op.value === 'string' ? op.value.trim() : ''
        if (!value || value.length > 80 || /[\u0000-\u001f]/.test(value)) { refused.push('A Live room section name needs 1–80 characters.'); break }
        if (op.expect !== undefined && (slide.websiteNav ?? '') !== op.expect) { refused.push('You renamed that section while the agent was working, so yours was kept.'); break }
        if (slide.websiteNav === value) break
        const before = slide.websiteNav
        slide.websiteNav = value
        record(op, { op: 'section_name', slideId: slide.id, before, after: value, sentence: `Renamed Live room section ${page} to “${value}”` })
        break
      }
      case 'set_brand': {
        const shown = normalizeBrand(br)
        const heroKeys = ['heroImage', 'heroSource', 'heroAlt']
        const staleHero = heroKeys.some(k => op.expect && Object.hasOwn(op.expect, k) && (br[k] ?? null) !== op.expect[k])
        if (staleHero) refused.push('You changed the brand image while the agent was working, so yours was kept.')
        const invalidHero = Object.hasOwn(op, 'heroImage') && op.heroImage !== '' && (!safeAsset(op.heroImage) || !publicProfileUrl(op.heroSource))
        for (const [key, raw] of Object.entries(op)) {
          if (key === 'op' || key === 'reason' || key === 'expect') continue
          if (!heroKeys.includes(key) && op.expect && Object.hasOwn(op.expect, key) && (br[key] ?? null) !== op.expect[key]) { refused.push(`You changed ${BRAND_NAMES[key] || key} while the agent was working, so yours was kept.`); continue }
          if (heroKeys.includes(key) && staleHero) continue
          if (heroKeys.includes(key) && invalidHero) { refused.push('The brand image needs validated image bytes and an HTTPS source.'); continue }
          let value
          if (COLOR_KEYS.includes(key)) {
            if (typeof raw !== 'string' || !/^#[0-9a-f]{6}$/i.test(raw)) { refused.push(`${BRAND_NAMES[key]}: "${String(raw).slice(0, 20)}" is not a #rrggbb colour.`); continue }
            value = raw.toLowerCase()
          } else if (BRAND_FONT_KEYS.includes(key)) {
            value = fonts.find(f => f.toLowerCase() === String(raw).trim().toLowerCase())
            if (!value) { refused.push(`${BRAND_NAMES[key]}: "${String(raw).slice(0, 40)}" is not one of the fonts the case can use.`); continue }
          } else if (key === 'hideLogo' && typeof raw === 'boolean') value = raw
          else if (['logo', 'heroImage'].includes(key) && (raw === '' || safeAsset(raw))) {
            if (key === 'heroImage' && raw && !publicProfileUrl(op.heroSource)) { refused.push('A web image needs its HTTPS source.'); continue }
            value = raw
          } else if (key === 'heroSource' && (raw === '' || publicProfileUrl(raw))) value = raw === '' ? '' : publicProfileUrl(raw)
          else if (key === 'heroAlt' && typeof raw === 'string' && raw.length <= 240) value = raw
          else { refused.push(`The agent cannot change the brand's ${String(key).slice(0, 30)}.`); continue }
          if (br[key] === value) continue
          const before = br[key]
          br = { ...br, [key]: value }
          record(op, { op: 'brand', key, before, after: value, sentence: COLOR_KEYS.includes(key) || BRAND_FONT_KEYS.includes(key) ? `${BRAND_NAMES[key]} ${shown[key]} → ${value}` : `Changed ${BRAND_NAMES[key].toLowerCase()}` })
        }
        break
      }
      default:
        refused.push(`"${String(op.op).slice(0, 40)}" is not a change the agent can make.`)
    }
  }
  if (list.length > MAX_DECK_OPS) refused.push(`Only the first ${MAX_DECK_OPS} changes were made.`)
  return { deck: d, brand: br, changes, refused }
}

// Undo a reply's changes, newest first. Each part is only put back while it
// still holds what the agent wrote; otherwise it is skipped and reported. With
// { force: true } (the user chose "Undo anyway") it is put back regardless,
// as long as the thing still exists. `conflicts` are the changes the user has
// edited since (what force would overwrite).
export function undoDeckOps(deck, brand, changes, { force = false } = {}) {
  let d = Array.isArray(deck) ? deck.map(s => ({ ...s, blocks: Array.isArray(s.blocks) ? [...s.blocks] : [] })) : []
  let br = brand && typeof brand === 'object' ? { ...brand } : {}
  const skipped = []
  const conflicts = []
  let restored = 0
  for (const c of [...(changes || [])].reverse()) {
    const si = c.slideId ? findSlide(d, c.slideId) : -1
    const slide = si >= 0 ? d[si] : null
    let ok = false
    let edited = false
    switch (c.op) {
      case 'set_text':
      case 'set_style': {
        const bi = slide ? slide.blocks.findIndex(b => b.id === c.blockId) : -1
        if (bi < 0) break
        edited = slide.blocks[bi][c.field] !== c.after
        if (edited && !force) break
        const b = { ...slide.blocks[bi] }
        if (c.before === undefined) delete b[c.field]; else b[c.field] = c.before
        slide.blocks[bi] = b
        ok = true
        break
      }
      case 'add_slide': {
        const i = findSlide(d, c.slide?.id)
        if (i < 0) break
        edited = !same(d[i], c.slide)
        if (edited && !force) break
        d.splice(i, 1); ok = true
        break
      }
      case 'remove_slide': {
        if (c.slide && findSlide(d, c.slide.id) < 0) { d.splice(Math.min(c.index, d.length), 0, clone(c.slide)); ok = true }
        break
      }
      case 'move_slide': {
        if (!slide) break
        edited = si !== c.to
        if (edited && !force) break
        d.splice(si, 1); d.splice(Math.min(c.from, d.length), 0, slide); ok = true
        break
      }
      case 'add_block': {
        const bi = slide ? slide.blocks.findIndex(b => b.id === c.block?.id) : -1
        if (bi < 0) break
        edited = !same(slide.blocks[bi], c.block)
        if (edited && !force) break
        slide.blocks.splice(bi, 1); ok = true
        break
      }
      case 'remove_block': {
        if (slide && c.block && !slide.blocks.some(b => b.id === c.block.id)) { slide.blocks.splice(Math.min(c.index, slide.blocks.length), 0, clone(c.block)); ok = true }
        break
      }
      case 'section_name': {
        if (!slide) break
        edited = slide.websiteNav !== c.after
        if (edited && !force) break
        if (c.before === undefined) delete slide.websiteNav; else slide.websiteNav = c.before
        ok = true
        break
      }
      case 'brand': {
        edited = br[c.key] !== c.after
        if (edited && !force) break
        br = { ...br }
        if (c.before === undefined) delete br[c.key]; else br[c.key] = c.before
        ok = true
        break
      }
    }
    if (edited) conflicts.push(c)
    if (ok) restored++
    else skipped.push(c.sentence)
  }
  return { deck: d, brand: br, restored, skipped: skipped.reverse(), conflicts: conflicts.reverse() }
}

// Redo a reply's changes after an undo, oldest first: write what the agent
// wrote again. Parts that no longer exist are skipped and reported.
export function redoDeckOps(deck, brand, changes) {
  let d = Array.isArray(deck) ? deck.map(s => ({ ...s, blocks: Array.isArray(s.blocks) ? [...s.blocks] : [] })) : []
  let br = brand && typeof brand === 'object' ? { ...brand } : {}
  const skipped = []
  for (const c of changes || []) {
    const si = c.slideId ? findSlide(d, c.slideId) : -1
    const slide = si >= 0 ? d[si] : null
    let ok = false
    switch (c.op) {
      case 'set_text':
      case 'set_style': {
        const bi = slide ? slide.blocks.findIndex(b => b.id === c.blockId) : -1
        if (bi >= 0) { slide.blocks[bi] = { ...slide.blocks[bi], [c.field]: c.after }; ok = true }
        break
      }
      case 'add_slide': {
        if (c.slide && findSlide(d, c.slide.id) < 0) d.splice(Math.min(c.index ?? d.length, d.length), 0, clone(c.slide))
        ok = true
        break
      }
      case 'remove_slide': {
        const i = findSlide(d, c.slide?.id)
        if (i < 0) ok = true
        else if (d.length > 1) { d.splice(i, 1); ok = true }
        break
      }
      case 'move_slide': {
        if (slide) { d.splice(si, 1); d.splice(Math.min(c.to, d.length), 0, slide); ok = true }
        break
      }
      case 'add_block': {
        if (slide && c.block) {
          if (!slide.blocks.some(b => b.id === c.block.id)) slide.blocks.splice(Math.min(c.index ?? slide.blocks.length, slide.blocks.length), 0, clone(c.block))
          ok = true
        }
        break
      }
      case 'remove_block': {
        if (slide) { slide.blocks = slide.blocks.filter(b => b.id !== c.block?.id); ok = true }
        break
      }
      case 'section_name':
        if (slide) { slide.websiteNav = c.after; ok = true }
        break
      case 'brand': {
        br = { ...br, [c.key]: c.after }
        ok = true
        break
      }
    }
    if (!ok) skipped.push(c.sentence)
  }
  return { deck: d, brand: br, skipped }
}

// One reply can change inputs and the case. Both go into the same agentLog
// entry (keyed by the chat message id, saved with the deal), so a reply is
// applied once and one Undo reverts all of it. Returns a patch for the deal.
export function applyAgentReply(p, messageId, { edits = [], deckOps = [], deckRefused = [] } = {}, { now } = {}) {
  if (!messageId || p.agentLog?.[messageId]) return {}
  const patch = {}
  const entry = { changes: [], refused: [], at: Date.now() }
  if (Array.isArray(edits) && edits.length) {
    const r = applyAgentEdits(p.fields, edits, now ? { now } : undefined)
    patch.fields = r.fields
    entry.changes = r.changes
    entry.refused = r.refused
  }
  if (Array.isArray(deckOps) && deckOps.length) {
    const r = applyDeckOps(p.deck, p.brand, deckOps, now ? { now } : undefined)
    if (r.changes.some(c => c.op !== 'brand')) patch.deck = r.deck
    if (r.changes.some(c => c.op === 'brand')) patch.brand = r.brand
    entry.deckChanges = r.changes
    entry.deckRefused = [...deckRefused, ...r.refused]
  }
  if (!entry.deckRefused) entry.deckRefused = deckRefused
  return { ...patch, agentLog: { ...(p.agentLog || {}), [messageId]: entry } }
}

// Undo a reply. Without force, parts the user edited since are kept (and
// listed in skipped); with { force: true } they are put back too.
export function undoAgentReply(p, messageId, { force = false } = {}) {
  const entry = p.agentLog?.[messageId]
  if (!entry || entry.undone) return {}
  const patch = {}
  const next = { ...entry, undone: true, skipped: [], deckSkipped: [] }
  if (entry.changes?.length) {
    const r = undoAgentEdits(p.fields, entry.changes, { force })
    patch.fields = r.fields
    next.skipped = r.skipped
  }
  if (entry.deckChanges?.length) {
    const r = undoDeckOps(p.deck, p.brand, entry.deckChanges, { force })
    if (entry.deckChanges.some(c => c.op !== 'brand')) patch.deck = r.deck
    if (entry.deckChanges.some(c => c.op === 'brand')) patch.brand = r.brand
    next.deckSkipped = r.skipped
  }
  return { ...patch, agentLog: { ...p.agentLog, [messageId]: next } }
}

// What the user has changed since the agent did, as places to name in "You
// edited page 2 since. Undo anyway?". Empty when a plain undo is clean.
export function agentReplyConflicts(p, messageId) {
  const entry = p.agentLog?.[messageId]
  if (!entry || entry.undone) return []
  const places = []
  const fields = p.fields || []
  for (const c of entry.changes || []) {
    const f = fields.find(x => x.key === c.key)
    if (f && editedSince(f, c)) places.push(c.label || c.key)
  }
  if (entry.deckChanges?.length) {
    const { conflicts } = undoDeckOps(p.deck, p.brand, entry.deckChanges)
    for (const c of conflicts) {
      if (c.op === 'brand') { places.push('the deck design'); continue }
      const i = findSlide(p.deck || [], c.slideId || c.slide?.id)
      places.push(i >= 0 ? `page ${i + 1}` : 'a page')
    }
  }
  return [...new Set(places)]
}

// What the user has changed since the reply was undone: the places a Redo
// would overwrite, for "You edited page 2 since. Redo anyway?". Mirrors
// agentReplyConflicts: a part conflicts when it no longer holds what the
// undo put back.
export function agentRedoConflicts(p, messageId) {
  const entry = p.agentLog?.[messageId]
  if (!entry || !entry.undone) return []
  const places = []
  for (const c of entry.changes || []) {
    const f = (p.fields || []).find(x => x.key === c.key)
    if (f && f.value !== c.before?.value) places.push(c.label || c.key)
  }
  const deck = p.deck || [], brand = p.brand || {}
  const page = id => { const i = findSlide(deck, id); return i >= 0 ? `page ${i + 1}` : 'a page' }
  for (const c of entry.deckChanges || []) {
    const si = c.slideId ? findSlide(deck, c.slideId) : -1
    const slide = si >= 0 ? deck[si] : null
    switch (c.op) {
      case 'set_text':
      case 'set_style': {
        const b = slide?.blocks?.find(x => x.id === c.blockId)
        if (b && b[c.field] !== c.before) places.push(page(c.slideId))
        break
      }
      case 'remove_slide': {
        const i = findSlide(deck, c.slide?.id)
        if (i >= 0 && !same(deck[i], c.slide)) places.push(`page ${i + 1}`)
        break
      }
      case 'move_slide':
        if (slide && si !== c.from) places.push(page(c.slideId))
        break
      case 'remove_block': {
        const b = slide?.blocks?.find(x => x.id === c.block?.id)
        if (b && !same(b, c.block)) places.push(page(c.slideId))
        break
      }
      case 'section_name':
        if (slide && slide.websiteNav !== c.before) places.push(page(c.slideId))
        break
      case 'brand':
        if (brand[c.key] !== c.before) places.push('the deck design')
        break
    }
  }
  return [...new Set(places)]
}

// Redo a reply that was undone: the agent's changes go back in.
export function redoAgentReply(p, messageId) {
  const entry = p.agentLog?.[messageId]
  if (!entry || !entry.undone) return {}
  const patch = {}
  const next = { ...entry, undone: false, skipped: [], deckSkipped: [] }
  if (entry.changes?.length) patch.fields = redoAgentEdits(p.fields, entry.changes)
  if (entry.deckChanges?.length) {
    const r = redoDeckOps(p.deck, p.brand, entry.deckChanges)
    if (entry.deckChanges.some(c => c.op !== 'brand')) patch.deck = r.deck
    if (entry.deckChanges.some(c => c.op === 'brand')) patch.brand = r.brand
    next.deckSkipped = r.skipped
  }
  return { ...patch, agentLog: { ...p.agentLog, [messageId]: next } }
}

// "Agent: changed the title on page 1", for the undo history.
export function agentStepLabel(entry) {
  const all = [...(entry?.changes || []).map(c => `changed ${c.label || c.key}`), ...(entry?.deckChanges || []).map(c => c.sentence)]
  if (!all.length) return 'Agent change'
  const first = all[0].charAt(0).toLowerCase() + all[0].slice(1)
  return all.length === 1 ? `Agent: ${first}` : `Agent: ${first} and ${all.length - 1} more`
}
