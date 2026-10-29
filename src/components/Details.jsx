import StakeholderRequirements from './StakeholderRequirements.jsx'
import CaseContext from './CaseContext.jsx'
import {CASE_CONTEXT} from '../caseContext.js'
import React, { useState } from 'react'
import InputSheet from './InputSheet.jsx'
import StakeholderMap from './StakeholderMap.jsx'
import People from './People.jsx'
import StakeholderBrief from './StakeholderBrief.jsx'
import { resolveStakeholder } from '../deck/stakeholders.js'
import { uid } from '../projects.js'
import { ORIGIN, emptySource } from '../source.js'
import { dealMarkdown, markdownFilename } from '../dealReport.js'
import { download } from '../export/download.js'
import { removeInput } from '../inputEditing.js'

// A project's details: the inputs that feed the deck (with where every number came
// from), the stakeholder map and the people found for each stakeholder. All of it is
// for Chris; none of it is on the deck.

export default function Details({
  project,
  model,
  connections,
  onFields,
  onStakeholders,
  onPeople,
  onReset,
  onRetryPublicInputs,
  userId,
  onFiles
}) {
  const [tab, setTab] = useState('inputs')
  const [briefKey, setBriefKey] = useState(null)
  const briefFor = briefKey && project.stakeholders.find(s => s.key === briefKey)
  const briefResolved = briefFor && resolveStakeholder(briefFor)
  const briefStakeholder = briefResolved && { ...briefResolved, key: briefFor.key, namedPeople: briefFor.namedPeople || [] }
  const peopleCount = Object.values(project.people || {}).reduce((n, l) => n + l.length, 0)

  return (
    <div className="details">
      <p className="mono-label">Case Inputs</p>
      <div className="details-title">
        <h1>{project.name}</h1>
        <button className="ghost" onClick={() => download(markdownFilename(project), new Blob([dealMarkdown(project)], { type: 'text/markdown;charset=utf-8' }))}>Export MD file</button>
      </div>

      {project.stakeholders.some(s => s.namedPeople?.length) && <section className="lookup-deal-people" aria-label="Named stakeholder mappings">
        {project.stakeholders.flatMap(s => (s.namedPeople || []).map(p => <p key={p.id}><strong><a href={p.sources[0]} target="_blank" rel="noreferrer noopener">{p.name}</a></strong> · <a href={p.mapping.sourceUrl} target="_blank" rel="noreferrer noopener">{p.title}</a><br />Mapped to {p.mapping.role} · {p.mapping.confidence} confidence · Inferred from title, not confirmed. {p.mapping.why} <a href={p.mapping.sourceUrl} target="_blank" rel="noreferrer noopener">Title source</a></p>))}
      </section>}

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

      {tab === 'inputs' && <CaseContext fields={project.fields} onFields={onFields}/>}
      {tab === 'inputs' && (
        <InputSheet
          publicResearch={project.publicInputResearch}
          onRetryPublicInputs={onRetryPublicInputs}
          fields={project.fields.filter(f=>!CASE_CONTEXT.some(c=>c.key===f.key))}
          model={model}
          company={project.name}
          connectors={connections}
          documents={project.documents}
          onFields={onFields}
          onAdd={input =>
            onFields(fs => [
              ...fs,
              {
                ...input,
                key: `custom_${uid()}`,
                group: 'Custom',
                custom: true,
                source: input.type === 'text' ? { state: 'input', origin: '' } : { state: 'assumption', origin: ORIGIN.assumption }
              }
            ])
          }
          onRemove={key => onFields(fs => removeInput(fs, key))}
          onReset={onReset}
        />
      )}

      {tab === 'stakeholders' && (
        briefStakeholder && userId
          ? <StakeholderBrief key={briefKey} project={project} stakeholder={briefStakeholder} userId={userId} onBack={() => setBriefKey(null)} onFiles={onFiles} />
          : <><StakeholderMap embedded company={project.name} stakeholders={project.stakeholders} people={project.people} onChange={onStakeholders} onOpen={userId ? setBriefKey : undefined} /><StakeholderRequirements stakeholders={project.stakeholders} onChange={onStakeholders}/></>
      )}

      {tab === 'people' && (
        <People embedded company={project.name} stakeholders={project.stakeholders} people={project.people} onPeople={onPeople} />
      )}
    </div>
  )
}

