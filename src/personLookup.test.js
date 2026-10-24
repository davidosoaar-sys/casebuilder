import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizePerson, matchPersonRole, parsePersonList, addPersonToDeal, acceptPersonInput } from './personLookup.js'
import { searchPerson } from './personAgent.js'
import { stubSearchPerson } from './personAgentStub.js'
import { newProject } from './projects.js'
import { resolveStakeholder } from './deck/stakeholders.js'
import { buildEnv, resolveSlides } from './deck/model.js'
import { stakeholdersForArchetype } from './valueModel.js'

const sourceUrl = 'https://example.com/person'
const claim = value => ({ value, sourceUrl, sourceType: 'web' })
const identity = { name: claim('Alex Doe'), title: claim('CISO'), company: claim('Acme') }

test('adding a person creates a named stakeholder and the existing deck framing', () => {
  const deal = newProject('Acme', {})
  deal.stakeholders = deal.stakeholders.filter(s => s.key !== 'security')
  const person = sanitizePerson(identity)
  const next = addPersonToDeal(deal, person)
  assert.equal(next.stakeholders.length, deal.stakeholders.length + 1)
  const added = next.stakeholders.find(s => s.key === 'security')
  assert.equal(added.namedPeople[0].name, 'Alex Doe')
  assert.equal(added.namedPeople[0].mapping.state, 'inferred')
  assert.equal(added.namedPeople[0].mapping.sourceUrl, sourceUrl)
  assert.equal(next.people.security[0].title, 'CISO')
  const framing = resolveStakeholder(added)
  assert.ok(framing.needsToSee.length)
  assert.ok(framing.objection)
  assert.ok(framing.counter)
  const fields = next.fields
  const env = buildEnv(Object.fromEntries(fields.map(f => [f.key, f.value])), fields, framing)
  const slides = JSON.stringify(resolveSlides(next.deck, env))
  assert.ok(slides.includes(framing.objection))
  assert.equal(slides.includes('Inferred from title'), false)
  assert.equal(slides.includes(sourceUrl), false)
  assert.deepEqual(next.fields, deal.fields)
  assert.equal(addPersonToDeal(next, person), next)
  assert.ok(stakeholdersForArchetype(next.stakeholders, 'Fast / AI-native').some(s => s.key === 'security' && s.namedPeople.length))
})

test('represented roles are reused, unknown titles always get a low confidence framing', () => {
  const person = sanitizePerson({ ...identity, title: claim('Chief Possibility Architect'), roleMatch: { role: 'CTO', confidence: 'high', why: 'Trust me' } })
  assert.equal(person.roleMatch.confidence, 'low')
  assert.match(person.roleMatch.why, /guess|unclear|confirm/i)
  const deal = newProject('Acme', {})
  const next = addPersonToDeal(deal, person)
  assert.equal(next.stakeholders.length, deal.stakeholders.length)
  assert.equal(next.people.cto.length, 1)
  assert.equal(matchPersonRole('Wombat Wrangler').confidence, 'low')
})

test('unsupported and disabled-source claims are dropped before rendering', () => {
  const p = sanitizePerson({ ...identity, tenure: 'Three years', reportsTo: { value: 'CTO' }, reports: [claim('A'), { value: 'Invented' }], likelyCares: 'Guess', publicSignals: [{ claim: 'Unsupported' }], title: { value: 'VP', sourceUrl: 'https://acme.slack.com/thread', sourceType: 'web' } }, ['web'])
  assert.equal(p.tenure, null)
  assert.equal(p.reportsTo, null)
  assert.equal(p.title, null)
  assert.equal(p.roleMatch, null)
  assert.equal(p.likelyCares, null)
  assert.equal(p.publicSignals.length, 0)
  assert.equal(p.reports.length, 1)
  assert.ok(p.sourcesSkipped.some(s => s.source === 'slack' && s.reason === 'disabled'))
  assert.equal(sanitizePerson({ name: { value: 'X', sourceUrl: 'javascript:alert(1)' } }).name, null)
})

test('a no-deal lookup still returns a sourced brief and cannot write', async () => {
  const snapshots = []
  for await (const p of stubSearchPerson({ name: 'Alex', enabledSources: ['web'] })) snapshots.push(sanitizePerson(p))
  assert.equal(snapshots.length, 2)
  assert.equal(snapshots[0].name.value, 'Alex')
  assert.ok(snapshots[0].name && snapshots[0].title && snapshots[0].roleMatch)
  assert.equal(snapshots[0].publicSignals.length, 0)
  assert.equal(snapshots[1].publicSignals.length, 1)
  assert.equal(addPersonToDeal(null, snapshots[1]), null)
})

test('ambiguous identities cannot be added before candidate selection', () => {
  const deal = newProject('Acme', {})
  const p = sanitizePerson({ ...identity, candidates: [identity, { ...identity, name: claim('Alex Smith') }] })
  assert.equal(p.candidates.length, 2)
  assert.equal(addPersonToDeal(deal, p), deal)
})

test('batch input understands company overrides, email and LinkedIn without discarding the query', () => {
  const query = 'Alex Doe\nSam at Beta;Lee, Gamma\nPat <pat@example.com>\nhttps://www.linkedin.com/in/jo'
  const requests = parsePersonList(query, 'Acme')
  assert.equal(requests.length, 5)
  assert.equal(requests[0].company, 'Acme')
  assert.equal(requests[1].company, 'Beta')
  assert.equal(requests[2].company, 'Gamma')
  assert.equal(requests[3].email, 'pat@example.com')
  assert.equal(requests[4].linkedinUrl, 'https://www.linkedin.com/in/jo')
})

test('numeric inputs stay unchanged until separately accepted and retain the source link', () => {
  const deal = newProject('Acme', {})
  const p = sanitizePerson({ ...identity, suggestedInputs: [{ key: 'engineers', value: 450, sourceUrl, sourceType: 'web' }, { key: 'hourlyCost', value: 100 }, { key: 'invented', value: 900, sourceUrl, sourceType: 'web' }] })
  assert.equal(p.suggestedInputs.length, 1)
  const added = addPersonToDeal(deal, p)
  assert.deepEqual(added.fields, deal.fields)
  const accepted = acceptPersonInput(added, p.suggestedInputs[0])
  const field = accepted.fields.find(f => f.key === 'engineers')
  assert.equal(field.value, 450)
  assert.equal(field.source.state, 'suggestion')
  assert.equal(field.source.link, sourceUrl)
})

test('transport yields identity before later stream chunks and forwards permission keys', async () => {
  const enc = new TextEncoder()
  let push, sent
  const body = new ReadableStream({ start(controller) { push = controller } })
  const stream = searchPerson({ name: 'Alex', enabledSources: ['web'] }, { fetchImpl: async (_url, options) => { sent = JSON.parse(options.body); return { ok: true, body } } })
  const first = stream.next()
  push.enqueue(enc.encode(JSON.stringify(identity) + '\n'))
  assert.deepEqual((await first).value, identity)
  assert.deepEqual(sent.enabledSources, ['web'])
  push.enqueue(enc.encode(JSON.stringify({ ...identity, publicSignals: [{ claim: 'A talk', sourceUrl }] }) + '\n')); push.close()
  assert.equal((await stream.next()).value.publicSignals.length, 1)
  assert.equal((await stream.next()).done, true)
})
