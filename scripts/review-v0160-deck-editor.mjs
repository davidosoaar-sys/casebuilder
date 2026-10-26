// v0.16.0: review the slide editor (Case artifacts > Edit slides) and undo/redo, read-only.
// TEST account; every database write is blocked, so nothing here is saved.
// Usage: node scripts/review-v0160-deck-editor.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-deck-editor'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const BEFORE_BUTTONS = 153 // `.deck button` on the 6-page test deck before the redesign (shoot-v0160-deck-editor.mjs)

let failed = 0
const check = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`) }
const errors = []

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('pageerror', e => errors.push(e.message))
let blocked = 0
await page.setRequestInterception(true)
// Every rpc the app calls writes (save_deal saves the project), so those are blocked too.
page.on('request', r => { const m = r.method(); if (/supabase\.co\/rest/.test(r.url()) && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(m)) { blocked++; return r.abort() } r.continue() })
const shot = name => page.screenshot({ path: `${out}/${name}.png` })
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
async function chord(keys) { for (const k of keys) await page.keyboard.down(k); for (const k of [...keys].reverse()) await page.keyboard.up(k); await sleep(450) }
const blur = () => page.evaluate(() => document.activeElement?.blur?.())
const pageIds = () => page.$$eval('.deck .slide-wrap[data-slide]', els => els.map(e => e.dataset.slide))
const railIds = () => page.$$eval('.rail-thumb[data-slide]', els => els.map(e => e.dataset.slide))
const blockIds = () => page.$$eval('.deck .block[data-block]', els => els.map(e => e.dataset.block))
const toastText = () => page.$eval('.toast', e => e.innerText).catch(() => '')

await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const nav = async l => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and normalize-space(.)="${l}"]`); await b.click(); await sleep(1200) }
await nav('Projects'); await page.waitForSelector('.project-card'); const cards = await page.$$('.project-card'); await cards[cards.length - 1].click(); await sleep(1500)
await nav('Case artifacts'); await sleep(1200)
const [edit] = await page.$$('xpath/.//button[contains(., "Edit slides")]'); if (edit) { await edit.click(); await sleep(1500) }
await page.waitForSelector('.page-rail .rail-thumb', { timeout: 10000 })
await shot('01-editor')

// 1. the rail shows one thumbnail per page
const ids0 = await pageIds()
const N = ids0.length
check(N >= 3, 'the deck has at least 3 pages to work with', `${N}`)
check((await railIds()).join() === ids0.join(), 'the rail shows N thumbnails = N pages, in order', `${(await railIds()).length} vs ${N}`)

// 2. permanent per-page buttons are gone
const after = await page.$$eval('.deck button', els => els.length)
const perPage = await page.$$eval('.deck .slide-wrap', ws => ws.map(w => w.querySelectorAll('.slide-head button').length))
check(after < BEFORE_BUTTONS / 3, 'far fewer buttons on the pages', `before ${BEFORE_BUTTONS}, after ${after}`)
check(perPage.every(n => n === 1), 'each page header has exactly one control (the "..." menu)', perPage.join(','))
check(!(await page.$('.slide-color-control, .slide-bar-tools, .add-block')), 'no colour swatches, arrow rows or "+ Add block" on the pages')
const label2 = await page.$eval(`.slide-wrap[data-slide="${ids0[1]}"] .slide-head`, e => e.innerText)
check(!label2.includes('·'), 'page labels have no middle dot', JSON.stringify(label2))
const hiddenNote = await page.$eval('.page-hidden-note', e => e.innerText).catch(() => '')
if (hiddenNote) check(/^Hidden from the client until \d+ inputs? (is|are) filled in\./.test(hiddenNote) && hiddenNote.length < 140, 'hidden pages say it in one short line', JSON.stringify(hiddenNote))

// 3. delete page 2 from its menu: N-1 pages and a toast with Undo; Undo brings the same page back
const p2 = ids0[1]
await page.hover(`.slide-wrap[data-slide="${p2}"] .slide-head`); await sleep(200)
await page.click(`.slide-wrap[data-slide="${p2}"] .page-more`); await sleep(300)
await shot('02-page-menu')
const [del] = await page.$$('xpath/.//div[contains(@class,"sched-menu")]//button[normalize-space(.)="Delete page"]')
await del.click(); await sleep(600)
check((await pageIds()).length === N - 1, 'deleting page 2 leaves N-1 pages', `${(await pageIds()).length}`)
check((await railIds()).length === N - 1, 'the rail follows', `${(await railIds()).length}`)
const t1 = await toastText()
check(/Page deleted/.test(t1) && /Undo/.test(t1), 'a "Page deleted" toast with Undo', JSON.stringify(t1))
const tip = await page.$eval('.deck-top .undo-btn', e => e.getAttribute('title'))
check(tip === 'Undo: deleted page 2', 'the undo button names the step', JSON.stringify(tip))
check(await page.$eval('.toaster', e => e.getAttribute('role')) === 'status', 'the toast is role=status')
await shot('03-page-deleted-toast')
const [undoBtn] = await page.$$('xpath/.//div[contains(@class,"toast")]//button[normalize-space(.)="Undo"]')
await undoBtn.click(); await sleep(600)
const ids1 = await pageIds()
check(ids1.length === N, 'Undo in the toast restores N pages', `${ids1.length}`)
check(ids1[1] === p2, 'page 2 is the same page as before (same id)')

// 4. delete a block, Cmd+Z restores it, Cmd+Shift+Z deletes it again
async function selectBlock(id) {
  await page.$eval(`.block[data-block="${id}"]`, e => e.scrollIntoView({ block: 'center' })); await sleep(250)
  const box = await (await page.$(`.block[data-block="${id}"]`)).boundingBox()
  // a tall block's top can sit under the sticky toolbar: click its first visible part
  const top = Math.max(box.y, await page.$eval('.deck-top', e => e.getBoundingClientRect().bottom + 8))
  const at = [box.x + Math.min(30, box.width / 2), top + Math.min(12, (box.y + box.height - top) / 2)]
  selectBlock.hit = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? `${e.tagName}.${e.className}` : '' }, at)
  await page.mouse.click(...at); await sleep(300)
  selectBlock.active = await page.evaluate(() => `${document.activeElement?.tagName}.${document.activeElement?.className}`)
  // clicking text opens it for editing; Escape closes the box and keeps the block selected
  if (await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA')) { await page.keyboard.press('Escape'); await sleep(200) }
}
const blocks0 = await blockIds()
const target = await page.$eval('.deck .slide-wrap:first-child .block:is(.block-logo,.block-divider,.block-stats,.block-text)', e => e.dataset.block)
await selectBlock(target)
check(!!(await page.$(`.block[data-block="${target}"].block-selected`)), 'clicking a block selects it')
await shot('04-block-selected')
const [delBlock] = await page.$$('xpath/.//div[contains(@class,"block-bar-tools")]//button[normalize-space(.)="Delete"]')
await delBlock.click(); await sleep(500)
check((await blockIds()).length === blocks0.length - 1 && !(await blockIds()).includes(target), 'Delete in the block bar removes the block')
check(/Block deleted/.test(await toastText()), 'a "Block deleted" toast', JSON.stringify(await toastText()))
await blur()
await chord([mod, 'z'])
check((await blockIds()).includes(target) && (await blockIds()).length === blocks0.length, 'Cmd+Z restores the deleted block')
await chord([mod, 'Shift', 'z'])
check(!(await blockIds()).includes(target), 'Cmd+Shift+Z deletes it again (redo)')
await chord([mod, 'z'])
check((await blockIds()).includes(target), 'Cmd+Z brings it back again')

// 5. Cmd+Z inside a text box is the text box's own undo, not the app's
const textBlock = await page.$eval('.deck .block-text .editable', e => e.closest('.block').dataset.block)
await page.$eval(`.block[data-block="${textBlock}"] .editable`, e => e.scrollIntoView({ block: 'center' })); await sleep(200)
await page.click(`.block[data-block="${textBlock}"] .editable`); await sleep(300)
check(await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA'), 'clicking text opens it for editing')
const pagesBefore = (await pageIds()).join()
const blocksBefore = (await blockIds()).join()
const textBefore = await page.$eval('.deck textarea', e => e.value)
await page.keyboard.type('Q'); await sleep(1300)
await page.evaluate(() => document.querySelector('.toaster .toast-x')?.click()); await sleep(250)
await chord([mod, 'z'])
const t2 = await toastText()
check(!/Undone/.test(t2), 'Cmd+Z in a focused text box does not trigger the app undo', JSON.stringify(t2))
check(await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA'), 'focus stays in the text box')
check((await pageIds()).join() === pagesBefore && (await blockIds()).join() === blocksBefore, 'the deck structure is untouched')
// (Headless Chrome does not run its own undo for Cmd+Z, so the "Q" stays in the box.)
await page.keyboard.press('Escape'); await sleep(300)
await blur()
await chord([mod, 'z'])
const textNow = await page.$eval(`.block[data-block="${textBlock}"] .editable`, e => e.innerText)
const restored = await page.evaluate(() => document.querySelector('.toast')?.innerText || '')
check(!/Q$/.test(textNow.trim()) && /Undone: edited text on page \d+/.test(restored), 'outside the box, Cmd+Z undoes the typing as one step', JSON.stringify({ textBefore, textNow, restored }))

// 6. drag a thumbnail to reorder; Cmd+Z restores the order
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300)
const order0 = await railIds()
const a = await (await page.$(`.rail-thumb[data-slide="${order0[0]}"]`)).boundingBox()
const c = await (await page.$(`.rail-thumb[data-slide="${order0[2]}"]`)).boundingBox()
await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
await page.mouse.down()
for (let i = 1; i <= 16; i++) { await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + ((c.y + c.height * 0.75 - a.y - a.height / 2) * i) / 16); await sleep(30) }
await shot('05-rail-dragging')
await page.mouse.up(); await sleep(900)
const order1 = await railIds()
check(order1.join() !== order0.join() && order1.indexOf(order0[0]) > 0, 'dragging thumbnail 1 down reorders the pages', `${order0.indexOf(order1[0]) + 1} now first`)
check((await pageIds()).join() === order1.join(), 'the canvas follows the rail order')
check(/Page moved/.test(await toastText()), 'a "Page moved" toast', JSON.stringify(await toastText()))
await shot('06-rail-reordered')
await blur()
await chord([mod, 'z'])
check((await railIds()).join() === order0.join(), 'Cmd+Z restores the page order')

// 7. Alt+Down on a focused thumbnail moves it; Cmd+Z puts it back
await page.focus(`.rail-thumb[data-slide="${order0[0]}"]`)
await chord(['Alt', 'ArrowDown'])
check((await railIds())[1] === order0[0], 'Alt+Down on a focused thumbnail moves the page down')
await blur(); await chord([mod, 'z'])
check((await railIds()).join() === order0.join(), 'and Cmd+Z puts it back')

// 8. block tools never cover their block's content
// blocks a person can click (an empty text block can render with no height)
const sample = (await page.$$eval('.deck .block[data-block]', els => els.filter(e => e.getBoundingClientRect().height >= 8).map(e => e.dataset.block))).slice(0, 12)
const overlaps = []
for (const id of sample) {
  await selectBlock(id)
  const r = await page.evaluate(bid => {
    const rect = el => el && el.getBoundingClientRect()
    const content = rect(document.querySelector(`.block[data-block="${bid}"] .block-content`))
    const tools = [...document.querySelectorAll('.block-bar-tools, .block-bar-tools .bar-btn, .deck .block-handle')].map(rect)
    const hit = t => t && content && t.width && t.height && t.left < content.right && t.right > content.left && t.top < content.bottom && t.bottom > content.top
    const el = document.querySelector(`.block[data-block="${bid}"]`)
    return { selected: !!document.querySelector(`.block[data-block="${bid}"].block-selected`), bar: !!document.querySelector('.block-bar-tools'), hits: tools.filter(hit).length, cls: el.className, text: el.innerText.slice(0, 40) }
  }, id)
  if (!r.selected || !r.bar || r.hits) { overlaps.push({ id, ...r, hit: selectBlock.hit, active: selectBlock.active }); await shot(`fail-${id}`) }
}
check(overlaps.length === 0, `no block toolbar overlaps its block's content (${sample.length} blocks measured)`, JSON.stringify(overlaps))
await shot('07-block-bar')

// 9. Escape deselects
await page.keyboard.press('Escape'); await sleep(250)
check(!(await page.$('.block-selected')) && !(await page.$('.block-bar-tools')), 'Escape deselects the block')

// 10. the "+" line between blocks opens a searchable block menu
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300)
const two = await page.$$eval('.deck .slide-wrap:first-child .block', els => els.slice(0, 2).map(e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, x: r.left + 40 } }))
if (two.length === 2) {
  await page.mouse.move(two[0].x, (two[0].bottom + two[1].top) / 2); await sleep(250)
  const plus = await page.$('.insert-plus')
  check(!!plus, 'hovering between blocks shows the "+" line')
  if (plus) {
    await plus.click(); await sleep(300)
    await page.keyboard.type('quo'); await sleep(200)
    const items = await page.$$eval('.block-pop .pick-item', els => els.map(e => e.innerText))
    check(items.length === 1 && items[0] === 'Quote', 'typing filters the block menu', JSON.stringify(items))
    await shot('08-block-picker')
    await page.keyboard.press('Escape')
    check(await page.waitForSelector('.block-pop', { hidden: true, timeout: 2000 }).then(() => true, () => false), 'Escape closes the block menu')
  }
}

// 10b. "/" in an empty text box opens the same block menu
const slashBlock = await page.$eval('.deck .block-text .editable', e => e.closest('.block').dataset.block)
await page.$eval(`.block[data-block="${slashBlock}"] .editable`, e => e.scrollIntoView({ block: 'center' })); await sleep(200)
await page.click(`.block[data-block="${slashBlock}"] .editable`); await sleep(300)
await page.$eval('.deck textarea', el => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })) }); await sleep(200)
await page.keyboard.press('/'); await sleep(400)
check(!!(await page.$('.block-pop .pick-search input')), '"/" in an empty text box opens the block menu')
await shot('08b-slash-menu')
await page.keyboard.press('Escape'); await page.waitForSelector('.block-pop', { hidden: true, timeout: 2000 }).catch(() => {})
await blur(); await page.keyboard.press('Escape'); await sleep(200)
await chord([mod, 'z'])

// 11. colour from the page menu: brand swatches and a custom colour, not only a native picker
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200)
const first = (await pageIds())[0]
await page.click(`.slide-wrap[data-slide="${first}"] .page-more`); await sleep(250)
const [colourItem] = await page.$$('xpath/.//div[contains(@class,"sched-menu")]//button[normalize-space(.)="Page colour"]')
await colourItem.click(); await sleep(350)
const swatches = await page.$$eval('.color-pop .swatch', els => els.length)
check(swatches >= 3 && !!(await page.$('.color-pop .color-hex')), 'Page colour opens brand swatches plus a custom colour field', `${swatches} swatches`)
await shot('09-page-colour')
await page.keyboard.press('Escape'); await sleep(200)

// 12. light theme and a phone width (screenshots; no sideways scrolling on the phone)
await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; window.scrollTo(0, 0) }); await sleep(300)
await selectBlock((await blockIds())[1])
await shot('10-light-selected')
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
await page.keyboard.press('Escape')
await page.setViewport({ width: 390, height: 844 }); await sleep(600)
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200)
await shot('11-phone')
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
check(overflow <= 0, 'no sideways scrolling at 390px', `${overflow}px`)

check(errors.length === 0, 'no page errors', errors.join(' | '))
console.log(`buttons on the pages: before ${BEFORE_BUTTONS}, after ${after}`)
console.log(`blocked ${blocked} database writes; screenshots in ${out}`)
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
await browser.close()
process.exit(failed ? 1 : 0)
