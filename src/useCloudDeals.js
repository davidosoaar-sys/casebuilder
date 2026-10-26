// Deals for the signed-in account, stored in Supabase. Loads once per account,
// replays any edit a closed tab never finished saving, seeds the Spotify sample
// for a brand-new account, and autosaves every change.
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { createCloudDealStore, loadCloudDeals, createCloudAutosaver } from './cloudDeals.js'
import { hydrate, newProject } from './projects.js'
import { SPOTIFY_LOGO } from './spotifyLogo.js'
import { styleSpotifyDeck } from './spotifyDeck.js'

const SAMPLE_MARK = 'casebuilder.cloud-sample.v1:'

export default function useCloudDeals(userId, connections) {
  const store = useMemo(() => createCloudDealStore(supabase, userId), [userId])
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [status, setStatus] = useState({ state: 'saved' })
  const seen = useRef(new Map())
  const saver = useRef(null)
  if (!saver.current) saver.current = createCloudAutosaver(store, { onStatus: setStatus })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        let { deals: loaded, replay } = await loadCloudDeals(store)
        let markSeen = true
        try { markSeen = Boolean(localStorage.getItem(SAMPLE_MARK + userId)) } catch {}
        if (!markSeen && loaded.length === 0) {
          // Fixed id per account: if two loads race (two tabs, or React's dev
          // double-start), the database refuses the second insert instead of
          // creating a second sample. Then we just read back what is there.
          const sample = styleSpotifyDeck({ ...newProject('Spotify', connections), id: `sample-spotify-${userId}`, projectLogo: SPOTIFY_LOGO, sample: true })
          try { await store.save(sample); loaded = [sample] }
          catch (e) { if (!/already taken/.test(e.message)) throw e; loaded = (await loadCloudDeals(store)).deals }
        }
        try { localStorage.setItem(SAMPLE_MARK + userId, 'added') } catch {}
        if (!alive) return
        const hydrated = loaded.map(hydrate)
        // Baseline = what the server has, so loading itself doesn't trigger saves.
        for (const d of hydrated) seen.current.set(d.id, JSON.stringify(d))
        for (const d of replay) { seen.current.delete(d.id); }
        setDeals(hydrated)
        setLoading(false)
      } catch (e) {
        if (alive) { setLoadError(e.message || 'Could not load your deals.'); setLoading(false) }
      }
    })()
    return () => { alive = false }
  }, [store]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading) return
    for (const deal of deals) {
      const fp = JSON.stringify(deal)
      if (seen.current.get(deal.id) === fp) continue
      seen.current.set(deal.id, fp)
      saver.current.queue(deal)
    }
  }, [deals, loading])

  useEffect(() => {
    const flush = () => { saver.current.flush() }
    const hidden = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', hidden)
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', hidden) }
  }, [])

  return {
    deals, setDeals, loading, loadError,
    saving: {
      status: loadError ? { state: 'error', message: loadError } : status,
      // Resolves once the latest copy is in the database. An edit made while a
      // save was in flight goes in a second save, so wait for that one too.
      flush: async () => { await saver.current.flush(); if (saver.current.hasPending()) await saver.current.flush() },
      async remove(id) { saver.current.forget(id); seen.current.delete(id); await store.remove(id) },
      reportError: message => setStatus({ state: 'error', message })
    }
  }
}
