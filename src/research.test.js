import test from 'node:test'
import assert from 'node:assert/strict'
import { parseInline, parseMarkdown, researchTitle, startResearch, isRunning, extractSources } from './research.js'

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

test('extractSources lifts a Sources list out of a chat reply and keeps its numbers', () => {
  const reply = 'Ek and Lorentzon founded Spotify in 2006. [1][2]\n\n- Wikipedia gives 23 April 2006. [1]\n\nSources:\n[1] https://en.wikipedia.org/wiki/Spotify\n[2] Britannica: https://www.britannica.com/money/Spotify\n[4] https://en.wikipedia.org/wiki/Daniel_Ek\n\nI haven\'t changed any inputs.'
  const { text, sources } = extractSources(reply)
  assert.deepEqual(sources.map(s => [s.n, s.url, s.title]), [
    [1, 'https://en.wikipedia.org/wiki/Spotify', ''],
    [2, 'https://www.britannica.com/money/Spotify', 'Britannica'],
    [4, 'https://en.wikipedia.org/wiki/Daniel_Ek', '']
  ])
  assert.ok(!/https?:/.test(text), 'no raw URL left')
  assert.ok(!/Sources:/.test(text), 'the emptied heading is dropped')
  assert.match(text, /in 2006\. \[1\]\[2\]/)
  assert.match(text, /I haven't changed any inputs\.$/)
})

test('extractSources turns bare URLs into citations, reusing listed numbers', () => {
  const { text, sources } = extractSources('See https://backstage.io/docs, and (https://en.wikipedia.org/wiki/Foo_(bar)). Again https://backstage.io/docs.\n\n[3] https://spotify.com - Spotify')
  assert.deepEqual(sources.map(s => [s.n, s.url, s.title]), [
    [3, 'https://spotify.com', 'Spotify'],
    [4, 'https://backstage.io/docs', ''],
    [5, 'https://en.wikipedia.org/wiki/Foo_(bar)', '']
  ])
  assert.equal(text, 'See [4], and ([5]). Again [4].')
})

test('extractSources leaves markdown links, numbered prose and plain text alone', () => {
  const md = 'Read [the docs](https://backstage.io).\n\n1. Talk to the VP\n2. Then https://x.com/a\n\nNo links here.'
  const { text, sources } = extractSources(md)
  assert.match(text, /\[the docs\]\(https:\/\/backstage\.io\)/)
  assert.match(text, /1\. Talk to the VP\n2\. Then \[1\]/)
  assert.deepEqual(sources, [{ n: 1, url: 'https://x.com/a', title: '' }])
  assert.deepEqual(extractSources('Just text.'), { text: 'Just text.', sources: [] })
  assert.deepEqual(extractSources(''), { text: '', sources: [] })
})

test('extractSources reads numbered lists only under a Sources heading', () => {
  const { text, sources } = extractSources('Answer.\n\n**Sources**\n1. [Spotify newsroom](https://newsroom.spotify.com)\n2. https://backstage.io\n\nDone.')
  assert.deepEqual(sources.map(s => [s.n, s.title]), [[1, 'Spotify newsroom'], [2, '']])
  assert.equal(text, 'Answer.\n\nDone.')
})
