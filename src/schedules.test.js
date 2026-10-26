import test from 'node:test'
import assert from 'node:assert/strict'
import { parseEvery, everyInterval, everyError, describeEvery, fmtWhen, defaultFirstRun, scheduleError, nextAt, fmtClock } from './schedules.js'

test('nextAt: the next matching local time, never now or earlier', () => {
  const mon10 = new Date(2026, 9, 26, 10, 0) // Monday, 26 Oct 2026, 10:00 AM
  const at = d => [d.getFullYear(), d.getMonth(), d.getDate(), d.getDay(), d.getHours(), d.getMinutes()]
  // Daily: later today if the time is still ahead, else tomorrow.
  assert.deepEqual(at(nextAt({ hour: 16 }, mon10)), [2026, 9, 26, 1, 16, 0])
  assert.deepEqual(at(nextAt({ hour: 8 }, mon10)), [2026, 9, 27, 2, 8, 0])
  assert.deepEqual(at(nextAt({ hour: 10, minute: 0 }, mon10)), [2026, 9, 27, 2, 10, 0])
  assert.deepEqual(at(nextAt({ hour: 10, minute: 30 }, mon10)), [2026, 9, 26, 1, 10, 30])
  // Weekly: the same weekday counts only if the time is still ahead.
  assert.deepEqual(at(nextAt({ weekday: 1, hour: 9 }, mon10)), [2026, 10, 2, 1, 9, 0])
  assert.deepEqual(at(nextAt({ weekday: 1, hour: 11 }, mon10)), [2026, 9, 26, 1, 11, 0])
  assert.deepEqual(at(nextAt({ weekday: 5, hour: 16 }, mon10)), [2026, 9, 30, 5, 16, 0])
  assert.deepEqual(at(nextAt({ weekday: 0, hour: 9 }, mon10)), [2026, 10, 1, 0, 9, 0])
  // Across a month end, from a Saturday night.
  assert.deepEqual(at(nextAt({ weekday: 1, hour: 9 }, new Date(2026, 9, 31, 23, 59))), [2026, 10, 2, 1, 9, 0])
  for (const spec of [{ hour: 0 }, { hour: 23, minute: 59 }, { weekday: 3, hour: 12 }]) assert.ok(nextAt(spec, mon10) > mon10)
})

test('fmtClock: 12-hour times', () => {
  assert.equal(fmtClock(9), '9:00 AM')
  assert.equal(fmtClock(16, 0), '4:00 PM')
  assert.equal(fmtClock(0, 5), '12:05 AM')
  assert.equal(fmtClock(12, 30), '12:30 PM')
})

test('intervals round-trip through the text Postgres returns', () => {
  assert.deepEqual(parseEvery('1 day'), { n: 1, unit: 'days' })
  assert.deepEqual(parseEvery('7 days'), { n: 1, unit: 'weeks' })
  assert.deepEqual(parseEvery('14 days'), { n: 2, unit: 'weeks' })
  assert.deepEqual(parseEvery('03:00:00'), { n: 3, unit: 'hours' })
  assert.deepEqual(parseEvery('1 day 02:00:00'), { n: 26, unit: 'hours' })
  assert.deepEqual(parseEvery('24:00:00'), { n: 1, unit: 'days' })
  for (const v of [{ n: 3, unit: 'hours' }, { n: 2, unit: 'days' }, { n: 2, unit: 'weeks' }]) {
    const pg = { '3 hours': '03:00:00', '2 days': '2 days', '14 days': '14 days' }[everyInterval(v)]
    assert.deepEqual(parseEvery(pg), v)
  }
})

test('describe and validate', () => {
  assert.equal(describeEvery('1 day'), 'Every day')
  assert.equal(describeEvery('7 days'), 'Every week')
  assert.equal(describeEvery('06:00:00'), 'Every 6 hours')
  assert.equal(everyError({ n: 0, unit: 'days' }), 'Repeat at least once per period.')
  assert.equal(everyError({ n: 5, unit: 'weeks' }), 'The longest gap is 31 days.')
  assert.equal(everyError({ n: 4, unit: 'weeks' }), '')
})

test('when: today / tomorrow / dates, 12-hour clock', () => {
  const now = new Date(2026, 9, 26, 10, 0)
  assert.equal(fmtWhen(new Date(2026, 9, 26, 15, 30).toISOString(), now), 'Today, 3:30 PM')
  assert.equal(fmtWhen(new Date(2026, 9, 27, 9, 0).toISOString(), now), 'Tomorrow, 9:00 AM')
  assert.match(fmtWhen(new Date(2026, 9, 30, 9, 0).toISOString(), now), /Oct 30, 9:00 AM$/)
  const d = defaultFirstRun(now)
  assert.deepEqual([d.getDate(), d.getHours(), d.getMinutes()], [27, 9, 0])
})

test('database errors read as plain sentences', () => {
  assert.match(scheduleError('schedule_limit: at most 20'), /20 scheduled tasks/)
  assert.match(scheduleError('schedule_past: x'), /future/)
})
