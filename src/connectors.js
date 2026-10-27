// The connections the agent may read. Each one is a PERMISSION: the agent can only read
// what Chris has switched on, and everything is off until he allows it. A connection
// that is off is never queried and never named as an origin.
//
// The agent can always search the public web for itself, so that is not a connection.
//
// Live account authorization is verified by /api/connect; these switches govern uploads.

export const LIVE_TOOLKITS = ['googlecalendar', 'gmail', 'slack', 'hubspot']

export const CONNECTORS = [
  { key: 'googlecalendar', label: 'Google Calendar', blurb: 'Meetings and attendees for pre-meeting briefs', allows: 'read uploaded calendar notes', accepts: 'pasted meeting notes or a .txt export', docLabel: 'Calendar notes' },
  { key: 'gmail', label: 'Gmail', blurb: 'Customer email threads and follow-ups', allows: 'read uploaded or pasted Gmail email threads', accepts: 'a pasted email thread or a .txt / .pdf export', docLabel: 'Gmail thread' },
  { key: 'claude', label: 'Claude', blurb: 'Connect Claude to your saved CaseBuilder projects', allows: 'read Claude conversations and research notes', accepts: 'a pasted conversation or a .txt / .md export', docLabel: 'Claude conversation' },
  { key: 'gong', label: 'Gong', blurb: 'Call transcripts', allows: 'read call transcripts', accepts: 'a transcript (paste, or a .txt / .vtt file)', docLabel: 'Call transcript' },
  { key: 'hubspot', label: 'HubSpot', blurb: 'CRM deal and contact records', allows: 'read CRM deal and contact records', accepts: 'a CSV export of the deal', docLabel: 'HubSpot export' },
  { key: 'slack', label: 'Slack', blurb: 'Internal threads', allows: 'read internal threads', accepts: 'a pasted thread or export', docLabel: 'Slack thread' },
  { key: 'clay', label: 'Clay', blurb: 'Company and contact enrichment', allows: 'read company and contact enrichment', accepts: 'a CSV export or pasted record', docLabel: 'Clay record' },
  { key: 'lemlist', label: 'Lemlist', blurb: 'Outreach campaigns and replies', allows: 'read outreach campaigns and replies', accepts: 'a CSV export or pasted replies', docLabel: 'Lemlist export' },
  { key: 'granola', label: 'Granola', blurb: 'Meeting notes and call summaries', allows: 'read meeting notes and call summaries', accepts: 'pasted notes or an exported .md / .txt / .pdf', docLabel: 'Granola notes' },
  { key: 'sheets', label: 'Google Sheets', blurb: 'Finance models and forecasts', allows: 'read finance models and forecasts', accepts: 'a sheet downloaded as .xlsx or .csv', docLabel: 'Google Sheet' },
  { key: 'excel', label: 'Excel', blurb: 'Finance models and forecasts', allows: 'read finance models and forecasts', accepts: 'an .xlsx or .csv file', docLabel: 'Excel workbook' },
  { key: 'figma', label: 'Figma', blurb: 'Design specs and handoff notes', allows: 'read design specs and handoff notes', accepts: 'a design spec exported as .pdf, or pasted notes', docLabel: 'Figma export' },
  { key: 'canva', label: 'Canva', blurb: 'Decks and one-pagers', allows: 'read decks and one-pagers', accepts: 'a design downloaded as .pdf or .pptx', docLabel: 'Canva design' }
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
