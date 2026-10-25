import React, { useState, useMemo, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Deck from './components/Deck.jsx'
import WebsiteView from './components/WebsiteView.jsx'
import ProjectList from './components/ProjectList.jsx'
import BrandSetup from './components/BrandSetup.jsx'
import Details from './components/Details.jsx'
import StakeholderMap from './components/StakeholderMap.jsx'
import People from './components/People.jsx'
import useCloudDeals from './useCloudDeals.js'
import ChatPanel from './components/ChatPanel.jsx'
import { applyAgentEdits, undoAgentEdits } from './agentEdits.js'
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
import { AGENT_COMMANDS } from './agentCommands.js'
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Agent: its own tab, or split beside the other tabs (width remembered).
  const [split, setSplit] = useState(() => { try { return localStorage.getItem('casebuilder.agent-split') === '1' } catch { return false } })
  const [chatWidth, setChatWidth] = useState(() => { try { return Number(localStorage.getItem('casebuilder.agent-width')) || 420 } catch { return 420 } })
  useEffect(() => { try { localStorage.setItem('casebuilder.agent-split', split ? '1' : '0') } catch {} }, [split])
  useEffect(() => { try { localStorage.setItem('casebuilder.agent-width', String(chatWidth)) } catch {} }, [chatWidth])
  const backFromAgent = useRef('details')
  function startResize(e) {
    e.preventDefault()
    const move = ev => setChatWidth(Math.round(Math.min(Math.max(window.innerWidth - (ev.touches?.[0]?.clientX ?? ev.clientX), 320), Math.min(900, window.innerWidth - 420))))
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); document.body.classList.remove('is-resizing') }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); document.body.classList.add('is-resizing')
  }
  const openSettings = () => setSettingsOpen(true)
  const [websiteAudience, setWebsiteAudience] = useState(null)
  const [previewRequest, setPreviewRequest] = useState(null)
  const [connectionProjectId, setConnectionProjectId] = useState('')
  const [stage, setStage] = useState(null) // 'map' | 'people' while setting up a new project
  const brandScans = useRef(new Map())

  async function scanBrand(id, company, website = '') {
    const token = Symbol()
    brandScans.current.set(id, token)
    setProjects(ps => ps.map(p => p.id === id ? { ...p, brand: { ...DEFAULT_BRAND, ...p.brand, status: 'scanning', message: 'Finding the company website, logo, colors and fonts…' } } : p))
    try {
      let code = ''
      try { code = localStorage.getItem('casebuilder.access') || '' } catch {}
      const response = await fetch('/api/brand', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}), ...(account.session?.access_token ? { Authorization: 'Bearer ' + account.session.access_token } : {}) }, body: JSON.stringify({ command:AGENT_COMMANDS.DISCOVER_BRAND,company, website: website && !/^https:\/\//i.test(website) ? `https://${website}` : website }), signal: AbortSignal.timeout(55000) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Brand discovery could not finish.')
      if (brandScans.current.get(id) !== token) return
      setProjects(ps => ps.map(p => p.id === id ? { ...p, brand: result, updatedAt: Date.now() } : p))
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
    if (next === 'settings') { setSettingsOpen(true); return } // overlay: never leaves the current page
    if (['projects', 'dashboard'].includes(next)) { saving.flush(); setCurrentId(null) }
    if (next === 'agent') { if (view !== 'agent') backFromAgent.current = view; setSplit(false) }
    setView(next)
  }
  const projectSidebar = <Sidebar view={view} project={project} projectMode onNav={navigate} onSettings={openSettings} settingsOpen={settingsOpen} saveStatus={saving.status} account={account} />

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

  // Agent edits: applied straight away, once per reply (agentLog is keyed by
  // the chat message id and saved with the deal), and undoable.
  const applyFromChat = (messageId, edits) =>
    update(p => {
      if (p.agentLog?.[messageId]) return {}
      const r = applyAgentEdits(p.fields, edits)
      const entry = { changes: r.changes, refused: r.refused, at: Date.now() }
      return { fields: r.fields, agentLog: { ...(p.agentLog || {}), [messageId]: entry } }
    })
  const undoFromChat = messageId =>
    update(p => {
      const entry = p.agentLog?.[messageId]
      if (!entry || entry.undone) return {}
      const r = undoAgentEdits(p.fields, entry.changes)
      return { fields: r.fields, agentLog: { ...p.agentLog, [messageId]: { ...entry, undone: true, skipped: r.skipped } } }
    })

  const settingsOverlay = settingsOpen && (
    <Settings account={account} name={user} onName={setUser} theme={theme} onTheme={setTheme} onClose={() => setSettingsOpen(false)} />
  )

  if (project && stage === 'map') {
    return (
      <div className="layout">
      {projectSidebar}<main className="content">
      <StakeholderMap
        company={project.name}
        stakeholders={project.stakeholders}
        onChange={onStakeholders}
        brand={project.brand}
        onContinue={() => setStage('brand')}
      />
      </main>{settingsOverlay}</div>
    )
  }

  if (project && stage === 'brand') return <div className="layout">{projectSidebar}<main className="content"><BrandSetup company={project.name} brand={project.brand} onScan={website=>scanBrand(project.id,project.name,website)} onChange={brand=>{brandScans.current.delete(project.id);update({brand:{...brand,status:'ready',message:'Your branding is saved.'}})}} onContinue={()=>setStage('people')}/></main>{settingsOverlay}</div>

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
      </main>{settingsOverlay}</div>
    )
  }

  // Details and Deck need a project; without one, fall back to the list.
  const page = ['connections', 'lookup', 'dashboard'].includes(view) ? view : project ? view : 'projects'
  const insideProject = !!project && page !== 'projects'
  const agentFull = insideProject && page === 'agent'
  const agentSplit = insideProject && split && !agentFull
  const userName = (user || '').trim() || account.session.user.email.split('@')[0]
  const chatProps = insideProject && { project, userId: account.session.user.id, userName, onApply: applyFromChat, onUndo: undoFromChat, onSettings: openSettings }

  return (
    <div className="layout">
      <Sidebar view={page} project={project} projectMode={insideProject} onNav={navigate} onSettings={openSettings} settingsOpen={settingsOpen} saveStatus={saving.status} account={account} />

      <div className={`lookup-content-wrap${agentSplit ? ' with-chat' : ''}`} style={agentSplit ? { '--chat-w': `${chatWidth}px` } : undefined}>
      <main className={`content${agentFull ? ' content-agent' : ''}`}>
        {agentFull ? (
          <ChatPanel key={project.id} {...chatProps} mode="full" onSplit={() => { setSplit(true); setView(backFromAgent.current === 'agent' ? 'details' : backFromAgent.current) }} />
        ) : page === 'dashboard' ? (
          <Dashboard
            account={account}
            name={user}
            deals={projects}
            loading={dealsLoading}
            onNav={navigate}
            onSettings={openSettings}
            onOpen={id => { saving.flush(); setCurrentId(id); setView('details') }}
            onCreate={() => { setView('projects'); setCreateRequest(n => n + 1) }}
          />
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
            onCreateSample={async key => {
              const { SAMPLE_CASES, createSampleCase } = await import('./sampleCases.js')
              const definition = SAMPLE_CASES.find(sample => sample.key === key)
              if (!definition) return
              const sample = createSampleCase(definition, newProject)
              setProjects(prev => [sample, ...prev])
              setCurrentId(sample.id)
              setView('details')
            }}
          />
        )}
      </main>
      {agentSplit && <>
        <div className="chat-resizer" role="separator" aria-orientation="vertical" aria-label="Resize agent panel" tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={e => { if (e.key === 'ArrowLeft') setChatWidth(w => Math.min(w + 24, 900)); if (e.key === 'ArrowRight') setChatWidth(w => Math.max(w - 24, 320)) }} />
        <ChatPanel key={project.id} {...chatProps} mode="split" onClose={() => setSplit(false)} onFull={() => navigate('agent')} />
      </>}
      {insideProject && !agentSplit && !agentFull && (
        <button type="button" className="chat-open" onClick={() => setSplit(true)} title="Open the agent beside this tab">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M9.5 3v10" /></svg>Agent
        </button>)}
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
      {settingsOverlay}
    </div>
  )
}
