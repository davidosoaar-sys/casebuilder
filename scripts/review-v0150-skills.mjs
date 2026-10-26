// v0.15.0 Skill library. TEST account. Two real agent runs on the NEW worker code
// (VPS harness; caller stops the live worker for the run).
//   - Skills page: 4 built-in skills, switch one off, configure one
//   - "Try" Pre-meeting brief from the Skills page -> chat -> fill who -> brief
//   - New custom skill -> use it from the chat's "Use a skill" -> reply follows it
//   - A switched-off skill is not offered in the chat
//   - cleanup: skill rows, chats
// Usage: node scripts/review-v0150-skills.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
import { pick as choose } from './lib/pick.mjs'
import { execFileSync } from 'node:child_process'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' }
const rest = (path, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const out = '/tmp/cb-review'; fs.mkdirSync(out, { recursive: true })
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const STAMP = Date.now().toString(36)

async function runOnHarness(owner, since) {
  for (let i = 0; i < 60; i++) {
    const r = await rest(`jobs?owner_id=eq.${owner}&status=eq.queued&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=1`, {
      method: 'PATCH', body: JSON.stringify({ status: 'running', locked_by: 'harness', locked_at: new Date().toISOString(), attempts: 1 }), headers: { Prefer: 'return=representation' } })
    const rows = r.ok ? await r.json() : []
    if (rows.length) {
      const o = execFileSync('ssh', ['casebuilder-vps', `sudo -u casebuilder bash -c 'cd /home/casebuilder/worker-harness && set -a && . /home/casebuilder/worker/worker.env && set +a && python3 handle_one.py ${rows[0].id}'`], { encoding: 'utf8', timeout: 300000 })
      return { job: rows[0], out: o.trim().split('\n').at(-1) }
    }
    await sleep(200)
  }
  return null
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
// The rail exists only for 2+ chats; otherwise open the header list.
async function showChats() {
  await page.waitForSelector('.chat-panel', { timeout: 15000 })
  await page.waitForFunction(() => !document.querySelector('.chat-empty') || !/loading/i.test(document.querySelector('.chat-empty').innerText))
  if (!(await page.$('.chat-rail')) && !(await page.$('.chat-menu-pop'))) await page.click('.chat-menu-btn')
  await page.waitForSelector('.chat-rail, .chat-menu-pop')
  await page.waitForFunction(() => ![...document.querySelectorAll('.chat-rail-empty')].some(e => /loading/i.test(e.innerText)))
}
async function newChat() {
  await showChats()
  await clickText('New chat', '.chat-rail-new')
}

try {
  await page.setViewport({ width: 1280, height: 900 })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  page.on('dialog', d => d.accept())
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
  const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
  const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
  await clickText('Projects', '.side-item')
  await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
  await page.waitForSelector('#engineers', { timeout: 15000 })
  const nav = label => clickText(label, '.side-item')
  // v0.15.1: Skills and Scheduled are in the main menu (outside a project).
  const mainMenu = async label => {
    if (await page.$('.project-sidebar-back')) { await page.click('.project-sidebar-back'); await page.waitForSelector('.project-card', { timeout: 15000 }) }
    await nav(label)
  }
  // "Use" / "Schedule" ask which project: pick the one the test opened.
  const pickProject = async () => { await page.waitForSelector('.skill-pick, .chat-skillrun'); if (await page.$('.chat-skillrun')) return; await choose(page, '.skill-pick [role=combobox]', dealId); await page.click('.skill-pick button[type=submit]') }
  const card = name => page.evaluateHandle(n => [...document.querySelectorAll('.skill-card')].find(c => c.querySelector('strong')?.innerText.toLowerCase() === n.toLowerCase()), name)
  const clickIn = async (h, text) => h.evaluate((c, t) => {
    if (!c) throw new Error(`Skill card not found for action: ${t}`)
    const b = [...c.querySelectorAll('button')].find(b => b.innerText.trim().toLowerCase() === t.toLowerCase())
    if (!b) throw new Error(`Skill button not found: ${t}`)
    b.click()
  }, text)
  const dealId = await (async () => { await nav('Agent'); await page.waitForSelector('.chat-panel[data-deal]', { timeout: 15000 }); return page.$eval('.chat-panel[data-deal]', e => e.dataset.deal) })()
  const chatsBefore = (await (await rest(`chats?deal_id=eq.${dealId}&select=id`)).json()).map(c => c.id)

  try {
    const items = await page.$$eval('.sidebar-nav .side-item', l => l.map(e => e.innerText.trim()))
    check('inside a project, the menu has no Skills or Scheduled', !items.some(t => t.toLowerCase() === 'skills') && !items.some(t => t.toLowerCase() === 'scheduled'), items.join(' | '))
    await mainMenu('Skills'); await page.waitForSelector('.skills-page .skill-card', { timeout: 15000 })
    const main = await page.$$eval('.sidebar-nav .side-item', l => l.map(e => e.innerText.trim()))
    check('the main menu has Scheduled and Skills', main.some(t => t.toLowerCase() === 'skills') && main.some(t => t.toLowerCase() === 'scheduled'), main.join(' | '))
    const names = await page.$$eval('.skill-card strong', l => l.map(e => e.innerText))
    check('Skills page lists the 4 built-in skills', ['Pre-meeting brief', 'Account news digest', 'Stakeholder map', 'Objection prep'].every(n => names.some(t => t.toLowerCase() === n.toLowerCase())), names.join(' | '))

    // Configure Objection prep: 3 objections.
    let c = await card('Objection prep'); await c.evaluate(c => { if (!c) throw new Error('Skill not found: Objection prep'); c.querySelector('.skill-open').click() }); await page.waitForSelector('.skill-config')
    await choose(page, '.skill-config [role=combobox]', '3'); await sleep(1200)
    const cfg = (await (await rest(`skills?owner_id=eq.${owner}&deal_id=is.null&prebuilt_key=eq.objection_prep&select=settings`)).json())[0]
    check('configure saves the setting for this project', cfg?.settings?.count === '3', JSON.stringify(cfg?.settings))
    await page.keyboard.press('Escape')
    // Switch Stakeholder map off.
    c = await card('Stakeholder map'); await c.evaluate(x => { if (!x) throw new Error('Skill not found: Stakeholder map'); x.querySelector('.skill-add').click() }); await sleep(1200)
    const off = (await (await rest(`skills?owner_id=eq.${owner}&deal_id=is.null&prebuilt_key=eq.stakeholder_map&select=enabled`)).json())[0]
    check('switching a skill off is saved', off?.enabled === false)

    // Custom skill.
    await page.click('.skills-page .page-head .primary'); await page.waitForSelector('.sched-form')
    await page.type('.sched-form input', `Haiku ${STAMP}`)
    await page.type('.sched-form textarea', 'Answer ONLY with a three-line haiku about this deal\'s company. No other text, no title.')
    await page.click('.sched-form button[type=submit]'); await page.waitForSelector('.skill-form-modal', { hidden: true }); await page.click('#skills-tab-yours'); await page.waitForFunction(s => [...document.querySelectorAll('.skill-card strong')].some(e => e.innerText === s), { timeout: 10000 }, `Haiku ${STAMP}`)
    check('a custom skill is added under "Yours"', true)
    await page.screenshot({ path: `${out}/v0150-10-skills.png` })

    // Use Pre-meeting brief from the Skills page.
    c = await card('Pre-meeting brief'); await clickIn(c, 'Try')
    await pickProject()
    await page.waitForSelector('.chat-skillrun', { timeout: 15000 })
    check('"Try" opened the picked project\'s Agent', (await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)) === dealId)
    check('"Try" opens the Agent with the skill ready to fill in', /Pre-meeting brief/i.test(await page.$eval('.chat-skillrun', e => e.innerText)))
    await sleep(800)
    check('"Try" starts a new chat (none open yet)', (await page.$$eval('.chat-full .chat-msg', l => l.length)) === 0)
    await page.click('.chat-skillrun button[type=submit]'); await sleep(400)
    check('a required detail is asked for, not sent empty', /Fill in "Who are you meeting\?"/.test(await page.$eval('.chat-error', e => e.innerText).catch(() => '')))
    await page.type('.chat-skillrun input', `Daniel Ek, CEO [${STAMP}]`)
    const since1 = new Date(Date.now() - 3000).toISOString()
    await page.click('.chat-skillrun button[type=submit]')
    const r1 = await runOnHarness(owner, since1)
    const firstChat = (await (await rest(`chats?deal_id=eq.${dealId}&select=id,title&order=created_at.desc&limit=1`)).json())[0]
    check('the skill run got its own new chat', firstChat && !chatsBefore.includes(firstChat.id) && /Pre-meeting brief/i.test(firstChat.title), firstChat?.title)
    check('it ran as a research job carrying the skill (not its text)', r1?.job.kind === 'research' && r1.job.payload.skill_key === 'pre_meeting_brief' && !/In one line/.test(r1.job.payload.question || ''), `${r1?.job.kind} ${r1?.job.payload.skill_key} ${r1?.out}`)
    await page.waitForFunction(() => document.querySelector('.chat-full .chat-research .research-answer'), { timeout: 30000 }).catch(() => {})
    const brief = await page.$eval('.chat-full .chat-research', e => e.innerText).catch(() => '')
    check('the brief follows the skill (questions to ask, avoid) and names him', /Ek/.test(brief) && /question/i.test(brief) && /avoid/i.test(brief), brief.replace(/\n+/g, ' ').slice(0, 160))
    await page.screenshot({ path: `${out}/v0150-11-skill-brief.png` })

    // Custom skill from the chat's "Use a skill" menu, in a new chat.
    await newChat(); await sleep(300)
    await page.click('.mascot-card .chat-skill-btn'); await page.waitForSelector('.chat-skill-menu')
    const offered = await page.$$eval('.chat-skill-menu [role=menuitem] > span', l => l.map(e => e.innerText))
    check('a switched-off skill is not offered in the chat', !offered.some(t => /^stakeholder map$/i.test(t)) && offered.includes(`Haiku ${STAMP}`), offered.join(' | '))
    await clickText(`Haiku ${STAMP}`, '.chat-skill-menu [role=menuitem] > span')
    const since2 = new Date(Date.now() - 3000).toISOString()
    await page.click('.chat-skillrun button[type=submit]')
    const r2 = await runOnHarness(owner, since2)
    check('the custom skill ran as an agent job with its id', r2?.job.kind === 'chat' && !!r2.job.payload.skill_id, r2?.out)
    await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-assistant .chat-bubble:not(.chat-typing)').length > 0, { timeout: 30000 }).catch(() => {})
    const haiku = await page.$$eval('.chat-full .chat-assistant .chat-bubble', l => l.at(-1)?.innerText || '')
    const lines = haiku.trim().split('\n').filter(Boolean)
    check('the reply follows the custom instructions (a 3-line haiku)', lines.length === 3, JSON.stringify(haiku.slice(0, 120)))

    // Removed Schedule-from-Skills checks: v0.16.0 removed this action; scheduling now starts on Scheduled.
  } finally {
    await rest(`skills?owner_id=eq.${owner}`, { method: 'DELETE' })
    const after = (await (await rest(`chats?deal_id=eq.${dealId}&select=id`)).json()).map(c => c.id)
    const mine = after.filter(id => !chatsBefore.includes(id))
    for (const id of mine) await rest(`chats?id=eq.${id}`, { method: 'DELETE' })
    const leftSkills = (await (await rest(`skills?owner_id=eq.${owner}&select=id`)).json()).length
    const oldCounts = await (await rest(`chat_messages?chat_id=in.(${chatsBefore.join(',')})&created_at=gte.${encodeURIComponent(new Date(Date.now() - 900000).toISOString())}&select=id`)).json()
    check('cleanup: skills and test chats removed, earlier chats untouched', leftSkills === 0 && mine.length === 2 && oldCounts.length === 0, `${mine.length} chats removed, ${oldCounts.length} new msgs in old chats`)
  }
  check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
} finally {
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
