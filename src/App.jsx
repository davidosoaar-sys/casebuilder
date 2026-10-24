import React, { useState, useMemo, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Deck from './components/Deck.jsx'
import WebsiteView from './components/WebsiteView.jsx'
import ProjectList from './components/ProjectList.jsx'
import Details from './components/Details.jsx'
import StakeholderMap from './components/StakeholderMap.jsx'
import People from './components/People.jsx'
import {
  loadProjects,
  saveProjects,
  newProject,
  hydrate,
  defaultFields,
  defaultStakeholders
} from './projects.js'
import { defaultDeck } from './deck/model.js'
import { computeModel } from './model.js'
import { stakeholdersForArchetype } from './valueModel.js'

const USER_KEY = 'casebuilder.user'

function loadUser() {
  try {
    return localStorage.getItem(USER_KEY) || ''
  } catch {
    return ''
  }
}

// A sidebar (Projects / Details / Deck) frames the app. Projects is the list;
// Details and Deck are the open project's two pages. A brand-new project first
// walks through the stakeholder map and the people step (full screen, no
// sidebar), then lands on its Details.
export default function App() {
  const [projects, setProjects] = useState(() => loadProjects().map(hydrate))
  const [currentId, setCurrentId] = useState(null)
  const [user, setUser] = useState(loadUser)
  const [view, setView] = useState('projects') // 'projects' | 'details' | 'deck' | 'website'
  const [stage, setStage] = useState(null) // 'map' | 'people' while setting up a new project

  useEffect(() => saveProjects(projects), [projects])
  useEffect(() => {
    try {
      localStorage.setItem(USER_KEY, user)
    } catch {
      // storage unavailable: the name just won't persist
    }
  }, [user])

  const project = projects.find(p => p.id === currentId)

  function update(patch) {
    setProjects(prev =>
      prev.map(p =>
        p.id === currentId
          ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch), updatedAt: Date.now() }
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
      const arch = fs => fs.find(f => f.key === 'archetype')?.value
      return arch(next) !== arch(p.fields)
        ? { fields: next, stakeholders: stakeholdersForArchetype(p.stakeholders, arch(next)) }
        : { fields: next }
    })

  if (project && stage === 'map') {
    return (
      <StakeholderMap
        company={project.name}
        stakeholders={project.stakeholders}
        onChange={onStakeholders}
        onContinue={() => setStage('people')}
      />
    )
  }

  if (project && stage === 'people') {
    return (
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
    )
  }

  // Details and Deck need a project; without one, fall back to the list.
  const page = project ? view : 'projects'

  return (
    <div className="layout">
      <Sidebar view={page} project={project} onNav={setView} />

      <main className="content">
        {page === 'details' ? (
          <Details
            project={project}
            model={model}
            onFields={onFields}
            onStakeholders={onStakeholders}
            onPeople={onPeople}
            onReset={() => {
              if (window.confirm('Reset this project’s inputs, stakeholders and deck to the defaults?')) {
                update({ fields: defaultFields(), stakeholders: defaultStakeholders(), deck: defaultDeck() })
              }
            }}
          />
        ) : page === 'deck' ? (
          <Deck
            inputs={inputs}
            model={model}
            fields={project.fields}
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
            onBack={() => setView('deck')}
          />
        ) : (
          <ProjectList
            user={user}
            onUser={setUser}
            projects={projects}
            activeId={currentId}
            onCreate={name => {
              const p = newProject(name)
              setProjects(prev => [p, ...prev])
              setCurrentId(p.id)
              setStage('map')
            }}
            onOpen={id => {
              setCurrentId(id)
              setView('details')
            }}
            onImport={p => {
              setProjects(prev => [p, ...prev])
              setCurrentId(p.id)
              setView('details')
            }}
            onDelete={id => {
              setProjects(prev => prev.filter(p => p.id !== id))
              if (id === currentId) setCurrentId(null)
            }}
          />
        )}
      </main>
    </div>
  )
}
