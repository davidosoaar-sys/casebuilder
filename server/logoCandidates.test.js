import test from 'node:test'
import assert from 'node:assert/strict'
import {logoCandidates} from './brand.js'
test('Amazon home identity rejects Join Prime and unlabeled promotion graphics',()=>{
 const html='<a href="/" aria-label="Amazon home"><img src="/join-prime-logo.png" alt="Join Prime"><img src="/unknown-tile.png"><img src="/amazon-logo.svg" alt="Amazon"></a><img src="/amazon-logo-join-prime.png" alt="Amazon logo">'
 const found=logoCandidates(html,'https://www.amazon.com/','Amazon')
 assert.ok(found.some(c=>c.url.endsWith('/amazon-logo.svg')))
 assert.ok(found.every(c=>!c.url?.includes('prime')&&!c.url?.includes('unknown-tile')))
})
test('promotion-only discovery returns no logo instead of a plausible wrong asset',()=>{
 assert.deepEqual(logoCandidates('<a href="/" aria-label="Amazon home"><img src="/join-prime.png" alt="Join Prime"></a>','https://www.amazon.com/','Amazon'),[])
})
