import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react'
import { AnimatePresence, MotionConfig, Reorder, motion, useDragControls } from 'framer-motion'
import { uid } from '../uid.js'
import BrandPanel from './BrandPanel.jsx'
import DeckLogo from './DeckLogo.jsx'
import { Select, Menu, Popover, UndoRedo, showToast, EASE_OUT, PlusIcon, SearchIcon } from './ui.jsx'
import { brandVars, fontFaceCss, blockDesign, normalizeBrand } from '../brand.js'
import ExportMenu from '../export/ExportMenu.jsx'
import { NO_ONE, resolveStakeholder } from '../deck/stakeholders.js'
import { fileToDataUrl } from '../deck/image.js'
import { slideName } from '../agentDeckEdits.js'
import { stepId } from '../useHistory.js'
import {
  TEXT_STYLES,
  STAT_KEYS,
  TOKENS,
  BLOCK_MENU,
  SLIDE_TEMPLATES,
  buildEnv,
  resolveBlock,
  isEmptyLive,
  slideIsEmpty
} from '../deck/model.js'
import { STAKEHOLDERS } from '../valueModel.js'

// The deck editor. A deck is a list of pages and a page is a list of blocks.
// Left: a rail of pages to jump to and drag into order. Right: the pages.
// Click any text to edit it; click a block to select it, and its tools appear
// in the bar at the top (never over the content). Each page has one "..."
// menu; blocks are added from the "+" line between them, or "/" in empty text.
// Every change is a step in the project's undo history; deletes say so in a
// toast with Undo. Live blocks (numbers, charts) recompute from the project;
// text can use tokens like {company} that fill in automatically.

// Re-exported because the map and people screens resolve stakeholders too.
export const resolve = resolveStakeholder

// How each text style renders: [tag, class].
const TEXT_TAG = {
  hero: ['h1', 'b-hero'],
  headline: ['h2', 'headline'],
  title: ['h2', ''],
  sub: ['p', 'headline-sub'],
  lede: ['p', 'lede'],
  body: ['div', 'body-text'],
  note: ['p', 'note'],
  label: ['div', 'slide-label'],
  eyebrow: ['p', 'eyebrow'],
  tag: ['p', 'tag'],
  forwhom: ['p', 'for-whom'],
  caption: ['p', 'caption']
}
const SINGLE_LINE = new Set(['hero', 'headline', 'title', 'label', 'eyebrow', 'tag', 'forwhom'])
const BLOCK_LABELS = { quote: 'Quote', columns: 'Two columns', image: 'Image', stats: 'Key numbers', drivers: 'Value drivers chart', pairs: 'Today vs with Portal',
  versus: 'Portal vs self-hosting', room: 'Stakeholder brief', logo: 'Logo', divider: 'Divider', spacer: 'Spacer' }
const blockLabel = b => (b.type === 'text' ? (TEXT_STYLES.find(([k]) => k === b.style) || [])[1] || 'Text' : BLOCK_LABELS[b.type] || 'Block')
const HEX = /^#[0-9a-f]{6}$/i
const still = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const typingIn = t => t?.isContentEditable || t?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')

// A page's name in the rail: its heading as the client reads it (tokens
// filled in), else its label.
function railTitle(slide, env) {
  const texts = slide.blocks.filter(b => b.type === 'text').map(b => ({ b, t: String(resolveBlock(b, env).text || '').trim() })).filter(x => x.t)
  const pick = ['hero', 'headline', 'title', 'label', 'eyebrow'].map(st => texts.find(x => x.b.style === st)).find(Boolean) || texts[0]
  return pick ? pick.t : slideName(slide)
}

// The inputs a page is still waiting on, when every figure on it is.
function pageWaiting(slide, env) {
  if (!slideIsEmpty(slide, env)) return null
  const missing = new Set()
  for (const b of slide.blocks) for (const label of resolveBlock(b, env).waiting || []) missing.add(label)
  return [...missing]
}

export default function Deck({ inputs, model, fields, connectors, stakeholders, onStakeholders, deck, onDeck, company, onWebsite, brand, onBrand, onScanBrand, initialAudienceKey, previewRequest, onPreviewOpened, onFillInputs, history }) {
  const [designOpen, setDesignOpen] = useState(false)
  const available = stakeholders.map(resolve).filter(Boolean)
  const [activeKey, setActiveKey] = useState(initialAudienceKey || available[0]?.key)
  const active = available.find(s => s.key === activeKey) || available[0] || NO_ONE
  const canEditStakeholder = active.key !== 'none'
  const env = buildEnv(inputs, fields, active, model)
  const shown = normalizeBrand(brand)

  // Which page is current (rail highlight, its menu always shown) and which
  // block is selected (outline + the tools in the bar).
  const [page, setPage] = useState(deck[0]?.id || null)
  const [sel, setSel] = useState(null) // { slideId, blockId }
  const pageIndex = id => deck.findIndex(s => s.id === id)
  const selSlide = sel && deck.find(s => s.id === sel.slideId)
  const selBlock = selSlide?.blocks.find(b => b.id === sel.blockId) || null

  // The rail and the pages sit under the sticky toolbar; keep its height in a
  // CSS variable so the rail and scroll targets line up with it.
  const wrap = useRef(null)
  const bar = useRef(null)
  useLayoutEffect(() => {
    const el = bar.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const set = () => wrap.current?.style.setProperty('--deck-top', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Escape deselects the block (unless something on top handled it first).
  useEffect(() => {
    if (!sel) return
    const onKey = e => { if (e.key === 'Escape' && !e.defaultPrevented && !typingIn(e.target)) setSel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel])

  // Scrolling moves the current page to the one at the top of the view.
  const jumping = useRef(0)
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame || Date.now() < jumping.current) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const top = (bar.current?.getBoundingClientRect().bottom || 0) + 120
        const pages = [...(wrap.current?.querySelectorAll('.slide-wrap[data-slide]') || [])]
        const at = pages.find(p => p.getBoundingClientRect().bottom > top) || pages[pages.length - 1]
        if (at) setPage(at.dataset.slide)
      })
    }
    window.addEventListener('scroll', onScroll, true)
    return () => { window.removeEventListener('scroll', onScroll, true); cancelAnimationFrame(frame) }
  }, [])
  function goTo(id) {
    setPage(id)
    jumping.current = Date.now() + 700
    wrap.current?.querySelector(`.slide-wrap[data-slide="${id}"]`)?.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' })
  }

  // ---- slide and block operations. Each is one labelled history step.
  const edit = (fn, label, extra) => onDeck(fn, { label, ...extra })
  const undoToast = (message, label, fn) => {
    const id = stepId()
    edit(fn, label, { id })
    showToast({ message, action: { label: 'Undo', onClick: () => history?.undoIf(id) } })
  }
  const patchSlide = (id, fn, label, extra) => edit(list => list.map(s => (s.id === id ? fn(s) : s)), label, extra)
  const moveSlideTo = (id, to) => {
    const from = pageIndex(id)
    if (from < 0 || to < 0 || to >= deck.length || to === from) return
    undoToast('Page moved', `Moved page ${from + 1} to page ${to + 1}`, list => {
      const i = list.findIndex(s => s.id === id)
      if (i < 0) return list
      const next = [...list]
      const [s] = next.splice(i, 1)
      next.splice(to, 0, s)
      return next
    })
  }
  const reorderSlides = ids => {
    const from = deck.findIndex((s, i) => s.id !== ids[i])
    if (from < 0) return
    // Moved down: what was below it now sits in its place. Otherwise it moved up into `from`.
    const moved = ids[from] === deck[from + 1]?.id ? deck[from].id : ids[from]
    undoToast('Page moved', `Moved page ${pageIndex(moved) + 1} to page ${ids.indexOf(moved) + 1}`, list => ids.map(id => list.find(s => s.id === id)).filter(Boolean).concat(list.filter(s => !ids.includes(s.id))))
  }
  const duplicateSlide = id => {
    const i = pageIndex(id)
    const copy = { ...deck[i], id: uid(), blocks: deck[i].blocks.map(b => ({ ...b, id: uid() })) }
    undoToast('Page duplicated', `Duplicated page ${i + 1}`, list => {
      const at = list.findIndex(s => s.id === id)
      return [...list.slice(0, at + 1), copy, ...list.slice(at + 1)]
    })
    setPage(copy.id)
  }
  const removeSlide = id => {
    const i = pageIndex(id)
    if (sel?.slideId === id) setSel(null)
    undoToast('Page deleted', `Deleted page ${i + 1}`, list => list.filter(s => s.id !== id))
  }
  const addSlide = (make, afterId) => {
    const made = make()
    const at = afterId ? pageIndex(afterId) + 1 : deck.length
    edit(list => [...list.slice(0, at), made, ...list.slice(at)], `Added page ${at + 1}`)
    setTimeout(() => goTo(made.id), 60)
  }

  const patchBlock = (slideId, blockId, fn, label, extra) =>
    patchSlide(slideId, s => ({ ...s, blocks: s.blocks.map(b => (b.id === blockId ? fn(b) : b)) }), label || `Edited page ${pageIndex(slideId) + 1}`, extra)
  const moveBlock = (slideId, blockId, dir) => {
    const s = deck.find(x => x.id === slideId)
    const i = s?.blocks.findIndex(b => b.id === blockId) ?? -1
    const j = i + dir
    if (i < 0 || j < 0 || j >= s.blocks.length) return
    patchSlide(slideId, x => {
      const blocks = [...x.blocks]
      ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
      return { ...x, blocks }
    }, `Moved a block on page ${pageIndex(slideId) + 1}`)
  }
  const reorderBlocks = (slideId, ids) =>
    patchSlide(slideId, s => ({ ...s, blocks: ids.map(id => s.blocks.find(b => b.id === id)).filter(Boolean) }), `Moved a block on page ${pageIndex(slideId) + 1}`)
  const removeBlock = (slideId, blockId) => {
    if (sel?.blockId === blockId) setSel(null)
    undoToast('Block deleted', `Deleted a block on page ${pageIndex(slideId) + 1}`, list =>
      list.map(s => (s.id === slideId ? { ...s, blocks: s.blocks.filter(b => b.id !== blockId) } : s)))
  }
  const duplicateBlock = (slideId, blockId) => {
    const copyId = uid()
    patchSlide(slideId, s => {
      const i = s.blocks.findIndex(b => b.id === blockId)
      return i < 0 ? s : { ...s, blocks: [...s.blocks.slice(0, i + 1), { ...s.blocks[i], id: copyId }, ...s.blocks.slice(i + 1)] }
    }, `Duplicated a block on page ${pageIndex(slideId) + 1}`)
    setSel({ slideId, blockId: copyId })
  }
  // Insert at `at`, or in place of the block `replace` ("/" in empty text).
  const insertBlock = (slideId, at, make, replace) => {
    const made = make()
    patchSlide(slideId, s => {
      const blocks = [...s.blocks]
      const r = replace ? blocks.findIndex(b => b.id === replace) : -1
      if (r >= 0) blocks.splice(r, 1, made)
      else blocks.splice(Math.min(at, blocks.length), 0, made)
      return { ...s, blocks }
    }, `Added a block to page ${pageIndex(slideId) + 1}`)
    setSel({ slideId, blockId: made.id })
  }

  function setStakeholderText(field, value) {
    onStakeholders(list =>
      list.map(s => (s.key === active.key ? { ...s, edit: { ...(s.edit || {}), [field]: value } } : s)),
      { label: 'Edited the stakeholder brief', key: `stake:${active.key}:${field}` }
    )
  }
  function removeStakeholder() {
    const id = stepId()
    onStakeholders(list => list.filter(s => s.key !== active.key), { label: `Removed ${active.role}`, id })
    showToast({ message: 'Stakeholder removed', action: { label: 'Undo', onClick: () => history?.undoIf(id) } })
  }

  const ops = { patchSlide, patchBlock, moveBlock, reorderBlocks, removeBlock, duplicateBlock, insertBlock, moveSlideTo, duplicateSlide, removeSlide }

  return (
    <MotionConfig reducedMotion="user">
    <main className="deck-wrap deck-editor-wrap" ref={wrap}>
      <div className="deck-top no-print" ref={bar}>
        <nav className="toolbar">
          <div className="who">
            <label className="who-label" htmlFor="deck-stakeholder">Stakeholder</label>
            <div className="stakeholder-select-row">
              <Select id="deck-stakeholder" aria-label="Stakeholder framing" value={active.key} disabled={!available.length} onChange={setActiveKey}
                options={available.length ? available.map(s => ({ value: s.key, label: `${s.role}${stakeholders.find(x => x.key === s.key)?.namedPeople?.length ? ` · ${stakeholders.find(x => x.key === s.key).namedPeople.map(p => p.name).join(', ')}` : ''}` })) : [{ value: 'none', label: 'No stakeholder selected' }]} />
              <AddStakeholder
                existing={stakeholders}
                onAdd={s => {
                  onStakeholders(list => [...list, s], { label: 'Added a stakeholder' })
                  setActiveKey(s.key)
                }}
              />
              <button className="ghost stakeholder-remove" disabled={!canEditStakeholder} title={`Remove ${active.role}`} aria-label={`Remove ${active.role}`} onClick={removeStakeholder}>×</button>
            </div>
          </div>
          <div className="toolbar-actions">
            <UndoRedo history={history} />
            <button className="ghost" onClick={() => setDesignOpen(v => !v)} aria-expanded={designOpen}>Deck design{brand?.status === 'scanning' ? ' · scanning' : ''}</button>
            <ExportMenu
              requestedView={previewRequest}
              onViewOpened={onPreviewOpened}
              brand={brand}
              company={company}
              deck={deck}
              inputs={inputs}
              fields={fields}
              connectors={connectors}
              stakeholders={available}
              activeKey={active.key}
              onWebsite={key => onWebsite(key || active.key)}
              onFillInputs={onFillInputs}
            />
          </div>
        </nav>
        <BlockBar
          block={selBlock}
          slideId={selSlide?.id}
          pageNo={selSlide ? pageIndex(selSlide.id) + 1 : 0}
          brand={brand}
          ops={ops}
          onClose={() => setSel(null)}
        />
      </div>

      {designOpen && <BrandPanel brand={brand} onChange={onBrand} onScan={onScanBrand} onClose={() => setDesignOpen(false)} />}
      <style>{fontFaceCss(brand)}</style>
      <div className="deck-editor">
        <PageRail deck={deck} env={env} brand={brand} current={page} onGo={goTo} onReorder={reorderSlides} onMove={moveSlideTo}
          onAdd={make => addSlide(make, page)} />
        <div className="deck customer-deck" style={brandVars(brand)}
          onPointerDown={e => { if (!e.target.closest('.block') && !e.target.closest('.popover')) setSel(null) }}>
          <AnimatePresence initial={false}>
            {deck.map((slide, idx) => (
              <PageEditor
                key={slide.id}
                slide={slide}
                idx={idx}
                count={deck.length}
                env={env}
                brand={brand}
                shown={shown}
                current={page === slide.id}
                sel={sel?.slideId === slide.id ? sel.blockId : null}
                onCurrent={() => setPage(slide.id)}
                onSelect={blockId => { setPage(slide.id); setSel({ slideId: slide.id, blockId }) }}
                onFillInputs={onFillInputs}
                canEditStakeholder={canEditStakeholder}
                onStakeholderText={setStakeholderText}
                ops={ops}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
    </MotionConfig>
  )
}

// ------------------------------------------------------------------- rail

function PageRail({ deck, env, brand, current, onGo, onReorder, onMove, onAdd }) {
  const ids = useMemo(() => deck.map(s => s.id), [deck])
  const [order, setOrderState] = useState(null) // while dragging; committed on drop
  const orderRef = useRef(null)
  const setOrder = o => { orderRef.current = o; setOrderState(o) }
  const [dragging, setDragging] = useState(null)
  const [picker, setPicker] = useState(false)
  const addRef = useRef(null)
  const values = order && order.length === ids.length && order.every(id => ids.includes(id)) ? order : ids
  const byId = new Map(deck.map(s => [s.id, s]))
  const railRef = useRef(null)
  useEffect(() => { railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' }) }, [current])

  return (
    <aside className="page-rail no-print" aria-label="Pages" style={brandVars(brand)} ref={railRef}>
      <Reorder.Group as="ol" axis="y" values={values} onReorder={setOrder} className="rail-list">
        {values.map((id, i) => {
          const s = byId.get(id)
          if (!s) return null
          const hidden = slideIsEmpty(s, env)
          return (
            <Reorder.Item key={id} value={id} as="li" tabIndex={-1} className={`rail-item${dragging === id ? ' is-dragging' : ''}`}
              whileDrag={{ scale: 1.04 }} transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              onDragStart={() => setDragging(id)}
              onDragEnd={() => {
                setDragging(null)
                const o = orderRef.current
                if (o && o.some((x, j) => x !== ids[j])) onReorder(o)
                setOrder(null)
              }}>
              <button type="button" className="rail-thumb" data-slide={id} aria-current={current === id ? 'true' : undefined}
                aria-label={`Page ${i + 1}: ${railTitle(s, env)}${hidden ? ', hidden from the client' : ''}. Alt+Up or Alt+Down moves it.`}
                onClick={() => onGo(id)}
                onKeyDown={e => {
                  if (!e.altKey || !['ArrowUp', 'ArrowDown'].includes(e.key)) return
                  e.preventDefault()
                  onMove(id, i + (e.key === 'ArrowUp' ? -1 : 1))
                }}>
                <span className="rail-num">{i + 1}</span>
                <span className={`rail-card${s.variant === 'hero' ? ' is-hero' : ''}`} style={HEX.test(s.design?.background) ? { background: s.design.background } : undefined}>
                  <span className="rail-title">{railTitle(s, env)}</span>
                  {hidden && <span className="hidden-pill">Hidden</span>}
                </span>
              </button>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
      <button ref={addRef} type="button" className="rail-add" aria-expanded={picker} aria-haspopup="dialog" onClick={() => setPicker(o => !o)}>
        <PlusIcon size={14} />New page
      </button>
      <Popover open={picker} anchor={addRef} onClose={() => setPicker(false)} label="Page templates" className="template-pop" height={360}>
        <p className="pop-title">Add a page after the current one</p>
        <div className="template-grid">
          {SLIDE_TEMPLATES.map(t => (
            <button key={t.key} type="button" className="pick-item" onClick={() => { setPicker(false); onAdd(t.make) }}>{t.name}</button>
          ))}
        </div>
      </Popover>
    </aside>
  )
}

// ------------------------------------------------------------------- pages

function PageEditor({ slide, idx, count, env, brand, shown, current, sel, onCurrent, onSelect, onFillInputs, canEditStakeholder, onStakeholderText, ops }) {
  const no = idx + 1
  const waiting = pageWaiting(slide, env)
  const head = useRef(null)
  const zone = useRef(null)
  const blocksRef = useRef(null)
  const [color, setColor] = useState(null) // 'page' | 'text'
  const [showWhich, setShowWhich] = useState(false)
  // The "+" line: which gap the pointer is near ({ at, y }), and the picker.
  const [gap, setGap] = useState(null)
  const [picker, setPicker] = useState(null) // { at, replace?, anchor, line? }
  const plusRef = useRef(null)
  const emptyRef = useRef(null)
  const line = picker?.line || gap
  // Block drag: the order while dragging, committed on drop.
  const ids = slide.blocks.map(b => b.id)
  const [order, setOrderState] = useState(null)
  const orderRef = useRef(null)
  const setOrder = o => { orderRef.current = o; setOrderState(o) }
  const [dragging, setDragging] = useState(false)
  const values = order && order.length === ids.length && order.every(id => ids.includes(id)) ? order : ids
  const byId = new Map(slide.blocks.map(b => [b.id, b]))

  function onMove(e) {
    if (picker || dragging) return
    const box = blocksRef.current
    if (!box || !zone.current) return
    const items = [...box.querySelectorAll(':scope > .block')]
    if (!items.length) return setGap(null)
    const top = zone.current.getBoundingClientRect().top
    let best = null
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const next = items[i + 1]?.getBoundingClientRect()
      const y = next ? (r.bottom + next.top) / 2 : r.bottom + 10
      const d = Math.abs(e.clientY - y)
      if (d < 12 && (!best || d < best.d)) best = { at: i + 1, y: y - top, d }
    })
    setGap(g => (best ? (g && g.at === best.at && g.y === best.y ? g : { at: best.at, y: best.y }) : null))
  }

  const pageColor = HEX.test(slide.design?.background) ? slide.design.background : shown.background
  const textColor = slide.blocks.find(b => b.design?.color)?.design.color || shown.text
  const menu = [
    { label: 'Page colour', onSelect: () => setColor('page') },
    { label: 'Text colour', onSelect: () => setColor('text') },
    { label: slide.variant === 'hero' ? 'Turn off hero background' : 'Hero background', onSelect: () => ops.patchSlide(slide.id, s => ({ ...s, variant: s.variant === 'hero' ? 'plain' : 'hero' }), `Changed the background of page ${no}`) },
    { label: 'Add a block', onSelect: () => setPicker({ at: slide.blocks.length, anchor: head }) },
    { label: 'Duplicate', onSelect: () => ops.duplicateSlide(slide.id) },
    { label: 'Move up', disabled: idx === 0, onSelect: () => ops.moveSlideTo(slide.id, idx - 1) },
    { label: 'Move down', disabled: idx === count - 1, onSelect: () => ops.moveSlideTo(slide.id, idx + 1) },
    { label: 'Delete page', danger: true, onSelect: () => ops.removeSlide(slide.id) }
  ]

  return (
    <motion.div className={`slide-wrap${waiting ? ' slide-incomplete' : ''}${current ? ' is-current' : ''}`} data-slide={slide.id}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.18, ease: EASE_OUT }}
      onPointerDown={() => { if (!current) onCurrent() }}>
      <div className="slide-head no-print" ref={head}>
        <span className="slide-num">Page {no}</span>
        {waiting && <span className="hidden-pill">Hidden</span>}
        <span className="slide-head-space" />
        <Menu label={`Page ${no} options`} title="Page options" className="icon-btn page-more" items={menu} />
      </div>
      {waiting && (
        <div className="page-hidden-note no-print">
          <p>
            Hidden from the client until {waiting.length || 'its'} {waiting.length === 1 ? 'input is' : 'inputs are'} filled in.{' '}
            {onFillInputs && <button type="button" className="link-btn" onClick={onFillInputs}>Fill them in</button>}
            {waiting.length > 0 && <button type="button" className="link-btn quiet" aria-expanded={showWhich} onClick={() => setShowWhich(v => !v)}>{showWhich ? 'Hide' : 'Show which'}</button>}
          </p>
          {showWhich && <ul className="waiting-list">{waiting.map(w => <li key={w}>{w}</li>)}</ul>}
        </div>
      )}
      <Popover open={!!color} anchor={head} align="right" onClose={() => setColor(null)} label={color === 'page' ? `Page ${no} colour` : `Page ${no} text colour`} className="color-pop">
        <ColorPicker title={color === 'page' ? 'Page colour' : 'Text colour'} value={color === 'page' ? pageColor : textColor} brand={shown}
          onPick={c => {
            if (color === 'page') ops.patchSlide(slide.id, s => ({ ...s, design: { ...s.design, background: c } }), `Changed the colour of page ${no}`, { key: `pagebg:${slide.id}` })
            else ops.patchSlide(slide.id, s => ({ ...s, blocks: s.blocks.map(b => (['logo', 'image'].includes(b.type) ? b : { ...b, design: { ...b.design, color: c } })) }), `Changed the text colour of page ${no}`, { key: `pagetext:${slide.id}` })
          }} />
      </Popover>

      <section className={`slide ${slide.variant === 'hero' ? 'slide-hero' : ''}`} style={HEX.test(slide.design?.background) ? { background: slide.design.background, '--page-background': slide.design.background } : undefined}>
        <div className="blocks-zone" ref={zone} onPointerMove={onMove} onPointerLeave={() => { if (!picker) setGap(null) }}>
          <Reorder.Group as="div" axis="y" values={values} onReorder={setOrder} className="blocks" ref={blocksRef}>
            {values.map((id, bi) => {
              const b = byId.get(id)
              if (!b) return null
              return (
                <BlockEditor
                  key={b.id}
                  block={b}
                  brand={brand}
                  env={env}
                  no={no}
                  first={bi === 0}
                  last={bi === values.length - 1}
                  selected={sel === b.id}
                  dragging={dragging}
                  onSelect={() => onSelect(b.id)}
                  canEditStakeholder={canEditStakeholder}
                  onPatch={(fn, label, extra) => ops.patchBlock(slide.id, b.id, fn, `${label} on page ${no}`, extra)}
                  onMove={dir => ops.moveBlock(slide.id, b.id, dir)}
                  onRemove={() => ops.removeBlock(slide.id, b.id)}
                  onSlash={el => setPicker({ at: bi, replace: b.id, anchor: el })}
                  onDragStart={() => setDragging(true)}
                  onDragEnd={() => {
                    setTimeout(() => setDragging(false), 320)
                    const o = orderRef.current
                    if (o && o.some((x, j) => x !== ids[j])) ops.reorderBlocks(slide.id, o)
                    setOrder(null)
                  }}
                  onStakeholderText={onStakeholderText}
                />
              )
            })}
          </Reorder.Group>
          {slide.blocks.length === 0 && (
            <p className="empty-slide">This page is empty. <button type="button" className="link-btn" ref={emptyRef} onClick={() => setPicker({ at: 0, anchor: emptyRef })}>Add a block</button></p>
          )}
          {line && slide.blocks.length > 0 && (
            <div className="insert-line no-print" style={{ top: line.y }}>
              <button ref={plusRef} type="button" className="insert-plus" aria-label="Add a block here" title="Add a block here" aria-expanded={!!picker?.line}
                onClick={() => setPicker(p => (p?.line ? null : { at: line.at, anchor: plusRef, line }))}>
                <PlusIcon size={12} />
              </button>
            </div>
          )}
        </div>
      </section>
      <Popover open={!!picker} anchor={picker?.anchor} onClose={() => { setPicker(null); setGap(null) }} label="Add a block" className="block-pop" height={340}>
        <BlockPicker onPick={item => { ops.insertBlock(slide.id, picker.at, item.make, picker.replace); setPicker(null); setGap(null) }} />
      </Popover>
    </motion.div>
  )
}

// The block menu as a popover you can type into.
function BlockPicker({ onPick }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const list = BLOCK_MENU.filter(i => i.name.toLowerCase().includes(q.trim().toLowerCase()))
  const box = useRef(null)
  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { box.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' }) }, [active])
  return (
    <div className="block-picker">
      <label className="pick-search">
        <SearchIcon />
        <input autoFocus value={q} placeholder="Find a block" aria-label="Find a block" onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, list.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
            else if (e.key === 'Enter' && list[active]) { e.preventDefault(); onPick(list[active]) }
          }} />
      </label>
      <div className="pick-list" role="listbox" aria-label="Blocks" ref={box}>
        {list.map((item, i) => (
          <button key={item.name} type="button" role="option" aria-selected={i === active} data-i={i} className={`pick-item${i === active ? ' is-active' : ''}`}
            onMouseMove={() => i !== active && setActive(i)} onClick={() => onPick(item)}>{item.name}</button>
        ))}
        {!list.length && <p className="pick-empty">No block called that.</p>}
      </div>
    </div>
  )
}

// Brand colours as swatches, then any colour by hex or the system picker.
function ColorPicker({ title, value, brand, onPick, extra }) {
  const [draft, setDraft] = useState(value || '')
  useEffect(() => { setDraft(value || '') }, [value])
  const swatches = [...new Set([brand.primary, brand.background, brand.surface, brand.text, brand.muted, '#ffffff', '#000000'].filter(c => HEX.test(c || '')).map(c => c.toLowerCase()))]
  return (
    <div className="color-picker">
      <p className="pop-title">{title}</p>
      <div className="swatches" role="group" aria-label="Brand colours">
        {swatches.map(c => (
          <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={c} title={c} aria-pressed={String(value).toLowerCase() === c} onClick={() => onPick(c)} />
        ))}
      </div>
      {extra}
      <div className="color-custom">
        <input className="color-hex" aria-label="Custom colour, hex" placeholder="#rrggbb" maxLength={7} value={draft}
          onChange={e => { const c = e.target.value.trim(); setDraft(c); if (HEX.test(c)) onPick(c) }} />
        <input type="color" aria-label="Pick a custom colour" value={HEX.test(value || '') ? value : '#000000'} onChange={e => onPick(e.target.value)} />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ blocks

// The selected block's tools, in the bar under the toolbar: never over the
// content. With nothing selected it says how to get them.
function BlockBar({ block: b, slideId, pageNo, brand, ops, onClose }) {
  const [open, setOpen] = useState(null) // 'color' | 'more' | 'show'
  const colorRef = useRef(null)
  const moreRef = useRef(null)
  const showRef = useRef(null)
  useEffect(() => { setOpen(null) }, [b?.id])
  const shown = normalizeBrand(brand)
  const patch = (fn, what, key) => ops.patchBlock(slideId, b.id, fn, `${what} on page ${pageNo}`, key ? { key: `${key}:${b.id}` } : undefined)
  const design = (k, v, what = 'Changed formatting') => patch(x => ({ ...x, design: { ...x.design, [k]: v } }), what, `design-${k}`)
  const textual = b && !['logo', 'image', 'divider', 'spacer'].includes(b.type)
  const backgroundKey = b?.type === 'text' && b?.style === 'tag' ? 'badgeBackground' : 'background'

  return (
    <div className="block-bar" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {!b ? (
          <motion.p key="hint" className="block-bar-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            Click a block to style it. Drag pages in the list to reorder them.
          </motion.p>
        ) : (
          <motion.div key="tools" className="block-bar-tools" role="toolbar" aria-label={`${blockLabel(b)} on page ${pageNo}`}
            initial={{ opacity: 0, transform: 'scale(0.97)' }} animate={{ opacity: 1, transform: 'scale(1)' }} exit={{ opacity: 0, transform: 'scale(0.97)' }} transition={{ duration: 0.14, ease: EASE_OUT }}>
            <span className="block-bar-name">{blockLabel(b)}<small>Page {pageNo}</small></span>
            {b.type === 'text' && (
              <Select className="block-style" value={b.style} title="Text style" aria-label="Text style"
                onChange={style => patch(x => ({ ...x, style }), 'Changed the text style')}
                options={TEXT_STYLES.map(([k, label]) => ({ value: k, label }))} />
            )}
            {textual && <>
              <div className="seg" role="group" aria-label="Alignment">
                {['left', 'center', 'right'].map(a => (
                  <button key={a} type="button" className="icon-btn seg-btn" aria-pressed={(b.design?.align || 'left') === a} aria-label={`Align ${a}`} title={`Align ${a}`} onClick={() => design('align', a, 'Changed the alignment')}>
                    <AlignIcon align={a} />
                  </button>
                ))}
              </div>
              <Select className="block-weight" value={b.design?.weight || ''} title="Weight" aria-label="Font weight" onChange={w => design('weight', w, 'Changed the weight')}
                options={[{ value: '', label: 'Auto weight' }, ...['400', '500', '600', '700', '800', '900'].map(w => ({ value: w, label: `Weight ${w}` }))]} />
              <button ref={colorRef} type="button" className="bar-btn" aria-expanded={open === 'color'} onClick={() => setOpen(o => (o === 'color' ? null : 'color'))}>
                <span className="dot" style={{ background: b.design?.color || shown.text }} />Colour
              </button>
            </>}
            {b.type === 'stats' && <button ref={showRef} type="button" className="bar-btn" aria-expanded={open === 'show'} onClick={() => setOpen(o => (o === 'show' ? null : 'show'))}>Show</button>}
            {b.type === 'image' && <>
              <label className="bar-btn">
                <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && pickImage(e.target.files[0], fn => patch(fn, 'Changed the image'))} />
                {b.src ? 'Replace image' : 'Choose image'}
              </label>
              {b.src && <button type="button" className="bar-btn" onClick={() => patch(x => ({ ...x, src: '' }), 'Removed the image')}>Remove image</button>}
            </>}
            {textual && <button ref={moreRef} type="button" className="bar-btn" aria-expanded={open === 'more'} onClick={() => setOpen(o => (o === 'more' ? null : 'more'))}>More</button>}
            <span className="bar-sep" />
            <button type="button" className="bar-btn" onClick={() => ops.duplicateBlock(slideId, b.id)}>Duplicate</button>
            <button type="button" className="bar-btn is-danger" onClick={() => ops.removeBlock(slideId, b.id)}>Delete</button>
            <button type="button" className="icon-btn bar-close" aria-label="Deselect (Escape)" title="Deselect (Escape)" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" /></svg>
            </button>

            <Popover open={open === 'color'} anchor={colorRef} onClose={() => setOpen(null)} label="Text colour" className="color-pop">
              <ColorPicker title="Text colour" value={b.design?.color || shown.text} brand={shown} onPick={c => design('color', c, 'Changed the text colour')} />
            </Popover>
            <Popover open={open === 'more'} anchor={moreRef} onClose={() => setOpen(null)} label="More formatting" className="format-pop" height={380}>
              <div className="format-grid">
                <label>Font size<input type="number" min="10" max="120" placeholder="Auto" value={b.design?.fontSize || ''} onChange={e => design('fontSize', e.target.value, 'Changed the font size')} /></label>
                <label>Font<input placeholder="Deck font" value={b.design?.font || ''} onChange={e => design('font', e.target.value, 'Changed the font')} /></label>
              </div>
              <ColorPicker title="Background" value={HEX.test(b.design?.[backgroundKey] || '') ? b.design[backgroundKey] : ''} brand={shown} onPick={c => design(backgroundKey, c, 'Changed the background')}
                extra={<button type="button" className="bar-btn transparent-color" aria-pressed={b.design?.[backgroundKey] === 'transparent'} onClick={() => design(backgroundKey, 'transparent', 'Changed the background')}><span className="transparency-swatch" />Transparent</button>} />
              <button type="button" className="bar-btn reset-format" onClick={() => patch(x => ({ ...x, design: {} }), 'Reset the formatting')}>Reset formatting</button>
            </Popover>
            <Popover open={open === 'show'} anchor={showRef} onClose={() => setOpen(null)} label="Numbers to show" className="format-pop">
              <p className="pop-title">Numbers to show</p>
              <div className="chips">
                {STAT_KEYS.map(([k, label]) => {
                  const on = (b.items || STAT_KEYS.map(([x]) => x)).includes(k)
                  return (
                    <label key={k} className={`chip ${on ? 'chip-on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => patch(x => {
                        const cur = x.items || STAT_KEYS.map(([y]) => y)
                        return { ...x, items: on ? cur.filter(y => y !== k) : STAT_KEYS.map(([y]) => y).filter(y => cur.includes(y) || y === k) }
                      }, 'Changed the key numbers')} />
                      {label}
                    </label>
                  )
                })}
              </div>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AlignIcon({ align }) {
  const mid = { left: 'M3 8h6', center: 'M5 8h6', right: 'M7 8h6' }[align]
  const low = { left: 'M3 12h8', center: 'M4 12h8', right: 'M5 12h8' }[align]
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 4h10" /><path d={mid} /><path d={low} />
    </svg>
  )
}

function BlockEditor({ block: b, no, first, last, selected, dragging, env, canEditStakeholder, onSelect, onPatch, onMove, onRemove, onSlash, onDragStart, onDragEnd, onStakeholderText, brand }) {
  const [badgeColors, setBadgeColors] = useState(false)
  const [badgeTextEditing, setBadgeTextEditing] = useState(false)
  const [hover, setHover] = useState(false)
  const [held, setHeld] = useState(false)
  const controls = useDragControls()
  const r = resolveBlock(b, env)
  const textKey = field => ({ key: `text:${b.id}:${field}` })

  let content = null
  switch (b.type) {
    case 'text': {
      const [Tag, cls] = TEXT_TAG[b.style] || TEXT_TAG.body
      const body = b.style === 'body'
      if (b.style === 'tag' && !badgeTextEditing) {
        content = <div className="editable-badge">
          <button className="tag tag-color-target" aria-label="Change badge background color" aria-expanded={badgeColors} title="Click to change background color" onClick={() => setBadgeColors(v => !v)}>{r.text || 'Add a label'}</button>
          {badgeColors && <div className="badge-color-panel no-print" role="group" aria-label="Badge background colors">
            <div className="badge-panel-head"><strong>Text background</strong><button className="tool" aria-label="Close badge colors" onClick={() => setBadgeColors(false)}>×</button></div>
            <div className="badge-swatches">{['#29261F', '#1DB954', '#123D32', '#253453', '#482B54', '#733A22', '#FFFFFF', '#000000'].map(color => <button key={color} type="button" className="badge-swatch" style={{ background: color }} aria-label={`Badge background ${color}`} onClick={() => onPatch(x => ({ ...x, design: { ...x.design, badgeBackground: color } }), 'Changed the label colour')} />)}</div>
            <button className="ghost transparent-color" aria-pressed={b.design?.badgeBackground === 'transparent'} onClick={() => onPatch(x => ({ ...x, design: { ...x.design, badgeBackground: 'transparent' } }), 'Changed the label colour')}><span className="transparency-swatch" />Transparent</button>
            <label className="badge-custom-color">Custom color<input type="color" aria-label="Badge background color" value={HEX.test(b.design?.badgeBackground || '') ? b.design.badgeBackground : '#29261F'} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, badgeBackground: e.target.value } }), 'Changed the label colour', { key: `badge:${b.id}` })} /></label>
            <button className="ghost" onClick={() => { setBadgeColors(false); setBadgeTextEditing(true) }}>Edit label text</button>
            <button className="ghost delete-element" onClick={onRemove}>Delete label</button>
          </div>}
        </div>
        break
      }
      content = (
        <Editable
          as={Tag}
          className={cls}
          single={SINGLE_LINE.has(b.style)}
          minRows={body ? 3 : 1}
          value={b.text}
          hint={tokenHint(b.text)}
          onChange={v => onPatch(x => ({ ...x, text: v }), `Edited text`, textKey('text'))}
          onSlash={onSlash}
          onFinish={b.style === 'tag' ? () => setBadgeTextEditing(false) : undefined}
        >
          {body ? <Body paras={r.paras} /> : r.text}
        </Editable>
      )
      break
    }
    case 'quote':
      content = <Editable as="blockquote" value={b.text} minRows={2} onChange={v => onPatch(x => ({ ...x, text: v }), 'Edited text', textKey('text'))}>{r.text}</Editable>
      break
    case 'columns':
      content = (
        <div className="two-col">
          {['left', 'right'].map(side => (
            <Editable key={side} as="div" minRows={4} value={b[side]} hint="Start a line with “- ” for a bullet." onChange={v => onPatch(x => ({ ...x, [side]: v }), 'Edited text', textKey(side))}>
              <Body paras={r[side]} />
            </Editable>
          ))}
        </div>
      )
      break
    case 'image':
      content = (
        <figure className="b-image">
          {b.src ? (
            <img src={b.src} alt={b.caption || ''} />
          ) : (
            <label className="image-drop no-print">
              <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && pickImage(e.target.files[0], fn => onPatch(fn, 'Changed the image'))} />
              Choose an image
            </label>
          )}
          {(b.src || b.caption) && (
            <Editable as="figcaption" single value={b.caption || ''} placeholder="Add a caption" onChange={v => onPatch(x => ({ ...x, caption: v }), 'Edited the caption', textKey('caption'))}>
              {r.caption}
            </Editable>
          )}
        </figure>
      )
      break
    case 'stats':
      content = (
        <div className="stats">
          {r.items.map(i => (
            <div key={i.key} className={`stat ${i.tone ? `stat-${i.tone}` : ''}`}>
              <span className="stat-label">{i.label}</span>
              <strong className="stat-value">{i.value}</strong>
              {i.eq && <span className="eq">{i.eq}</span>}
            </div>
          ))}
        </div>
      )
      break
    case 'drivers':
      content = (
        <>
          <div className="chart">
            {r.groups.map(g => (
              <section key={g.key} className={`pillar ${g.leads ? 'pillar-lead' : ''}`} data-pillar={g.key}>
                <h3 className="pillar-head">
                  {g.label}
                  <span className="pillar-total">{g.total}</span>
                </h3>
                {g.rows.map(d => (
                  <div key={d.key} className={`bar-row ${d.lead ? 'bar-lead' : ''}`} data-driver={d.key}>
                    <div className="bar-label">
                      {d.label}
                      {d.lead && <span className="lead-dot" title="Leads for this stakeholder" />}
                    </div>
                    <div className="bar-track">
                      <div className="bar-bar" style={{ width: `${d.pct}%`, background: d.color, opacity: d.lead ? 1 : 0.45 }} />
                    </div>
                    <div className="bar-value">{d.valueStr}</div>
                    <div className="bar-detail eq">
                      {d.detail}
                      {d.flag && <span className="flag"> ({d.flag})</span>}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <div className="total-row">
            <span>Total annual value</span>
            <strong>{r.total}</strong>
          </div>
          <p className="eq eq-total">{r.totalEq}</p>
        </>
      )
      break
    case 'pairs':
      content = (
        <div className="pairs-table">
          <div className="pairs-head">
            <span />
            <span>today</span>
            <span>with Portal</span>
            <span>difference</span>
          </div>
          {r.rows.map(p => (
            <div className="pairs-row" key={p.key} data-pair={p.key}>
              <div className="pairs-label">
                {p.label}
                {p.unit && <span className="unit"> ({p.unit})</span>}
              </div>
              <div className="pairs-num">{p.today}</div>
              <div className="pairs-num">{p.portal}</div>
              <div className="pairs-num pairs-diff">{p.diff}</div>
              <div className="pairs-eq eq">
                {p.saved}: worth {p.value}
              </div>
            </div>
          ))}
        </div>
      )
      break
    case 'versus':
      content = (
        <>
          <div className="versus">
            {r.rows.map(row => (
              <div className="versus-row" key={row.name}>
                <span className="versus-name">{row.name}</span>
                <div className="versus-track">
                  <div className={`versus-bar versus-${row.tone}`} style={{ width: `${row.pct}%` }} />
                </div>
                <span className="versus-num">{row.valueStr}</span>
                {row.eq && <span className="eq versus-eq">{row.eq}</span>}
              </div>
            ))}
          </div>
          <p className="versus-note">
            {r.lead} <strong>{r.verdict}</strong>
          </p>
          <p className="eq">{r.eq}</p>
        </>
      )
      break
    case 'room': {
      const st = env.active
      const can = canEditStakeholder
      content = (
        <div className="two-col">
          <div>
            <h3>What they need to see</h3>
            <Editable as="div" disabled={!can} value={(st.needsToSee || []).join('\n')} hint="One point per line." onChange={v => onStakeholderText('needsToSee', v.split('\n'))}>
              <ul>
                {r.needs.map(n => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Editable>
          </div>
          <div>
            <h3>The objection</h3>
            <Editable as="blockquote" disabled={!can} value={st.objection} onChange={v => onStakeholderText('objection', v)} />
            <h3>The counter</h3>
            <Editable as="p" disabled={!can} value={st.counter} onChange={v => onStakeholderText('counter', v)} />
          </div>
        </div>
      )
      break
    }
    case 'logo':
      content = (
        <div className="title-logo">
          <DeckLogo brand={brand} />
        </div>
      )
      break
    case 'divider':
      content = <hr className="b-divider" />
      break
    case 'spacer':
      content = <div className="b-spacer" />
      break
    default:
      content = null
  }

  // Chris's view only: a figure still waiting on inputs. Never printed or exported.
  if (isEmptyLive(r)) {
    content = (
      <p className="waiting no-print" title={r.waiting?.length ? `Waiting for: ${r.waiting.join(', ')}` : undefined}>
        {blockLabel(b)}: waiting for inputs
      </p>
    )
  }

  const handle = hover || selected || held
  return (
    <Reorder.Item as="div" value={b.id} dragListener={false} dragControls={controls} tabIndex={-1}
      className={`block block-${b.type}${selected ? ' block-selected' : ''}${held ? ' is-dragging' : ''}`}
      data-block={b.id}
      transition={dragging ? { type: 'spring', stiffness: 520, damping: 40 } : { duration: 0 }}
      whileDrag={{ scale: 1.01 }}
      onDragStart={() => { setHeld(true); onDragStart() }}
      onDragEnd={() => { setHeld(false); onDragEnd() }}
      onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}
      onPointerDown={e => { if (!e.target.closest('.block-handle, .badge-color-panel')) onSelect() }}>
      {handle && (
        <button type="button" className="block-handle no-print" aria-label={`Move this ${blockLabel(b).toLowerCase()}. Drag, or Alt+Up and Alt+Down.`} title="Drag to move"
          onPointerDown={e => { e.preventDefault(); onSelect(); controls.start(e) }}
          onKeyDown={e => {
            if (!e.altKey || !['ArrowUp', 'ArrowDown'].includes(e.key)) return
            e.preventDefault()
            if (e.key === 'ArrowUp' ? !first : !last) onMove(e.key === 'ArrowUp' ? -1 : 1)
          }}>
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="1.2" /><circle cx="8" cy="4" r="1.2" /><circle cx="4" cy="8" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="4" cy="12" r="1.2" /><circle cx="8" cy="12" r="1.2" /></svg>
        </button>
      )}
      <div className={`block-content ${b.design?.color ? 'custom-color' : ''} ${b.design?.fontSize ? 'custom-size' : ''} ${b.design?.font ? 'custom-font' : ''} ${b.design?.weight ? 'custom-weight' : ''}`} style={blockDesign(b.design)}>{content}</div>
    </Reorder.Item>
  )
}

async function pickImage(file, onPatch) {
  try {
    const src = await fileToDataUrl(file)
    onPatch(x => ({ ...x, src }))
  } catch (err) {
    window.alert(err.message)
  }
}

// Reminds you which tokens fill in while you are typing a template.
function tokenHint(t) {
  const used = [...String(t || '').matchAll(/\{(\w+)\}/g)].map(m => m[1])
  const known = TOKENS.filter(([k]) => used.includes(k))
  return known.length
    ? `{${known.map(([k]) => k).join('}, {')}} fill in automatically.`
    : `Tokens such as ${TOKENS.slice(0, 3).map(([k]) => `{${k}}`).join(', ')} fill in automatically. Type / in empty text to add a block.`
}

// ------------------------------------------------------------ small pieces

// Text you click to edit. Shows `children` (or the plain value) until clicked,
// then a box you type in. Single-line text commits on Enter; everything
// commits on blur; Esc also closes it. "/" in an empty box calls onSlash.
function Editable({
  as: Tag = 'span',
  className,
  value,
  onChange,
  single = false,
  minRows = 1,
  placeholder = 'Click to add text',
  hint,
  disabled = false,
  onFinish,
  onSlash,
  children
}) {
  const [editing, setEditing] = useState(false)

  if (editing && !disabled) {
    return (
      <Tag className={className}>
        <AutoText
          autoFocus
          value={value}
          single={single}
          minRows={minRows}
          onChange={onChange}
          onSlash={onSlash}
          onDone={() => { setEditing(false); onFinish?.() }}
        />
        {hint && <span className="edit-hint no-print">{hint}</span>}
      </Tag>
    )
  }

  return (
    <Tag
      className={`${className || ''} ${disabled ? '' : 'editable'}`.trim()}
      data-placeholder={placeholder}
      tabIndex={disabled ? undefined : 0}
      title={disabled ? undefined : 'Click to edit'}
      onClick={disabled ? undefined : () => setEditing(true)}
      onKeyDown={disabled ? undefined : e => e.key === 'Enter' && setEditing(true)}
    >
      {children ?? value}
    </Tag>
  )
}

function AutoText({ value, onChange, onDone, onSlash, single, minRows = 1, autoFocus }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  useLayoutEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
      const end = ref.current.value.length
      ref.current.setSelectionRange(end, end)
    }
  }, [autoFocus])
  return (
    <textarea
      ref={ref}
      className="edit-field"
      rows={minRows}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={e => {
        if (e.key === '/' && onSlash && !String(value || '').trim()) {
          e.preventDefault()
          onSlash(ref.current)
          return
        }
        if (e.key === 'Escape' || (single && e.key === 'Enter')) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
    />
  )
}

// Plain-text body: "- " lines are bullets, blank lines split paragraphs.
function Body({ paras }) {
  return (
    <div className="page-body">
      {(paras || []).map((p, i) =>
        p.type === 'ul' ? (
          <ul key={i}>
            {p.items.map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{p.text}</p>
        )
      )}
    </div>
  )
}

export function AddStakeholder({ existing, onAdd }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const have = new Set(existing.map(s => s.key))
  const removed = STAKEHOLDERS.filter(s => !have.has(s.key))

  function addCustom(e) {
    e.preventDefault()
    const name = role.trim()
    if (!name) return
    onAdd({
      key: `custom_${uid()}`,
      role: name,
      tag: 'Custom stakeholder',
      cares: 'What they care about',
      objection: '-',
      counter: '-'
    })
    setRole('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="tab tab-add" onClick={() => setOpen(true)}>
        + Add
      </button>
    )
  }

  return (
    <form className="stake-add" onSubmit={addCustom}>
      {removed.map(s => (
        <button
          key={s.key}
          type="button"
          className="tab"
          onClick={() => {
            onAdd({ key: s.key, builtin: true })
            setOpen(false)
          }}
        >
          + {s.role}
        </button>
      ))}
      <input
        type="text"
        placeholder="Or a new role"
        value={role}
        onChange={e => setRole(e.target.value)}
        autoFocus
      />
      <button className="primary" type="submit" disabled={!role.trim()}>
        Add
      </button>
      <button className="ghost" type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  )
}
