import React, { useState, useMemo, useEffect } from 'react'
import InputSheet from './components/InputSheet.jsx'
import Deck from './components/Deck.jsx'
import ProjectList from './components/ProjectList.jsx'
import {
  loadProjects,
  saveProjects,
  newProject,
  hydrate,
  defaultFields,
  defaultStakeholders,
  uid
} from './projects.js'

export default function App() {
  const [projects, setProjects] = useState(() => loadProjects().map(hydrate))
  const [currentId, setCurrentId] = useState(null)

  useEffect(() => saveProjects(projects), [projects])

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

  if (!project) {
    return (
      <ProjectList
        projects={projects}
        onCreate={name => {
          const p = newProject(name)
          setProjects(prev => [p, ...prev])
          setCurrentId(p.id)
        }}
        onOpen={setCurrentId}
        onDelete={id => setProjects(prev => prev.filter(p => p.id !== id))}
      />
    )
  }

  const setFields = fn => update(p => ({ fields: fn(p.fields) }))

  return (
    <div className="app">
      <InputSheet
        projectName={project.name}
        fields={project.fields}
        onBack={() => setCurrentId(null)}
        onChange={(key, value) =>
          setFields(fs => fs.map(f => (f.key === key ? { ...f, value } : f)))
        }
        onToggle={key =>
          setFields(fs =>
            fs.map(f => (f.key === key ? { ...f, confirmed: !f.confirmed } : f))
          )
        }
        onReset={() =>
          update({ fields: defaultFields(), stakeholders: defaultStakeholders() })
        }
        onAdd={input =>
          setFields(fs => [
            ...fs,
            { ...input, key: `custom_${uid()}`, group: 'Custom', custom: true }
          ])
        }
        onRemove={key => setFields(fs => fs.filter(f => f.key !== key))}
      />
      <Deck
        inputs={inputs}
        fields={project.fields}
        stakeholders={project.stakeholders}
        onStakeholders={fn => update(p => ({ stakeholders: fn(p.stakeholders) }))}
      />
    </div>
  )
}
