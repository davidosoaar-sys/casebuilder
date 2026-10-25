import fs from 'node:fs'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
Object.assign(process.env, envFile('.env.server.local'))
const { findPublicPhoto, photoOnPage } = await import('../server/publicProfile.js')
const { searchBackendOrNull } = await import('../server/agentSearch.js')
const { fetchPublic } = await import('../server/publicWeb.js')
const [name, company] = process.argv.slice(2)
const s = searchBackendOrNull()
const res = await s.search(`"${name}" ${company}`, { count: 10 })
for (const r of res) {
  let note = ''
  try {
    const p = await fetchPublic(r.url, { limit: 1500000 }); const h = p.buffer.toString('utf8'); const l = h.toLowerCase()
    note = `${p.type.split(';')[0]} co:${l.includes(company.toLowerCase())} who:${l.includes(name.toLowerCase())} img:${photoOnPage(h, name).slice(0, 80)}`
  } catch (e) { note = 'FAIL ' + String(e.message).slice(0, 60) }
  console.log(r.url.slice(0, 90), '|', note)
}
const p = await findPublicPhoto({ name, company })
console.log('RESULT', p ? p.imageUrl + ' from ' + p.sourceUrl : 'none')
