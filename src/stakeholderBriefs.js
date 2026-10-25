// Stakeholder briefs: a synthesis of what this project's material says about ONE
// stakeholder (where they stand, what they care about, decisions, open asks and
// their own words), written by the account's agent. Not a copy of transcripts.
// Briefs are stakeholder_brief jobs; the newest one per stakeholder is shown.

export const BRIEF_SELECT = 'id, deal_id, payload, status, result, error, created_at, updated_at'

export async function latestBriefs(client, dealId) {
  const { data, error } = await client.from('jobs').select(BRIEF_SELECT)
    .eq('deal_id', dealId).eq('kind', 'stakeholder_brief')
    .order('created_at', { ascending: false }).limit(60)
  if (error) throw error
  const out = {}
  for (const j of data || []) {
    const k = j.payload?.role_key
    if (k && !out[k]) out[k] = j
  }
  return out
}

export async function getBrief(client, id) {
  const { data, error } = await client.from('jobs').select(BRIEF_SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function startBrief(client, { userId, dealId, stakeholder }) {
  const payload = {
    role_key: stakeholder.key,
    role: stakeholder.role,
    people: (stakeholder.namedPeople || []).map(p => p.name).filter(Boolean).slice(0, 6)
  }
  const { data, error } = await client.from('jobs')
    .insert({ owner_id: userId, deal_id: dealId, kind: 'stakeholder_brief', payload }).select(BRIEF_SELECT).single()
  if (error) throw new Error(/rate|limit/i.test(error.message) ? 'Too many requests just now. Wait a minute and try again.' : /foreign key|row-level/i.test(error.message) ? 'This project has not finished saving yet. Try again in a second.' : error.message)
  return data
}

export const briefRunning = j => !!j && (j.status === 'queued' || j.status === 'running')

// Requirement chips, in the words Ali used for the Live room.
export const ASK_STATUS = {
  done: 'Actioned',
  in_progress: 'In progress',
  waiting: 'Waiting for approval',
  open: 'Open'
}

export const STANCE = {
  champion: 'Champion',
  supportive: 'Supportive',
  neutral: 'Neutral',
  skeptical: 'Skeptical',
  blocker: 'Blocker',
  unknown: 'Not clear yet'
}

// What the brief will read, so the empty state can say it before running.
export function briefSources(project, fileCount = 0) {
  const on = Object.entries(project?.connectors || {}).filter(([, v]) => v).map(([k]) => k)
  const docs = (project?.documents || []).filter(d => on.includes(d.source) && d.text).length
  return { files: fileCount, connectorDocs: docs }
}
