// v0.16.0: review the Dashboard redesign (Needs attention, Since you last looked,
// Other deals), read-only. TEST account; every write to Supabase is blocked
// (POST/PATCH/PUT/DELETE on /rest/v1, rpc included), so nothing here is saved.
// The deals request is held back briefly so the skeleton can be checked, and
// the expected bar segments are worked out from the same deals the page got.
// Usage: node scripts/review-v0160-dashboard.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} }
const { hydrate } = await import('../src/projects.js')
const { dealSummary, triage, readiness } = await import('../src/dashboard.js')

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-dashboard'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))

let failed = 0
const check = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`) }
const errors = []
const writes = []
let dealRows = null

// The TEST deals are mostly empty, so two of them get fixture values in this
// browser only (the response is edited; writes are blocked, nothing is saved):
// the last deal can be valued as a range and misses a stakeholder (Find), the
// second has three fresh suggestions (Review, and a feed item).
const setFields = (data, values) => {
  const fields = [...(data.fields || [])]
  for (const [key, value, state, extra] of values) {
    const f = { key, value, source: { state, origin: 'Review fixture', ...(extra || {}) } }
    const i = fields.findIndex(x => x.key === key)
    if (i >= 0) fields[i] = { ...fields[i], ...f }; else fields.push(f)
  }
  return { ...data, fields }
}
function withFixtures(rows) {
  if (rows.length < 2) return rows
  const pinnedAt = new Date(Date.now() - 3600e3).toISOString()
  const last = rows.length - 1
  return rows.map((r, i) => i === last ? { ...r, data: setFields(r.data, [
    ['engineers', 800, 'input'], ['hourlyCost', 110, 'assumption'], ['searchHoursToday', 3, 'assumption'], ['searchHoursPortal', 2, 'input'],
    ['toolSpendToday', 240000, 'input'], ['toolSpendPortal', 120000, 'assumption']
  ]) } : i === 1 ? { ...r, data: setFields(r.data, [
    ['engineers', 1200, 'suggestion', { pinnedAt }], ['newHiresPerYear', 90, 'suggestion', { pinnedAt }], ['incidentsPerMonth', 10, 'suggestion', { pinnedAt }]
  ]) } : r)
}

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
page.on('pageerror', e => errors.push(e.message))
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`) })
page.on('dialog', d => { writes.push(`dialog: ${d.message()}`); d.dismiss() })
await page.setRequestInterception(true)
page.on('request', async r => {
  const u = new URL(r.url())
  const m = r.method()
  if (/\/(rest|storage|functions)\/v1\//.test(u.pathname) && !['GET', 'HEAD', 'OPTIONS'].includes(m)) { writes.push(`${m} ${u.pathname}`); return r.abort() }
  // The deals list: fetched here, held for 1.5 s (so the skeleton shows), and kept to compare against.
  if (m === 'GET' && /\/rest\/v1\/deals$/.test(u.pathname) && u.searchParams.get('select')?.includes('data')) {
    try {
      const res = await fetch(r.url(), { headers: r.headers() })
      let body = await res.text()
      if (res.ok) { dealRows = withFixtures(JSON.parse(body)); body = JSON.stringify(dealRows) }
      await sleep(1500)
      return r.respond({ status: res.status, contentType: res.headers.get('content-type') || 'application/json', headers: { 'access-control-allow-origin': '*' }, body })
    } catch (e) { errors.push(`deals fetch: ${e.message}`); return r.continue() }
  }
  r.continue()
})
const shot = name => page.screenshot({ path: `${out}/${name}.png`, fullPage: true })

await page.goto(base, { waitUntil: 'networkidle2' })
await page.evaluate(() => localStorage.removeItem('casebuilder.dashboard.seen'))
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })

// 1. skeleton before the deals arrive, then rows
const skeleton = await page.evaluate(() => !!document.querySelector('.dashboard .skill-skeleton[aria-busy="true"]') && !document.querySelector('.dash-deal'))
check(skeleton, 'a skeleton shows before the deals load')
await page.waitForFunction(() => !document.querySelector('.dashboard [aria-busy="true"]'), { timeout: 20000 })
await sleep(700) // stagger + bar grow
check(Array.isArray(dealRows) && dealRows.length > 0, 'the TEST account has deals to show', `${dealRows?.length ?? 'no response'}`)
const deals = (dealRows || []).map(r => hydrate(r.data))
const byId = Object.fromEntries(deals.map(d => [d.id, d]))
const expected = triage(deals.map(dealSummary))
for (const s of [...expected.attention, ...expected.rest]) console.log(`  ${s.deal.name}: ${Math.round(s.readiness.confirmedShare * 100)}% confirmed, ${JSON.stringify(s.readiness.counts)}, action ${s.action?.label || '-'}, value ${s.range ? `${Math.round(s.range.low)}..${Math.round(s.range.high)}` : 'none'}`)
await shot('01-dashboard-1280')

// 2. Needs attention: at most 5, least confirmed first, the expected deals
const rows = await page.$$eval('.dash-rows:not(.dash-rows-compact) .dash-deal', els => els.map(e => ({ id: e.dataset.deal, share: Number(e.dataset.confirmed) })))
check(rows.length > 0 && rows.length <= 5, 'Needs attention has 1 to 5 rows', `${rows.length}`)
check(rows.every((r, i) => i === 0 || rows[i - 1].share <= r.share), 'rows are ordered by confirmed share, lowest first', rows.map(r => r.share.toFixed(2)).join(' <= '))
check(rows.map(r => r.id).join() === expected.attention.map(s => s.deal.id).join(), 'the rows are the deals the helpers pick, in the same order')
check(rows.every(r => Math.abs(r.share - readiness(byId[r.id]?.fields || []).confirmedShare) < 1e-3), 'each row\'s confirmed share matches its deal')

// 3. every deal row (both lists): a bar whose segments add to 100% and match the field states
const bars = await page.$$eval('.dash-deal', els => els.map(e => ({
  id: e.dataset.deal,
  segs: [...e.querySelectorAll('.dash-seg')].map(s => ({ state: s.dataset.state, count: Number(s.dataset.count), width: parseFloat(s.style.width) })),
  px: [...e.querySelectorAll('.dash-seg')].reduce((a, s) => a + s.getBoundingClientRect().width, 0),
  barPx: e.querySelector('.dash-bar')?.getBoundingClientRect().width || 0,
  value: e.querySelector('.dash-value')?.innerText || '',
  people: e.querySelector('.dash-people')?.innerText || '',
  action: e.querySelector('.dash-action-btn')?.innerText || ''
})))
check(bars.length === deals.length, 'every deal has one row', `${bars.length} rows, ${deals.length} deals`)
const badSum = bars.filter(b => Math.abs(b.segs.reduce((a, s) => a + s.width, 0) - 100) > 1)
check(bars.length > 0 && badSum.length === 0, 'each bar\'s segment widths add up to 100% (+-1)', JSON.stringify(badSum.map(b => b.id)))
const badPx = bars.filter(b => !b.barPx || Math.abs(b.px - b.barPx) > 2)
check(badPx.length === 0, 'the drawn segments fill the bar after it has grown', JSON.stringify(badPx.map(b => [b.px, b.barPx])))
const badStates = bars.filter(b => {
  const r = readiness(byId[b.id]?.fields || [])
  return r.segments.filter(s => s.share > 0).some(s => {
    const seg = b.segs.find(x => x.state === s.state)
    return !seg || seg.count !== s.count || Math.abs(seg.width - (s.count / r.total) * 100) > 0.5
  }) || b.segs.length !== r.segments.filter(s => s.share > 0).length
})
check(badStates.length === 0, 'each bar\'s segments match the deal\'s field states (confirmed, assumption, suggestion, empty)', JSON.stringify(badStates.map(b => b.id)))
const moneyRange = /^\$[\d.]+[kM]? (to \$[\d.]+[kM]? )?a year$/
check(bars.every(b => moneyRange.test(b.value) || b.value === 'Not enough inputs to value yet'), 'value is a yearly range or "Not enough inputs to value yet"', JSON.stringify(bars.map(b => b.value)))
check(bars.every(b => {
  const s = dealSummary(byId[b.id])
  return s.range ? /a year$/.test(b.value) : b.value === 'Not enough inputs to value yet'
}), 'a value shows only when the model can compute one')
check(bars.every(b => /^\d+ of \d+ roles? (has|have) a person(\. No .+ yet)?$|^No stakeholders mapped yet$/.test(b.people)), 'each row has a stakeholders line', JSON.stringify(bars.map(b => b.people)))
const attentionBars = bars.filter(b => rows.some(r => r.id === b.id))
check(attentionBars.every(b => b.action && b.action === dealSummary(byId[b.id]).action?.label), 'each Needs attention row has one action button, the expected one', JSON.stringify(attentionBars.map(b => b.action)))

// 4. hover legend; the header line; the job log is gone; no em dash
await page.hover('.dash-deal .dash-ready'); await sleep(250)
const tip = await page.$eval('.dash-deal .dash-ready-tip', e => ({ o: getComputedStyle(e).opacity, t: e.innerText }))
check(Number(tip.o) > 0.9 && /Confirmed/.test(tip.t) && /Empty/.test(tip.t), 'hovering a bar shows its legend with counts', JSON.stringify(tip))
await shot('02-bar-legend')
const sub = await page.$eval('.dash-figures', e => e.innerText.replace(/\n+/g, ' | '))
check(/Pipeline/.test(sub) && /Confirmed/.test(sub) && /New since you looked/.test(sub), 'the hero shows pipeline, confirmed and new as their own figures', JSON.stringify(sub))
const text = await page.$eval('.dashboard', e => e.innerText)
check(!/agent activity|Chat reply|key ends in/i.test(text) && !(await page.$('.dash-job, .dash-agent-status')), 'the agent job log is gone')
check(!/\u2014/.test(text), 'no em dash in the page text')
check(!/win rate|activities/i.test(text), 'no CRM metrics')
const feed = await page.$$eval('.dash-feed li', els => els.map(e => e.innerText))
const feedEmpty = await page.$$eval('#dash-since ~ .dash-empty, .dash-section:nth-of-type(2) .dash-empty', els => els.map(e => e.innerText))
check(feed.length <= 6 && (feed.length > 0 || feedEmpty.some(t => /^Nothing new since .*\d:\d\d (am|pm)/.test(t))), 'Since you last looked: up to 6 items, or "Nothing new since <time>"', JSON.stringify(feed.length ? feed : feedEmpty))
check(feed.every(t => /(just now|min ago|h ago|yesterday|days ago)$/.test(t.trim())), 'each feed item has a relative time')

// 5. Review / Fill / Confirm open Case inputs
const pill = () => page.evaluate(() => document.querySelector('.sidebar-desktop .side-on')?.getAttribute('aria-label'))
const backToDashboard = async () => { await page.click('.sidebar-desktop .sidebar-home'); await page.waitForSelector('.dash-deal', { timeout: 15000 }); await sleep(600) }
const inputsKind = await page.$eval('.dash-action-btn:is([data-kind=review],[data-kind=fill],[data-kind=confirm])', e => ({ kind: e.dataset.kind, label: e.innerText, deal: e.closest('.dash-deal').dataset.deal })).catch(() => null)
if (inputsKind) {
  await page.click(`.dash-deal[data-deal="${inputsKind.deal}"] .dash-action-btn`); await sleep(1200)
  check(await pill() === 'Case inputs', `"${inputsKind.label}" opens Case inputs`, await pill())
  await shot('03-review-case-inputs')
  await backToDashboard()
} else check(false, 'a Review/Fill/Confirm button to test', 'none on the TEST account')

// 6. clicking the row (not the button) opens the deal
const rowDeal = rows[0]?.id
await page.click(`.dash-deal[data-deal="${rowDeal}"] .dash-people`); await sleep(1200)
check(await pill() === 'Case inputs', 'clicking a row opens that deal', await pill())
await backToDashboard()

// 7. Find opens the Agent with the composer filled, and sends nothing
const find = await page.$eval('.dash-action-btn[data-kind=find]', e => ({ label: e.innerText, deal: e.closest('.dash-deal').dataset.deal })).catch(() => null)
if (find) {
  const before = writes.length
  await page.click(`.dash-deal[data-deal="${find.deal}"] .dash-action-btn`)
  await page.waitForSelector('main.content-agent #chat-input', { timeout: 15000 }).catch(() => {})
  await sleep(1500)
  const val = await page.$eval('#chat-input', e => e.value).catch(() => null)
  const want = dealSummary(byId[find.deal]).action.prompt
  check(val === want, `"${find.label}" opens the Agent with the composer filled`, JSON.stringify(val))
  check(await page.evaluate(() => document.activeElement?.id === 'chat-input'), 'the composer has focus')
  const sent = writes.slice(before).filter(w => /jobs|chat_messages|chats/.test(w))
  check(sent.length === 0, 'nothing was sent (no POST to jobs, chats or chat_messages)', sent.join(' | '))
  await shot('04-find-agent')
  await backToDashboard()
} else console.log('SKIP Find: no deal on the TEST account has a stakeholder gap as its next action')

// 8. phone: one column, readable bars, no sideways scroll
await page.setViewport({ width: 375, height: 812 }); await sleep(700)
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
check(overflow <= 0, 'no sideways scrolling at 375px', `${overflow}px`)
const phoneBar = await page.$eval('.dash-deal .dash-bar', e => e.getBoundingClientRect().width)
check(phoneBar >= 180, 'the bar stays readable at 375px', `${Math.round(phoneBar)}px`)
await shot('05-dashboard-375')
await page.evaluate(() => { document.documentElement.dataset.theme = 'light' }); await sleep(300)
await shot('06-dashboard-375-light')
await page.setViewport({ width: 1280, height: 900 }); await sleep(500)
await shot('07-dashboard-1280-light')
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })

// 9. leaving the Dashboard stores "last looked" for this account
const seen = await page.evaluate(() => localStorage.getItem('casebuilder.dashboard.seen'))
check(!!seen && Object.values(JSON.parse(seen)).every(Number.isFinite), '"last looked" is stored per account when you leave', seen)

const dbWrites = writes.filter(w => /\/rest\/v1\//.test(w))
console.log(`blocked writes: ${writes.length ? writes.join(' | ') : 'none'}`)
check(errors.length === 0, 'no page errors or 4xx', errors.slice(0, 5).join(' | '))
console.log(`blocked ${dbWrites.length} database writes; screenshots in ${out}`)
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
await browser.close()
process.exit(failed ? 1 : 0)
