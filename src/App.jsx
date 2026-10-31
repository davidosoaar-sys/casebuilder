import {verifyBrandForDisplay} from './verifyBrand.js'
import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Deck from './components/Deck.jsx'
import WebsiteView from './components/WebsiteView.jsx'
import ProjectList from './components/ProjectList.jsx'
import BrandSetup from './components/BrandSetup.jsx'
import TemplateSetup from './components/TemplateSetup.jsx'
import SetupProgress from './components/SetupProgress.jsx'
import FirstVisit from './components/FirstVisit.jsx'
import { resetTour } from './tourTips.js'
import Details from './components/Details.jsx'
import StakeholderMap from './components/StakeholderMap.jsx'
import People from './components/People.jsx'
import useCloudDeals from './useCloudDeals.js'
import ChatPanel from './components/ChatPanel.jsx'
import { apiHeaders } from './apiAuth.js'
import { prepareBrandOps } from './agentBrandAssets.js'
import { applyAgentReply, undoAgentReply, redoAgentReply, agentReplyConflicts, agentRedoConflicts, agentStepLabel } from './agentDeckEdits.js'
import useHistory from './useHistory.js'
import { Toaster, showToast } from './components/ui.jsx'
import { runCommand } from './agentRunner.js'
import { withSuggestion } from './source.js'
import { supabase } from './supabase.js'
import {
  duplicateProject,
  newProject,
  hydrate,
  defaultFields,
  defaultStakeholders
} from './projects.js'
import { defaultDeck } from './deck/model.js'
import {templateBrand,chooseDeckTemplate,prepareTemplateBrand} from './deck/template.js'
import { loadConnections, saveConnections } from './connectors.js'
import Connections from './components/Connections.jsx'
import Dashboard from './components/Dashboard.jsx'
import Settings from './components/Settings.jsx'
import { computeModel } from './model.js'
import { stakeholdersForArchetype } from './valueModel.js'
import { DEFAULT_BRAND } from './brand.js'
import { AGENT_COMMANDS } from './agentCommands.js'
import PersonLookup from './components/PersonLookup.jsx'
import Scheduled from './components/Scheduled.jsx'
import Skills from './components/Skills.jsx'
import Customize from './components/Customize.jsx'
import ProjectFiles from './components/ProjectFiles.jsx'
import WaitlistAdmin, { isAdmin } from './components/WaitlistAdmin.jsx'
import usePersonLookup from './usePersonLookup.js'
import { addPersonToDeal, acceptPersonInput } from './personLookup.js'
import usePublicInputs from './usePublicInputs.js'

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
const ADMIN_VIEW_KEY = 'casebuilder.adminView'

export default function App({ account }) {
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f8f7' : '#111111')
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])
  // isAdminAccount = what the database says. admin = what the UI shows: an admin can
  // switch to the regular view (Settings) to see the app as everyone else does.
  const [isAdminAccount, setAdminAccount] = useState(false)
  useEffect(() => { isAdmin(account.session.user.id).then(setAdminAccount).catch(() => setAdminAccount(false)) }, [account.session.user.id])
  const [adminView, setAdminViewState] = useState(() => { try { return localStorage.getItem(ADMIN_VIEW_KEY) !== 'regular' } catch { return true } })
  const setAdminView = on => { setAdminViewState(on); try { localStorage.setItem(ADMIN_VIEW_KEY, on ? 'admin' : 'regular') } catch {} }
  const admin = isAdminAccount && adminView
  // Admin: replay the guided tour from the start (clears this user's tour progress).
  const [tourRun, setTourRun] = useState(0)
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
  const [view, setView] = useState(() => new URLSearchParams(window.location.search).has('connector_callback') ? 'connections' : 'dashboard') // 'dashboard' | 'projects' | 'details' | 'deck' | 'website' | 'settings' | ...
  const connectorLinkOpened = useRef(false)
  useEffect(() => {
    if (dealsLoading || connectorLinkOpened.current) return
    connectorLinkOpened.current = true
    const params = new URLSearchParams(window.location.search)
    const id = params.get('deal'), target = params.get('view')
    if (projects.some(p => p.id === id) && ['website','deck'].includes(target)) {
      setCurrentId(id); setView(target)
    }
  }, [dealsLoading, projects])
  const [createRequest, setCreateRequest] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  function restartTour() {
    resetTour(account.session.user.id)
    setSettingsOpen(false)
    navigate('dashboard')
    setTourRun(n => n + 1)
  }
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
      const response = await fetch('/api/brand', { method: 'POST', headers: await apiHeaders(code ? { 'x-access-code': code } : {}), body: JSON.stringify({ command:AGENT_COMMANDS.DISCOVER_BRAND,company, website: website && !/^https:\/\//i.test(website) ? `https://${website}` : website }), signal: AbortSignal.timeout(55000) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Brand discovery could not finish.')
      const checked=await prepareTemplateBrand(await verifyBrandForDisplay(result),projects.find(p=>p.id===id)?.brand?.template)
      if (brandScans.current.get(id) !== token) return
      setProjects(ps => ps.map(p => p.id === id ? { ...p, brand: templateBrand(checked,p.brand?.template), updatedAt: Date.now() } : p))
    } catch (error) {
      if (brandScans.current.get(id) !== token) return
      setProjects(ps => ps.map(p => p.id === id ? { ...p, brand: { ...p.brand, status: 'error', message: error.message || 'Brand discovery could not finish. You can edit everything manually.' } } : p))
    }
  }

  useEffect(() => { window.scrollTo(0, 0) }, [view, currentId, stage])
  // A new page fades in with a 4px rise. Keyed on the page, not the project,
  // with no exit and no remount; the full-screen Agent is left alone.
  const mainRef = useRef(null)
  const shownView = useRef(view)
  useLayoutEffect(() => {
    if (shownView.current === view) return
    shownView.current = view
    const main = mainRef.current
    const el = main?.firstElementChild
    if (!el || main.classList.contains('content-agent') || !el.animate) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.animate(still ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }],
      { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
  }, [view])

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
  const retryPublicInputs=usePublicInputs({project,active:!!project&&['details','deck','website'].includes(view),setProjects})
  const connectionProject = project || projects.find(p=>p.id===connectionProjectId)
  function updateConnectionProject(patch) {
    if (!connectionProject) return
    setProjects(previous=>previous.map(p=>p.id===connectionProject.id?{...p,...patch(p),createdAt:p.createdAt,updatedAt:Date.now()}:p))
  }
  const lookup = usePersonLookup({ project, connections: dealConnections })
  const [pendingPersonInput, setPendingPersonInput] = useState(null)
  const [skillRequest, setSkillRequest] = useState(null) // Skills page "Use" -> the Agent
  const [fillRequest, setFillRequest] = useState(null) // Dashboard "Find the CTO" -> the Agent's composer, not sent
  const [scheduleSkill, setScheduleSkill] = useState(null) // Skills page "Schedule" -> Scheduled
  const lookupPage = <PersonLookup lookup={lookup} project={project}
    onAdd={person => update(p => addPersonToDeal(p, person))}
    onInput={suggestion => setPendingPersonInput({ dealId: project.id, suggestion })} />
  function navigate(next) {
    if(next==='deck')setPreviewRequest(null) // Start with all editable slides; previews open only through View as.
    if (next === 'customize') next = 'skills' // Customize opens on its Skills tab
    setStage(null)
    if (next === 'settings') { setSettingsOpen(true); return } // overlay: never leaves the current page
    if (['projects', 'dashboard', 'waitlist'].includes(next)) { saving.flush(); setCurrentId(null) }
    if (next === 'agent') { if (view !== 'agent') backFromAgent.current = view; setSplit(false) }
    setView(next)
  }
  const projectSidebar = <Sidebar view={view} project={project} projectMode onNav={navigate} onSettings={openSettings} settingsOpen={settingsOpen} saveStatus={saving.status} account={account} />

  // Every change to the open project goes through here. `opts` labels it for
  // the undo history ({ label, key?, id?, agent? }); { skip: true } is undo/redo
  // itself. Changes to parts the history does not track are not steps.
  function update(patch, opts) {
    history.record(opts || { label: 'Edit' })
    setProjects(prev =>
      prev.map(p =>
        p.id === currentId
          ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch), createdAt: p.createdAt, updatedAt: Date.now() }
          : p
      )
    )
  }

  // Undo / redo for the open project: through update(), so saving works as
  // normal. Undoing an agent step also marks its chat change card.
  // Brand and theme changes, from the Deck design panel and from the quick design switch.
  const changeBrand = async brand => { brandScans.current.delete(project.id); const changed=brand.template!==project.brand?.template&&['company','backstage'].includes(brand.template); if(changed||brand.logo!==project.brand.logo)brand=await prepareTemplateBrand({...brand,originalLogo:brand.logo!==project.brand.logo?brand.logo:brand.originalLogo},brand.template); update(changed?chooseDeckTemplate(project,brand):{ brand: { ...brand, status: 'ready', message: 'Your custom deck design is saved.' } }, { label: changed?'Changed the deck template':'Changed the deck design', key: changed?undefined:'brand-panel' }) }

  const history = useHistory(project, (parts, step, direction) => update(p => {
    const a = step.agent
    const entry = a && p.agentLog?.[a.id]
    if (!entry) return parts
    const undone = direction === 'undo' ? !a.undone : a.undone
    return { ...parts, agentLog: { ...p.agentLog, [a.id]: { ...entry, undone, skipped: [], deckSkipped: [] } } }
  }, { skip: true }))
  const historyRef = useRef(history)
  historyRef.current = history
  const onProjectPage = !!project && !stage && !['projects', 'skills', 'scheduled', 'dashboard', 'connections', 'lookup', 'waitlist'].includes(view)
  useEffect(() => {
    if (!onProjectPage) return
    const onKey = e => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const k = e.key.toLowerCase()
      const undo = k === 'z' && !e.shiftKey
      const redo = (k === 'z' && e.shiftKey) || (k === 'y' && e.ctrlKey && !e.metaKey)
      if (!undo && !redo) return
      // Text fields keep their own undo.
      const t = e.target
      if (t?.isContentEditable || t?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return
      e.preventDefault()
      const h = historyRef.current
      const step = undo ? h.undo() : h.redo()
      if (step) showToast({ message: `${undo ? 'Undone' : 'Redone'}: ${step.label.charAt(0).toLowerCase()}${step.label.slice(1)}`, duration: 3000 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onProjectPage])

  const fields = project?.fields
  const inputs = useMemo(
    () => (fields ? Object.fromEntries(fields.map(f => [f.key, f.value])) : {}),
    [fields]
  )

  // The model is recomputed from the inputs on every change. Nothing downstream
  // keeps a copy of a figure.
  const model = useMemo(() => computeModel(inputs), [inputs])

  const onStakeholders = (fn, opts) => update(p => ({ stakeholders: fn(p.stakeholders) }), opts || { label: 'Changed the stakeholders', key: 'stakeholders' })
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
    }, { label: 'Edited the inputs', key: 'fields' })

  // Agent edits (inputs, and the deck and brand behind every artifact): applied
  // straight away, once per reply (agentLog is keyed by the chat message id and
  // saved with the deal), and undoable with one Undo per reply. Each is also a
  // step in the undo history. Undo always undoes: when the user has changed the
  // same thing since, it returns the places so the card can ask first.
  const applyingReplies = useRef(new Set())
  const activeProjectId = useRef(currentId)
  activeProjectId.current = currentId
  const applyFromChat = async (messageId, edits, deckOps) => {
    if (!project || applyingReplies.current.has(messageId) || project.agentLog?.[messageId]) return
    applyingReplies.current.add(messageId)
    const prepared = await prepareBrandOps(deckOps, project.brand, async (url, kind) => {
      let code = ''
      try { code = localStorage.getItem('casebuilder.access') || '' } catch {}
      const response = await fetch('/api/brand', { method: 'POST', headers: await apiHeaders(code ? { 'x-access-code': code } : {}), body: JSON.stringify({ command: 'resolve_brand_asset', url, kind }), signal: AbortSignal.timeout(15000) })
      const result = await response.json()
      if (!response.ok) throw Error(result.error || 'Image validation failed.')
      return result
    })
    if (activeProjectId.current !== project.id) { applyingReplies.current.delete(messageId); return }
    const entry = project && applyAgentReply(project, messageId, { edits, ...prepared }).agentLog?.[messageId]
    update(p => applyAgentReply(p, messageId, { edits, ...prepared }), { label: agentStepLabel(entry), agent: { id: messageId, undone: false } })
    applyingReplies.current.delete(messageId)
  }
  const undoFromChat = (messageId, { force = false } = {}) => {
    if (!project) return {}
    const conflicts = force ? [] : agentReplyConflicts(project, messageId)
    if (conflicts.length) return { conflicts }
    update(p => undoAgentReply(p, messageId, { force: true }), { label: 'Undid an agent change', agent: { id: messageId, undone: true } })
    return {}
  }
  const redoFromChat = (messageId, { force = false } = {}) => {
    if (!project) return {}
    const conflicts = force ? [] : agentRedoConflicts(project, messageId)
    if (conflicts.length) return { conflicts }
    update(p => redoAgentReply(p, messageId), { label: agentStepLabel(project?.agentLog?.[messageId]), agent: { id: messageId, undone: false } })
    return {}
  }

  // Agent commands (Find people, Suggest values, Person lookup, Find branding):
  // run once per reply through the same client code as the buttons, results
  // saved on the deal as proposals; the user picks what goes in.
  const runningCmds = useRef(new Set())
  const patchDeal = (dealId, fn) => setProjects(prev => prev.map(p => p.id === dealId ? { ...p, ...fn(p), createdAt: p.createdAt, updatedAt: Date.now() } : p))
  async function runFromChat(messageId, commands) {
    const deal = project
    if (!deal || runningCmds.current.has(messageId) || deal.agentRuns?.[messageId]?.status === 'done') return
    runningCmds.current.add(messageId)
    const setRun = run => patchDeal(deal.id, p => ({ agentRuns: { ...(p.agentRuns || {}), [messageId]: { ...(p.agentRuns?.[messageId] || {}), ...run } } }))
    setRun({ status: 'running', at: Date.now(), commands, results: [] })
    const results = []
    for (const command of commands) {
      try { results.push({ command, ...(await runCommand(command, deal, { connections: dealConnections, model })) }) }
      catch (e) { results.push({ command, error: e.message || 'The command failed.' }) }
      setRun({ results: [...results] })
    }
    setRun({ status: 'done', results, finishedAt: Date.now() })
    runningCmds.current.delete(messageId)
  }
  // Picking a result: the same writes the buttons make.
  function pickFromChat(messageId, pick) {
    update(p => {
      const run = p.agentRuns?.[messageId]
      if (!run) return {}
      const mark = picked => ({ agentRuns: { ...p.agentRuns, [messageId]: { ...run, picked: { ...(run.picked || {}), [pick.id]: picked } } } })
      if (pick.type === 'person') {
        const have = p.people?.[pick.roleKey] || []
        if (have.some(x => x.name?.toLowerCase() === pick.person.name.toLowerCase())) return mark(true)
        return { ...mark(true), people: { ...(p.people || {}), [pick.roleKey]: [...have, pick.person] } }
      }
      if (pick.type === 'value') {
        const now = new Date().toISOString()
        return { ...mark(true), fields: p.fields.map(f => f.key === pick.key && !f.deleted ? withSuggestion(f, pick.suggestion, { now, enabled: pick.enabled || [] }) : f) }
      }
      if (pick.type === 'lookup') { const next = addPersonToDeal(p, pick.person); return next === p ? mark(true) : { ...mark(true), stakeholders: next.stakeholders, people: next.people } }
      if (pick.type === 'brand') return { ...mark(true), brand: pick.brand }
      return {}
    })
  }

  const settingsOverlay = settingsOpen && (
    <Settings account={account} name={user} onName={setUser} theme={theme} onTheme={setTheme} isAdminAccount={isAdminAccount} adminView={adminView} onAdminView={setAdminView} onRestartTour={restartTour} onClose={() => setSettingsOpen(false)} />
  )

  const welcomeOverlay=<FirstVisit key={tourRun} userId={account.session.user.id} userName={user} onName={async name=>{const {error}=await supabase.auth.updateUser({data:{name}});if(error)throw error;setUserState(name)}} context={{stage,view}} suspended={settingsOpen}/>
  if (project && stage === 'map') {
    return (
      <div className="layout">
      {projectSidebar}<main className="content"><SetupProgress stage={stage}/>
      <StakeholderMap
        company={project.name}
        stakeholders={project.stakeholders}
        onChange={onStakeholders}
        brand={project.brand}
        onContinue={() => setStage('brand')}
      />
      </main>{settingsOverlay}{welcomeOverlay}</div>
    )
  }

  if (project && stage === 'brand') return <div className="layout">{projectSidebar}<main className="content"><SetupProgress stage={stage}/><BrandSetup onBack={()=>setStage('map')} company={project.name} brand={project.brand} onScan={website=>scanBrand(project.id,project.name,website)} onChange={brand=>{brandScans.current.delete(project.id);update({brand:{...templateBrand(brand,project.brand?.template),status:'ready',message:'Your branding is saved.'}})}} onContinue={()=>setStage('people')}/></main>{settingsOverlay}{welcomeOverlay}</div>

  if (project && stage === 'people') {
    return (
      <div className="layout">
      {projectSidebar}<main className="content"><SetupProgress stage={stage}/>
      <People
        showStep
        onBack={()=>setStage('map')}
        company={project.name}
        stakeholders={project.stakeholders}
        people={project.people}
        onPeople={onPeople}
        continueLabel="Choose theme"
        onContinue={() => {
          setStage('theme')
        }}
      />
      </main>{settingsOverlay}{welcomeOverlay}</div>
    )
  }

  // Details and Deck need a project; without one, fall back to the list.
  if(project&&stage==='theme')return <div className="layout">{projectSidebar}<main className="content"><SetupProgress stage={stage}/><TemplateSetup key={project.id} company={project.name} brand={project.brand} onBack={()=>setStage('people')} onContinue={async template=>{const brand=await prepareTemplateBrand(project.brand,template);update(chooseDeckTemplate(project,brand),{label:'Selected the case theme'});setStage(null);setView('details')}}/></main>{settingsOverlay}{welcomeOverlay}</div>

  const page = ['connections', 'lookup', 'dashboard', 'waitlist', 'skills', 'scheduled'].includes(view) ? view : project ? view : 'projects'
  const insideProject = !!project && !['projects', 'skills', 'scheduled'].includes(page)
  const agentFull = insideProject && page === 'agent'
  const agentSplit = insideProject && split && !agentFull
  const userName = (user || '').trim() || account.session.user.email.split('@')[0]
  const chatProps = insideProject && { project, userId: account.session.user.id, userName, onApply: applyFromChat, onUndo: undoFromChat, onRedo: redoFromChat, onRun: runFromChat, onPick: pickFromChat, onSettings: openSettings,
    onFlush: saving.flush, onViewCase: () => { if (page === 'agent') setSplit(true); setView('website') },
    skillRequest: skillRequest?.dealId === project?.id ? skillRequest : null, onSkillRequestDone: () => setSkillRequest(null),
    fillRequest: fillRequest?.dealId === project?.id ? fillRequest : null, onFillRequestDone: () => setFillRequest(null) }

  return (
    <div className="layout">
      <Sidebar view={page} project={project} projectMode={insideProject} onNav={navigate} onSettings={openSettings} settingsOpen={settingsOpen} saveStatus={saving.status} account={account} admin={admin} />

      <div className={`lookup-content-wrap${agentSplit ? ' with-chat' : ''}`} style={agentSplit ? { '--chat-w': `${chatWidth}px` } : undefined}>
      <main ref={mainRef} className={`content${agentFull ? ' content-agent' : ''}`}>
        {cloud.loadError ? (
          <section className="page" role="alert">
            <h1>Your projects could not be loaded</h1>
            <p>The database could not return your projects. This is a loading error, not an empty project list.</p>
            <p>No projects have been deleted by this error. Your pending local edits are kept.</p>
            <p>{cloud.loadError}</p>
            <button className="primary" type="button" onClick={cloud.retry}>Try again</button>
          </section>
        ) : agentFull ? (
          <ChatPanel key={project.id} {...chatProps} mode="full" onSplit={() => { setSplit(true); setView(backFromAgent.current === 'agent' ? 'details' : backFromAgent.current) }} />
        ) : page === 'dashboard' ? (
          <Dashboard
            account={account}
            name={user}
            deals={projects}
            loading={dealsLoading}
            onSettings={openSettings}
            onOpen={id => { saving.flush(); setCurrentId(id); setView('details') }}
            onReview={id => { saving.flush(); setCurrentId(id); setView('details') }}
            onFind={(id, text) => { saving.flush(); setFillRequest({ dealId: id, text }); setCurrentId(id); backFromAgent.current = 'details'; setSplit(false); setView('agent') }}
            onRescan={id => { const d = projects.find(p => p.id === id); if (d) scanBrand(id, d.name, d.brand?.website || '') }}
            onCreate={() => { setView('projects'); setCreateRequest(n => n + 1) }}
          />
        ) : page === 'details' ? (
          <Details
            onRetryPublicInputs={retryPublicInputs}
            project={project}
            model={model}
            connections={dealConnections}
            onFields={onFields}
            onStakeholders={onStakeholders}
            onPeople={onPeople}
            userId={account.session.user.id}
            onFiles={() => navigate('files')}
            onReset={() => {
              if (window.confirm('Reset this project’s inputs, stakeholders and deck to the defaults?')) {
                update({ fields: defaultFields(), stakeholders: defaultStakeholders(), deck: defaultDeck(), documents: [] }, { label: 'Reset the project to the defaults' })
              }
            }}
          />
        ) : page === 'connections' ? (
          <Customize tab="connections" onTab={navigate}>
          <Connections embedded
            project={connectionProject}
            projects={projects}
            selectedProjectId={connectionProjectId}
            onSelectProject={setConnectionProjectId}
            connections={connectionProject?.connectors || connections}
            documents={connectionProject?.documents || []}
            onConnections={fn => connectionProject ? updateConnectionProject(p => ({ connectors: fn(p.connectors || connections) })) : setConnections(fn)}
            onDocuments={fn => updateConnectionProject(p => ({ documents: fn(p.documents || []) }))}
          />
          </Customize>
        ) : page === 'waitlist' && admin ? (
          <WaitlistAdmin />
        ) : page === 'skills' ? (
          <Customize tab="skills" onTab={navigate}>
          <Skills embedded userId={account.session.user.id} projects={projects}
            onUse={(sk, dealId) => { saving.flush(); setSkillRequest({ dealId, key: sk.key, id: sk.id }); setCurrentId(dealId); setView('agent') }}
            onSchedule={(sk, dealId) => { setScheduleSkill({ dealId, skill: sk }); navigate('scheduled') }} />
          </Customize>
        ) : page === 'scheduled' ? (
          <Scheduled userId={account.session.user.id} projects={projects}
            skillToSchedule={scheduleSkill} onSkillScheduled={() => setScheduleSkill(null)}
            onOpenChat={(dealId, chatId) => { try { localStorage.setItem(`casebuilder.chat.${dealId}`, chatId) } catch {} ; saving.flush(); setCurrentId(dealId); setView('agent') }} />
        ) : page === 'files' && project ? (
          <ProjectFiles key={project.id} project={project} userId={account.session.user.id} />
        ) : (page === 'people-lookup' || page === 'research') && project ? (
          // Research moved into the Agent as "Deep research" (v0.15.0); this page keeps the person lookup.
          <PersonLookup lookup={lookup} project={project}
            onAdd={person => update(p => addPersonToDeal(p, person))}
            onInput={suggestion => setPendingPersonInput({ dealId: project.id, suggestion })} />
        ) : page === 'lookup' ? (
          lookupPage
        ) : page === 'deck' ? (
          <Deck
            initialAudienceKey={websiteAudience}
            onImagery={patch=>update(p=>p.brand.heroImage||p.brand.heroImageHidden?{}:{brand:{...p.brand,...patch,sources:[...new Set([...(p.brand.sources||[]),...(patch.sources||[])])]}},{label:'Found official cover imagery'})}
            previewRequest={previewRequest}
            onPreviewOpened={() => setPreviewRequest(null)}
            key={project.id}
            brand={project.brand}
            onBrand={changeBrand}
            history={history}
            onScanBrand={website => scanBrand(project.id, project.name, website)}
            inputs={inputs}
            model={model}
            fields={project.fields}
            connectors={dealConnections}
            stakeholders={project.stakeholders}
            onStakeholders={onStakeholders}
            deck={project.deck}
            company={project.name}
            onDeck={(fn, opts) => update(p => ({ deck: fn(p.deck) }), opts || { label: 'Edited the slides' })}
            onWebsite={key => { setWebsiteAudience(key); setView('website') }}
            onFillInputs={() => navigate('details')}
          />
        ) : page === 'website' ? (
          <WebsiteView
            onImagery={patch=>update(p=>p.brand.heroImage||p.brand.heroImageHidden?{}:{brand:{...p.brand,...patch,sources:[...new Set([...(p.brand.sources||[]),...(patch.sources||[])])]}},{label:'Found official cover imagery'})}
            key={project.id}
            project={project}
            audienceKey={websiteAudience}
            onView={(format, audience) => { setWebsiteAudience(audience); setPreviewRequest(format==='editor'?null:format); setView('deck') }}
            onBrand={changeBrand}
            inputs={inputs}
            onDeck={(fn, opts) => update(p => ({ deck: fn(p.deck) }), opts || { label: 'Edited the Live room' })}
            history={history}
            onSite={site => update({ site })}
            onScenario={fn => update(p => ({ scenario: fn(p.scenario || {}) }))}
            onBack={() => setView('deck')}
            onFillInputs={() => navigate('details')}
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
      <Toaster />
      {welcomeOverlay}
    </div>
  )
}
