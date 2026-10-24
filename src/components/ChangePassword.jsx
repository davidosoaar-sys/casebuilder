// Signed-in user changes their own password. Supabase updateUser: the new
// password goes straight from this form to Supabase Auth over HTTPS.
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase.js'

export default function ChangePassword({ onClose }) {
  const [pw, setPw] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const tooShort = pw.length > 0 && pw.length < 10
  const mismatch = again.length > 0 && pw !== again

  async function submit(e) {
    e.preventDefault()
    if (pw.length < 10 || pw !== again) return
    setBusy(true); setError('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  // Portal to <body>: rendered inside the sticky sidebar, the main page sat on
  // top of the dialog and swallowed every click.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submit} onKeyDown={e => e.key === 'Escape' && onClose()}>
        <p className="mono-label">Account</p>
        {done ? (
          <>
            <p className="change-pw-done" role="status">Password changed. Use it next time you sign in.</p>
            <div className="modal-actions"><button className="primary" type="button" onClick={onClose}>Done</button></div>
          </>
        ) : (
          <>
            <label htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} autoFocus />
            <label htmlFor="new-password-again">Type it again</label>
            <input id="new-password-again" type="password" autoComplete="new-password" value={again} onChange={e => setAgain(e.target.value)} />
            {tooShort && <p className="auth-error">At least 10 characters.</p>}
            {mismatch && <p className="auth-error">The two passwords do not match.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <div className="modal-actions">
              <button className="primary" type="submit" disabled={busy || pw.length < 10 || pw !== again}>{busy ? 'Saving…' : 'Change password'}</button>
              <button className="ghost" type="button" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </form>
    </div>,
    document.body
  )
}
