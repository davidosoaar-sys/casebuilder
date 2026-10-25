// Transport only: provider and search logic live behind server/personAgent.js.
import { AGENT_COMMANDS } from './agentCommands.js'
import { apiHeaders } from './apiAuth.js'
export async function* searchPerson(request, { signal, fetchImpl = fetch } = {}) {
  let code = ''
  try { code = localStorage.getItem('casebuilder.access') || '' } catch {}
  const response = await fetchImpl('/api/person', { method: 'POST', headers: await apiHeaders(code ? { 'x-access-code': code } : {}), body: JSON.stringify({...request,command:AGENT_COMMANDS.LOOKUP_PERSON}), signal })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Person lookup is unavailable (${response.status}).`)
  }
  if (!response.body) throw new Error('The lookup returned no stream.')
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let buffer = ''
  const unpack = line => {
    const event = JSON.parse(line)
    if (event.error || event.type === 'error') throw new Error(event.error || event.message || 'The lookup could not finish.')
    return event.person || event.data || event
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      let newline
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim(); buffer = buffer.slice(newline + 1)
        if (line) yield unpack(line)
      }
      if (done) break
    }
    if (buffer.trim()) yield unpack(buffer)
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
}
