// The connections the agent may read. Each one is a PERMISSION: the agent can only read
// what Chris has switched on, and everything is off until he allows it. A connection
// that is off is never queried and never named as an origin.
//
// The agent can always search the public web for itself, so that is not a connection.
//
// Gong, HubSpot, Slack, Clay and Lemlist take uploaded or pasted material in this build
// (a transcript, a CSV export). Real OAuth connections go behind a security review
// later; the interface is the same, so swapping one in changes nothing Chris sees.

export const CONNECTORS = [
  { key: 'gong', label: 'Gong', blurb: 'Call transcripts', allows: 'read call transcripts', accepts: 'a transcript (paste, or a .txt / .vtt file)', docLabel: 'Call transcript' },
  { key: 'hubspot', label: 'HubSpot', blurb: 'CRM deal and contact records', allows: 'read CRM deal and contact records', accepts: 'a CSV export of the deal', docLabel: 'HubSpot export' },
  { key: 'slack', label: 'Slack', blurb: 'Internal threads', allows: 'read internal threads', accepts: 'a pasted thread or export', docLabel: 'Slack thread' },
  { key: 'clay', label: 'Clay', blurb: 'Company and contact enrichment', allows: 'read company and contact enrichment', accepts: 'a CSV export or pasted record', docLabel: 'Clay record' },
  { key: 'lemlist', label: 'Lemlist', blurb: 'Outreach campaigns and replies', allows: 'read outreach campaigns and replies', accepts: 'a CSV export or pasted replies', docLabel: 'Lemlist export' }
]

export const connectorByKey = Object.fromEntries(CONNECTORS.map(c => [c.key, c]))

export const defaultConnectors = () => Object.fromEntries(CONNECTORS.map(c => [c.key, false]))

// The connections that are on, as labels, in the order shown on the page.
export const enabledLabels = connectors => CONNECTORS.filter(c => connectors && connectors[c.key]).map(c => c.label)

// Connections are app-wide settings (what the agent may read), kept in this browser.
const KEY = 'casebuilder.connections'

export function loadConnections() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...defaultConnectors(), ...Object.fromEntries(Object.entries(raw).filter(([k, v]) => k in connectorByKey && typeof v === 'boolean')) }
  } catch {
    return defaultConnectors()
  }
}

export function saveConnections(connections) {
  try {
    localStorage.setItem(KEY, JSON.stringify(connections))
  } catch {
    // storage unavailable: the setting just will not persist this session
  }
}
