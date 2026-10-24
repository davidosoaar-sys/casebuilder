import React, { useState, useMemo, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Deck from './components/Deck.jsx'
import WebsiteView from './components/WebsiteView.jsx'
import ProjectList from './components/ProjectList.jsx'
import Details from './components/Details.jsx'
import StakeholderMap from './components/StakeholderMap.jsx'
import People from './components/People.jsx'
import useDealSaving from './useDealSaving.js'
import { dealStorage } from './dealStorage.js'
import {
  loadProjects,
  duplicateProject,
  newProject,
  hydrate,
  defaultFields,
  defaultStakeholders
} from './projects.js'
import { defaultDeck } from './deck/model.js'
import { loadConnections, saveConnections } from './connectors.js'
import Connections from './components/Connections.jsx'
import { computeModel } from './model.js'
import { stakeholdersForArchetype } from './valueModel.js'
import { DEFAULT_BRAND } from './brand.js'
import PersonLookup from './components/PersonLookup.jsx'
import usePersonLookup from './usePersonLookup.js'
import { addPersonToDeal, acceptPersonInput } from './personLookup.js'

const USER_KEY = 'casebuilder.user'
const THEME_KEY = 'casebuilder.theme'

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function loadUser() {
  try {
    return localStorage.getItem(USER_KEY) || ''
  } catch {
    return ''
  }
}

// Global navigation lives in the Projects / Connections sidebar. Opening a
// project replaces it with Details / Deck tabs and an explicit way back.
export default function App() {
  const [theme, setTheme] = useState(initialTheme)
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f8f7' : '#111111')
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])
  const [projects, setProjects] = useState(() => loadProjects().map(hydrate))
  const saving = useDealSaving(projects)
  const [currentId, setCurrentId] = useState(null)
  const [user, setUser] = useState(loadUser)
  const [view, setView] = useState('projects') // 'projects' | 'details' | 'deck' | 'website'
  const [websiteAudience, setWebsiteAudience] = useState(null)
  const [previewRequest, setPreviewRequest] = useState(null)
  const [connections, setConnections] = useState(loadConnections)
  const [connectionProjectId,setConnectionProjectId] = useState('')
  const [stage, setStage] = useState(null) // 'map' | 'people' while setting up a new project
  const brandScans = useRef(new Map())

  async function scanBrand(id, company, website = '') {
    const token = Symbol()
    brandScans.current.set(id, token)
    setProjects(ps => ps.map(p => p.id === id ? { ...p, brand: { ...DEFAULT_BRAND, ...p.brand, status: 'scanning', message: 'Finding the company website, logo, colors and fonts…' } } : p))
    try {
      let code = ''
      try { code = localStorage.getItem('casebuilder.access') || '' } catch {}
      const response = await fetch('/api/brand', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}) }, body: JSON.stringify({ company, website: website && !/^https:\/\//i.test(website) ? `https://${website}` : website }), signal: AbortSignal.timeout(55000) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Brand discovery could not finish.')
      if (brandScans.current.get(id) !== token) return
      setProjects(ps => ps.map(p => p.id === id ? { ...p, brand: result } : p))
    } catch (error) {
      if (brandScans.current.get(id) !== token) return
      setProjects(ps => ps.map(p => p.id === id ? { ...p, brand: { ...p.brand, status: 'error', message: error.message || 'Brand discovery could not finish. You can edit everything manually.' } } : p))
    }
  }

  useEffect(() => { window.scrollTo(0, 0) }, [view, currentId, stage])

  useEffect(() => saveConnections(connections), [connections])
  useEffect(() => {
    try {
      localStorage.setItem(USER_KEY, user)
    } catch {
      // storage unavailable: the name just won't persist
    }
  }, [user])

  const project = projects.find(p => p.id === currentId)
  const dealConnections = project?.connectors || connections
  const connectionProject = project || projects.find(p=>p.id===connectionProjectId)
  function updateConnectionProject(patch) {
    if (!connectionProject) return
    setProjects(previous=>previous.map(p=>p.id===connectionProject.id?{...p,...patch(p),createdAt:p.createdAt,updatedAt:Date.now()}:p))
  }
  const lookup = usePersonLookup({ project, connections: dealConnections })
  const [pendingPersonInput, setPendingPersonInput] = useState(null)
  const lookupPage = <PersonLookup lookup={lookup} project={project}
    onAdd={person => update(p => addPersonToDeal(p, person))}
    onInput={suggestion => setPendingPersonInput({ dealId: project.id, suggestion })} />
  function navigate(next) {
    setStage(null)
    if (next === 'projects') { saving.flush(); setCurrentId(null) }
    setView(next)
  }
  const projectSidebar = <Sidebar view={view} project={project} projectMode onNav={navigate} theme={theme} onThemeToggle={toggleTheme} saveStatus={saving.status} />

  function update(patch) {
    setProjects(prev =>
      prev.map(p =>
        p.id === currentId
          ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch), createdAt: p.createdAt, updatedAt: Date.now() }
          : p
      )
    )
  }

  const fields = project?.fields
  const inputs = useMemo(
    () => (fields ? Object.fromEntries(fields.map(f => [f.key, f.value])) : {}),
    [fields]
  )

  // The model is recomputed from the inputs on every change. Nothing downstream
  // keeps a copy of a figure.
  const model = useMemo(() => computeModel(inputs), [inputs])

  const onStakeholders = fn => update(p => ({ stakeholders: fn(p.stakeholders) }))
  const onPeople = fn => update(p => ({ people: fn(p.people) }))
  // Changing the archetype changes who is in the room, immediately.
  const onFields = fn =>
    update(p => {
      const next = fn(p.fields)
      const company = next.find(f => f.key === 'companyName')?.value
      const name = typeof company === 'string' && company.trim() ? company.trim() : p.name
      const arch = fs => fs.find(f => f.key === 'archetype')?.value
      return arch(next) !== arch(p.fields)
        ? { name, fields: next, stakeholders: stakeholdersForArchetype(p.stakeholders, arch(next)) }
        : { name, fields: next }
    })

  if (project && stage === 'map') {
    return (
      <div className="layout">
      {projectSidebar}<main className="content">
      <StakeholderMap
        company={project.name}
        stakeholders={project.stakeholders}
        onChange={onStakeholders}
        onContinue={() => setStage('people')}
      />
      </main></div>
    )
  }

  if (project && stage === 'people') {
    return (
      <div className="layout">
      {projectSidebar}<main className="content">
      <People
        showStep
        company={project.name}
        stakeholders={project.stakeholders}
        people={project.people}
        onPeople={onPeople}
        continueLabel="Finish"
        onContinue={() => {
          setStage(null)
          setView('details')
        }}
      />
      </main></div>
    )
  }

  // Details and Deck need a project; without one, fall back to the list.
  const page = ['connections', 'lookup'].includes(view) ? view : project ? view : 'projects'
  const insideProject = !!project && page !== 'projects'

  return (
    <div className="layout">
      <Sidebar view={page} project={project} projectMode={insideProject} onNav={navigate} theme={theme} onThemeToggle={toggleTheme} saveStatus={saving.status} />

      <div className="lookup-content-wrap">
      <main className="content">
        {page === 'details' ? (
          <Details
            project={project}
            model={model}
            connections={dealConnections}
            onFields={onFields}
            onStakeholders={onStakeholders}
            onPeople={onPeople}
            onReset={() => {
              if (window.confirm('Reset this project’s inputs, stakeholders and deck to the defaults?')) {
                update({ fields: defaultFields(), stakeholders: defaultStakeholders(), deck: defaultDeck(), documents: [] })
              }
            }}
          />
        ) : page === 'connections' ? (
          <Connections
            project={connectionProject}
            projects={projects}
            selectedProjectId={connectionProjectId}
            onSelectProject={setConnectionProjectId}
            connections={connectionProject?.connectors || connections}
            documents={connectionProject?.documents || []}
            onConnections={fn => connectionProject ? updateConnectionProject(p => ({ connectors: fn(p.connectors || connections) })) : setConnections(fn)}
            onDocuments={fn => updateConnectionProject(p => ({ documents: fn(p.documents || []) }))}
          />
        ) : page === 'lookup' ? (
          lookupPage
        ) : page === 'deck' ? (
          <Deck
            initialAudienceKey={websiteAudience}
            previewRequest={previewRequest}
            onPreviewOpened={() => setPreviewRequest(null)}
            key={project.id}
            brand={project.brand}
            onBrand={brand => { brandScans.current.delete(project.id); update({ brand: { ...brand, status: 'ready', message: 'Your custom deck design is saved.' } }) }}
            onScanBrand={website => scanBrand(project.id, project.name, website)}
            inputs={inputs}
            model={model}
            fields={project.fields}
            connectors={dealConnections}
            stakeholders={project.stakeholders}
            onStakeholders={onStakeholders}
            deck={project.deck}
            company={project.name}
            onDeck={fn => update(p => ({ deck: fn(p.deck) }))}
            onWebsite={key => { setWebsiteAudience(key); setView('website') }}
          />
        ) : page === 'website' ? (
          <WebsiteView
            key={project.id}
            project={project}
            audienceKey={websiteAudience}
            onView={(format, audience) => { setWebsiteAudience(audience); setPreviewRequest(format); setView('deck') }}
            inputs={inputs}
            onDeck={fn => update(p => ({ deck: fn(p.deck) }))}
            onSite={site => update({ site })}
            onScenario={fn => update(p => ({ scenario: fn(p.scenario || {}) }))}
            onBack={() => setView('deck')}
          />
        ) : (
          <ProjectList
            user={user}
            onUser={setUser}
            projects={projects}
            activeId={currentId}
            onCreate={name => {
              const p = newProject(name, connections)
              setProjects(prev => [p, ...prev])
              setCurrentId(p.id)
              setStage('map')
              scanBrand(p.id, name)
            }}
            onOpen={id => {
              saving.flush()
              setCurrentId(id)
              setView('details')
            }}
            onDelete={id => {
              try { dealStorage.delete(id); saving.forget(id) } catch (e) { saving.reportError(e.message); return }
              setProjects(prev => prev.filter(p => p.id !== id))
              if (id === currentId) setCurrentId(null)
            }}
            onDuplicate={p => { const copy = duplicateProject(p); setProjects(prev => [copy, ...prev]) }}
          />
        )}
      </main>
      </div>
      {pendingPersonInput && project?.id === pendingPersonInput.dealId && <div className="modal-backdrop" onClick={() => setPendingPersonInput(null)}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="person-input-review" onClick={e => e.stopPropagation()}>
          <h2 id="person-input-review">Review suggested input</h2>
          <p>{pendingPersonInput.suggestion.label}: <strong>{pendingPersonInput.suggestion.value}</strong></p>
          <p>Current value: {String(project.fields.find(f => f.key === pendingPersonInput.suggestion.key)?.value ?? 'not entered') || 'not entered'}. Applying this will replace it and mark the source as a suggestion.</p>
          <a href={pendingPersonInput.suggestion.sourceUrl} target="_blank" rel="noreferrer noopener">Read source</a>
          <div className="modal-actions"><button className="primary" onClick={() => { update(p => acceptPersonInput(p, pendingPersonInput.suggestion)); setPendingPersonInput(null) }}>Apply suggestion</button><button className="ghost" onClick={() => setPendingPersonInput(null)}>Cancel</button></div>
        </section>
      </div>}
    </div>
  )
}
