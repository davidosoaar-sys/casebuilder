import test from 'node:test'
import assert from 'node:assert/strict'
import { parseInline, parseMarkdown, researchTitle, startResearch, isRunning } from './research.js'

test('inline: bold, code, links and citations, no raw HTML', () => {
  const out = parseInline('Spotify runs **Backstage** `v1.56` [1, 2] see [docs](https://backstage.io) <b>x</b>')
  assert.deepEqual(out.filter(x => x.t === 'cite').map(x => x.n), [1, 2])
  assert.ok(out.some(x => x.t === 'b' && x.v === 'Backstage'))
  assert.ok(out.some(x => x.t === 'code' && x.v === 'v1.56'))
  assert.ok(out.some(x => x.t === 'link' && x.href === 'https://backstage.io'))
  // HTML stays text: the component renders it as a string, never as markup.
  assert.ok(out.some(x => x.t === 'text' && x.v.includes('<b>x</b>')))
})

test('inline: javascript: links are not links', () => {
  assert.ok(!parseInline('[x](javascript:alert(1))').some(x => x.t === 'link'))
})

test('blocks: headings, paragraphs and both list kinds', () => {
  const b = parseMarkdown('Direct answer [1].\n\n## Detail\n- one\n- two\n\n1. first\n2. second\nTail line')
  assert.deepEqual(b.map(x => x.type), ['p', 'h', 'ul', 'ol', 'p'])
  assert.deepEqual(b[2].items, ['one', 'two'])
  assert.equal(b[1].level, 2)
})

test('history titles are trimmed', () => {
  assert.equal(researchTitle({ payload: { question: '  a   b ' } }), 'a b')
  assert.ok(researchTitle({ payload: { question: 'x'.repeat(200) } }).length <= 79)
  assert.equal(researchTitle({}), 'Untitled research')
})

test('start research enqueues a research job with the question and optional project', async () => {
  let inserted
  const client = { from: () => ({ insert: row => { inserted = row; return { select: () => ({ single: async () => ({ data: { id: 'j1', ...row, status: 'queued' }, error: null }) }) } } }) }
  const job = await startResearch(client, { userId: 'u1', question: '  Who leads platform?  ', dealId: 'd1' })
  assert.deepEqual(inserted, { owner_id: 'u1', deal_id: 'd1', kind: 'research', payload: { question: 'Who leads platform?' } })
  assert.ok(isRunning(job))
  await startResearch(client, { userId: 'u1', question: 'q' })
  assert.equal(inserted.deal_id, null)
  await assert.rejects(startResearch(client, { userId: 'u1', question: '   ' }), /question/)
})
