// Isolated connector UI fixture: no Supabase session, real accounts, or app storage.
import { build } from 'esbuild'
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import assert from 'node:assert/strict'
const bundled = await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Connections from './src/components/Connections.jsx'; import {defaultConnectors} from './src/connectors.js'; createRoot(document.getElementById('root')).render(<Connections connections={defaultConnectors()} documents={[]} onConnections={()=>{}} onDocuments={()=>{}} />);`, resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, write: false, format: 'iife', loader: { '.png': 'dataurl' }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' })
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setContent('<html><head></head><body><div id="root"></div></body></html>')
  const css = fs.readdirSync('dist/assets').find(f => /^index.*\.css$/.test(f))
  await page.addStyleTag({ content: fs.readFileSync('dist/assets/' + css, 'utf8') })
  await page.evaluate(() => {
    window.calls = []
    let connected = true
    window.fetch = async (url, options = {}) => {
      window.calls.push({ url, body: options.body })
      if (options.method === 'POST') { connected = false; return { ok: true, json: async () => ({ disconnected: true }) } }
      return { ok: true, json: async () => ({ configured: ['googlecalendar', 'gmail', 'slack'], connections: connected ? [{ toolkit: 'gmail', id: 'fake' }] : [] }) }
    }
  })
  await page.addScriptTag({ content: bundled.outputFiles[0].text })
  await page.waitForFunction(() => document.querySelector('[data-connector=gmail]')?.textContent.includes('Disconnect'))
  assert.match(await page.$eval('[data-connector=hubspot]', e => e.textContent), /upload or paste only/i)
  for (const [width, theme] of [[1280, 'light'], [1280, 'dark'], [390, 'light'], [390, 'dark']]) {
    await page.setViewport({ width, height: 900 })
    await page.evaluate(t => { document.documentElement.dataset.theme = t }, theme)
    await new Promise(resolve => setTimeout(resolve, 350))
    await page.screenshot({ path: `/tmp/composio-${width}-${theme}.png`, fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal overflow')
  }
  await page.click('[data-connector=gmail] .connector-live button')
  await page.waitForFunction(() => !document.querySelector('[data-connector=gmail]').textContent.includes('Disconnect'))
  assert.equal(await page.evaluate(() => JSON.parse(window.calls.find(c => c.body).body).action), 'disconnect')
  await page.evaluate(() => { window.fetch = async () => { throw new Error('Offline fixture') }; window.dispatchEvent(new Event('focus')) })
  await page.waitForFunction(() => [...document.querySelectorAll('[role=alert]')].some(e => e.textContent.includes('Offline fixture')))
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('[role=alert]')].some(e => /Offline fixture/.test(e.textContent))))
  assert.deepEqual(errors, [])
  console.log('PASS: connected, connect, disconnect, unconfigured, error/retry; desktop/light and mobile/dark; no overflow or page errors')
} finally { await browser.close() }
