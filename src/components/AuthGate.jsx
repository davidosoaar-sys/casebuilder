// Gate the whole app behind a Supabase session.
// Sign in: email + password. Create account: email + password, then a 6-digit
// code from the confirmation email (typed here, no links to click). Each screen
// links to the other. Opening the app with ?signup lands on Create account.
// Forgot password: email -> 6-digit reset code -> new password, all on this
// screen (no links to click).
import React, { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../supabase.js'
import AppLogo from './AppLogo.jsx'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking
  // A password reset signs the user in as soon as the code is accepted. Keep
  // the reset screen up until the new password is saved, so the app cannot
  // open (and be signed out of) with the old password still in place.
  const [resetting, setResetting] = useState(false)

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
  if (!session || resetting) return <AuthScreens onReset={setResetting} />
  return children({ session, signOut: () => supabase.auth.signOut() })
}

// ?waitlist (or the old ?signup link) opens the waitlist; ?invited opens Create account.
const initialMode = () => {
  try {
    const q = new URLSearchParams(window.location.search)
    return q.has('invited') ? 'signup' : (q.has('waitlist') || q.has('signup')) ? 'waitlist' : 'signin'
  } catch { return 'signin' }
}
const initialEmail = () => { try { return new URLSearchParams(window.location.search).get('email') || '' } catch { return '' } }
const sourceParam = () => { try { return (new URLSearchParams(window.location.search).get('ref') || '').slice(0, 60) } catch { return '' } }

function AuthScreens({ onReset = () => {} }) {
  const [mode, setMode] = useState(initialMode) // 'signin' | 'waitlist' | 'joined' | 'signup' | 'code' | 'forgot' | 'reset'
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [newPw, setNewPw] = useState('')
  const [newPwAgain, setNewPwAgain] = useState('')
  const go = next => { setMode(next); setError(''); setNotice(''); setCode(''); setNewPw(''); setNewPwAgain('') }

  async function sendReset(e) {
    e?.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setBusy(false)
    if (error) { setError(friendly(error)); return }
    // Same message whether or not the account exists, so the form cannot be
    // used to find out who has an account.
    setMode('reset'); setCode('')
    setNotice(`If ${email.trim()} has a CaseBuilder account, we sent it a 6-digit reset code.`)
  }

  async function resetPassword(e) {
    e.preventDefault()
    if (newPw.length < 10) { setError('Use at least 10 characters for the password.'); return }
    if (newPw !== newPwAgain) { setError('The two passwords do not match.'); return }
    setBusy(true); setError('')
    onReset(true)
    const { error: vErr } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' })
    if (vErr) {
      setBusy(false); onReset(false)
      setError(/expired|invalid/i.test(vErr.message) ? 'That code is wrong or has expired. Check the latest email, or send a new code.' : vErr.message)
      return
    }
    // The recovery code signs the user in; set the new password on that session.
    const { error: uErr } = await supabase.auth.updateUser({ password: newPw })
    setBusy(false)
    if (uErr) {
      // Do not leave a signed-in session behind with the old password still set.
      await supabase.auth.signOut()
      onReset(false)
      setError(friendly(uErr))
      return
    }
    onReset(false) // saved: now the app opens
  }

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
    if (error) {
      if (/waitlist_only|database error saving new user/i.test(error.message)) {
        setError('This email has not been invited yet. Join the waitlist and we will let you know.')
        return
      }
      setError(friendly(error)); return
    }
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

  if (mode === 'forgot') {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={sendReset}>
          <AppLogo />
          <h1>Reset your password</h1>
          <p className="auth-note auth-note-top">Enter your account email. We will send you a 6-digit code.</p>
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary" type="submit" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send reset code'}</button>
          <p className="auth-switch">Remembered it? <button type="button" className="link-btn" onClick={() => go('signin')}>Sign in</button></p>
        </form>
      </main>
    )
  }

  if (mode === 'reset') {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={resetPassword}>
          <AppLogo />
          <h1>Choose a new password</h1>
          <p className="auth-note auth-note-top">{notice || `Enter the 6-digit code we sent to ${email.trim()}.`}</p>
          <label htmlFor="reset-code">Reset code</label>
          <input id="reset-code" className="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus required />
          <label htmlFor="reset-password">New password</label>
          <input id="reset-password" type="password" autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} required />
          <label htmlFor="reset-password-again">Type it again</label>
          <input id="reset-password-again" type="password" autoComplete="new-password" value={newPwAgain} onChange={e => setNewPwAgain(e.target.value)} required />
          <p className="auth-hint">At least 10 characters.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary" type="submit" disabled={busy || code.trim().length < 6 || newPw.length < 10 || newPw !== newPwAgain}>{busy ? 'Saving…' : 'Set new password'}</button>
          <p className="auth-switch">No email? <button type="button" className="link-btn" onClick={() => sendReset()}>Send a new code</button> · <button type="button" className="link-btn" onClick={() => go('signin')}>Back to sign in</button></p>
        </form>
      </main>
    )
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

  if (mode === 'waitlist' || mode === 'joined') return <Waitlist email={email} setEmail={setEmail} joined={mode === 'joined'} onJoined={() => setMode('joined')} onSignIn={() => go('signin')} onInvited={() => go('signup')} />

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
        {signup
          ? <p className="auth-hint">At least 10 characters. Use the email you were invited with.</p>
          : <p className="auth-forgot"><button type="button" className="link-btn" onClick={() => { setError(''); setNotice(''); setMode('forgot') }}>Forgot password?</button></p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy || !email.trim() || !password}>
          {busy ? (signup ? 'Creating…' : 'Signing in…') : (signup ? 'Create account' : 'Sign in')}
        </button>
        <p className="auth-switch">
          {signup
            ? <>Already have an account? <button type="button" className="link-btn" onClick={() => go('signin')}>Sign in</button></>
            : <>New to CaseBuilder? <button type="button" className="link-btn" onClick={() => go('waitlist')}>Join the waitlist</button></>}
        </p>
      </form>
    </main>
  )
}

function Waitlist({ email, setEmail, joined, onJoined, onSignIn, onInvited }) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [useCase, setUseCase] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function join(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.rpc('join_waitlist', { p_email: email.trim(), p_name: name, p_company: company, p_role: role, p_use_case: useCase, p_source: sourceParam() })
    setBusy(false)
    if (error) { setError(/valid email/.test(error.message) ? 'Enter a valid email.' : /too many/.test(error.message) ? 'Too many sign-ups right now. Try again in a little while.' : error.message); return }
    onJoined()
  }

  if (joined) return (
    <main className="auth-screen">
      <div className="auth-card waitlist-card">
        <AppLogo />
        <h1>You're on the list</h1>
        <p className="waitlist-lede">Thanks{name.trim() ? `, ${name.trim().split(' ')[0]}` : ''}. We're letting people in by hand while we test with real sellers. We'll email {email.trim()} when your account is ready.</p>
        <p className="auth-switch">Already invited? <button type="button" className="link-btn" onClick={onInvited}>Create your account</button></p>
      </div>
    </main>
  )

  return (
    <main className="auth-screen">
      <form className="auth-card waitlist-card" onSubmit={join}>
        <AppLogo />
        <h1>Join the waitlist</h1>
        <p className="waitlist-lede">CaseBuilder turns what you know about a deal into a business case each stakeholder can say yes to. We're opening it to a small group first.</p>
        <label htmlFor="wl-email">Work email</label>
        <input id="wl-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        <div className="waitlist-row">
          <div><label htmlFor="wl-name">Name</label><input id="wl-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={120} /></div>
          <div><label htmlFor="wl-company">Company</label><input id="wl-company" autoComplete="organization" value={company} onChange={e => setCompany(e.target.value)} maxLength={120} /></div>
        </div>
        <label htmlFor="wl-role">Role</label>
        <input id="wl-role" autoComplete="organization-title" value={role} onChange={e => setRole(e.target.value)} maxLength={120} placeholder="e.g. Account Executive, Solutions Engineer" />
        <label htmlFor="wl-use">What would you use it for? <span className="auth-optional">optional</span></label>
        <textarea id="wl-use" rows={3} value={useCase} onChange={e => setUseCase(e.target.value)} maxLength={1000} placeholder="The deal or business case you'd try it on first." />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy || !email.trim()}>{busy ? 'Joining…' : 'Join the waitlist'}</button>
        <p className="auth-switch">Already have an account? <button type="button" className="link-btn" onClick={onSignIn}>Sign in</button></p>
        <p className="auth-switch waitlist-invited">Got an invite? <button type="button" className="link-btn" onClick={onInvited}>Create your account</button></p>
      </form>
    </main>
  )
}

function friendly(error) {
  if (/rate limit|too many/i.test(error.message)) return 'Too many emails sent just now. Wait a few minutes and try again.'
  if (/password/i.test(error.message) && /least|short|weak/i.test(error.message)) return 'That password is too short or too common. Try a longer one.'
  return error.message
}
