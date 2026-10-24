import React from 'react'
import AppLogo from './AppLogo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import SaveIndicator from './SaveIndicator.jsx'

// Global navigation. The project's own tabs are in ProjectNav.

const icon = {
  dashboard: <><rect x="2.5" y="2.5" width="4.5" height="5.5" rx=".8" /><rect x="9" y="2.5" width="4.5" height="3.5" rx=".8" /><rect x="9" y="8" width="4.5" height="5.5" rx=".8" /><rect x="2.5" y="10" width="4.5" height="3.5" rx=".8" /></>,
  settings: <><circle cx="8" cy="8" r="2" /><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1" strokeLinecap="round" /></>,
  lookup: <><circle cx="6.5" cy="5" r="2.5" /><path d="M2 13c0-3 9-3 9 0M11 8l3 3M12 7l2 2" /></>,
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

function Item({ id, label, view, onNav, disabled, title }) {
  return (
    <button
      className={`side-item ${view === id ? 'side-on' : ''}`}
      onClick={() => onNav(id)}
      disabled={disabled}
      title={title || label}
      aria-label={label}
      aria-current={view === id ? 'page' : undefined}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {icon[id]}
      </svg>
      <span className="side-label">{label}</span>
    </button>
  )
}

const COLLAPSE_KEY = 'casebuilder.sidebar'
function initialCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === 'collapsed' } catch { return false }
}

export default function Sidebar({ view, project, projectMode = false, onNav, theme, onThemeToggle, saveStatus, account, children }) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed)
  React.useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'open'
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? 'collapsed' : 'open') } catch {}
  }, [collapsed])
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-logo">
        <AppLogo height={26} compact={collapsed} />
        <button type="button" className="sidebar-collapse" onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="1.5" /><path d="M6 2.5v11" />{collapsed ? <path d="M8.6 6.2l1.8 1.8-1.8 1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M10.6 6.2L8.8 8l1.8 1.8" strokeLinecap="round" strokeLinejoin="round" />}</svg>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {projectMode ? <>
          <button className="side-item project-sidebar-back" onClick={() => onNav('projects')} title="All projects" aria-label="All projects"><span aria-hidden="true">←</span><span className="side-label">All projects</span></button>
          <Item id="details" label="Input sheet" view={view} onNav={onNav} />
          <Item id="deck" label="Deck" view={view === 'website' ? 'deck' : view} onNav={onNav} />
        </> : <>
          <Item id="dashboard" label="Dashboard" view={view} onNav={onNav} />
          <Item id="projects" label="Projects" view={view} onNav={onNav} />
        </>}
        {!projectMode && <Item id="connections" label="Connections" view={view} onNav={onNav} title="What the agent is allowed to read" />}
        <Item id="lookup" label="Person lookup" view={view} onNav={onNav} />
        <Item id="settings" label="Settings" view={view} onNav={onNav} />
      </nav>
      {children}
      <div className="sidebar-footer">
        {account && <div className="sidebar-account"><span title={account.session.user.email}>{account.session.user.email}</span><button type="button" onClick={account.signOut}>Sign out</button></div>}
        <SaveIndicator status={saveStatus} />
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </aside>
  )
}
