// Shared UI pieces: tabs with a sliding pill, the portal dialog shell, the
// custom select, the "..." menu, skeleton rows, motion curves, icons.
// Class names are the Skills ones (v0.16.0); the app uses the same look.
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'

export const EASE_OUT = [0.23, 1, 0.32, 1]
export const EASE_IN_OUT = [0.77, 0, 0.175, 1]
export const EASE_DRAWER = [0.32, 0.72, 0, 1]

// Popovers render into body; skipped on the server (unit tests render markup).
const portal = node => (typeof document === 'undefined' ? null : createPortal(<MotionConfig reducedMotion="user">{node}</MotionConfig>, document.body))
const POP_IN = { initial: { opacity: 0, transform: 'scale(0.97)' }, animate: { opacity: 1, transform: 'scale(1)' }, exit: { opacity: 0, transform: 'scale(0.97)' }, transition: { duration: 0.14, ease: EASE_OUT } }

// Close a popover on a press outside it, on resize, and on scroll outside it.
function useDismiss(open, refs, close) {
  const shut = useRef(close)
  shut.current = close
  useEffect(() => {
    if (!open) return
    const inside = t => refs.some(r => r.current?.contains(t))
    const onDown = e => { if (!inside(e.target)) shut.current() }
    const onScroll = e => { if (!inside(e.target)) shut.current() }
    const onResize = () => shut.current()
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
}

// Where a popover goes: under its trigger, or above when there is no room.
function place(el, height, alignRight = false, width = 180) {
  const r = el.getBoundingClientRect()
  const up = r.bottom + height + 8 > window.innerHeight && r.top > height + 8
  const y = up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }
  const x = alignRight ? { right: Math.max(8, window.innerWidth - r.right) } : { left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, width) - 8)) }
  return { ...x, ...y, width: r.width, origin: `${up ? 'bottom' : 'top'} ${alignRight ? 'right' : 'left'}` }
}

// A select that looks like the app: a button that opens a listbox.
// options: [{ value, label, disabled? }]. onChange gets the value as a string,
// like a native select. The trigger keeps focus; arrows, Home, End, Enter,
// Escape and type-ahead work while it is open.
export function Select({ value, onChange, options, placeholder = '', disabled = false, id, name, className = '', title, 'aria-label': ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState(null)
  const btn = useRef(null)
  const list = useRef(null)
  const typed = useRef({ text: '', at: 0 })
  const listId = useId()
  const selected = options.findIndex(o => String(o.value) === String(value))
  const usable = i => i >= 0 && i < options.length && !options[i].disabled
  const first = () => options.findIndex((_, i) => usable(i))
  const last = () => { for (let i = options.length - 1; i >= 0; i--) if (usable(i)) return i; return -1 }
  const step = (from, dir) => { for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (usable(i)) return i; return from }

  function show() {
    if (disabled || !options.length) return
    setActive(usable(selected) ? selected : first())
    setPos(place(btn.current, Math.min(options.length * 36 + 10, 290)))
    setOpen(true)
  }
  function hide() { setOpen(false) }
  function choose(i) {
    if (!usable(i)) return
    hide()
    if (i !== selected) onChange?.(String(options[i].value))
  }
  useDismiss(open, [btn, list], hide)
  useEffect(() => {
    if (open && active >= 0) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function seek(ch) {
    const now = Date.now()
    const t = typed.current
    t.text = now - t.at > 600 ? ch : t.text + ch
    t.at = now
    const from = active < 0 ? 0 : active + (t.text.length === 1 ? 1 : 0)
    for (let k = 0; k < options.length; k++) {
      const i = (from + k) % options.length
      if (usable(i) && String(options[i].label).toLowerCase().startsWith(t.text.toLowerCase())) return i
    }
    return -1
  }
  function onKey(e) {
    const k = e.key
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(k)) { e.preventDefault(); show() }
      return
    }
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(); return }
    if (k === 'Tab') { hide(); return }
    const typing = k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey
    if ((k === 'Enter' || (k === ' ' && Date.now() - typed.current.at > 600))) { e.preventDefault(); choose(active); return }
    const to = k === 'ArrowDown' ? step(active, 1) : k === 'ArrowUp' ? step(active, -1) : k === 'Home' ? first() : k === 'End' ? last() : typing ? seek(k) : null
    if (to == null) return
    e.preventDefault()
    if (to >= 0) setActive(to)
  }

  const shown = selected >= 0 ? options[selected].label : placeholder
  return (
    <>
      <button ref={btn} type="button" id={id} name={name} title={title} className={`cselect ${className}`} role="combobox" aria-label={ariaLabel}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        data-value={value ?? ''} disabled={disabled} onClick={() => (open ? hide() : show())} onKeyDown={onKey}>
        <span className={`cselect-value${selected < 0 ? ' is-placeholder' : ''}`}>{shown}</span>
        <svg className="cselect-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 4.5L6 7.5l3-3" /></svg>
      </button>
      {portal(
        <AnimatePresence>
          {open && pos && (
            <motion.div ref={list} id={listId} className="cselect-list" role="listbox" aria-label={ariaLabel}
              style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.width, transformOrigin: pos.origin }} {...POP_IN}>
              {options.map((o, i) => (
                <div key={String(o.value)} id={`${listId}-${i}`} data-index={i} data-value={String(o.value)} role="option" aria-selected={i === selected} aria-disabled={o.disabled || undefined}
                  className={`cselect-option${i === active ? ' is-active' : ''}`} onMouseDown={e => e.preventDefault()} onMouseMove={() => { if (usable(i) && i !== active) setActive(i) }} onClick={() => choose(i)}>
                  <span>{o.label}</span>
                  {i === selected && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7.5l2.6 2.5L11 4.5" /></svg>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}

// "..." menu, portalled so list clipping never cuts it. Escape or a click
// outside closes it; arrow keys move between items. Items: [{ label,
// description?, onSelect, disabled?, danger? }]. children replace the dots in
// the trigger; align="left" opens it from the trigger's left edge; itemHeight
// is the row height used to decide whether it opens up or down.
export function Menu({ label, items, className = 'icon-btn sched-more', title = 'More', children, align = 'right', itemHeight = 44, menuWidth = 180, disabled = false, menuClass = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btn = useRef(null)
  const pop = useRef(null)
  const right = align !== 'left'
  useLayoutEffect(() => { if (open) setPos(place(btn.current, items.length * itemHeight + 12, right, menuWidth)) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useDismiss(open, [btn, pop], () => setOpen(false))
  useEffect(() => {
    if (!open) return
    pop.current?.querySelector('[role=menuitem]:not(:disabled)')?.focus()
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); btn.current?.focus() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, pos])
  function onKey(e) {
    const all = [...pop.current.querySelectorAll('[role=menuitem]:not(:disabled)')]
    const i = all.indexOf(document.activeElement)
    const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : null
    if (to == null) return
    e.preventDefault(); all[(to + all.length) % all.length]?.focus()
  }
  return (
    <>
      <button ref={btn} type="button" className={className} aria-label={label} title={title} aria-haspopup="menu" aria-expanded={open} disabled={disabled} onClick={() => setOpen(o => !o)}>
        {children || <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>}
      </button>
      {portal(
        <AnimatePresence>
          {open && pos && (
            <motion.div ref={pop} className={`sched-menu ${menuClass}`.trim()} role="menu" aria-label={label} onKeyDown={onKey}
              style={{ left: right ? undefined : pos.left, right: right ? pos.right : undefined, top: pos.top, bottom: pos.bottom, transformOrigin: pos.origin }} {...POP_IN}>
              {items.map(it => (
                <button key={it.label} type="button" role="menuitem" tabIndex={-1} disabled={it.disabled} className={`${it.danger ? 'is-danger' : ''}${it.description ? ' has-desc' : ''}`}
                  onClick={() => { setOpen(false); btn.current?.focus(); it.onSelect() }}>
                  {it.description ? <><span>{it.label}</span><small>{it.description}</small></> : it.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}

// A small panel anchored to an element (a ref or the element itself),
// portalled, scaling in from its corner. Escape or a press outside closes it;
// Escape is handled first and marked handled (defaultPrevented) so nothing
// under it reacts too.
export function Popover({ open, anchor, onClose, label, className = '', align = 'left', height = 320, children }) {
  const pop = useRef(null)
  const [pos, setPos] = useState(null)
  const el = () => anchor?.current ?? anchor ?? null
  const anchorRef = useRef(null)
  anchorRef.current = el()
  useLayoutEffect(() => { if (open && el()) setPos(place(el(), height, align === 'right')) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useDismiss(open, [anchorRef, pop], onClose)
  const shut = useRef(onClose)
  shut.current = onClose
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); shut.current(); anchorRef.current?.focus?.() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])
  return portal(
    <AnimatePresence>
      {open && pos && (
        <motion.div ref={pop} className={`popover ${className}`} role="dialog" aria-label={label}
          style={{ left: pos.left, right: pos.right, top: pos.top, bottom: pos.bottom, transformOrigin: pos.origin }} {...POP_IN}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// tabs: [{ id, label, count? }]. Ids are `${idPrefix}-tab-<id>` and the panel
// is `${idPrefix}-panel-<id>`. Arrow keys move between tabs.
export function Tabs({ tabs, value, onChange, layoutId, idPrefix, label }) {
  const refs = useRef({})
  function onKey(e) {
    const i = tabs.findIndex(t => t.id === value)
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = tabs[(i + step + tabs.length) % tabs.length].id
    onChange(next); refs.current[next]?.focus()
  }
  return (
    <div className="skill-tabs" role="tablist" aria-label={label} onKeyDown={onKey}>
      {tabs.map((t, i) => {
        const on = value === t.id
        return (
          <button key={t.id} ref={el => { refs.current[t.id] = el }} type="button" role="tab" id={`${idPrefix}-tab-${t.id}`} aria-controls={`${idPrefix}-panel-${t.id}`}
            aria-selected={on} tabIndex={on || (value == null && i === 0) ? 0 : -1} className="skill-tab" onClick={() => onChange(t.id)}>
            {on && <motion.span layoutId={layoutId} className="skill-tab-pill" transition={{ duration: 0.25, ease: EASE_IN_OUT }} />}
            <span className="skill-tab-label">{t.label}{t.count != null && <span className="skill-tab-count">{t.count}</span>}</span>
          </button>
        )
      })}
    </div>
  )
}

// Loading placeholder: an optional featured block, then `rows` cards of
// `height` px in `listClass` (the grid or list the real cards use).
export function Skeleton({ label = 'Loading', rows = 4, height = 78, featured = false, listClass = 'skill-grid' }) {
  return (
    <div className="skill-skeleton" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {featured && <div className="skill-skeleton-featured" />}
      <ul className={listClass} aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => <li key={i} className="skill-skeleton-card" style={{ height }}><span /><span><i /><i /></span></li>)}
      </ul>
    </div>
  )
}

// One shimmering bar in place of a value that is still loading.
export function SkeletonText({ label = 'Loading', width = '4ch' }) {
  return <span className="skeleton-text" style={{ width }} aria-busy="true"><span className="visually-hidden">{label}</span></span>
}

// Portal dialog shell: backdrop fade, scale-in panel, Escape and backdrop
// click close, focus moves inside and returns, body scroll locked.
const openDialogs = []
export function Dialog({ open, onClose, title, icon, className = '', children }) {
  const titleId = useId()
  return createPortal(
    <AnimatePresence>
      {open && <DialogPanel key="d" onClose={onClose} title={title} icon={icon} className={className} titleId={titleId}>{children}</DialogPanel>}
    </AnimatePresence>,
    document.body
  )
}

export function DialogPanel({ onClose, title, icon, className, titleId, children }) {
  const panel = useRef(null)
  const closeBtn = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const me = {}
    openDialogs.push(me)
    const before = document.activeElement
    if (!panel.current?.contains(document.activeElement)) closeBtn.current?.focus()
    const onKey = e => {
      if (openDialogs[openDialogs.length - 1] !== me) return
      if (e.key === 'Escape') { e.stopPropagation(); close.current() }
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll('button:not(:disabled), input, select, textarea, [href]')]
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      openDialogs.splice(openDialogs.indexOf(me), 1)
      // Hand focus back unless another dialog has already taken it.
      const now = document.activeElement
      const free = !now || now === document.body || panel.current?.contains(now)
      if (free && before && document.contains(before)) before.focus?.()
    }
  }, [])
  return (
    <motion.div className="skill-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
      <motion.div ref={panel} className={`skill-dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}
        initial={{ opacity: 0, transform: 'scale(0.96)' }} animate={{ opacity: 1, transform: 'scale(1)' }} exit={{ opacity: 0, transform: 'scale(0.96)' }}
        transition={{ duration: 0.2, ease: EASE_OUT }}>
        <header className="skill-dialog-head">
          {icon && <span className="skill-icon" aria-hidden="true">{icon}</span>}
          <h2 id={titleId}>{title}</h2>
          <button ref={closeBtn} className="overlay-x" type="button" onClick={onClose} aria-label="Close" title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" /></svg>
          </button>
        </header>
        {children}
      </motion.div>
    </motion.div>
  )
}

// Toasts: one short message at the bottom centre, with an optional action
// ("Page deleted. Undo"). useToast() returns show({ message, action?:
// { label, onClick }, duration? }); <Toaster /> renders them, once per app.
// A new toast replaces the old one. Hover or focus pauses the timer; Escape
// dismisses.
const toastListeners = new Set()
let toastNow = null
function setToast(t) { toastNow = t; toastListeners.forEach(fn => fn(t)) }
export function showToast({ message, action = null, duration = 5500 }) {
  const t = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, message, action, duration }
  setToast(t)
  return t.id
}
export function dismissToast(id) { if (!id || toastNow?.id === id) setToast(null) }
export function useToast() { return showToast }

export function Toaster() {
  const [t, setT] = useState(toastNow)
  const paused = useRef(false)
  const left = useRef(0)
  const started = useRef(0)
  const timer = useRef(null)
  const ctl = useRef({ pause() {}, resume() {} })
  useEffect(() => { toastListeners.add(setT); return () => { toastListeners.delete(setT) } }, [])
  useEffect(() => {
    clearTimeout(timer.current)
    if (!t) return
    left.current = t.duration
    paused.current = false
    const run = () => { started.current = Date.now(); timer.current = setTimeout(() => dismissToast(t.id), left.current) }
    run()
    const onKey = e => { if (e.key === 'Escape') dismissToast(t.id) }
    window.addEventListener('keydown', onKey)
    ctl.current = {
      pause() { if (paused.current) return; paused.current = true; clearTimeout(timer.current); left.current -= Date.now() - started.current },
      resume() { if (!paused.current) return; paused.current = false; run() }
    }
    return () => { clearTimeout(timer.current); window.removeEventListener('keydown', onKey) }
  }, [t])
  if (typeof document === 'undefined') return null
  return createPortal(
    <MotionConfig reducedMotion="user">
      <div className="toaster" role="status" aria-live="polite">
        <AnimatePresence>
          {t && (
            <motion.div key={t.id} className="toast" onPointerEnter={() => ctl.current.pause()} onPointerLeave={() => ctl.current.resume()} onFocus={() => ctl.current.pause()} onBlur={() => ctl.current.resume()}
              initial={{ opacity: 0, transform: 'translateY(12px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} exit={{ opacity: 0, transform: 'translateY(8px)' }}
              transition={{ duration: 0.2, ease: EASE_OUT }}>
              <span className="toast-msg">{t.message}</span>
              {t.action && <button type="button" className="toast-action" onClick={() => { dismissToast(t.id); t.action.onClick() }}>{t.action.label}</button>}
              <button type="button" className="toast-x" aria-label="Dismiss" title="Dismiss" onClick={() => dismissToast(t.id)}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" /></svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>,
    document.body
  )
}

// Undo / redo arrows for a toolbar. history: what useHistory returns.
export function UndoRedo({ history }) {
  if (!history) return null
  return (
    <div className="undo-redo" role="group" aria-label="History">
      <button type="button" className="icon-btn undo-btn" onClick={history.undo} disabled={!history.canUndo} aria-label={history.undoLabel} title={history.undoLabel} data-tip={history.undoLabel}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5.5 3.5L2.5 6.5l3 3" /><path d="M2.5 6.5h7a4 4 0 0 1 0 8H7" /></svg>
      </button>
      <button type="button" className="icon-btn undo-btn" onClick={history.redo} disabled={!history.canRedo} aria-label={history.redoLabel} title={history.redoLabel} data-tip={history.redoLabel}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.5 3.5l3 3-3 3" /><path d="M13.5 6.5h-7a4 4 0 0 0 0 8H9" /></svg>
      </button>
    </div>
  )
}

// 20px stroke icons, one per built-in skill.
export function SkillIcon({ skillKey }) {
  const p = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (skillKey === 'pre_meeting_brief') return <svg {...p}><rect x="3" y="4.5" width="14" height="12" rx="2" /><path d="M3 8.5h14M7 2.5v3M13 2.5v3M7 12h2" /></svg>
  if (skillKey === 'account_news') return <svg {...p}><path d="M4 4.5h10v10.5a1.5 1.5 0 0 0 1.5 1.5H5.5A1.5 1.5 0 0 1 4 15V4.5Z" /><path d="M14 8h2v7a1.5 1.5 0 0 1-3 0M7 8h4M7 11h4M7 14h2" /></svg>
  if (skillKey === 'stakeholder_map') return <svg {...p}><circle cx="10" cy="5" r="2" /><circle cx="4.5" cy="14.5" r="2" /><circle cx="15.5" cy="14.5" r="2" /><path d="M9 6.8l-3.5 5.9M11 6.8l3.5 5.9M6.5 14.5h7" /></svg>
  if (skillKey === 'objection_prep') return <svg {...p}><path d="M10 2.5l6 2.2v4.6c0 3.8-2.6 6.6-6 8.2-3.4-1.6-6-4.4-6-8.2V4.7l6-2.2Z" /><path d="M7.5 10l1.8 1.8 3.4-3.6" /></svg>
  return <svg {...p}><path d="M10 3v3M10 14v3M3 10h3M14 10h3M5.2 5.2l1.8 1.8M13 13l1.8 1.8M5.2 14.8L7 13M13 7l1.8-1.8" /></svg>
}

export function PlusIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
}

export function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
}
