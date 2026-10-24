import fs from 'node:fs'
import puppeteer from 'puppeteer'
const C = fs.readFileSync('src/assets/casebuilder-mark.svg', 'utf8')
const B = fs.readFileSync('src/assets/backstage-logo.svg', 'utf8').replace('viewBox="0 0 2079.95 456.05"', 'viewBox="-10 0 360 456"').replace(/fill:#7df3e1/, 'fill:currentColor')
const row = h => `<div style="display:flex;gap:48px;align-items:center;margin:18px 0"><div style="height:${h}px">${B.replace('<svg ', `<svg height="${h}" `)}</div><div style="height:${h}px">${C.replace('<svg ', `<svg height="${h}" `)}</div></div>`
const b = await puppeteer.launch({ headless: 'new' }); const p = await b.newPage()
await p.setViewport({ width: 520, height: 470 })
await p.setContent(`<body style="margin:0;padding:20px 30px;background:#181818;color:#7df3e1;--logo-bg:#181818;font:13px Helvetica">B (Backstage) vs C (ours)${row(240)}${row(48)}${row(26)}</body>`)
await p.screenshot({ path: '/tmp/mark-compare.png' }); await b.close()
