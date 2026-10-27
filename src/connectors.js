// The connections the agent may read. Each one is a PERMISSION: the agent can only read
// what Chris has switched on, and everything is off until he allows it. A connection
// that is off is never queried and never named as an origin.
//
// The agent can always search the public web for itself, so that is not a connection.
//
// Live account authorization is verified by /api/connect; these switches govern uploads.

// Composio toolkit slugs that can be connected as live accounts. A card's `toolkit`
// is its Composio slug when that differs from its key (Sheets keeps its old key so
// existing per-project upload permissions still apply).
export const LIVE_TOOLKITS = ['googlecalendar', 'gmail', 'slack', 'hubspot', 'gong', 'googlesheets', 'excel', 'googledrive', 'figma', 'canva', 'fireflies', 'clay', 'lemlist']

// Toolkits whose Composio auth is the user's own API key, entered on Composio's hosted
// Connect page (never in CaseBuilder).
export const KEY_AUTH_TOOLKITS = ['fireflies', 'clay', 'lemlist']

export const CONNECTOR_GROUPS = ['Calls & meetings', 'Email & chat', 'CRM & enrichment', 'Finance & files', 'Design']

export const CONNECTORS = [
  { key: 'googlecalendar', group: 'Calls & meetings', label: 'Google Calendar', blurb: 'Meetings and attendees for pre-meeting briefs', allows: 'read uploaded calendar notes', accepts: 'pasted meeting notes or a .txt export', docLabel: 'Calendar notes' },
  { key: 'gmail', group: 'Email & chat', label: 'Gmail', blurb: 'Customer email threads and follow-ups', allows: 'read uploaded or pasted Gmail email threads', accepts: 'a pasted email thread or a .txt / .pdf export', docLabel: 'Gmail thread' },
  { key: 'claude', label: 'Claude', blurb: 'Connect Claude to your saved CaseBuilder projects', allows: 'read Claude conversations and research notes', accepts: 'a pasted conversation or a .txt / .md export', docLabel: 'Claude conversation' },
  { key: 'gong', group: 'Calls & meetings', label: 'Gong', blurb: 'Call transcripts with the customer', allows: 'read call transcripts', accepts: 'a transcript (paste, or a .txt / .vtt file)', docLabel: 'Call transcript' },
  { key: 'hubspot', group: 'CRM & enrichment', label: 'HubSpot', blurb: 'CRM deal and contact records', allows: 'read CRM deal and contact records', accepts: 'a CSV export of the deal', docLabel: 'HubSpot export' },
  { key: 'slack', group: 'Email & chat', label: 'Slack', blurb: 'Internal threads', allows: 'read internal threads', accepts: 'a pasted thread or export', docLabel: 'Slack thread' },
  { key: 'clay', group: 'CRM & enrichment', label: 'Clay', blurb: 'Company and contact enrichment', allows: 'read company and contact enrichment', accepts: 'a CSV export or pasted record', docLabel: 'Clay record' },
  { key: 'lemlist', group: 'CRM & enrichment', label: 'Lemlist', blurb: 'Outreach companies, notes and replies', allows: 'read outreach campaigns and replies', accepts: 'a CSV export or pasted replies', docLabel: 'Lemlist export' },
  { key: 'granola', group: 'Calls & meetings', label: 'Granola', blurb: 'Meeting notes and call summaries', allows: 'read meeting notes and call summaries', accepts: 'pasted notes or an exported .md / .txt / .pdf', docLabel: 'Granola notes', note: 'Granola has no live connection here. Paste or upload notes, or push them from Claude through the Claude connector.' },
  { key: 'sheets', toolkit: 'googlesheets', group: 'Finance & files', label: 'Google Sheets', blurb: 'Finance models and forecasts', allows: 'read finance models and forecasts', accepts: 'a sheet downloaded as .xlsx or .csv', docLabel: 'Google Sheet' },
  { key: 'excel', group: 'Finance & files', label: 'Excel', blurb: 'Finance models and forecasts in OneDrive', allows: 'read finance models and forecasts', accepts: 'an .xlsx or .csv file', docLabel: 'Excel workbook' },
  { key: 'figma', group: 'Design', label: 'Figma', blurb: 'File details and comments from a linked design', allows: 'read design specs and handoff notes', accepts: 'a design spec exported as .pdf, or pasted notes', docLabel: 'Figma export' },
  { key: 'canva', group: 'Design', label: 'Canva', blurb: 'Decks and one-pagers (titles and links)', allows: 'read decks and one-pagers', accepts: 'a design downloaded as .pdf or .pptx', docLabel: 'Canva design' },
  { key: 'fireflies', group: 'Calls & meetings', label: 'Fireflies', blurb: 'Meeting transcripts and summaries', allows: 'read meeting transcripts', accepts: 'a transcript (paste, or a .txt / .vtt file)', docLabel: 'Fireflies transcript' },
  { key: 'googledrive', group: 'Finance & files', label: 'Google Drive', blurb: 'Docs and sheets named for the customer', allows: 'read Drive documents and spreadsheets', accepts: 'a downloaded .pdf, .docx, .xlsx or .csv', docLabel: 'Drive file' }
]

// The Composio toolkit behind a card, or null when it has no live connection.
export const toolkitOf = c => (LIVE_TOOLKITS.includes(c.toolkit || c.key) ? c.toolkit || c.key : null)

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
