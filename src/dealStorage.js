// The only persistence adapter for deal records. No list index: a damaged deal
// cannot hide its neighbours. Writes replace one complete record atomically.
import { INPUT_FIELDS } from './valueModel.js'

export const DEAL_PREFIX = 'casebuilder.deal.v2:'
export const LEGACY_KEY = 'casebuilder.projects.v1'
const MIGRATION_KEY = 'casebuilder.deals.migrated.v2'
const required = INPUT_FIELDS.map(f => f.key)
const clone = value => JSON.parse(JSON.stringify(value))

export function assertCompleteDeal(deal) {
  if (!deal || typeof deal.id !== 'string' || !deal.id || typeof deal.name !== 'string' || !deal.name.trim()) throw new Error('A deal needs its id and company name.')
  if (!Array.isArray(deal.fields) || required.some(key => !deal.fields.some(f => f.key === key && Object.hasOwn(f, 'value') && f.source && typeof f.source === 'object'))) throw new Error('Refusing to save an incomplete deal. The previous copy is unchanged.')
  if (!Array.isArray(deal.stakeholders) || !Array.isArray(deal.deck) || !deal.connectors || typeof deal.connectors !== 'object') throw new Error('Refusing to save a partial deal.')
  if (!Number.isFinite(deal.createdAt) || !Number.isFinite(deal.updatedAt)) throw new Error('The deal needs creation and modification timestamps.')
}

export function createDealStorage(getBackend = () => localStorage) {
  const backup = (key, raw) => {
    const storage = getBackend()
    const base = `casebuilder.backup:${key}`
    if (storage.getItem(base) === raw) return
    const target = storage.getItem(base) === null ? base : `${base}:${Date.now()}:${Math.random().toString(36).slice(2)}`
    // If a quota prevents making the backup, the original remains untouched.
    storage.setItem(target, raw)
  }
  const read = id => {
    const key = DEAL_PREFIX + id
    const raw = getBackend().getItem(key)
    if (raw === null) return null
    try {
      const record = JSON.parse(raw)
      if (record.version !== 2) throw new Error('Unsupported deal record')
      assertCompleteDeal(record.deal)
      if (record.deal.id !== id) throw new Error('Mismatched deal id')
      return record.deal
    } catch {
      try { backup(key, raw) } catch {}
      return null
    }
  }
  return {
    get(id) { return clone(read(id)) },
    set(deal) {
      assertCompleteDeal(deal)
      const copy = clone(deal)
      const key = DEAL_PREFIX + copy.id
      const existing = getBackend().getItem(key)
      const previous = read(copy.id)
      if (existing !== null && !previous) throw new Error('This deal has a damaged stored copy. It was preserved; duplicate the deal to save a fresh copy.')
      if (previous && previous.updatedAt > copy.updatedAt) throw new Error('A newer copy of this deal is already saved. Reload before continuing.')
      getBackend().setItem(key, JSON.stringify({ version: 2, deal: copy }))
      return copy
    },
    list() {
      const storage = getBackend()
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(k => k?.startsWith(DEAL_PREFIX))
      return keys.map(key => read(key.slice(DEAL_PREFIX.length))).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt).map(clone)
    },
    delete(id) { getBackend().removeItem(DEAL_PREFIX + id) },
    seedSample(key, create, matches) {
      const storage = getBackend(), marker = `casebuilder.sample:${key}`
      if (storage.getItem(marker)) return
      if (!this.list().some(matches)) this.set(create())
      storage.setItem(marker, 'added')
    },
    migrateLegacy(normalize) {
      const storage = getBackend()
      if (storage.getItem(MIGRATION_KEY)) return
      const raw = storage.getItem(LEGACY_KEY)
      if (raw === null) { storage.setItem(MIGRATION_KEY, 'done'); return }
      let old
      try { old = JSON.parse(raw); if (!Array.isArray(old)) throw new Error('Not a deal list') }
      catch { backup(LEGACY_KEY, raw); storage.setItem(MIGRATION_KEY, 'recovered'); return }
      let damaged = false
      for (const item of old) {
        let deal
        try {
          deal = normalize(item)
          assertCompleteDeal(deal)
        } catch {
          damaged = true
          continue
        }
        // Storage failures must not be treated as bad data or marked done.
        if (storage.getItem(DEAL_PREFIX + deal.id) === null) this.set(deal)
      }
      if (damaged) backup(LEGACY_KEY, raw)
      storage.setItem(MIGRATION_KEY, 'done')
      // Deliberately retain the legacy raw list for recovery. Never clear it.
    }
  }
}
export const dealStorage = createDealStorage()

// Keep the latest complete snapshot of each changed deal. Failures retain their
// pending copies for a later retry; lifecycle flushes protect the last keystroke.
export function createDealAutosaver(store, { delay = 350, onStatus = () => {}, schedule = setTimeout, cancel = clearTimeout } = {}) {
  const pending = new Map()
  let timer
  function flush() {
    if (timer) cancel(timer)
    timer = undefined
    let error = ''
    for (const [id, snapshot] of [...pending]) {
      try { store.set(snapshot); pending.delete(id) } catch (e) { error = e.message || 'Could not save changes in this browser.' }
    }
    onStatus(error ? { state: 'error', message: error } : { state: 'saved', at: Date.now() })
    return !error
  }
  return {
    queue(deal) {
      pending.set(deal.id, clone(deal))
      onStatus({ state: 'saving' })
      if (timer) cancel(timer)
      timer = schedule(flush, delay)
    },
    flush,
    forget(id) { pending.delete(id) },
    hasPending() { return pending.size > 0 }
  }
}
