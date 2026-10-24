// Gate the whole app behind a Supabase session.
// Sign in: email + password. Create account: email + password, then a 6-digit
// code from the confirmation email (typed here, no links to click). Each screen
// links to the other. Opening the app with ?signup lands on Create account.
import React, { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../supabase.js'
import AppLogo from './AppLogo.jsx'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigured) {
    return <main className="auth-screen"><div className="auth-card"><AppLogo /><p className="auth-error" role="alert">This build has no Supabase settings, so sign-in is unavailable.</p></div></main>
  }
  if (session === undefined) return <main className="auth-screen" aria-busy="true" />
  if (!session) return <AuthScreens />
  return children({ session, signOut: () => supabase.auth.signOut() })
}

const initialMode = () => {
  try { return new URLSearchParams(window.location.search).has('signup') ? 'signup' : 'signin' } catch { return 'signin' }
}

function AuthScreens() {
  const [mode, setMode] = useState(initialMode) // 'signin' | 'signup' | 'code'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const go = next => { setMode(next); setError(''); setNotice(''); setCode('') }

  async function signIn(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (!error) return
    if (/not confirmed/i.test(error.message)) { await resend(); setMode('code'); return }
    setError(/invalid/i.test(error.message) ? 'That email and password do not match an account.' : error.message)
  }

  async function signUp(e) {
    e.preventDefault()
    if (password.length < 10) { setError('Use at least 10 characters for the password.'); return }
    setBusy(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    setBusy(false)
    if (error) { setError(friendly(error)); return }
    // Supabase returns a user with no identities when the email is already registered.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError('There is already an account with this email. Sign in instead.')
      return
    }
    if (data.session) return // confirmations switched off: already signed in
    setMode('code')
    setNotice(`We sent a 6-digit code to ${email.trim()}.`)
  }

  async function verify(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' })
    setBusy(false)
    if (error) setError(/expired|invalid/i.test(error.message) ? 'That code is wrong or has expired. Check the latest email, or send a new code.' : error.message)
  }

  async function resend() {
    setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
    if (error) setError(friendly(error))
    else setNotice(`We sent a new code to ${email.trim()}.`)
  }

  if (mode === 'code') {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={verify}>
          <AppLogo />
          <h1>Check your email</h1>
          <p className="auth-note auth-note-top">{notice || `Enter the 6-digit code we sent to ${email.trim()}.`}</p>
          <label htmlFor="auth-code">Confirmation code</label>
          <input id="auth-code" className="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus required />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary" type="submit" disabled={busy || code.trim().length < 6}>{busy ? 'Checking…' : 'Confirm and continue'}</button>
          <p className="auth-switch">No email? <button type="button" className="link-btn" onClick={resend}>Send a new code</button> · <button type="button" className="link-btn" onClick={() => go('signup')}>Use a different email</button></p>
        </form>
      </main>
    )
  }

  const signup = mode === 'signup'
  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={signup ? signUp : signIn}>
        <AppLogo />
        <h1>{signup ? 'Create your account' : 'Sign in'}</h1>
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required />
        {signup && <p className="auth-hint">At least 10 characters.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy || !email.trim() || !password}>
          {busy ? (signup ? 'Creating…' : 'Signing in…') : (signup ? 'Create account' : 'Sign in')}
        </button>
        <p className="auth-switch">
          {signup
            ? <>Already have an account? <button type="button" className="link-btn" onClick={() => go('signin')}>Sign in</button></>
            : <>New to CaseBuilder? <button type="button" className="link-btn" onClick={() => go('signup')}>Create an account</button></>}
        </p>
      </form>
    </main>
  )
}

function friendly(error) {
  if (/rate limit|too many/i.test(error.message)) return 'Too many emails sent just now. Wait a few minutes and try again.'
  if (/password/i.test(error.message) && /least|short|weak/i.test(error.message)) return 'That password is too short or too common. Try a longer one.'
  return error.message
}
