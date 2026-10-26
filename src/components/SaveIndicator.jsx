import React from 'react'
// A dot and a short label: green Saved, pulsing amber Saving, pink Not saved.
// The label remounts per state so it fades in; collapsed menus show the dot only.
export default function SaveIndicator({ status }) {
  const text = status.state === 'saving' ? 'Saving' : status.state === 'error' ? 'Not saved' : 'Saved'
  return (
    <span className={`save-indicator save-${status.state} no-print`} role="status" title={status.message || 'Saved to your account'} aria-live="polite">
      <i className="save-dot" aria-hidden="true" />
      <span key={status.state} className="save-label">{text}</span>
    </span>
  )
}
