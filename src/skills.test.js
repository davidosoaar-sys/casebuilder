import test from 'node:test'
import assert from 'node:assert/strict'
import { PREBUILT, librarySkills, skillMessage, skillRef, missingInput, settingsFor } from './skills.js'

test('four prebuilt skills, each with instructions and a mode', () => {
  assert.deepEqual(PREBUILT.map(s => s.key), ['pre_meeting_brief', 'account_news', 'stakeholder_map', 'objection_prep'])
  for (const s of PREBUILT) { assert.ok(s.instructions.length > 100); assert.ok(['chat', 'research'].includes(s.mode)) }
})

test('library: prebuilt on by default, a saved row switches off/configures, custom skills listed', () => {
  const lib = librarySkills([{ id: 'r1', prebuilt_key: 'account_news', enabled: false, settings: { days: '30' } }, { id: 'c1', prebuilt_key: null, name: 'Mine', description: '', instructions: 'Do it', enabled: true, settings: { mode: 'research' } }])
  assert.equal(lib.length, 5)
  const news = lib.find(s => s.key === 'account_news')
  assert.equal(news.enabled, false); assert.equal(news.settings.days, '30'); assert.equal(news.id, 'r1')
  assert.equal(lib.find(s => s.key === 'pre_meeting_brief').enabled, true)
  assert.equal(lib.find(s => s.id === 'c1').mode, 'research')
  assert.deepEqual(settingsFor(PREBUILT[0], { length: 'bogus' }), { length: 'short' })
})

test('using a skill: visible message, payload reference, required inputs', () => {
  const brief = librarySkills([]).find(s => s.key === 'pre_meeting_brief')
  assert.equal(missingInput(brief, {}).key, 'who')
  assert.equal(missingInput(brief, { who: 'Gustav' }), null)
  assert.equal(skillMessage(brief, { who: 'Gustav', when: '' }), 'Use skill: Pre-meeting brief\nWho are you meeting: Gustav')
  assert.deepEqual(skillRef(brief, { who: ' Gustav ', when: '' }), { skill_key: 'pre_meeting_brief', skill_inputs: { who: 'Gustav' } })
  assert.deepEqual(skillRef({ prebuilt: false, id: 'c1' }), { skill_id: 'c1' })
})
