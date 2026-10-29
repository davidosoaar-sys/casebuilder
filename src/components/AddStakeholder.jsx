import React, {useState} from 'react'
import {uid} from '../uid.js'
import {STAKEHOLDERS} from '../valueModel.js'

export function AddStakeholder({ existing, onAdd }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const have = new Set(existing.map(s => s.key))
  const removed = STAKEHOLDERS.filter(s => !have.has(s.key))

  function addCustom(e) {
    e.preventDefault()
    const name = role.trim()
    if (!name) return
    onAdd({
      key: `custom_${uid()}`,
      role: name,
      tag: 'Custom stakeholder',
      cares: 'What they care about',
      objection: '-',
      counter: '-'
    })
    setRole('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="tab tab-add" onClick={() => setOpen(true)}>
        + Add
      </button>
    )
  }

  return (
    <form className="stake-add" onSubmit={addCustom}>
      {removed.map(s => (
        <button
          key={s.key}
          type="button"
          className="tab"
          onClick={() => {
            onAdd({ key: s.key, builtin: true })
            setOpen(false)
          }}
        >
          + {s.role}
        </button>
      ))}
      <input
        type="text"
        placeholder="Or a new role"
        value={role}
        onChange={e => setRole(e.target.value)}
        autoFocus
      />
      <button className="primary" type="submit" disabled={!role.trim()}>
        Add
      </button>
      <button className="ghost" type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  )
}
