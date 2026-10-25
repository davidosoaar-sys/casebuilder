// v0.15.0 keys: Settings lists four providers, a second key adds the "agent uses"
// switch, switching works, a wrong-prefix key is refused, the chat model picker
// names the active provider's models. TEST account; restores its keys at the end
// (removes the OpenRouter key it adds, sets Anthropic back as the one in use).
// Usage: node scripts/review-v0150-keys.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const out = '/tmp/cb-review'; fs.mkdirSync(out, { recursive: true })
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const FAKE_OR = 'sk-or-v1-' + 'cbtest'.repeat(8)

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('dialog', d => d.accept())
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
const openSettings = async () => { await page.click('.side-settings'); await page.waitForSelector('.settings-card-overlay'); await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {}) }
const rowFor = name => page.evaluateHandle(n => [...document.querySelectorAll('.key-row')].find(r => r.querySelector('.settings-label')?.innerText.startsWith(n)), name)

try {
  await openSettings()
  const labels = await page.$$eval('.key-row .settings-label', l => l.map(e => e.innerText))
  check('Settings lists all four providers', ['Anthropic', 'OpenAI', 'Google Gemini', 'OpenRouter'].every(n => labels.some(l => l.startsWith(n))), labels.join(' | '))
  const one = await page.$eval('.key-active', e => e.innerText).catch(() => '')
  check('with one key it says which provider the agent uses', /Anthropic/.test(one), one)

  // Wrong prefix is refused, by the database, with a readable message.
  let or = await rowFor('OpenRouter')
  await (await or.$('input[type=password]')).type('sk-proj-' + 'x'.repeat(40))
  await (await or.$('button[type=submit]')).click(); await sleep(1500)
  or = await rowFor('OpenRouter')
  const err = await or.evaluate(r => r.querySelector('.auth-error')?.innerText || '')
  check('an OpenAI-looking key in the OpenRouter box is refused', /sk-or-/.test(err), err)

  // Save a (fake) OpenRouter key: it becomes the one in use, and the switch appears.
  const input = await or.$('input[type=password]')
  await input.evaluate(i => { i.focus(); i.select() }); await page.keyboard.press('Backspace'); await input.type(FAKE_OR)
  await (await or.$('button[type=submit]')).click()
  await page.waitForSelector('[aria-label="Provider the agent uses"]', { timeout: 10000 }).catch(() => {})
  const sw = await page.$$eval('[aria-label="Provider the agent uses"] button', l => l.map(b => ({ t: b.innerText, on: b.getAttribute('aria-checked') === 'true' }))).catch(() => [])
  check('a second key shows the "agent uses" switch with both providers', sw.length === 2, sw.map(b => b.t + (b.on ? '*' : '')).join(', '))
  check('the key just saved is the one in use', sw.find(b => b.on)?.t === 'OpenRouter')
  await page.screenshot({ path: `${out}/v0150-1-settings-keys.png` })

  // The chat model picker names OpenRouter's models.
  await page.keyboard.press('Escape'); await sleep(300)
  const [projects] = await page.$$('xpath/.//button[contains(., "Projects")]'); await projects.click()
  await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
  await page.waitForSelector('#engineers', { timeout: 15000 })
  if (!(await page.$('.chat-split'))) await page.click('.chat-open')
  await page.waitForSelector('.mascot-model-btn', { timeout: 10000 }).catch(() => {})
  await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  const btn = await page.$eval('.mascot-model-btn', b => b.innerText).catch(() => '(no chat on this page)')
  check('chat model picker shows the active provider\'s model', /Claude (Sonnet|Haiku|Opus) 5\.5/.test(btn), btn.replace(/\n/g, ' '))

  // Switch back to Anthropic.
  await openSettings()
  await page.waitForSelector('[aria-label="Provider the agent uses"]', { timeout: 10000 })
  await page.evaluate(() => [...document.querySelectorAll('[aria-label="Provider the agent uses"] button')].find(b => b.innerText === 'Anthropic')?.click())
  await sleep(1500)
  const now = await page.$$eval('[aria-label="Provider the agent uses"] button', l => l.find(b => b.getAttribute('aria-checked') === 'true')?.innerText)
  check('switching the provider in Settings sticks', now === 'Anthropic', now)
} finally {
  // Restore: remove the fake OpenRouter key.
  if (!(await page.$('.settings-card-overlay'))) await openSettings().catch(() => {})
  await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  const or = await rowFor('OpenRouter')
  const rm = await or.evaluate(r => { const b = [...r.querySelectorAll('button')].find(b => b.innerText === 'Remove'); if (b) { b.click(); return true } return false }).catch(() => false)
  await sleep(2500)
  const left = await page.$$eval('.key-row', l => l.filter(r => /Saved/.test(r.innerText)).map(r => r.querySelector('.settings-label').innerText)).catch(() => [])
  check('cleanup: only the Anthropic key is left', rm && left.length === 1 && left[0].startsWith('Anthropic'), left.join(', '))
}
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
