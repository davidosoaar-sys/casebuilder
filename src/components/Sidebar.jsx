import React from 'react'
import AppLogo from './AppLogo.jsx'
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

function Item({ id, icon: iconId, label, view, onNav, disabled, title }) {
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
        {icon[iconId || id]}
      </svg>
      <span className="side-label">{label}</span>
    </button>
  )
}

const COLLAPSE_KEY = 'casebuilder.sidebar'
function initialCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === 'collapsed' } catch { return false }
}

export default function Sidebar({ view, project, projectMode = false, onNav, onSettings, settingsOpen = false, saveStatus, account, admin = false, children }) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed)
  React.useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'open'
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? 'collapsed' : 'open') } catch {}
  }, [collapsed])
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-logo">
        <button type="button" className="sidebar-home" onClick={() => onNav('dashboard')} title="Dashboard" aria-label="CaseBuilder, go to the dashboard">
          <AppLogo height={26} compact={collapsed} />
        </button>
        <button type="button" className="sidebar-collapse" onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="1.5" /><path d="M6 2.5v11" />{collapsed ? <path d="M8.6 6.2l1.8 1.8-1.8 1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M10.6 6.2L8.8 8l1.8 1.8" strokeLinecap="round" strokeLinejoin="round" />}</svg>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {projectMode ? <>
          <button className="side-item project-sidebar-back" onClick={() => onNav('projects')} title="All projects" aria-label="All projects"><span aria-hidden="true">←</span><span className="side-label">All projects</span></button>
          <Item id="details" label="Case inputs" view={view} onNav={onNav} />
          <Item id="website" icon="deck" label="Case artifacts" view={view === 'deck' ? 'website' : view} onNav={onNav} title="Live room, deck, PDF and one-pager" />
          <Item id="agent" label="Agent" view={view} onNav={onNav} />
          <Item id="people-lookup" icon="research" label="Person lookup" view={view} onNav={onNav} title="Who is this? Look up one person before a call" />
          <Item id="files" label="Files" view={view} onNav={onNav} title="Context the agent reads for this project" />
        </> : <>
          <Item id="dashboard" label="Dashboard" view={view} onNav={onNav} />
          <Item id="projects" label="Projects" view={view} onNav={onNav} />
          <Item id="scheduled" label="Scheduled" view={view} onNav={onNav} title="Tasks the agent runs on a repeat, across your projects" />
          <Item id="skills" label="Skills" view={view} onNav={onNav} title="Ready-made ways of working for the agent, and your own" />
        </>}
        {!projectMode && <Item id="connections" label="Connectors" view={view} onNav={onNav} title="What the agent is allowed to read" />}
        {!projectMode && admin && <Item id="waitlist" label="Waitlist" view={view} onNav={onNav} title="Who asked for access" />}
      </nav>
      {children}
      <div className="sidebar-footer">
        <SaveIndicator status={saveStatus} />
        <button type="button" className={`side-item side-settings ${settingsOpen ? 'side-on' : ''}`} onClick={onSettings} title="Settings" aria-label="Settings" aria-haspopup="dialog">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{icon.settings}</svg>
          <span className="side-label side-settings-text"><span>Settings</span>{account && <small>{account.session.user.email}</small>}</span>
        </button>
        <small className="platform-version" title={`CaseBuilder v${version}${import.meta.env.DEV ? ' · Local development, unreleased changes may be present' : ' · Installed release'}`}>
          v{version}<span className="side-label">{import.meta.env.DEV ? ' · Local' : ''}</span>
        </small>
      </div>
    </aside>
  )
}
