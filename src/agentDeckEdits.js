// The agent changes the case artifacts: the deck (pages of blocks) and the
// brand. Same rules as agentEdits.js: check every operation again (never trust
// the worker), apply it straight away, and keep what it replaced so it can be
// undone. Undo only puts a part back while it still holds what the agent wrote;
// if the user has edited it since, the user's edit wins. Pure functions.
//
// worker/worker.py parse_deck_ops checks the same operations before they get
// here; keep the two in step.
import { TEXT_STYLES, SLIDE_TEMPLATES, BLOCK_MENU, TOKENS, textBlock, fill } from './deck/model.js'
import { COLOR_KEYS, BRAND_FONTS, cleanFont, normalizeBrand } from './brand.js'
import { applyAgentEdits, undoAgentEdits } from './agentEdits.js'

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
const BRAND_NAMES = { primary: 'Primary colour', background: 'Background', surface: 'Surface colour', text: 'Text colour', muted: 'Muted text colour', headingFont: 'Heading font', bodyFont: 'Body font' }
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

// Plain text: no control characters except new lines and tabs.
function cleanText(v) {
  if (typeof v !== 'string') return { error: 'The new text was not text.' }
  const t = v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\s+$/, '')
  if (!t.trim()) return { error: 'The new text was empty. To take something out, remove the block.' }
  if (t.length > MAX_TEXT) return { error: `The new text is longer than ${MAX_TEXT} characters.` }
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
        record(op, { op: 'add_slide', slide: clone(made), sentence: `Added a page "${slideName(made)}"${after}` })
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
        record(op, { op: 'add_block', slideId: slide.id, block: clone(made), sentence: `Added ${/^[aeiou]/i.test(op.kind) ? 'an' : 'a'} ${op.kind.toLowerCase()} to page ${page}` })
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
      case 'set_brand': {
        const shown = normalizeBrand(br)
        for (const [key, raw] of Object.entries(op)) {
          if (key === 'op' || key === 'reason') continue
          let value
          if (COLOR_KEYS.includes(key)) {
            if (typeof raw !== 'string' || !/^#[0-9a-f]{6}$/i.test(raw)) { refused.push(`${BRAND_NAMES[key]}: "${String(raw).slice(0, 20)}" is not a #rrggbb colour.`); continue }
            value = raw.toLowerCase()
          } else if (BRAND_FONT_KEYS.includes(key)) {
            value = fonts.find(f => f.toLowerCase() === String(raw).trim().toLowerCase())
            if (!value) { refused.push(`${BRAND_NAMES[key]}: "${String(raw).slice(0, 40)}" is not one of the fonts the case can use.`); continue }
          } else { refused.push(`The agent cannot change the brand's ${String(key).slice(0, 30)}.`); continue }
          if (String(br[key] ?? '').toLowerCase() === value.toLowerCase() && br[key] !== undefined) continue
          const before = br[key]
          br = { ...br, [key]: value }
          record(op, { op: 'brand', key, before, after: value, sentence: `${BRAND_NAMES[key]} ${shown[key]} → ${value}` })
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
// still holds what the agent wrote; otherwise it is skipped and reported.
export function undoDeckOps(deck, brand, changes) {
  let d = Array.isArray(deck) ? deck.map(s => ({ ...s, blocks: Array.isArray(s.blocks) ? [...s.blocks] : [] })) : []
  let br = brand && typeof brand === 'object' ? { ...brand } : {}
  const skipped = []
  let restored = 0
  for (const c of [...(changes || [])].reverse()) {
    const si = c.slideId ? findSlide(d, c.slideId) : -1
    const slide = si >= 0 ? d[si] : null
    let ok = false
    switch (c.op) {
      case 'set_text':
      case 'set_style': {
        const bi = slide ? slide.blocks.findIndex(b => b.id === c.blockId) : -1
        if (bi >= 0 && slide.blocks[bi][c.field] === c.after) {
          const b = { ...slide.blocks[bi] }
          if (c.before === undefined) delete b[c.field]; else b[c.field] = c.before
          slide.blocks[bi] = b
          ok = true
        }
        break
      }
      case 'add_slide': {
        const i = findSlide(d, c.slide?.id)
        if (i >= 0 && same(d[i], c.slide)) { d.splice(i, 1); ok = true }
        break
      }
      case 'remove_slide': {
        if (c.slide && findSlide(d, c.slide.id) < 0) { d.splice(Math.min(c.index, d.length), 0, clone(c.slide)); ok = true }
        break
      }
      case 'move_slide': {
        if (slide && si === c.to) { d.splice(si, 1); d.splice(Math.min(c.from, d.length), 0, slide); ok = true }
        break
      }
      case 'add_block': {
        const bi = slide ? slide.blocks.findIndex(b => b.id === c.block?.id) : -1
        if (bi >= 0 && same(slide.blocks[bi], c.block)) { slide.blocks.splice(bi, 1); ok = true }
        break
      }
      case 'remove_block': {
        if (slide && c.block && !slide.blocks.some(b => b.id === c.block.id)) { slide.blocks.splice(Math.min(c.index, slide.blocks.length), 0, clone(c.block)); ok = true }
        break
      }
      case 'brand': {
        if (br[c.key] === c.after) {
          br = { ...br }
          if (c.before === undefined) delete br[c.key]; else br[c.key] = c.before
          ok = true
        }
        break
      }
    }
    if (ok) restored++
    else skipped.push(c.sentence)
  }
  return { deck: d, brand: br, restored, skipped: skipped.reverse() }
}

// One reply can change inputs and the case. Both go into the same agentLog
// entry (keyed by the chat message id, saved with the deal), so a reply is
// applied once and one Undo reverts all of it. Returns a patch for the deal.
export function applyAgentReply(p, messageId, { edits = [], deckOps = [] } = {}, { now } = {}) {
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
    entry.deckRefused = r.refused
  }
  return { ...patch, agentLog: { ...(p.agentLog || {}), [messageId]: entry } }
}

export function undoAgentReply(p, messageId) {
  const entry = p.agentLog?.[messageId]
  if (!entry || entry.undone) return {}
  const patch = {}
  const next = { ...entry, undone: true, skipped: [] }
  if (entry.changes?.length) {
    const r = undoAgentEdits(p.fields, entry.changes)
    patch.fields = r.fields
    next.skipped = r.skipped
  }
  if (entry.deckChanges?.length) {
    const r = undoDeckOps(p.deck, p.brand, entry.deckChanges)
    if (entry.deckChanges.some(c => c.op !== 'brand')) patch.deck = r.deck
    if (entry.deckChanges.some(c => c.op === 'brand')) patch.brand = r.brand
    next.deckSkipped = r.skipped
  }
  return { ...patch, agentLog: { ...p.agentLog, [messageId]: next } }
}
