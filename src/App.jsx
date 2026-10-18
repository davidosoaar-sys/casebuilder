import React, { useState, useMemo } from 'react'
import { INPUT_FIELDS } from './valueModel.js'
import InputSheet from './components/InputSheet.jsx'
import Deck from './components/Deck.jsx'

export default function App() {
  const [fields, setFields] = useState(() =>
    INPUT_FIELDS.map(f => ({ ...f }))
  )

  const inputs = useMemo(
    () => Object.fromEntries(fields.map(f => [f.key, f.value])),
    [fields]
  )

  function handleChange(key, value) {
    setFields(prev =>
      prev.map(f => (f.key === key ? { ...f, value } : f))
    )
  }

  function handleToggle(key) {
    setFields(prev =>
      prev.map(f => (f.key === key ? { ...f, confirmed: !f.confirmed } : f))
    )
  }

  function handleReset() {
    setFields(INPUT_FIELDS.map(f => ({ ...f })))
  }

  return (
    <div className="app">
      <InputSheet
        fields={fields}
        onChange={handleChange}
        onToggle={handleToggle}
        onReset={handleReset}
      />
      <Deck inputs={inputs} fields={fields} />
    </div>
  )
}
