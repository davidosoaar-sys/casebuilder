// v0.16.0: review the Agent chat UI, read-only. TEST account; every database
// write is blocked (POST/PATCH/PUT/DELETE on /rest/v1, rpc included, plus
// storage and functions), and no message is ever sent.
// Pass 1: the Spotify test project's real chat history.
// Pass 2: fixture chats and messages fed into the chats / chat_messages reads
//         (request interception): markdown, a reply with URLs and a Sources
//         list, a tool trace, three chats for the rail.
// Pass 3: an empty chat (a real project with no chats if there is one, else
//         an empty chats read): greeting, starter chips fill the composer.
// Usage: node scripts/review-v0160-chat-ui.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-chat'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))

let failed = 0, passed = 0
const check = (ok, name, detail = '') => { ok ? passed++ : failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`) }
const errors = []

// ---- fixtures -------------------------------------------------------------
const ago = m => new Date(Date.now() - m * 60000).toISOString()
const DEAL = '00000000-0000-4000-8000-0000000000d1'
const CHATS = [
  { id: '00000000-0000-4000-8000-0000000000c1', title: 'Founders and sources', kind: 'chat', updated_at: ago(30) },
  { id: '00000000-0000-4000-8000-0000000000c2', title: 'Title page wording', kind: 'chat', updated_at: ago(60 * 5) },
  { id: '00000000-0000-4000-8000-0000000000c3', title: 'Platform team research', kind: 'research', updated_at: ago(60 * 30) }
]
const REPLY = [
  '## Who founded Spotify',
  'Daniel Ek and Martin Lorentzon founded **Spotify** in Stockholm in 2006. [1][2]',
  '',
  '- Wikipedia gives 23 April 2006. [1]',
  '- The developer portal runs on `Backstage`, open-sourced in 2020: https://backstage.io/blog/2020/03/16/announcing-backstage.',
  '- More in [the newsroom](https://newsroom.spotify.com).',
  '',
  'Sources:',
  '[1] https://en.wikipedia.org/wiki/Spotify',
  '[2] Britannica: https://www.britannica.com/money/Spotify',
  '',
  "I haven't changed any inputs."
].join('\n')
const TRACE = [
  { tool: 'web_search', title: 'Searched the web for "Spotify founders"', provider: 'Tavily', ok: true, input: { query: 'Spotify founders' }, results: [{ url: 'https://en.wikipedia.org/wiki/Spotify', title: 'Spotify - Wikipedia' }] },
  { tool: 'web_extract', title: 'Read en.wikipedia.org', provider: 'Tavily', ok: true, input: { urls: ['https://en.wikipedia.org/wiki/Spotify'] }, output: 'Spotify was founded in 2006 in Stockholm.' }
]
const msgs = chatId => [
  { id: 9000001, role: 'user', content: 'Who founded Spotify, and where can I read more?', meta: {}, job_id: null, created_at: ago(40), chat_id: chatId },
  { id: 9000002, role: 'assistant', content: REPLY, meta: { model: 'claude-sonnet-5-5', seconds: 7, trace: TRACE }, job_id: null, created_at: ago(39), chat_id: chatId },
  { id: 9000003, role: 'user', content: 'Thanks. Which inputs are still unconfirmed?', meta: {}, job_id: null, created_at: ago(35), chat_id: chatId },
  { id: 9000004, role: 'assistant', content: 'Three inputs are still unconfirmed: **engineer count**, **hourly cost** and **onboarding time**. Ask the VP of Engineering for the first two.', meta: { model: 'claude-sonnet-5-5', seconds: 4 }, job_id: null, created_at: ago(34), chat_id: chatId }
]

// ---- browser and the write block -----------------------------------------
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
page.on('pageerror', e => errors.push(e.message))
page.on('dialog', d => d.dismiss())
const writes = [] // every write the app tried (all aborted)
let fake = { chats: null, messages: false } // null / false = real data
await page.setRequestInterception(true)
page.on('request', r => {
  const u = new URL(r.url())
  const m = r.method()
  const supa = /supabase\.co$/.test(u.hostname)
  // Every rpc the app calls writes (save_deal saves the project), so those are blocked too.
  if (supa && /^\/(rest|storage|functions)\//.test(u.pathname) && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(m)) { writes.push(`${m} ${u.pathname}`); return r.abort() }
  const table = supa && (u.pathname.match(/\/rest\/v1\/(chats|chat_messages)$/) || [])[1]
  const cors = { 'access-control-allow-origin': r.headers().origin || '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-expose-headers': 'content-range' }
  const json = body => r.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })
  if (table && m === 'OPTIONS' && ((table === 'chats' && fake.chats) || (table === 'chat_messages' && fake.messages))) return r.respond({ status: 204, headers: cors })
  if (table === 'chats' && fake.chats && m === 'GET') return json(fake.chats.map(c => ({ ...c, deal_id: DEAL })))
  if (table === 'chat_messages' && fake.messages && m === 'GET') return json(msgs((u.searchParams.get('chat_id') || '').replace(/^eq\./, '')))
  r.continue()
})
const shot = name => page.screenshot({ path: `${out}/${name}.png` })

await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })

const side = async label => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and normalize-space(.)="${label}"]`); if (!b) throw new Error(`no sidebar item ${label}`); await b.click(); await sleep(900) }
async function openAgent(card = 'last') {
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.waitForSelector('.dashboard', { timeout: 20000 })
  await side('Projects'); await page.waitForSelector('.project-card', { timeout: 15000 })
  const cards = await page.$$('.project-card')
  const target = cards[card === 'last' ? cards.length - 1 : card]
  if (!target) return false
  openAgent.cards = cards.length
  await target.click(); await sleep(1500)
  await side('Agent')
  await page.waitForSelector('.chat-full', { timeout: 15000 })
  await page.waitForFunction(() => !/Loading/.test(document.querySelector('.chat-full .chat-inner')?.innerText || ''), { timeout: 15000 })
  await sleep(900)
  return true
}

// Shared checks: layout, mascot, the skill button, overflow.
const layout = () => page.evaluate(() => {
  const inner = document.querySelector('.chat-full .chat-inner')?.getBoundingClientRect()
  const r = e => e.getBoundingClientRect()
  return {
    inner: inner && { left: inner.left, right: inner.right, width: inner.width },
    users: [...document.querySelectorAll('.chat-full .chat-user .chat-bubble')].map(e => ({ left: r(e).left, right: r(e).right, bg: getComputedStyle(e).backgroundColor, radius: getComputedStyle(e).borderTopLeftRadius })),
    agents: [...document.querySelectorAll('.chat-full .chat-assistant:not(.chat-working) .chat-turn')].map(e => ({ left: r(e).left, right: r(e).right, bg: getComputedStyle(e.querySelector('.chat-bubble') || e).backgroundColor })),
    marks: document.querySelectorAll('.chat-full .chat-assistant .agent-mark').length,
    turns: document.querySelectorAll('.chat-full .chat-assistant').length
  }
})
async function mascotClear(label) {
  await sleep(900)
  const m = await page.evaluate(() => {
    const robot = document.querySelector('.mascot-perch .robot'), card = document.querySelector('.mascot-card')
    if (!robot || !card) return null
    return { robot: robot.getBoundingClientRect().bottom, card: card.getBoundingClientRect().top }
  })
  check(!!m && m.robot <= m.card + 1, `${label}: the mascot sits above the composer card`, m ? `robot bottom ${m.robot.toFixed(1)}, card top ${m.card.toFixed(1)}` : 'no perched robot')
}
async function noOverflow(label) {
  const o = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth, vw: window.innerWidth,
    list: (() => { const l = document.querySelector('.chat-list'); return l ? l.scrollWidth - l.clientWidth : 0 })(),
    widest: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1 && e.getBoundingClientRect().width > 0).slice(0, 3).map(e => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`)
  }))
  check(o.doc <= o.vw + 1 && o.list <= 1, `${label}: no horizontal overflow`, JSON.stringify(o))
}
async function skillInComposer(label) {
  const s = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /Use a skill/.test(x.getAttribute('aria-label') || x.innerText))
    return b ? { inBar: !!b.closest('.mascot-bar .mascot-left'), outside: [...document.querySelectorAll('.chat-skillbar')].length } : null
  })
  check(!!s && s.inBar && s.outside === 0, `${label}: "Use a skill" is in the composer tool row`, JSON.stringify(s))
}

// ---- pass 1: real history -------------------------------------------------
// The first project whose open chat has messages (the Spotify test project has).
let realCount = 0
for (let i = 0; i < 6; i++) {
  if (!(await openAgent(i))) break
  realCount = await page.$$eval('.chat-full .chat-msg', l => l.length)
  const name = await page.$eval('.chat-full .chat-deal, .chat-full .chat-menu-btn', e => e.innerText).catch(() => '')
  console.log(`project ${i + 1}: open chat "${name.trim()}" has ${realCount} messages`)
  if (realCount > 0) break
}
if (realCount > 0) {
  const L = await layout()
  check(L.users.every(u => Math.abs(u.right - L.inner.right) <= 4 && u.left > L.inner.left + L.inner.width * 0.25), 'real: user bubbles sit on the right of the column', JSON.stringify(L.users.map(u => [Math.round(u.left), Math.round(u.right)])) + ` column ${Math.round(L.inner.left)}-${Math.round(L.inner.right)}`)
  check(L.agents.every(a => a.left - L.inner.left <= 48), 'real: agent turns start at the left (after the mark)', JSON.stringify(L.agents.map(a => Math.round(a.left - L.inner.left))))
  check(L.marks >= 1, 'real: agent turns carry the agent mark', `${L.marks} marks on ${L.turns} turns`)
  const raw = await page.$$eval('.chat-full .chat-md', l => l.map(e => e.innerText).join('\n'))
  if (/https?:\/\//.test(raw) || (await page.$('.chat-full .src-chip, .chat-full .src-card'))) check(!/https?:\/\//.test(raw), 'real: no raw URLs in agent replies')
  await mascotClear('real')
  await skillInComposer('real')
  await noOverflow('real 1280')
  await shot('01-real-1280')
} else console.log('SKIP real history checks: the project has no messages (pass 2 covers them with fixtures)')

// ---- pass 2: fixtures -----------------------------------------------------
fake = { chats: CHATS, messages: true }
await openAgent('last')
await shot('02-fixture-1280')
{
  const L = await layout()
  check(L.users.length === 2 && L.agents.length === 2, 'fixture: two user messages and two agent turns', `${L.users.length}/${L.agents.length}`)
  check(L.users.every(u => Math.abs(u.right - L.inner.right) <= 4 && u.left > L.inner.left + L.inner.width * 0.25), 'fixture: user bubbles are right-aligned', JSON.stringify(L.users.map(u => [Math.round(u.left), Math.round(u.right)])))
  check(L.users.every(u => u.radius === '14px' && u.bg !== 'rgba(0, 0, 0, 0)'), 'fixture: user bubbles are filled, 14px radius', JSON.stringify(L.users.map(u => [u.bg, u.radius])))
  check(L.agents.every(a => a.left - L.inner.left <= 48 && a.bg === 'rgba(0, 0, 0, 0)'), 'fixture: agent replies are left, with no bubble', JSON.stringify(L.agents))
  check(L.marks === 2, 'fixture: each agent turn starts with the mark', `${L.marks}`)
  const maxCh = await page.$eval('.chat-full .chat-turn', e => getComputedStyle(e).maxWidth)
  check(/px$/.test(maxCh) && parseFloat(maxCh) < 760, 'fixture: agent text is held to a reading width', maxCh)

  // markdown
  const md = await page.$eval('.chat-full .chat-md', e => ({
    h: e.querySelectorAll('h3, h4').length, li: e.querySelectorAll('li').length, b: e.querySelectorAll('strong').length, code: e.querySelectorAll('code').length,
    links: [...e.querySelectorAll('.research-answer a:not(.src-chip)')].map(a => [a.target, a.rel]),
    text: e.innerText, chips: [...e.querySelectorAll('.src-chip')].map(a => ({ text: a.innerText.replace(/\s+/g, ' '), href: a.href, target: a.target, rel: a.rel, tip: a.dataset.tip })),
    cards: [...e.querySelectorAll('.src-row .src-card')].map(a => a.innerText.replace(/\s+/g, ' '))
  }))
  check(md.h >= 1 && md.li >= 3 && md.b >= 1 && md.code >= 1, 'fixture: replies render markdown (heading, list, bold, code)', JSON.stringify({ h: md.h, li: md.li, b: md.b, code: md.code }))
  check(md.links.length >= 1 && md.links.every(([t, r]) => t === '_blank' && /noreferrer/.test(r) && /noopener/.test(r)), 'fixture: links open in a new tab with noreferrer noopener', JSON.stringify(md.links))
  check(!/https?:\/\//.test(md.text), 'fixture: no raw URL text in the reply', JSON.stringify(md.text.match(/https?:\/\/\S+/g)))
  check(md.chips.length >= 3 && md.chips.some(c => /^1 en\.wikipedia\.org$/.test(c.text)) && md.chips.some(c => /backstage\.io/.test(c.text)), 'fixture: URLs and [n] refs render as "[n] host" chips', JSON.stringify(md.chips.map(c => c.text)))
  check(md.chips.every(c => c.target === '_blank' && /noopener/.test(c.rel) && c.tip), 'fixture: chips open in a new tab and carry a tooltip', '')
  check(md.cards.length === 3, 'fixture: the Sources list is a row of chips', JSON.stringify(md.cards))
  check(!/Sources:/.test(md.text) || md.text.split('Sources').length === 2, 'fixture: the raw "Sources:" block is gone', '')
  // tooltip on keyboard focus
  // keyboard focus (Shift+Tab, Tab) so :focus-visible applies, as for a keyboard user
  await page.focus('.chat-full .chat-md .src-chip'); await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await page.keyboard.press('Tab'); await sleep(200)
  const tip = await page.$eval('.chat-full .chat-md .src-chip', e => { const s = getComputedStyle(e, '::after'); return { display: s.display, content: s.content } })
  check(tip.display === 'block' && /wikipedia/.test(tip.content), 'fixture: focusing a chip shows its title or URL', JSON.stringify(tip))
  await shot('03-chip-tooltip')
  await page.evaluate(() => document.activeElement?.blur())

  // hover actions and timestamps
  await page.mouse.move(5, 790); await sleep(250)
  const hidden = await page.$$eval('.chat-full .chat-assistant .msg-actions.on-hover', l => l.map(e => getComputedStyle(e).opacity))
  const agentTurn = await page.$('.chat-full .chat-assistant:not(.chat-working)')
  await agentTurn.hover(); await sleep(300)
  const shown = await page.$eval('.chat-full .chat-assistant:not(.chat-working) .msg-actions', e => ({ op: getComputedStyle(e).opacity, time: !!e.querySelector('.msg-time'), iconOnly: [...e.querySelectorAll('button')].every(b => !b.innerText.trim()) }))
  check(hidden.every(o => o === '0') && shown.op === '1' && shown.time && shown.iconOnly, 'fixture: copy and time show on hover only, as icon buttons', JSON.stringify({ hidden, shown }))
  const edits = await page.evaluate(() => { const users = [...document.querySelectorAll('.chat-full .chat-user')]; return { n: document.querySelectorAll('.chat-full [aria-label="Edit message"]').length, onLast: !!users.at(-1)?.querySelector('[aria-label="Edit message"]') } })
  check(edits.n === 1 && edits.onLast, 'fixture: edit is offered on your last message only', JSON.stringify(edits))

  // tool trace toggles, with an animated height
  const traceSel = '.chat-full .chat-assistant .tool-trace'
  check(!(await page.$(`${traceSel} .trace-steps`)), 'fixture: the tool trace starts closed')
  await page.click(`${traceSel} .trace-summary`); await sleep(60)
  const mid = await page.$eval(`${traceSel} .trace-steps`, e => e.parentElement.getBoundingClientRect().height).catch(() => -1)
  await sleep(350)
  const full = await page.$eval(`${traceSel} .trace-steps`, e => e.parentElement.getBoundingClientRect().height).catch(() => -1)
  check(full > 40 && (await page.$eval(`${traceSel} .trace-summary`, e => e.getAttribute('aria-expanded'))) === 'true', 'fixture: the tool trace opens', `height ${Math.round(full)}`)
  check(mid >= 0 && mid < full, 'fixture: it opens with a height animation', `${Math.round(mid)}px at 60ms, ${Math.round(full)}px at rest`)
  await shot('04-trace-open')
  await page.click(`${traceSel} .trace-summary`); await sleep(400)
  check(!(await page.$(`${traceSel} .trace-steps`)), 'fixture: the tool trace closes')

  // rail with three chats: pill on the open one, a "..." menu per row
  const rail = await page.evaluate(() => ({ rail: !!document.querySelector('.chat-rail'), rows: document.querySelectorAll('.chat-rail .chat-row').length, pills: document.querySelectorAll('.chat-rail .chat-row.is-on .chat-row-pill').length, when: [...document.querySelectorAll('.chat-rail .chat-row-when')].map(e => e.innerText) }))
  check(rail.rail && rail.rows === 3 && rail.pills === 1 && rail.when.every(Boolean), 'fixture: 3 chats show the rail, titles with times, a pill on the open chat', JSON.stringify(rail))
  const rows = await page.$$('.chat-rail .chat-row')
  await rows[1].hover(); await sleep(150)
  await (await rows[1].$('.chat-row-more')).click(); await sleep(300)
  const menu = await page.$$eval('.sched-menu [role=menuitem]', l => l.map(e => e.innerText))
  check(menu.join(',') === 'Rename,Delete', 'fixture: each row has a "..." menu with Rename and Delete', menu.join(','))
  await shot('05-rail-menu')
  await page.keyboard.press('Escape'); await sleep(250)
  await (await rows[1].$('.chat-row-open')).click(); await sleep(900)
  const on = await page.evaluate(() => [...document.querySelectorAll('.chat-rail .chat-row')].findIndex(r => r.classList.contains('is-on') && r.querySelector('.chat-row-pill')))
  check(on === 1, 'fixture: picking another chat moves the pill', `${on}`)

  // composer
  await mascotClear('fixture 1280')
  await skillInComposer('fixture')
  await page.evaluate(() => [...document.querySelectorAll('.mascot-bar button')].find(b => /Use a skill/.test(b.getAttribute('aria-label') || '')).click()); await sleep(300)
  const skillMenu = await page.$$eval('.chat-skill-menu [role=menuitem]', l => l.length).catch(() => 0)
  check(skillMenu >= 1, '"Use a skill" opens the skill menu', `${skillMenu} items`)
  await shot('06-skill-menu')
  await page.keyboard.press('Escape'); await sleep(250)
  await noOverflow('fixture 1280')

  // light theme, for the eye
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await sleep(300)
  await shot('07-fixture-light')
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'))

  // phone width
  await page.setViewport({ width: 375, height: 812 }); await sleep(900)
  await noOverflow('fixture 375')
  await mascotClear('fixture 375')
  console.log('375 layout:', JSON.stringify(await page.evaluate(() => ({ bar: document.querySelector('.mobile-bar')?.getBoundingClientRect().height, shell: document.querySelector('.chat-shell')?.getBoundingClientRect().height, top: document.querySelector('.chat-shell')?.getBoundingClientRect().top, vh: window.innerHeight, docH: document.documentElement.scrollHeight }))))
  const send375 = await page.evaluate(() => { const s = document.querySelector('.mascot-send').getBoundingClientRect(), c = document.querySelector('.mascot-card').getBoundingClientRect(), t = document.querySelector('.mascot-model-btn').getBoundingClientRect(); return { sameRow: Math.abs((s.top + s.bottom) / 2 - (t.top + t.bottom) / 2) < 4, inside: s.right <= c.right && s.bottom <= c.bottom && s.bottom <= window.innerHeight } })
  check(send375.sameRow && send375.inside, 'fixture 375: the composer tools and send button fit on one row', JSON.stringify(send375))
  const L375 = await layout()
  check(L375.users.every(u => Math.abs(u.right - L375.inner.right) <= 4), 'fixture 375: user bubbles stay right', JSON.stringify(L375.users.map(u => [Math.round(u.left), Math.round(u.right)])))
  await shot('08-fixture-375')
  await page.setViewport({ width: 1280, height: 800 })
}

// ---- pass 3: empty chat ---------------------------------------------------
fake = { chats: null, messages: false }
let realEmpty = false
await openAgent(0)
if (!(await page.$('.chat-full.is-empty'))) {
  console.log('the first project has chats: using an empty chats read instead')
  fake = { chats: [], messages: false }
  await openAgent(0)
} else realEmpty = true
console.log(`empty chat from ${realEmpty ? 'a real project with no chats' : 'an empty chats read'}`)
{
  const g = await page.$eval('.chat-full .mascot-welcome h2', e => e.innerText).catch(() => '')
  check(/^What do you want to work on for .+\?$/.test(g), 'empty: the greeting names the company', JSON.stringify(g))
  const centred = await page.evaluate(() => { const w = document.querySelector('.chat-full .mascot-welcome'), p = document.querySelector('.chat-full.chat-panel'); if (!w || !p) return null; const a = w.getBoundingClientRect(), b = p.getBoundingClientRect(); return Math.abs((a.left + a.right) / 2 - (b.left + b.right) / 2) })
  check(centred !== null && centred < 6, 'empty: the greeting is centred', `${centred?.toFixed(1)}px off centre`)
  const chips = await page.$$eval('.chat-starters .starter-chip', l => l.map(e => e.innerText))
  check(chips.join('|') === "What's still missing from this case?|Find the VP of Engineering|Make the title page punchier|Add a page on the rollout plan", 'empty: four starter chips', JSON.stringify(chips))
  check((await page.$$('.chat-full .chat-empty li')).length === 0, 'empty: no second starter list')
  check(!(await page.$('.chat-rail')) && !!(await page.$('.chat-full .chat-menu-btn')), 'empty: no rail with 0-1 chats; chats are in the header menu')
  await skillInComposer('empty')
  await noOverflow('empty 1280')
  await shot('09-empty-1280')

  const before = writes.length
  const reqs = []
  const spy = r => { if (r.method() !== 'GET' && r.method() !== 'OPTIONS' && /supabase\.co/.test(r.url())) reqs.push(`${r.method()} ${new URL(r.url()).pathname}`) }
  page.on('request', spy)
  const [chip] = await page.$$('xpath/.//button[contains(@class,"starter-chip") and normalize-space(.)="Make the title page punchier"]')
  await chip.click(); await sleep(1500)
  page.off('request', spy)
  const box = await page.$eval('#chat-input', e => ({ value: e.value, focused: document.activeElement === e }))
  check(box.value === 'Make the title page punchier' && box.focused, 'empty: a chip fills the composer and focuses it', JSON.stringify(box))
  check(reqs.length === 0 && writes.length === before, 'empty: clicking a chip sends nothing (no POST)', JSON.stringify(reqs))
  check((await page.$$('.chat-full .chat-msg')).length === 0, 'empty: no message appears')
  await mascotClear('empty, after filling')
  await shot('10-empty-filled')
  await page.setViewport({ width: 375, height: 812 }); await sleep(900)
  await noOverflow('empty 375')
  await mascotClear('empty 375')
  await shot('11-empty-375')
  await page.click('#chat-input', { clickCount: 3 }); await page.keyboard.press('Backspace')
}

// ---- summary ----------------------------------------------------------------
check(errors.length === 0, 'no page errors', errors.join(' | '))
const sent = writes.filter(w => /chat_messages|\/jobs|\/chats/.test(w))
check(sent.length === 0, 'nothing was sent to the agent (no chat, message or job writes)', sent.join(', '))
console.log(`blocked writes: ${writes.length}${writes.length ? ` (${[...new Set(writes)].join(', ')})` : ''}`)
console.log(`${passed}/${passed + failed} passed; screenshots in ${out}`)
await browser.close()
process.exit(failed ? 1 : 0)
