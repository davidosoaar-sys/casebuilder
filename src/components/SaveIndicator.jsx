import React from 'react'
export default function SaveIndicator({ status }) {
  return <span className={`save-indicator save-${status.state} no-print`} role="status" title={status.message || 'Saved in this browser'} aria-live="polite">{status.state === 'saving' ? 'Saving…' : status.state === 'error' ? 'Not saved — storage unavailable' : 'Saved'}</span>
}
