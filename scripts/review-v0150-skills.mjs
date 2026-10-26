// v0.15.0 Skill library. TEST account. Two real agent runs on the NEW worker code
// (VPS harness; caller stops the live worker for the run).
//   - Skills page: 4 built-in skills, switch one off, configure one
//   - "Use" Pre-meeting brief from the Skills page -> chat -> fill who -> brief
//   - New custom skill -> use it from the chat's "Use a skill" -> reply follows it
//   - A switched-off skill is not offered in the chat
//   - "Schedule" from the Skills page opens the Scheduled form with the skill
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

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('dialog', d => d.accept())
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const [projects] = await page.$$('xpath/.//button[contains(., "Projects")]'); await projects.click()
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('#engineers', { timeout: 15000 })
const nav = async label => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and contains(., "${label}")]`); await b.click() }
// v0.15.1: Skills and Scheduled are in the main menu (outside a project).
const mainMenu = async label => {
  if (await page.$('.project-sidebar-back')) { await page.click('.project-sidebar-back'); await page.waitForSelector('.project-card', { timeout: 15000 }) }
  await nav(label)
}
// "Use" / "Schedule" ask which project: pick the one the test opened.
const pickProject = async () => { await choose(page, '.skill-pick [role=combobox]', dealId); await page.click('.skill-pick button[type=submit]') }
const card = name => page.evaluateHandle(n => [...document.querySelectorAll('.skill-card')].find(c => c.querySelector('strong')?.innerText === n), name)
const clickIn = async (h, text) => h.evaluate((c, t) => [...c.querySelectorAll('button')].find(b => b.innerText === t).click(), text)
const dealId = await (async () => { await nav('Agent'); await page.waitForSelector('.chat-panel[data-deal]', { timeout: 15000 }); return page.$eval('.chat-panel[data-deal]', e => e.dataset.deal) })()
const chatsBefore = (await (await rest(`chats?deal_id=eq.${dealId}&select=id`)).json()).map(c => c.id)

try {
  const items = await page.$$eval('.sidebar-nav .side-item', l => l.map(e => e.innerText.trim()))
  check('inside a project, the menu has no Skills or Scheduled', !items.includes('Skills') && !items.includes('Scheduled'), items.join(' | '))
  await mainMenu('Skills'); await page.waitForSelector('.skills-page .skill-card', { timeout: 15000 })
  const main = await page.$$eval('.sidebar-nav .side-item', l => l.map(e => e.innerText.trim()))
  check('the main menu has Scheduled and Skills', main.includes('Skills') && main.includes('Scheduled'), main.join(' | '))
  const names = await page.$$eval('.skill-card strong', l => l.map(e => e.innerText))
  check('Skills page lists the 4 built-in skills', ['Pre-meeting brief', 'Account news digest', 'Stakeholder map', 'Objection prep'].every(n => names.includes(n)), names.join(' | '))

  // Configure Objection prep: 3 objections.
  let c = await card('Objection prep'); await clickIn(c, 'Configure')
  await choose(page, '.skill-config [role=combobox]', '3'); await sleep(1200)
  const cfg = (await (await rest(`skills?owner_id=eq.${owner}&deal_id=is.null&prebuilt_key=eq.objection_prep&select=settings`)).json())[0]
  check('configure saves the setting for this project', cfg?.settings?.count === '3', JSON.stringify(cfg?.settings))
  // Switch Stakeholder map off.
  c = await card('Stakeholder map'); await c.evaluate(x => x.querySelector('.pf-toggle input').click()); await sleep(1200)
  const off = (await (await rest(`skills?owner_id=eq.${owner}&deal_id=is.null&prebuilt_key=eq.stakeholder_map&select=enabled`)).json())[0]
  check('switching a skill off is saved', off?.enabled === false)

  // Custom skill.
  await page.click('.skills-page .page-head .primary'); await page.waitForSelector('.sched-form')
  await page.type('.sched-form input', `Haiku ${STAMP}`)
  await page.type('.sched-form textarea', 'Answer ONLY with a three-line haiku about this deal\'s company. No other text, no title.')
  await page.click('.sched-form button[type=submit]'); await page.waitForFunction(s => [...document.querySelectorAll('.skill-card strong')].some(e => e.innerText === s), { timeout: 10000 }, `Haiku ${STAMP}`)
  check('a custom skill is added under "Yours"', true)
  await page.screenshot({ path: `${out}/v0150-10-skills.png` })

  // Use Pre-meeting brief from the Skills page.
  c = await card('Pre-meeting brief'); await clickIn(c, 'Use')
  await pickProject()
  await page.waitForSelector('.chat-skillrun', { timeout: 15000 })
  check('"Use" opened the picked project\'s Agent', (await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)) === dealId)
  check('"Use" opens the Agent with the skill ready to fill in', /Pre-meeting brief/.test(await page.$eval('.chat-skillrun', e => e.innerText)))
  await sleep(800)
  check('"Use" starts a new chat (none open yet)', (await page.$$eval('.chat-full .chat-msg', l => l.length)) === 0)
  await page.click('.chat-skillrun button[type=submit]'); await sleep(400)
  check('a required detail is asked for, not sent empty', /Fill in "Who are you meeting\?"/.test(await page.$eval('.chat-error', e => e.innerText).catch(() => '')))
  await page.type('.chat-skillrun input', `Daniel Ek, CEO [${STAMP}]`)
  const since1 = new Date(Date.now() - 3000).toISOString()
  await page.click('.chat-skillrun button[type=submit]')
  const r1 = await runOnHarness(owner, since1)
  const firstChat = (await (await rest(`chats?deal_id=eq.${dealId}&select=id,title&order=created_at.desc&limit=1`)).json())[0]
  check('the skill run got its own new chat', firstChat && !chatsBefore.includes(firstChat.id) && /Pre-meeting brief/.test(firstChat.title), firstChat?.title)
  check('it ran as a research job carrying the skill (not its text)', r1?.job.kind === 'research' && r1.job.payload.skill_key === 'pre_meeting_brief' && !/In one line/.test(r1.job.payload.question || ''), `${r1?.job.kind} ${r1?.job.payload.skill_key} ${r1?.out}`)
  await page.waitForFunction(() => document.querySelector('.chat-full .chat-research .research-answer'), { timeout: 30000 }).catch(() => {})
  const brief = await page.$eval('.chat-full .chat-research', e => e.innerText).catch(() => '')
  check('the brief follows the skill (questions to ask, avoid) and names him', /Ek/.test(brief) && /question/i.test(brief) && /avoid/i.test(brief), brief.replace(/\n+/g, ' ').slice(0, 160))
  await page.screenshot({ path: `${out}/v0150-11-skill-brief.png` })

  // Custom skill from the chat's "Use a skill" menu, in a new chat.
  await page.click('.chat-rail-new'); await sleep(300)
  await page.click('.chat-skill-btn'); await page.waitForSelector('.chat-skill-pop')
  const offered = await page.$$eval('.chat-skill-opt strong', l => l.map(e => e.innerText))
  check('a switched-off skill is not offered in the chat', !offered.includes('Stakeholder map') && offered.includes(`Haiku ${STAMP}`), offered.join(' | '))
  await page.evaluate(s => [...document.querySelectorAll('.chat-skill-opt')].find(b => b.innerText.startsWith(s)).click(), `Haiku ${STAMP}`)
  const since2 = new Date(Date.now() - 3000).toISOString()
  await page.click('.chat-skillrun button[type=submit]')
  const r2 = await runOnHarness(owner, since2)
  check('the custom skill ran as an agent job with its id', r2?.job.kind === 'chat' && !!r2.job.payload.skill_id, r2?.out)
  await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-assistant .chat-bubble:not(.chat-typing)').length > 0, { timeout: 30000 }).catch(() => {})
  const haiku = await page.$$eval('.chat-full .chat-assistant .chat-bubble', l => l.at(-1)?.innerText || '')
  const lines = haiku.trim().split('\n').filter(Boolean)
  check('the reply follows the custom instructions (a 3-line haiku)', lines.length === 3, JSON.stringify(haiku.slice(0, 120)))

  // Schedule from the Skills page.
  await mainMenu('Skills'); await page.waitForSelector('.skill-card', { timeout: 10000 })
  c = await card('Account news digest'); await clickIn(c, 'Schedule')
  await pickProject()
  await page.waitForSelector('.scheduled-page .sched-form', { timeout: 10000 })
  await page.waitForFunction(() => document.querySelector('.sched-form [role=combobox][aria-label="Skill"]')?.dataset.value === 'k:account_news', { timeout: 10000 }).catch(() => {})
  const pick = await page.$eval('.sched-form [role=combobox][aria-label="Skill"]', s => s.dataset.value).catch(() => '')
  const proj = await page.$eval('.sched-form [role=combobox][aria-label="Project"]', s => s.dataset.value).catch(() => '')
  check('"Schedule" opens the Scheduled form with the skill and project picked', pick === 'k:account_news' && proj === dealId, `${pick} ${proj === dealId}`)
  await page.click('.sched-form .ghost')
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
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
