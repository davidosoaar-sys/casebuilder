import React from 'react'
import { MotionConfig, motion } from 'framer-motion'
import PageHead from './PageHead.jsx'
import { EASE_IN_OUT } from './ui.jsx'

// Customize: one place for how the agent works (Skills) and what it can read
// (Connectors), like Claude's Customize page. The tab is the view itself
// ('skills' | 'connections'), so links, Back and the sidebar keep working and
// each tab can be opened directly. The pages render without their own header.
export const CUSTOMIZE_SECTIONS = [
  { id: 'skills', label: 'Skills' },
  { id: 'connections', label: 'Connectors' },
]

export default function Customize({ tab, onTab, children }) {
  const refs = React.useRef({})
  // Section nav, not a segmented control: underlined links, so it reads as a
  // level above the Discover / Yours pills inside Skills. Arrow keys move.
  const onKey = e => {
    const i = CUSTOMIZE_SECTIONS.findIndex(s => s.id === tab)
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = CUSTOMIZE_SECTIONS[(i + step + CUSTOMIZE_SECTIONS.length) % CUSTOMIZE_SECTIONS.length].id
    onTab(next); setTimeout(() => refs.current[next]?.focus(), 0)
  }
  return (
    <MotionConfig reducedMotion="user">
      <section className="page customize-page">
        <PageHead title="Customize" sub="How the agent works, and what it is allowed to read." />
        <div className="customize-nav" role="tablist" aria-label="Customize" onKeyDown={onKey}>
          {CUSTOMIZE_SECTIONS.map(s => {
            const on = s.id === tab
            return (
              <button key={s.id} ref={el => { refs.current[s.id] = el }} type="button" role="tab" id={`customize-tab-${s.id}`}
                aria-controls={`customize-panel-${s.id}`} aria-selected={on} tabIndex={on ? 0 : -1}
                className={`customize-nav-item${on ? ' is-on' : ''}`} onClick={() => onTab(s.id)}>
                {s.label}
                {on && <motion.span layoutId="customize-nav-line" className="customize-nav-line" transition={{ duration: 0.22, ease: EASE_IN_OUT }} />}
              </button>
            )
          })}
        </div>
        <div id={`customize-panel-${tab}`} role="tabpanel" aria-labelledby={`customize-tab-${tab}`} className="customize-panel">
          {children}
        </div>
      </section>
    </MotionConfig>
  )
}
