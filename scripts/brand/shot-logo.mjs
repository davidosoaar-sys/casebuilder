// Zoomed screenshots of the sidebar logo, expanded and collapsed, at 3x so a
// clipped edge is visible. Uses test2. Output: /tmp/logo-open.png, /tmp/logo-collapsed.png
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const readEnv = f => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const pw = readEnv(`${os.homedir()}/.config/casebuilder/accounts/test2@casebuilder.dev.env`).PASSWORD
const b = await puppeteer.launch({ headless: 'new' })
const p = await (await b.createBrowserContext()).newPage()
await p.setViewport({ width: 1280, height: 690, deviceScaleFactor: 3 })
await p.goto('http://localhost:5173', { waitUntil: 'networkidle2' })
await p.type('#auth-email', 'test2@casebuilder.dev'); await p.type('#auth-password', pw)
await p.click('button[type=submit]'); await p.waitForSelector('.sidebar-logo')
for (const state of ['open', 'collapsed']) {
  if (state === 'collapsed') { await p.click('.sidebar-collapse'); await new Promise(r => setTimeout(r, 400)) }
  const el = await p.$('.sidebar-logo')
  const box = await el.boundingBox()
  await p.screenshot({ path: `/tmp/logo-${state}.png`, clip: { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: box.height + 12 } })
  const m = await p.$eval('.app-logo-mark svg', s => { const r = s.getBoundingClientRect(), pr = s.closest('.sidebar').getBoundingClientRect(); return { w: r.width, h: r.height, insideSidebar: r.left >= pr.left && r.right <= pr.right } })
  console.log(state, JSON.stringify(m))
}
await p.click('.sidebar-collapse') // leave it expanded
await b.close()
