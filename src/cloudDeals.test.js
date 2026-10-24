import test from 'node:test'
import assert from 'node:assert/strict'
import { createCloudDealStore, loadCloudDeals, createCloudAutosaver } from './cloudDeals.js'
import { newProject } from './projects.js'

// Minimal fake of the supabase-js calls cloudDeals uses, with the same version
// semantics as public.deals + save_deal (version bumps on every write; stale
// writes raise deal_conflict). `offline` makes every call fail like a dropped network.
function fakeSupabase() {
  const rows = new Map()
  const db = { rows, offline: false, calls: 0 }
  const fail = () => ({ data: null, error: { message: 'Failed to fetch' } })
  db.from = () => {
    const q = { filters: [] }
    const api = {
      select() { return api },
      eq(col, val) { q.filters.push([col, val]); return api },
      order() {
        db.calls++
        if (db.offline) return Promise.resolve(fail())
        const data = [...rows.values()].filter(r => q.filters.every(([c, v]) => r[c] === v)).map(r => ({ id: r.id, data: structuredClone(r.data), version: r.version }))
        return Promise.resolve({ data, error: null })
      },
      insert(row) {
        return { select: () => ({ single: () => {
          db.calls++
          if (db.offline) return Promise.resolve(fail())
          if (rows.has(row.id)) return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } })
          rows.set(row.id, { ...structuredClone(row), version: 1 })
          return Promise.resolve({ data: { version: 1 }, error: null })
        } }) }
      },
      delete() {
        const d = { filters: [] }
        const del = { eq(c, v) { d.filters.push([c, v]); return d.filters.length === 2 ? run() : del } }
        const run = () => { db.calls++; if (db.offline) return Promise.resolve(fail()); for (const [id, r] of rows) if (d.filters.every(([c, v]) => r[c] === v)) rows.delete(id); return Promise.resolve({ error: null }) }
        return del
      }
    }
    return api
  }
  db.rpc = (name, a) => {
    db.calls++
    if (db.offline) return Promise.resolve(fail())
    const r = rows.get(a.p_id)
    if (!r) return Promise.resolve({ data: null, error: { message: 'deal_not_found' } })
    if (r.version !== a.p_expected_version) return Promise.resolve({ data: null, error: { message: 'deal_conflict: a newer copy of this deal is already saved' } })
    r.version++; r.data = structuredClone(a.p_data); r.name = a.p_name
    return Promise.resolve({ data: r.version, error: null })
  }
  return db
}
function memory() {
  const map = new Map()
  return { get length() { return map.size }, key: i => [...map.keys()][i], getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k) }
}
const make = name => newProject(name, { web: true })
const edit = (d, name) => ({ ...d, name, updatedAt: d.updatedAt + 1 })
const manual = () => { const t = []; return { schedule: f => (t.push(f), t.length), cancel: () => {}, fire: () => t.splice(0).forEach(f => f()) } }

test('cloud: save, reload in a new session, edit again: one row, exact data', async () => {
  const sb = fakeSupabase(), local = memory()
  const a = createCloudDealStore(sb, 'u1', () => local)
  const deal = make('Northwind')
  await a.save(deal)
  const b = createCloudDealStore(sb, 'u1', () => local)
  const { deals } = await loadCloudDeals(b)
  assert.deepEqual(deals, [deal])
  await b.save(edit(deal, 'Northwind Retail'))
  assert.equal(sb.rows.size, 1)
  assert.equal(sb.rows.get(deal.id).version, 2)
  assert.equal(sb.rows.get(deal.id).data.name, 'Northwind Retail')
})

test('cloud: a stale tab cannot overwrite a newer save', async () => {
  const sb = fakeSupabase(), deal = make('Acme')
  const tab1 = createCloudDealStore(sb, 'u1', memory), tab2 = createCloudDealStore(sb, 'u1', memory)
  await tab1.save(deal)
  await tab2.list(); await tab1.list()
  await tab1.save(edit(deal, 'from tab 1'))
  await assert.rejects(tab2.save(edit(deal, 'from tab 2')), /newer copy/)
  assert.equal(sb.rows.get(deal.id).data.name, 'from tab 1')
})

test('cloud: lists only the signed-in owner\'s deals, even if more rows are readable', async () => {
  const sb = fakeSupabase()
  await createCloudDealStore(sb, 'admin', memory).save(make('Mine'))
  await createCloudDealStore(sb, 'chris', memory).save(make('Chris deal'))
  const mine = await createCloudDealStore(sb, 'admin', memory).list()
  assert.deepEqual(mine.map(d => d.name), ['Mine'])
})

test('cloud: offline edits are kept, retried, and saved when the network returns', async () => {
  const sb = fakeSupabase(), local = memory(), t = manual(), statuses = []
  const store = createCloudDealStore(sb, 'u1', () => local)
  const saver = createCloudAutosaver(store, { onStatus: s => statuses.push(s.state), schedule: t.schedule, cancel: t.cancel })
  const deal = make('Offline Co')
  sb.offline = true
  saver.queue(deal)
  t.fire(); await new Promise(r => setTimeout(r, 0))
  assert.equal(statuses.at(-1), 'error')
  assert.equal(store.pending.all().length, 1, 'write-ahead copy survives the failure')
  sb.offline = false
  t.fire(); await new Promise(r => setTimeout(r, 0))   // the automatic retry
  assert.equal(statuses.at(-1), 'saved')
  assert.equal(sb.rows.get(deal.id).data.name, 'Offline Co')
  assert.equal(store.pending.all().length, 0)
})

test('cloud: tab closed mid-save: the next load replays the unsaved edit', async () => {
  const sb = fakeSupabase(), local = memory()
  const first = createCloudDealStore(sb, 'u1', () => local)
  const deal = make('Replay')
  await first.save(deal)
  const t = manual()
  const saver = createCloudAutosaver(first, { schedule: t.schedule, cancel: t.cancel })
  saver.queue(edit(deal, 'Replay (edited)'))           // queued, never flushed: tab closes
  const next = createCloudDealStore(sb, 'u1', () => local)
  const { deals, replay } = await loadCloudDeals(next)
  assert.equal(deals[0].name, 'Replay (edited)')
  assert.equal(replay.length, 1)
  await next.save(replay[0]); next.pending.clear(replay[0].id, replay[0])
  assert.equal(sb.rows.get(deal.id).data.name, 'Replay (edited)')
})

test('cloud: write-ahead copies are per account', async () => {
  const sb = fakeSupabase(), local = memory()
  createCloudDealStore(sb, 'amr', () => local).pending.put(make('Amr draft'))
  const other = createCloudDealStore(sb, 'chris', () => local)
  assert.deepEqual((await loadCloudDeals(other)).deals, [])
})

test('cloud: delete removes the row and any pending copy', async () => {
  const sb = fakeSupabase(), local = memory()
  const store = createCloudDealStore(sb, 'u1', () => local), deal = make('Gone')
  await store.save(deal); store.pending.put(deal)
  await store.remove(deal.id)
  assert.equal(sb.rows.size, 0)
  assert.equal(store.pending.all().length, 0)
})
