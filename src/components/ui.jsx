// Shared UI pieces for the library pages (Skills, Scheduled): tabs with a
// sliding pill, the portal dialog shell, skeleton rows, motion curves, icons.
// Class names are the Skills ones (v0.16.0); both pages use the same look.
import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

export const EASE_OUT = [0.23, 1, 0.32, 1]
export const EASE_IN_OUT = [0.77, 0, 0.175, 1]

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
