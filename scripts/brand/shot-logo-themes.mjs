// Logo comparison sheet: the app's sidebar logo (dark + light theme) next to
// the landing site's nav wordmark. Uses test2. Output: /tmp/logo-sheet.png
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
await p.evaluate(() => document.fonts.ready)
const grab = async name => { const bx = await (await p.$('.sidebar-logo')).boundingBox(); await p.screenshot({ path: name, clip: { x: bx.x - 8, y: bx.y - 8, width: bx.width + 16, height: bx.height + 16 } }) }
const font = await p.$eval('.app-logo-word', e => { const cs = getComputedStyle(e); return `${cs.fontFamily.split(',')[0]} ${cs.fontWeight} loaded=${document.fonts.check(`600 20px Outfit`)}` })
const colors = await p.$eval('.app-logo-word', e => [getComputedStyle(e).color, getComputedStyle(e.querySelector('span')).color])
console.log('font', font, 'colors dark', JSON.stringify(colors))
await grab('/tmp/logo-dark.png')
const light = await p.$('button[aria-label^="Switch to light"]')
if (light) { await light.click(); await new Promise(r => setTimeout(r, 300)) }
console.log('colors light', JSON.stringify(await p.$eval('.app-logo-word', e => [getComputedStyle(e).color, getComputedStyle(e.querySelector('span')).color])))
await grab('/tmp/logo-light.png')
const dark = await p.$('button[aria-label^="Switch to dark"]'); if (dark) await dark.click()
await b.close()
