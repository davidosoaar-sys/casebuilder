import React, { useState } from 'react'
import InputSheet from './InputSheet.jsx'
import StakeholderMap from './StakeholderMap.jsx'
import People from './People.jsx'
import { uid } from '../projects.js'
import { projectToCaseFile } from '../caseFile.js'

// A project's details: the inputs that feed the deck, the stakeholder map, and
// the people found for each stakeholder.

export default function Details({ project, onFields, onStakeholders, onPeople, onReset }) {
  const [tab, setTab] = useState('inputs')
  const peopleCount = Object.values(project.people || {}).reduce((n, l) => n + l.length, 0)

  const setFields = fn => onFields(fn)

  return (
    <div className="details">
      <p className="mono-label">Details</p>
      <div className="details-title">
        <h1>{project.name}</h1>
        <button className="ghost" onClick={() => downloadCase(project)} title="Save this case as a .case.json file the Claude plugin or another copy of the app can open">
          Export case file
        </button>
      </div>

      <div className="details-tabs" role="tablist">
        {[
          ['inputs', 'Inputs', null],
          ['stakeholders', 'Stakeholders', project.stakeholders.length],
          ['people', 'People', peopleCount]
        ].map(([key, label, count]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`details-tab ${tab === key ? 'details-tab-on' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
            {count != null && <span className="details-count">{count}</span>}
          </button>
        ))}
      </div>

      {tab === 'inputs' && (
        <InputSheet
          fields={project.fields}
          onChange={(key, value) =>
            setFields(fs => fs.map(f => (f.key === key ? { ...f, value } : f)))
          }
          onToggle={key =>
            setFields(fs => fs.map(f => (f.key === key ? { ...f, confirmed: !f.confirmed } : f)))
          }
          onAdd={input =>
            onFields(fs => [...fs, { ...input, key: `custom_${uid()}`, group: 'Custom', custom: true }])
          }
          onRemove={key => setFields(fs => fs.filter(f => f.key !== key))}
          onReset={onReset}
        />
      )}

      {tab === 'stakeholders' && (
        <StakeholderMap
          embedded
          company={project.name}
          stakeholders={project.stakeholders}
          people={project.people}
          onChange={onStakeholders}
        />
      )}

      {tab === 'people' && (
        <People
          embedded
          company={project.name}
          stakeholders={project.stakeholders}
          people={project.people}
          onPeople={onPeople}
        />
      )}
    </div>
  )
}

function downloadCase(project) {
  const blob = new Blob([JSON.stringify(projectToCaseFile(project), null, 2) + '\n'], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${String(project.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'case'}.case.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
