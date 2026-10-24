// Deals in Supabase, one row per deal (public.deals). Replaces the browser-only
// store for signed-in users. Same contract as dealStorage where it matters:
// complete records only, never silently overwrite a newer copy.
//
// Three safety properties:
// 1. Optimistic concurrency. Every save names the version it last read
//    (save_deal RPC); a stale save fails with a conflict instead of clobbering.
// 2. Write-ahead copy. Each queued edit is written to this browser's storage
//    first, keyed by account, and removed only after Supabase confirms. A tab
//    closed mid-save, or a network drop, loses nothing: the next load replays it.
// 3. Own deals only. Admins can read every deal under RLS, so the list filters
//    by owner explicitly; an admin's project list is still just their own.
import { assertCompleteDeal } from './dealStorage.js'

const clone = value => JSON.parse(JSON.stringify(value))
const PENDING = 'casebuilder.pending.v1:'

export function createCloudDealStore(client, userId, getLocal = () => localStorage) {
  const versions = new Map() // deal id -> version last read or written
  const pendingKey = id => `${PENDING}${userId}:${id}`

  async function list() {
    const { data, error } = await client.from('deals').select('id, data, version').eq('owner_id', userId).order('updated_at', { ascending: false })
    if (error) throw new Error(`Could not load your deals: ${error.message}`)
    const deals = []
    for (const row of data) {
      versions.set(row.id, row.version)
      try { assertCompleteDeal(row.data); deals.push(row.data) } catch { /* skip an unreadable row rather than hide the rest */ }
    }
    return deals.sort((a, b) => b.updatedAt - a.updatedAt).map(clone)
  }

  async function save(deal) {
    assertCompleteDeal(deal)
    const copy = clone(deal)
    if (!versions.has(copy.id)) {
      const { data, error } = await client.from('deals').insert({ id: copy.id, owner_id: userId, name: copy.name, data: copy }).select('version').single()
      if (error) throw new Error(error.code === '23505' ? 'This deal id is already taken. Duplicate the deal to save a fresh copy.' : `Could not save: ${error.message}`)
      versions.set(copy.id, data.version)
      return copy
    }
    const { data, error } = await client.rpc('save_deal', { p_id: copy.id, p_name: copy.name, p_data: copy, p_expected_version: versions.get(copy.id) })
    if (error) {
      if (/deal_conflict/.test(error.message)) throw new Error('A newer copy of this deal was saved somewhere else. Reload to see it before continuing.')
      if (/deal_not_found/.test(error.message)) { versions.delete(copy.id); return save(copy) } // deleted elsewhere: recreate rather than lose edits
      throw new Error(`Could not save: ${error.message}`)
    }
    versions.set(copy.id, data)
    return copy
  }

  async function remove(id) {
    const { error } = await client.from('deals').delete().eq('id', id).eq('owner_id', userId)
    if (error) throw new Error(`Could not delete: ${error.message}`)
    versions.delete(id)
    try { getLocal().removeItem(pendingKey(id)) } catch {}
  }

  // Write-ahead copies of unsaved edits.
  const pending = {
    put(deal) { try { getLocal().setItem(pendingKey(deal.id), JSON.stringify(deal)) } catch {} },
    clear(id, deal) {
      try {
        const raw = getLocal().getItem(pendingKey(id))
        // Only clear if nothing newer was queued while this save was in flight.
        if (raw !== null && (!deal || JSON.parse(raw).updatedAt <= deal.updatedAt)) getLocal().removeItem(pendingKey(id))
      } catch {}
    },
    all() {
      const out = []
      try {
        const s = getLocal()
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i)
          if (!k?.startsWith(`${PENDING}${userId}:`)) continue
          try { const d = JSON.parse(s.getItem(k)); assertCompleteDeal(d); out.push(d) } catch {}
        }
      } catch {}
      return out
    }
  }

  return { list, save, remove, pending }
}

// Load: cloud deals, then replay any write-ahead edit that is newer than the
// cloud copy (a save that never reached the server).
export async function loadCloudDeals(store) {
  const deals = await store.list()
  const byId = new Map(deals.map(d => [d.id, d]))
  const replay = []
  for (const local of store.pending.all()) {
    const cloud = byId.get(local.id)
    if (!cloud || local.updatedAt > cloud.updatedAt) { byId.set(local.id, local); replay.push(local) }
    else store.pending.clear(local.id, cloud)
  }
  return { deals: [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt), replay }
}

// Debounced, serial autosave. One save per deal in flight at a time; edits made
// meanwhile coalesce into the next save. Failed saves keep their pending copy.
export function createCloudAutosaver(store, { delay = 600, retryDelay = 5000, onStatus = () => {}, schedule = setTimeout, cancel = clearTimeout } = {}) {
  const queued = new Map()
  const inflight = new Map()
  let timer
  let lastError = ''

  function report() {
    // A failed save waits in the queue for its retry; show the error, not "saving".
    if (inflight.size || (queued.size && !lastError)) onStatus({ state: 'saving' })
    else onStatus(lastError ? { state: 'error', message: lastError } : { state: 'saved', at: Date.now() })
  }

  function run(id) {
    if (inflight.has(id) || !queued.has(id)) return inflight.get(id)
    const deal = queued.get(id)
    queued.delete(id)
    const p = store.save(deal)
      .then(() => { store.pending.clear(id, deal); lastError = '' })
      .catch(e => {
        lastError = e.message || 'Could not save.'
        if (!queued.has(id)) queued.set(id, deal) // keep it; a newer queued edit wins
        // Network blips retry on their own. Conflicts need a reload, so they wait.
        if (!/newer copy|already taken/.test(lastError)) { if (timer) cancel(timer); timer = schedule(flush, retryDelay) }
      })
      .finally(() => {
        inflight.delete(id)
        if (queued.has(id) && !lastError) run(id)
        report()
      })
    inflight.set(id, p)
    return p
  }

  function flush() {
    if (timer) cancel(timer)
    timer = undefined
    const ids = [...queued.keys()]
    report()
    return Promise.all(ids.map(run).concat([...inflight.values()]))
  }

  return {
    queue(deal) {
      const copy = clone(deal)
      queued.set(copy.id, copy)
      store.pending.put(copy)
      lastError = ''
      onStatus({ state: 'saving' })
      if (timer) cancel(timer)
      timer = schedule(flush, delay)
    },
    flush,
    forget(id) { queued.delete(id) },
    hasPending() { return queued.size > 0 || inflight.size > 0 }
  }
}
