// v0.16.0 agent deck edits, UI only (TEST account, writes blocked, no agent run).
// Serves one fake chat whose reply carries an input edit and deck_ops built from
// the first project's real deck, then checks and screenshots the change card,
// Undo, and "View". Nothing is saved: every write is aborted.
// Usage: node scripts/shoot-v0160-agent-deck.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-agent-deck'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 860 })
const errors = []
const writes = []
page.on('pageerror', e => errors.push(e.message))
let deals = null
page.on('response', async r => {
  const u = new URL(r.url())
  if (u.pathname.endsWith('/rest/v1/deals') && r.request().method() === 'GET' && !deals) { try { deals = await r.json() } catch {} }
})
const CHAT = '00000000-0000-4000-8000-00000000d3c0'
const json = (req, body) => req.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) })
let messages = []
await page.setRequestInterception(true)
page.on('request', req => {
  const u = new URL(req.url())
  if (/\/(rest|storage|functions)\/v1\//.test(u.pathname) && !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) { writes.push(`${req.method()} ${u.pathname}`); return req.abort() }
  if (req.method() === 'GET' && u.pathname.endsWith('/rest/v1/chats')) return json(req, [{ id: CHAT, title: 'Deck changes', kind: 'chat', updated_at: new Date().toISOString() }])
  if (req.method() === 'GET' && u.pathname.endsWith('/rest/v1/chat_messages') && u.search.includes(CHAT)) return json(req, messages)
  req.continue()
})

await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
await sleep(500)
await page.click('.sidebar-desktop .side-item[aria-label="Projects"]'); await page.waitForSelector('.project-card', { timeout: 15000 })
// The project list is sorted by updatedAt, newest first: the first card is this deal.
const deal = (deals || []).map(r => r.data).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt)[0]
if (!deal?.deck?.length) { check('the TEST account has a project with a deck', false); await browser.close(); process.exit(1) }
const hero = deal.deck[0].blocks.find(b => b.type === 'text' && b.style === 'hero') || deal.deck[0].blocks.find(b => b.type === 'text')
const now = new Date().toISOString()
messages = [
  { id: 900000001, role: 'user', content: 'Make the title punchier, add a rollout page after it, and use a white background.', meta: {}, job_id: null, created_at: now },
  { id: 900000002, role: 'assistant', content: 'Done. I gave the title page a shorter heading, added a rollout page after it with three steps, and switched the background to white.', job_id: null, created_at: now,
    meta: { model: 'claude-sonnet-5-5', seconds: 9, edits: [], commands: [], rejected: [],
      deck_ops: [
        { op: 'set_text', slide_id: deal.deck[0].id, block_id: hero.id, field: 'text', value: '{company}, ready to ship faster', reason: 'Punchier.' },
        { op: 'add_slide', template: 'bullets', after_slide_id: deal.deck[0].id, texts: [{ style: 'label', text: 'Rollout' }, { style: 'title', text: 'Rollout plan' }, { style: 'body', text: '- Pilot with one team\n- Expand to every squad\n- Retire the old portal' }] },
        { op: 'set_brand', background: '#ffffff' }
      ],
      deck_rejected: ['add_block: \'Image\' cannot be added by the agent.'] } }
]
await page.click('.project-card')
await page.waitForSelector('#engineers', { timeout: 15000 })
await page.click('.sidebar-desktop .side-item[aria-label="Agent"]').catch(async () => { const [b] = await page.$$('xpath/.//button[contains(@class,"side-item") and contains(., "Agent")]'); await b.click() })
await page.waitForSelector('.chat-full .chat-changes', { timeout: 15000 }).catch(() => {})
await sleep(600)
const dealShown = await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal).catch(() => '')
check('the Agent opened on the project whose deck the ops name', dealShown === deal.id, dealShown)
const card = await page.$eval('.chat-full .chat-changes', e => e.innerText).catch(() => '')
check('change card: "Changed the case" with one sentence per change', /Changed the case/i.test(card) && /Changed the hero title on page 1/.test(card) && /Added a page "Rollout plan" after page 1/.test(card) && /Background #[0-9a-f]{6} → #ffffff/.test(card), card.replace(/\n+/g, ' | '))
check('change card: worker rejections listed', /Not changed in the case/i.test(card))
check('change card: Undo and View buttons', await page.$$eval('.chat-full .chg-actions button', l => l.map(b => b.innerText).join(',')) === 'Undo,View')
const stripe = await page.$eval('.chat-full .chat-changes', e => getComputedStyle(e).borderLeftWidth === getComputedStyle(e).borderTopWidth)
check('change card: no left accent stripe', stripe)
const card1 = await page.$('.chat-full .chat-changes')
await card1.screenshot({ path: `${out}/01-card.png` })
await page.screenshot({ path: `${out}/02-agent.png` })

await page.click('.chat-full .chg-actions button:last-child')
await page.waitForSelector('iframe[title="Live Room"]', { timeout: 15000 }).catch(() => {})
await sleep(1500)
const room = await page.$eval('iframe[title="Live Room"]', f => f.srcdoc).catch(() => '')
check('View opens Case artifacts showing the agent changes', /ready to ship faster/.test(room) && /Rollout plan/.test(room), room ? `${room.length} chars` : 'no frame')
check('View keeps the agent beside it', !!(await page.$('.chat-split .chat-changes')))
await page.screenshot({ path: `${out}/03-live-room.png` })

await page.click('.chat-split .chg-actions button')
await sleep(1200)
const undone = await page.$eval('.chat-split .chat-changes', e => e.innerText).catch(() => '')
check('Undo: the card says Undone and offers no second Undo', /Undone/i.test(undone) && !(await page.$$eval('.chat-split .chg-actions button', l => l.some(b => b.innerText === 'Undo'))))
const room2 = await page.$eval('iframe[title="Live Room"]', f => f.srcdoc).catch(() => '')
check('Undo: the Live room is back without a reload', !/ready to ship faster/.test(room2) && !/Rollout plan/.test(room2))
await (await page.$('.chat-split .chat-changes'))?.screenshot({ path: `${out}/04-undone.png` })

check('only blocked writes were attempted (deal saves)', writes.every(w => /deals|rpc\/save_deal/.test(w)), [...new Set(writes)].join(', '))
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
