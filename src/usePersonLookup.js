import { useEffect, useRef, useState } from 'react'
import { searchPerson } from './personAgent.js'
import { stubSearchPerson } from './personAgentStub.js'
import { parsePersonList, sanitizePerson } from './personLookup.js'
import { CONNECTORS } from './connectors.js'

const cache = new Map()
const fingerprint = value => JSON.stringify(value)
export default function usePersonLookup({ project, connections }) {
  const [query, setQuery] = useState('')
  const [demo, setDemo] = useState(false)
  const [results, setResults] = useState([])
  const [contextAtSearch, setContextAtSearch] = useState('')
  const jobs = useRef(new Map()), generation = useRef(0)
  const enabledSources = ['web', ...CONNECTORS.filter(c => connections?.[c.key]).map(c => c.key)]
  const documents = (project?.documents || []).filter(d => enabledSources.includes(d.source))
  const dealContext = project ? Object.fromEntries(project.fields.filter(f => ['archetype', 'strategicPriority'].includes(f.key)).map(f => [f.key, f.value])) : {}
  const context = fingerprint({ id: project?.id, company: project?.name || '', enabledSources, documents, dealContext })
  const stop = () => { generation.current++; jobs.current.forEach(c => c.abort()); jobs.current.clear() }
  useEffect(() => {
    stop()
    // A connector change or deal switch invalidates visible findings too.
    setResults([])
    return stop
  }, [context]) // eslint-disable-line react-hooks/exhaustive-deps

  async function lookup(request, index, run, isDemo) {
    const controller = new AbortController()
    jobs.current.get(index)?.abort()
    jobs.current.set(index, controller)
    const timer = setTimeout(() => controller.abort('timeout'), 55000)
    const key = fingerprint({ context, request, isDemo })
    const patch = value => { if (generation.current === run && jobs.current.get(index) === controller) setResults(list => list.map((r, i) => i === index ? { ...r, ...value } : r)) }
    if (cache.has(key)) { clearTimeout(timer); patch({ person: cache.get(key), status: 'done', cached: true }); jobs.current.delete(index); return }
    let snapshot = {}, found = false
    try {
      for await (const update of (isDemo ? stubSearchPerson : searchPerson)({ ...request, enabledSources, documents, dealContext }, { signal: controller.signal })) {
        if (generation.current !== run || controller.signal.aborted) return
        snapshot = { ...snapshot, ...update }
        const person = sanitizePerson(snapshot, enabledSources)
        found = !!person.name || person.candidates.length > 0
        patch({ person, status: 'searching' })
      }
      if (controller.signal.aborted) throw new Error('The agent took too long. Try again; the deal has not changed.')
      if (!found) throw new Error('No sourced match found. Try a company name, email or LinkedIn URL.')
      const person = sanitizePerson(snapshot, enabledSources)
      cache.set(key, person)
      // Bound a session cache without storing personal research on disk.
      if (cache.size > 100) cache.delete(cache.keys().next().value)
      patch({ person, status: 'done' })
    } catch (e) {
      if (generation.current === run) patch({ status: 'error', error: controller.signal.aborted ? 'The agent took too long. Try again; the deal has not changed.' : e.message || 'The agent is unreachable. Try again.' })
    } finally { clearTimeout(timer); if (jobs.current.get(index) === controller) jobs.current.delete(index) }
  }
  function run() {
    const requests = parsePersonList(query, project?.name || '')
    if (!requests.length) return
    stop()
    const run = generation.current
    setContextAtSearch(context)
    setResults(requests.map(request => ({ request, status: 'queued', person: null })))
    // Three concurrent lookups keep late invite lists responsive without an
    // unbounded burst of requests. Each result streams independently.
    let cursor = 0
    const worker = async () => { while (cursor < requests.length && generation.current === run) { const i = cursor++; await lookup(requests[i], i, run, demo) } }
    for (let i = 0; i < Math.min(3, requests.length); i++) void worker()
  }
  function choose(index, candidate) {
    const request = { name: candidate.name.value, company: candidate.company?.value || project?.name || '', candidateUrl: candidate.name.sourceUrl }
    setResults(list => list.map((r, i) => i === index ? { request, status: 'searching', person: null } : r))
    void lookup(request, index, generation.current, demo)
  }
  return { query, setQuery, demo, setDemo, results: contextAtSearch === context ? results : [], run, choose, busy: contextAtSearch === context && results.some(r => ['searching', 'queued'].includes(r.status)) }
}
