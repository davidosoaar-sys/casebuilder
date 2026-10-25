// Debug: what the website-finding step returned for a company name.
import fs from 'node:fs'
import os from 'node:os'
import Anthropic from '@anthropic-ai/sdk'
import { runWithSearch } from '../server/agentSearch.js'
import { agentPrompt } from '../server/agent-commands/index.js'
import { AGENT_COMMANDS } from '../src/agentCommands.js'

const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
Object.assign(process.env, envFile(`${os.homedir()}/.config/casebuilder/search.env`))
const client = new Anthropic({ apiKey: T.ANTHROPIC_API_KEY })
for (const company of process.argv.slice(2)) {
  const run = await runWithSearch({ client, model: 'claude-sonnet-5-5', maxTokens: 1200, maxSearches: 2, thinking: null, effort: null,
    system: agentPrompt(AGENT_COMMANDS.DISCOVER_BRAND), messages: [{ role: 'user', content: 'Company: ' + company }] })
  console.log('==', company, 'searches', run.searches)
  console.log('hosts:', [...new Set(run.evidence.map(e => e.host))].join(', '))
  console.log('text:', run.text.slice(0, 500))
}
