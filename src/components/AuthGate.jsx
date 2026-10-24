// Gate the whole app behind a Supabase session. Email + password only: no
// magic links, so sign-in never depends on an email landing during a demo.
import React, { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../supabase.js'
import Logo from './Logo.jsx'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigured) {
    return <main className="auth-screen"><div className="auth-card"><Logo /><p className="auth-error" role="alert">This build has no Supabase settings, so sign-in is unavailable.</p></div></main>
  }
  if (session === undefined) return <main className="auth-screen" aria-busy="true" />
  if (!session) return <SignIn />
  return children({ session, signOut: () => supabase.auth.signOut() })
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(/invalid/i.test(error.message) ? 'That email and password do not match an account.' : error.message)
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <Logo />
        <h1>Sign in</h1>
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy || !email.trim() || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="auth-note">Accounts are created by the CaseBuilder team during the pilot.</p>
      </form>
    </main>
  )
}
