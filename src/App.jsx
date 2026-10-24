import React, { useState, useMemo, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Deck from './components/Deck.jsx'
import WebsiteView from './components/WebsiteView.jsx'
import ProjectList from './components/ProjectList.jsx'
import Details from './components/Details.jsx'
import StakeholderMap from './components/StakeholderMap.jsx'
import People from './components/People.jsx'
import useCloudDeals from './useCloudDeals.js'
import { supabase } from './supabase.js'
import {
  duplicateProject,
  newProject,
  hydrate,
  defaultFields,
  defaultStakeholders
} from './projects.js'
import { defaultDeck } from './deck/model.js'
import { loadConnections, saveConnections } from './connectors.js'
import Connections from './components/Connections.jsx'
import Dashboard from './components/Dashboard.jsx'
import Settings from './components/Settings.jsx'
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
export default function App({ account }) {
  const [theme, setTheme] = useState(initialTheme)
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f8f7' : '#111111')
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])
  const [connections, setConnections] = useState(loadConnections)
  const cloud = useCloudDeals(account.session.user.id, connections)
  const { deals: projects, setDeals: setProjects, loading: dealsLoading } = cloud
  const saving = cloud.saving
  const [currentId, setCurrentId] = useState(null)
  // Display name lives on the account (Supabase user metadata), so it follows
  // the person to any browser. Falls back to a name typed in this browser before.
  const [user, setUserState] = useState(() => account.session.user.user_metadata?.name || loadUser())
  const setUser = name => {
    setUserState(name)
    supabase.auth.updateUser({ data: { name } }).catch(() => {})
  }
  const [view, setView] = useState('dashboard') // 'dashboard' | 'projects' | 'details' | 'deck' | 'website' | 'settings' | ...
  const [createRequest, setCreateRequest] = useState(0)
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
  const lookup = usePersonLookup({ project, connections: dealConnections })
  const [pendingPersonInput, setPendingPersonInput] = useState(null)
  const lookupPage = <PersonLookup lookup={lookup} project={project}
    onAdd={person => update(p => addPersonToDeal(p, person))}
    onInput={suggestion => setPendingPersonInput({ dealId: project.id, suggestion })} />
  function navigate(next) {
    setStage(null)
    if (['projects', 'dashboard', 'settings'].includes(next)) { saving.flush(); setCurrentId(null) }
    setView(next)
  }
  const projectSidebar = <Sidebar view={view} project={project} projectMode onNav={navigate} theme={theme} onThemeToggle={toggleTheme} saveStatus={saving.status} account={account} />

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
  const page = ['connections', 'lookup', 'dashboard', 'settings'].includes(view) ? view : project ? view : 'projects'
  const insideProject = !!project && page !== 'projects'

  return (
    <div className="layout">
      <Sidebar view={page} project={project} projectMode={insideProject} onNav={navigate} theme={theme} onThemeToggle={toggleTheme} saveStatus={saving.status} account={account} />

      <div className="lookup-content-wrap">
      <main className="content">
        {page === 'dashboard' ? (
          <Dashboard
            account={account}
            name={user}
            deals={projects}
            loading={dealsLoading}
            onNav={navigate}
            onOpen={id => { saving.flush(); setCurrentId(id); setView('details') }}
            onCreate={() => { setView('projects'); setCreateRequest(n => n + 1) }}
          />
        ) : page === 'settings' ? (
          <Settings account={account} name={user} onName={setUser} />
        ) : page === 'details' ? (
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
            project={project}
            connections={dealConnections}
            documents={project ? project.documents : []}
            onConnections={fn => project ? update(p => ({ connectors: fn(p.connectors) })) : setConnections(fn)}
            onDocuments={fn => update(p => ({ documents: fn(p.documents) }))}
          />
        ) : page === 'lookup' ? (
          lookupPage
        ) : page === 'deck' ? (
          <Deck
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
            onWebsite={() => setView('website')}
          />
        ) : page === 'website' ? (
          <WebsiteView
            key={project.id}
            project={project}
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
            loading={dealsLoading}
            createRequest={createRequest}
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
              saving.remove(id).then(() => {
                setProjects(prev => prev.filter(p => p.id !== id))
                if (id === currentId) setCurrentId(null)
              }, e => saving.reportError(e.message))
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
