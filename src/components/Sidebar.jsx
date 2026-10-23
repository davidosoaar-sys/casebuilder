import React from 'react'
import Logo from './Logo.jsx'

// The left navigation: logo, then Projects, then the open project's Details and
// Deck. Details and Deck are greyed out until a project has been opened.

const icon = {
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

export default function Sidebar({ view, project, onNav }) {
  const none = !project
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-logo">
        <Logo height={26} />
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        <Item id="projects" label="Projects" view={view} onNav={onNav} />

        <p className="side-caption">{project ? project.name : 'No project open'}</p>

        <Item
          id="details"
          label="Details"
          view={view}
          onNav={onNav}
          disabled={none}
          title={none ? 'Open a project first' : undefined}
        />
        <Item
          id="deck"
          label="Deck"
          view={view}
          onNav={onNav}
          disabled={none}
          title={none ? 'Open a project first' : undefined}
        />
      </nav>
    </aside>
  )
}
