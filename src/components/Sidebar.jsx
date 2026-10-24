import React from 'react'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import SaveIndicator from './SaveIndicator.jsx'

// Global navigation. The project's own tabs are in ProjectNav.

const icon = {
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
      title={title}
      aria-current={view === id ? 'page' : undefined}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {icon[id]}
      </svg>
      {label}
    </button>
  )
}

export default function Sidebar({ view, project, projectMode = false, onNav, theme, onThemeToggle, saveStatus, children }) {
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-logo">
        <Logo height={26} />
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {projectMode ? <>
          <button className="side-item project-sidebar-back" onClick={() => onNav('projects')}>← All projects</button>
          <Item id="details" label="Input sheet" view={view} onNav={onNav} />
          <Item id="deck" label="Deck" view={view === 'website' ? 'deck' : view} onNav={onNav} />
        </> : <Item id="projects" label="Projects" view={view} onNav={onNav} />}
        {!projectMode && <Item id="connections" label="Connections" view={view} onNav={onNav} title="What the agent is allowed to read" />}
        <Item id="lookup" label="Person lookup" view={view} onNav={onNav} />

      </nav>
      {children}
      <div className="sidebar-footer"><SaveIndicator status={saveStatus} /><ThemeToggle theme={theme} onToggle={onThemeToggle} /></div>
    </aside>
  )
}
