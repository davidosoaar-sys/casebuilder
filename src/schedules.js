// Scheduled tasks: helpers shared by the Scheduled screen. The table, the
// per-minute runner (pg_cron) and the 20-per-account cap live in the database
// (migrations 0001, 0002, 0011).

export const SCHEDULE_LIMIT = 20
export const MAX_PROMPT = 2000

// Postgres hands an interval back as text ("1 day", "7 days", "03:00:00",
// "1 day 02:00:00"). We only ever write whole hours or whole days.
export function parseEvery(text) {
  const s = String(text || '')
  const days = Number((s.match(/(\d+)\s+days?/) || [])[1] || 0)
  const hms = s.match(/(\d+):(\d+):(\d+)/)
  const hours = hms ? Number(hms[1]) : Number((s.match(/(\d+)\s+hours?/) || [])[1] || 0)
  const total = days * 24 + hours
  if (total && total % 24 === 0) {
    const d = total / 24
    return d % 7 === 0 ? { n: d / 7, unit: 'weeks' } : { n: d, unit: 'days' }
  }
  return { n: total || 1, unit: 'hours' }
}

export function everyInterval({ n, unit }) {
  const k = Math.max(1, Math.floor(Number(n) || 1))
  if (unit === 'weeks') return `${k * 7} days`
  if (unit === 'days') return `${k} days`
  return `${k} hours`
}

// The database allows 1 hour to 31 days.
export function everyError({ n, unit }) {
  const k = Math.floor(Number(n))
  if (!k || k < 1) return 'Repeat at least once per period.'
  const hours = unit === 'weeks' ? k * 168 : unit === 'days' ? k * 24 : k
  if (hours > 31 * 24) return 'The longest gap is 31 days.'
  return ''
}

export function describeEvery(text) {
  const { n, unit } = parseEvery(text)
  const one = { hours: 'hour', days: 'day', weeks: 'week' }[unit]
  return n === 1 ? `Every ${one}` : `Every ${n} ${unit}`
}

// <input type="datetime-local"> value for a Date, in the browser's zone.
export function toLocalInput(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Tomorrow at 9:00 AM local: a sensible first run.
export function defaultFirstRun(now = new Date()) {
  const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0)
  return d
}

// The next local time at hour:minute after `now`, on `weekday` (0 = Sunday)
// if given. Templates use it for their first run.
export function nextAt({ weekday, hour, minute = 0 }, now = new Date()) {
  const d = new Date(now); d.setHours(hour, minute, 0, 0)
  if (weekday == null) { if (d <= now) d.setDate(d.getDate() + 1); return d }
  let ahead = (weekday - d.getDay() + 7) % 7
  if (ahead === 0 && d <= now) ahead = 7
  d.setDate(d.getDate() + ahead)
  return d
}

// "9:00 AM" for an hour and minute, without a date.
export function fmtClock(hour, minute = 0) {
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}

export function fmtWhen(iso, now = new Date()) {
  if (!iso) return ''
  const d = new Date(iso)
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
  const day = new Date(d); day.setHours(0, 0, 0, 0)
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const diff = Math.round((day - today) / 86400000)
  if (diff === 0) return `Today, ${time}`
  if (diff === 1) return `Tomorrow, ${time}`
  if (diff === -1) return `Yesterday, ${time}`
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`
}

export function scheduleError(message = '') {
  if (/schedule_limit/.test(message)) return `You already have ${SCHEDULE_LIMIT} scheduled tasks, the most an account can have. Delete one first.`
  if (/schedule_past/.test(message)) return 'The first run has to be in the future.'
  if (/check constraint/.test(message)) return 'Check the name and how often it repeats (1 hour to 31 days).'
  return message
}
