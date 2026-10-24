// Real end-to-end check of the agent chat (v0.6.0), on the TEST account:
// real browser -> Supabase job -> Hermes worker on the VM -> real model ->
// edits applied to the deal -> deck recalculates -> saved to Supabase ->
// Undo puts it back. Restores the deal's original value at the end.
// Usage: node scripts/review-agent-chat.mjs [base-url]
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

// Direct DB reader, signed in as the same test account (RLS applies).
const db = createClient(app.VITE_SUPABASE_URL, app.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
await db.auth.signInWithPassword({ email: EMAIL, password: T.TEST_PASSWORD })
const savedEngineers = async id => {
  const { data } = await db.from('deals').select('data').eq('id', id).single()
  return data?.data?.fields?.find(f => f.key === 'engineers')
}

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
const dealId = await page.evaluate(() => {
  // the open deal is the only one with an input sheet; read its id from the app state via the save target
  return window.__cbDealId || null
})
const before = await page.$eval('#engineers', e => e.value)
check('deal open, chat panel shown', Boolean(await page.$('.chat-panel')), `engineers=${before}`)

const target = String(Number(before) === 1234 ? 1235 : 1234)
await page.waitForFunction(() => !document.querySelector('.chat-empty') || /Ask a question/.test(document.querySelector('.chat-empty').innerText), { timeout: 15000 })
await sleep(1000)
const cardsBefore = (await page.$$('.chat-changes')).length
const t0 = Date.now()
await page.type('#chat-input', `They have ${Number(target).toLocaleString('en-US')} engineers. Please update the deal.`)
await page.click('.chat-form button[type=submit]')
await page.waitForSelector('.chat-typing', { timeout: 10000 })
check('message sent, agent working', true)
await page.waitForFunction(n => document.querySelectorAll('.chat-changes').length > n, { timeout: 180000 }, cardsBefore)
const secs = Math.round((Date.now() - t0) / 1000)
await sleep(800)
const lastCard = sel => page.$$eval(sel, es => es[es.length - 1].innerText)
const card = await lastCard('.chat-changes')
check('reply arrived with a change card', /Engineers/i.test(card), `${secs}s`)
await page.screenshot({ path: '/tmp/agent-1-changed.png' })
const after = await page.$eval('#engineers', e => e.value)
check('input sheet shows the new value', after === target, `${before} -> ${after}`)
check('change marked as "your number" (from chat)', /your number/i.test(card))

// Saved to Supabase (autosave), with the right source.
const deals = (await db.from('deals').select('id, data').order('updated_at', { ascending: false }).limit(1)).data
const id = deals[0].id
let saved
for (let i = 0; i < 10; i++) { saved = await savedEngineers(id); if (String(saved?.value) === target) break; await sleep(700) }
check('saved to Supabase', String(saved?.value) === target, `db=${saved?.value} state=${saved?.source?.state}`)

// Deck recalculates.
const [deckBtn] = await page.$$('xpath/.//aside//button[contains(., "Deck")]'); await deckBtn.click(); await sleep(1500)
const deckText = await page.evaluate(() => document.querySelector('.content')?.innerText || '')
check('deck page still renders with chat open', deckText.length > 100 && Boolean(await page.$('.chat-panel')))
await page.screenshot({ path: '/tmp/agent-2-deck.png' })
const [sheetBtn] = await page.$$('xpath/.//aside//button[contains(., "Input sheet")]'); await sheetBtn.click()
await page.waitForSelector('#engineers')

// Undo.
const undos = await page.$$('.chg-undo'); await undos[undos.length - 1].click(); await sleep(800)
const undone = await page.$eval('#engineers', e => e.value)
check('Undo puts the value back', undone === before, `${after} -> ${undone}`)
check('card shows Undone', /Undone/i.test(await lastCard('.chat-changes')))
for (let i = 0; i < 10; i++) { saved = await savedEngineers(id); if (String(saved?.value) === before) break; await sleep(700) }
check('Undo saved to Supabase', String(saved?.value) === before, `db=${saved?.value}`)
await page.screenshot({ path: '/tmp/agent-3-undone.png' })

// Reload: edits are not applied twice, Undo state persists.
await page.reload({ waitUntil: 'networkidle2' })
await page.waitForSelector('.dashboard, #engineers', { timeout: 20000 })
if (await page.$('.dashboard')) { const [pr] = await page.$$('xpath/.//button[contains(., "Projects")]'); await pr.click(); await page.waitForSelector('.project-card'); await (await page.$('.project-card')).click() }
await page.waitForSelector('.chat-changes', { timeout: 20000 }); await sleep(1500)
check('after reload: not re-applied', (await page.$eval('#engineers', e => e.value)) === before)
check('after reload: still shows Undone', /Undone/i.test(await lastCard('.chat-changes')))

check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
console.log(results.every(Boolean) ? 'ALL PASS' : `${results.filter(r => !r).length} FAILED`)
