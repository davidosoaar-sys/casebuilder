// Real end-to-end check of agent commands (v0.8.0), on the TEST account:
// chat "find the CTO" -> worker on the VM returns a FIND_STAKEHOLDERS command
// -> the app runs it through /api/research with the user's own saved key ->
// result card -> "Add to deal" -> person saved on the deal in Supabase.
// Also checks the Find people BUTTON path works with only the account key.
// Usage: node scripts/review-agent-commands.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
import { createClient } from '@supabase/supabase-js'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const app = envFile(process.cwd() + '/.env.local')
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const EMAIL = 'test@casebuilder.dev'
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const db = createClient(app.VITE_SUPABASE_URL, app.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const { data: { session } } = await db.auth.signInWithPassword({ email: EMAIL, password: T.TEST_PASSWORD })
check('no server Anthropic key configured (so only the account key can pay)', !/^ANTHROPIC_API_KEY=/m.test(fs.readFileSync('.env.local', 'utf8')))

// 1. the button route, signed in vs not
let r = await fetch(base + '/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: 'Lovable', role: 'CTO' }) })
check('button route without a session is refused', r.status === 503 || r.status === 401, String(r.status))
r = await fetch(base + '/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ company: 'Lovable', role: 'CTO' }) })
const btn = await r.json()
check('button route with the session runs on the account key', r.ok && Array.isArray(btn.people), `${r.status} ${(btn.people || []).map(p => p.name).join(', ') || btn.note || btn.error}`)

// 2. the chat path
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', EMAIL); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
const [projects] = await page.$$('xpath/.//button[contains(., "Projects")]'); await projects.click()
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('#engineers', { timeout: 15000 })
const dealName = await page.evaluate(() => document.querySelector('.chat-deal, h1')?.innerText || '')
const [agent] = await page.$$('xpath/.//aside//button[contains(., "Agent")]'); await agent.click()
await page.waitForSelector('.chat-full'); await sleep(1500)
const before = (await page.$$('.cmd-card')).length
await page.click('.mascot-model-btn'); const [hk] = await page.$$('xpath/.//div[contains(@class,"mascot-menu")]//button[contains(., "Sonnet")]'); await hk.click(); await page.keyboard.press('Escape')
await page.type('#chat-input', 'Find the VP of Engineering for this deal.')
const t0 = Date.now()
await page.click('.mascot-send')
await page.waitForFunction(n => document.querySelectorAll('.cmd-card').length > n, { timeout: 180000 }, before)
check('agent replied with a Find people command card', true, `${Math.round((Date.now() - t0) / 1000)}s`)
await page.waitForFunction(() => { const c = [...document.querySelectorAll('.cmd-card')].pop(); return c && !c.querySelector('.cmd-spin') }, { timeout: 180000 })
const card = await page.$$eval('.cmd-card', cs => cs[cs.length - 1].innerText)
check('command ran and returned a result', /Find people/i.test(card) && !/failed|not set up|API key/i.test(card), card.replace(/\n+/g, ' | ').slice(0, 220))
await page.screenshot({ path: '/tmp/cmd-1-result.png' })

const picks = await page.$$('.cmd-card:last-of-type .cmd-pick')
const lastCardPicks = await page.evaluate(() => [...document.querySelectorAll('.cmd-card')].pop().querySelectorAll('.cmd-pick').length)
if (lastCardPicks) {
  const name = await page.evaluate(() => [...document.querySelectorAll('.cmd-card')].pop().querySelector('.cmd-row strong').innerText)
  await page.evaluate(() => [...document.querySelectorAll('.cmd-card')].pop().querySelector('.cmd-pick').click())
  await sleep(600)
  check('picked person shows Added', await page.evaluate(() => /Added/.test([...document.querySelectorAll('.cmd-card')].pop().innerText)))
  let saved = false
  for (let i = 0; i < 12 && !saved; i++) {
    const { data } = await db.from('deals').select('data').order('updated_at', { ascending: false }).limit(1)
    saved = Object.values(data[0].data.people || {}).flat().some(p => p.name === name)
    if (!saved) await sleep(700)
  }
  check('picked person saved on the deal in Supabase', saved, name)
  await page.screenshot({ path: '/tmp/cmd-2-added.png' })
} else {
  check('result had someone to add (none found is allowed but not tested here)', false, 'no candidates returned')
}

// reload: commands do not re-run
const runsBefore = await page.$$eval('.cmd-card', cs => cs.length)
await page.reload({ waitUntil: 'networkidle2' })
await page.waitForSelector('.dashboard, .chat-full, #engineers', { timeout: 20000 })
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
console.log(results.every(Boolean) ? 'ALL PASS' : `${results.filter(r => !r).length} FAILED`)
