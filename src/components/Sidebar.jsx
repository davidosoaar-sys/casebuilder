import React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import AppLogo from './AppLogo.jsx'
import { EASE_DRAWER, EASE_IN_OUT, EASE_OUT } from './ui.jsx'
import SaveIndicator from './SaveIndicator.jsx'
import { version } from '../../package.json'

// Global navigation. The project's own tabs are in ProjectNav.

const icon = {
  dashboard: <><rect x="2.5" y="2.5" width="4.5" height="5.5" rx=".8" /><rect x="9" y="2.5" width="4.5" height="3.5" rx=".8" /><rect x="9" y="8" width="4.5" height="5.5" rx=".8" /><rect x="2.5" y="10" width="4.5" height="3.5" rx=".8" /></>,
  settings: <><path d="M6.9 1.8h2.2l.35 1.7 1.05.6 1.65-.55 1.1 1.9-1.3 1.15v1.2l1.3 1.15-1.1 1.9-1.65-.55-1.05.6-.35 1.7H6.9l-.35-1.7-1.05-.6-1.65.55-1.1-1.9 1.3-1.15V6.6L2.75 5.45l1.1-1.9 1.65.55 1.05-.6z" strokeLinejoin="round" /><circle cx="8" cy="8" r="2" /></>,
  agent: <><path d="M3 3.5h10v7H8.5L5.5 13v-2.5H3z" strokeLinejoin="round" /><path d="M6 7h.01M8 7h.01M10 7h.01" strokeWidth="2" strokeLinecap="round" /></>,
  lookup: <><circle cx="6.5" cy="5" r="2.5" /><path d="M2 13c0-3 9-3 9 0M11 8l3 3M12 7l2 2" /></>,
  waitlist: <><circle cx="6" cy="5.5" r="2.3" /><path d="M1.8 13c.4-2.8 8-2.8 8.4 0" /><path d="M11 5h3.5M11 8h3.5M12 11h2.5" strokeLinecap="round" /></>,
  skills: <><path d="M8 1.8l1.8 3.7 4 .6-2.9 2.8.7 4L8 11l-3.6 1.9.7-4-2.9-2.8 4-.6z" strokeLinejoin="round" /></>,
  customize: <><path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6" strokeLinecap="round" /><circle cx="10" cy="4.5" r="1.6" /><circle cx="6" cy="11.5" r="1.6" /></>,
  scheduled: <><circle cx="8" cy="8.5" r="5.5" /><path d="M8 5.5v3.2l2 1.3M6 1.8h4" strokeLinecap="round" strokeLinejoin="round" /></>,
  files: <><path d="M3 2.5h6l4 4v7H3z" strokeLinejoin="round" /><path d="M9 2.5v4h4M5.5 9h5M5.5 11.5h3.5" strokeLinecap="round" /></>,
  research: <><circle cx="7" cy="7" r="4.5" /><path d="M10.4 10.4l3.6 3.6M5 7h4M7 5v4" strokeLinecap="round" /></>,
  projects: (
    <path d="M2.5 4.5h4l1.5 1.8h5.5v6.2h-11z" strokeLinejoin="round" />
  ),
  details: (
    <>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" strokeLinecap="round" />
      <circle cx="5.5" cy="4.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  deck: (
    <>
      <rect x="2.5" y="3.5" width="11" height="7.5" rx="1" />
      <path d="M6 13.5h4M8 11v2.5" strokeLinecap="round" />
    </>
  ),
  connections: (
    <>
      <circle cx="4" cy="8" r="1.8" />
      <circle cx="12" cy="4" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <path d="M5.7 7.2l4.6-2.4M5.7 8.8l4.6 2.4" strokeLinecap="round" />
    </>
  ),
  website: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M2.5 8h11M8 2.5c1.8 1.6 2.6 3.4 2.6 5.5S9.8 11.9 8 13.5M8 2.5C6.2 4.1 5.4 5.9 5.4 8s.8 3.9 2.6 5.5" />
    </>
  )
}

// The active item carries one background pill that slides between items
// (framer-motion layoutId, one id per menu instance).
function Item({ id, icon: iconId, label, view, onNav, disabled, title, pill }) {
  const on = view === id
  return (
    <button
      className={`side-item ${on ? 'side-on' : ''}`}
      onClick={() => onNav(id)}
      disabled={disabled}
      title={title || label}
      aria-label={label}
      data-tour={id==='research'?'research-nav':id==='agent'?'agent':id==='details'?'inputs':id==='website'||id==='deck'?'artifacts':undefined}
      aria-current={on ? 'page' : undefined}
    >
      {on && <motion.span layoutId={pill} className="side-pill" aria-hidden="true" transition={{ duration: 0.2, ease: EASE_IN_OUT }} />}
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {icon[iconId || id]}
      </svg>
      <span className="side-label">{label}</span>
    </button>
  )
}

const PROJECT_ITEMS = [
  { id: 'details', label: 'Case inputs' },
  { id: 'website', icon: 'deck', label: 'Case artifacts', title: 'Live room, deck, PDF and one-pager' },
  { id: 'agent', label: 'Agent' },
  { id: 'people-lookup', icon: 'research', label: 'Person lookup', title: 'Who is this? Look up one person before a call' },
  { id: 'files', label: 'Files', title: 'Context the agent reads for this project' }
]
const MAIN_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'scheduled', label: 'Scheduled', title: 'Tasks the agent runs on a repeat, across your projects' },
  // Skills and Connectors live together under Customize (like Claude): one place
  // for how the agent works and what it can read. The page has a tab for each.
  { id: 'customize', label: 'Customize', title: 'Skills and connectors: how the agent works and what it can read' },
  { id: 'waitlist', label: 'Waitlist', title: 'Who asked for access', admin: true }
]

const COLLAPSE_KEY = 'casebuilder.sidebar'
// The views shown under Customize; its sidebar item is lit on any of them.
export const CUSTOMIZE_TABS = ['skills', 'connections']
function initialCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === 'collapsed' } catch { return false }
}

export default function Sidebar({ view, project, projectMode = false, onNav, onSettings, settingsOpen = false, saveStatus, account, admin = false, children }) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed)
  const [drawer, setDrawer] = React.useState(false)
  const menuBtn = React.useRef(null)
  React.useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'open'
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? 'collapsed' : 'open') } catch {}
  }, [collapsed])
  // The drawer only exists on small screens: close it when the window grows.
  React.useEffect(() => {
    const wide = window.matchMedia('(min-width: 861px)')
    const onChange = () => { if (wide.matches) setDrawer(false) }
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [])

  const items = (projectMode ? PROJECT_ITEMS : MAIN_ITEMS).filter(it => !it.admin || admin)
  const current = view === 'deck' ? 'website' : CUSTOMIZE_TABS.includes(view) ? 'customize' : view
  const title = items.find(it => it.id === current)?.label || (projectMode ? project?.name : '') || 'CaseBuilder'

  // Menu contents, shared by the desktop sidebar and the mobile drawer.
  const body = (where, go, settings) => <>
    <nav className="sidebar-nav" aria-label="Main">
      {projectMode && <button className="side-item project-sidebar-back" onClick={() => go('projects')} title="All projects" aria-label="All projects"><span aria-hidden="true">←</span><span className="side-label">All projects</span></button>}
      {items.map(it => <Item key={it.id} {...it} view={current} onNav={go} pill={`side-pill-${where}`} />)}
    </nav>
    {children}
    <div className="sidebar-footer">
      <button type="button" className={`side-item side-settings ${settingsOpen ? 'side-on' : ''}`} onClick={settings} title="Settings" aria-label="Settings" aria-haspopup="dialog">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{icon.settings}</svg>
        <span className="side-label side-settings-text"><span>Settings</span>{account && <small>{account.session.user.email}</small>}</span>
      </button>
      <div className="sidebar-meta">
        <small className="platform-version" title={`CaseBuilder v${version}${import.meta.env.DEV ? ' · Local development, unreleased changes may be present' : ' · Installed release'}`}>
          v{version}<span className="side-label">{import.meta.env.DEV ? ' · Local' : ''}</span>
        </small>
        <SaveIndicator status={saveStatus} />
      </div>
    </div>
  </>

  const closeAnd = fn => (...args) => { setDrawer(false); fn(...args) }
  return (
    <MotionConfig reducedMotion="user">
      <aside className={`sidebar sidebar-desktop no-print${collapsed ? ' is-collapsed' : ''}`}>
        <div className="sidebar-logo">
          <button type="button" className="sidebar-home" onClick={() => onNav('dashboard')} title="Dashboard" aria-label="CaseBuilder, go to the dashboard">
            <AppLogo height={26} compact={collapsed} />
          </button>
          <button type="button" className="sidebar-collapse" onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="1.5" /><path d="M6 2.5v11" />{collapsed ? <path d="M8.6 6.2l1.8 1.8-1.8 1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M10.6 6.2L8.8 8l1.8 1.8" strokeLinecap="round" strokeLinejoin="round" />}</svg>
          </button>
        </div>
        {body('desktop', onNav, onSettings)}
      </aside>

      <header className="mobile-bar no-print">
        <button type="button" className="sidebar-home" onClick={() => onNav('dashboard')} title="Dashboard" aria-label="CaseBuilder, go to the dashboard">
          <AppLogo height={22} compact />
        </button>
        <span className="mobile-bar-title">{title}</span>
        <button ref={menuBtn} type="button" className="mobile-menu-btn" onClick={() => setDrawer(true)} aria-label="Open menu" aria-haspopup="dialog" aria-expanded={drawer}>
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></svg>
        </button>
      </header>

      {typeof document !== 'undefined' && createPortal(
        <MotionConfig reducedMotion="user">
          <AnimatePresence>
            {drawer && (
              <Drawer key="drawer" onClose={() => setDrawer(false)} returnTo={menuBtn}>
                <div className="sidebar-logo">
                  <button type="button" className="sidebar-home" onClick={() => closeAnd(onNav)('dashboard')} title="Dashboard" aria-label="CaseBuilder, go to the dashboard">
                    <AppLogo height={26} />
                  </button>
                  <button type="button" className="sidebar-collapse drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu" title="Close menu">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" /></svg>
                  </button>
                </div>
                {body('drawer', closeAnd(onNav), closeAnd(onSettings))}
              </Drawer>
            )}
          </AnimatePresence>
        </MotionConfig>,
        document.body
      )}
    </MotionConfig>
  )
}

// Slide-in menu for small screens: backdrop, Escape and backdrop close, focus
// moves to the first item and back to the menu button, body scroll locked.
function Drawer({ onClose, returnTo, children }) {
  const panel = React.useRef(null)
  const close = React.useRef(onClose)
  close.current = onClose
  React.useEffect(() => {
    const target = returnTo.current
    panel.current?.querySelector('.sidebar-nav .side-item')?.focus()
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close.current() }
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll('button:not(:disabled), [href], input, select, textarea')]
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
      // Back to the menu button, unless something else (Settings) took focus.
      const now = document.activeElement
      if (!now || now === document.body || panel.current?.contains(now)) target?.focus()
    }
  }, [returnTo])
  return (
    <motion.div className="drawer-backdrop no-print" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
      <motion.aside ref={panel} className="sidebar sidebar-drawer" role="dialog" aria-modal="true" aria-label="Menu"
        initial={{ transform: 'translateX(-100%)' }} animate={{ transform: 'translateX(0%)' }} exit={{ transform: 'translateX(-100%)' }}
        transition={{ duration: 0.26, ease: EASE_DRAWER }}>
        {children}
      </motion.aside>
    </motion.div>
  )
}
