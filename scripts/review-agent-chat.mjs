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

const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 600000 })
const page = await browser.newPage()
// v0.16.0: sentence-case labels, with explicit failures for missing controls.
async function clickText(label, selector = 'button') {
  await page.evaluate((label, selector) => {
    const button = [...document.querySelectorAll(selector)].find(b =>
      (b.getAttribute('aria-label') || b.innerText).trim().toLowerCase() === label.toLowerCase())
    if (!button) throw new Error(`Button not found: "${label}" (${selector})`)
    button.click()
  }, label, selector)
}

try {
  await page.setViewport({ width: 1440, height: 900 })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', EMAIL); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForSelector('.dashboard', { timeout: 20000 })
  await clickText('Projects', '.side-item')
  await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
  await page.waitForSelector('#engineers', { timeout: 15000 })
  const before = await page.$eval('#engineers', e => e.value)
  if (!(await page.$('.chat-split'))) await page.click('.chat-open')
  await page.waitForSelector('.chat-split', { timeout: 10000 })
  const id = await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)
  const chatsBeforeResult = await db.from('chats').select('id').eq('deal_id', id)
  if (chatsBeforeResult.error) throw chatsBeforeResult.error
  const chatsBefore = chatsBeforeResult.data.map(c => c.id)
  await page.waitForFunction(() => !document.querySelector('.chat-empty') || !/loading/i.test(document.querySelector('.chat-empty').innerText), { timeout: 15000 })
  let sent = false
  const cardsBefore = (await page.$$('.chat-changes')).length
  try {
  check('deal open, agent split pane shown', true, `engineers=${before}`)

  const target = String(Number(before) === 1234 ? 1235 : 1234)
  await page.waitForFunction(() => !document.querySelector('.chat-empty') || /Ask a question/.test(document.querySelector('.chat-empty').innerText), { timeout: 15000 })
  await sleep(1000)
  const t0 = Date.now()
  await page.type('#chat-input', `They have ${Number(target).toLocaleString('en-US')} engineers. Please update the deal.`)
  sent = true
  await page.click('.mascot-send')
  await page.waitForSelector('.mascot-send.is-busy', { timeout: 10000 })
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
  let saved
  for (let i = 0; i < 10; i++) { saved = await savedEngineers(id); if (String(saved?.value) === target) break; await sleep(700) }
  check('saved to Supabase', String(saved?.value) === target, `db=${saved?.value} state=${saved?.source?.state}`)

  // Deck recalculates.
  await clickText('Case artifacts', '.side-item'); await clickText('Edit slides'); await sleep(1500)
  const deckText = await page.evaluate(() => document.querySelector('.content')?.innerText || '')
  check('deck page still renders with agent split open', deckText.length > 100 && Boolean(await page.$('.chat-split')))
  await page.screenshot({ path: '/tmp/agent-2-deck.png' })
  await clickText('Case inputs', '.side-item')
  // copy icon on the reply, edit icon on hover of the user's message
  const users = await page.$$('.chat-user'); await users[users.length - 1].hover(); await new Promise(r => setTimeout(r, 300))
  const hoverOpacity = await page.$$eval('.chat-user .msg-actions.on-hover', es => getComputedStyle(es[es.length - 1]).opacity)
  check('user message shows copy + edit on hover', hoverOpacity === '1' && (await page.$$('.chat-user [aria-label="Edit message"]')).length > 0)
  check('replies have a copy button', (await page.$$('.chat-assistant [aria-label="Copy reply"]')).length > 0)
  await page.waitForSelector('#engineers')

  // Undo.
  const changeCards = await page.$$('.chat-changes')
  const undo = await changeCards.at(-1).$('button.chg-undo')
  if (!undo) throw new Error('Button not found: Undo on the latest change card')
  await undo.click(); await sleep(800)
  const undone = await page.$eval('#engineers', e => e.value)
  check('Undo puts the value back', undone === before, `${after} -> ${undone}`)
  check('card shows Undone', /Undone/i.test(await lastCard('.chat-changes')))
  for (let i = 0; i < 10; i++) { saved = await savedEngineers(id); if (String(saved?.value) === before) break; await sleep(700) }
  check('Undo saved to Supabase', String(saved?.value) === before, `db=${saved?.value}`)
  await page.screenshot({ path: '/tmp/agent-3-undone.png' })

  // Reload: edits are not applied twice, Undo state persists.
  await page.reload({ waitUntil: 'networkidle2' })
  await page.waitForSelector('.dashboard, #engineers', { timeout: 20000 })
  if (await page.$('.dashboard')) { await clickText('Projects', '.side-item'); await page.waitForSelector('.project-card'); await (await page.$('.project-card')).click() }
  await page.waitForSelector('.chat-changes', { timeout: 20000 }); await sleep(1500)
  check('after reload: not re-applied', (await page.$eval('#engineers', e => e.value)) === before)
  check('after reload: still shows Undone', /Undone/i.test(await lastCard('.chat-changes')))

  } finally {
    // Keep the original Undo restoration even when an intermediate assertion/wait throws.
    if (sent) {
      try {
      await page.waitForFunction(n => document.querySelectorAll('.chat-changes').length > n && !document.querySelector('.chat-typing'), { timeout: 240000 }, cardsBefore)
      const cards = await page.$$('.chat-changes')
      const latest = cards.at(-1)
      if (!(await latest.evaluate(c => c.classList.contains('is-undone')))) {
        const undo = await latest.$('.chg-undo')
        if (!undo) throw new Error('Cleanup button not found: Undo on the test change card')
        await undo.click()
      }
      await clickText('Case inputs', '.side-item')
      await page.waitForFunction(value => document.querySelector('#engineers')?.value === value, { timeout: 15000 }, before)
      let restored
      for (let i = 0; i < 20; i++) { restored = await savedEngineers(id); if (String(restored?.value) === before) break; await sleep(700) }
      check('cleanup: original engineers value saved', String(restored?.value) === before)
      } finally {
      const after = await db.from('chats').select('id').eq('deal_id', id)
      if (after.error) throw after.error
      for (const chat of after.data.filter(c => !chatsBefore.includes(c.id))) {
        const removed = await db.from('chats').delete().eq('id', chat.id)
        if (removed.error) throw removed.error
      }
      }
    }
  }
  check('no page errors', errors.length === 0, errors.join(' | '))
} finally {
  await browser.close()
}
console.log(results.every(Boolean) ? 'ALL PASS' : `${results.filter(r => !r).length} FAILED`)
