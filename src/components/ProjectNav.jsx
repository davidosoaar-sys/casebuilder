import React from 'react'
import AppLogo from './AppLogo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import SaveIndicator from './SaveIndicator.jsx'

export default function ProjectNav({ project, view, onNav, onBack, theme, onThemeToggle, saveStatus }) {
  return (
    <header className="project-nav no-print">
      <div className="project-nav-context">
        <AppLogo height={23} />
        <button className="ghost project-back" onClick={onBack}>← All deals</button>
        <span className="project-nav-name" title={project.name}>{project.name}</span>
      </div>
      <nav className="project-nav-tabs" aria-label="Project">
        <button className={`project-tab ${view === 'details' ? 'project-tab-active' : ''}`} aria-current={view === 'details' ? 'page' : undefined} onClick={() => onNav('details')}>Details</button>
        <button className={`project-tab ${view === 'deck' || view === 'website' ? 'project-tab-active' : ''}`} aria-current={view === 'deck' || view === 'website' ? 'page' : undefined} onClick={() => onNav('deck')}>Deck</button>
      </nav>
      <SaveIndicator status={saveStatus} />
      <ThemeToggle theme={theme} onToggle={onThemeToggle} />
    </header>
  )
}
