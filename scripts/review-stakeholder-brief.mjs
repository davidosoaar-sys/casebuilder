// Stakeholder brief end to end on the TEST account and the real worker:
// upload a (fictional) call transcript and internal thread to the project, open
// the Finance stakeholder from the map, write the brief, and check it is a
// synthesis (stance, asks with status chips, decisions, verified quotes), not a
// copy of the transcript. Removes the files afterwards.
// Usage: node scripts/review-stakeholder-brief.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const DIR = '/tmp/cb-brief'
fs.mkdirSync(DIR, { recursive: true })
const CALL = `Discovery call, Spotify, 14 October 2026 (fictional test material)
Attendees: Priya Raman (Finance Director, Spotify), Marco Lindqvist (VP Engineering, Spotify), Chris (Account Executive)

Chris: Thanks both. Marco, you mentioned search time is the big pain.
Marco: Our engineers lose hours a week hunting for docs and owners. I want this fixed before planning season.
Priya: I'm open to it, but I need to see the payback. Anything over twelve months will not get through the budget committee.
Priya: Also, we already pay for two internal tools that overlap. Show me what we can switch off.
Chris: Understood. We'll send a payback model with your headcount.
Priya: Send it before the 28th, that's when the committee pack closes.
Marco: Agreed that we pilot with the payments team first.
Priya: Fine by me, as long as the pilot is free for the first 60 days.
`
const THREAD = `#spotify-deal internal thread (fictional)
Aleena: Priya replied to the pricing email. She wants the security review done before she signs anything.
Chris: Security questionnaire is with their team now, waiting on them.
Aleena: Payback model draft is half done, I'll finish it Monday.
`
fs.writeFileSync(`${DIR}/Spotify discovery call 2026-10-14.txt`, CALL)
fs.writeFileSync(`${DIR}/Slack spotify-deal thread.txt`, THREAD)

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('response', async r => { if (r.status() >= 400 && /supabase/.test(r.url())) errors.push(`${r.status()} ${r.url().split('?')[0]} ${(await r.text().catch(() => '')).slice(0, 160)}`) })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.click('.side-item[aria-label="Projects"]')
await page.waitForSelector('.project-card', { timeout: 15000 })
const spotify = await page.$$eval('.project-card', cs => cs.findIndex(c => /Spotify/.test(c.innerText)))
await (await page.$$('.project-card'))[Math.max(0, spotify)].click()
await page.waitForSelector('.side-item[aria-label="Files"]')

// Upload the material.
await page.click('.side-item[aria-label="Files"]')
await page.waitForSelector('.pf-page .pf-drop'); await page.waitForNetworkIdle({ idleTime: 800 })
const before = await page.$$eval('.pf-card', l => l.length)
await (await page.$('.pf-drop input[type=file]')).uploadFile(`${DIR}/Spotify discovery call 2026-10-14.txt`, `${DIR}/Slack spotify-deal thread.txt`)
await page.waitForFunction(n => document.querySelectorAll('.pf-card').length >= n + 2, { timeout: 30000 }, before)
check('call transcript and thread uploaded to Files', true)

// Open the Finance stakeholder from the map.
await page.click('.side-item[aria-label="Case inputs"]')
await page.waitForSelector('.details-tab')
await page.evaluate(() => [...document.querySelectorAll('.details-tab')].find(b => /Stakeholders/.test(b.innerText)).click())
await page.waitForSelector('.map-node .map-open')
const opened = await page.evaluate(() => { const b = [...document.querySelectorAll('.map-open')].find(b => /Finance/.test(b.getAttribute('aria-label'))); b?.click(); return !!b })
check('map has a Brief link on the Finance stakeholder', opened)
await page.waitForSelector('.sb-page')
await page.waitForFunction(() => { const b = document.querySelector('.sb-head-actions button'); return b && !b.disabled }, { timeout: 15000 })
const intro = await page.$eval('.sb-page', e => e.innerText)
check('before running, it says what it will read and that it does not search the web', /does not search the web/.test(intro) || /Refresh brief/.test(intro), intro.slice(0, 200).replace(/\n/g, ' '))

await page.click('.sb-head-actions button')
await page.waitForSelector('.sb-empty[role=status]', { timeout: 10000 }).catch(() => {})
await page.waitForSelector('.sb-summary', { timeout: 240000 })
await page.waitForFunction(() => !document.querySelector('.sb-empty[role=status]'), { timeout: 10000 }).catch(() => {})
const body = await page.$eval('.sb-body', e => e.innerText)
const bodyNoQuotes = await page.$eval('.sb-body', e => { const c = e.cloneNode(true); c.querySelectorAll('blockquote').forEach(q => q.remove()); return c.innerText })
const summary = await page.$eval('.sb-summary', e => e.innerText)
const stance = await page.$eval('.sb-stance', e => e.innerText).catch(() => '')
const asks = await page.$$eval('.sb-asks li', l => l.map(e => e.innerText.replace(/\n/g, ' | ')))
const chips = await page.$$eval('.sb-asks .sb-status', l => l.map(e => e.innerText))
const decisions = await page.$$eval('.sb-decisions li', l => l.map(e => e.innerText.replace(/\n/g, ' | ')))
const quotes = await page.$$eval('.sb-card blockquote', l => l.map(e => e.innerText.replace(/\n/g, ' | ')))
console.log('summary:', summary); console.log('stance:', stance); console.log('asks:', asks); console.log('decisions:', decisions); console.log('quotes:', quotes)

check('brief is about the Finance stakeholder (mentions payback)', /payback/i.test(body))
check('brief has a stance', !!stance && stance !== '')
const head = await page.$eval('.sb-head p', e => e.innerText)
check('header names the person the material identifies (Priya Raman)', /Priya Raman/.test(head), head)
check('requirements show as status chips', chips.length > 0 && chips.every(c => ['Actioned', 'In progress', 'Waiting for approval', 'Open'].includes(c)), chips.join(', '))
check('picked up the 12-month payback condition', /12|twelve/i.test(body))
check('picked up the security review ask from the internal thread', /security/i.test(body))
check('quotes shown are word for word in the material', quotes.every(q => CALL.includes(q.split(' | ')[0].replace(/^“|”$/g, '')) || THREAD.includes(q.split(' | ')[0].replace(/^“|”$/g, ''))), quotes.join(' / '))
// Not a transcript copy: much shorter than the material and no long verbatim runs.
const longest = (() => { let best = 0; const src = CALL + THREAD; for (let i = 0; i + 80 <= bodyNoQuotes.length; i += 10) if (src.includes(bodyNoQuotes.slice(i, i + 80))) best = 80; return best })()
check('it is a synthesis, not a copy (outside the quotes, no 80-character run copied from the material)', longest === 0)
check('brief stays on the stakeholder (no comments on deck instructions)', !/cost target|slide/i.test(summary), summary.slice(0, 120))
await page.screenshot({ path: '/tmp/cb-review/7-stakeholder-brief.png', fullPage: true })

// Back to the map, then reopen: the brief is remembered.
await page.click('.sb-back'); await page.waitForSelector('.map-node')
await page.evaluate(() => [...document.querySelectorAll('.map-open')].find(b => /Finance/.test(b.getAttribute('aria-label'))).click())
await page.waitForSelector('.sb-summary', { timeout: 15000 }).catch(() => {})
check('reopening shows the saved brief without re-running', !!(await page.$('.sb-summary')) && /Refresh brief/.test(await page.$eval('.sb-head-actions button', b => b.innerText)))

// Clean up the two files.
await page.click('.side-item[aria-label="Files"]'); await page.waitForSelector('.pf-page .pf-drop'); await page.waitForNetworkIdle({ idleTime: 800 })
for (const name of ['Spotify discovery call 2026-10-14.txt', 'Slack spotify-deal thread.txt']) {
  await page.evaluate(n => [...document.querySelectorAll('.pf-card')].find(c => c.querySelector('.pf-card-name').innerText === n)?.querySelector('.pf-card-actions .icon-btn')?.click(), name)
  await sleep(800)
}
check('no page errors or failed Supabase calls', errors.length === 0, errors.join(' | '))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
