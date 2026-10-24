// Builds the Claude plugin from the app's own source:
//   - bundles plugin-src/cli.mjs (+ the value model, deck model, exporters and
//     PowerPoint library) into one self-contained script,
//   - regenerates the reference docs from valueModel.js so they cannot drift,
//   - optionally zips the plugin for upload to Cowork / Claude desktop.
//
//   npm run build:plugin            build
//   npm run build:plugin -- --zip   build and write dist-plugin/casebuilder-plugin.zip

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const plugin = path.join(root, 'plugin')
const skill = path.join(plugin, 'skills/business-case')
const refs = path.join(skill, 'references')
const bundle = path.join(skill, 'scripts/casebuilder.mjs')

// 1. the value model's source, importable as text by the bundle (the website
//    export inlines it so the downloaded page can recompute live)
fs.mkdirSync(path.join(root, '.build'), { recursive: true })
fs.writeFileSync(
  path.join(root, '.build/valueModel.txt'),
  ['src/format.js', 'src/model.js', 'src/valueModel.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n')
)

// 2. the bundle
fs.mkdirSync(path.dirname(bundle), { recursive: true })
await build({
  entryPoints: [path.join(root, 'plugin-src/cli.mjs')],
  outfile: bundle,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  loader: { '.svg': 'text', '.txt': 'text', '.png': 'dataurl' },
  banner: { js: "#!/usr/bin/env node\nimport { createRequire as __cbRequire } from 'node:module';\nconst require = __cbRequire(import.meta.url);" },
  logLevel: 'warning',
  legalComments: 'none'
})
console.log(`bundle   ${path.relative(root, bundle)}  ${(fs.statSync(bundle).size / 1024 / 1024).toFixed(2)} MB`)

// 3. reference docs, generated from the model
const M = await import(pathToFileURL(path.join(root, 'src/valueModel.js')).href)
fs.mkdirSync(refs, { recursive: true })

const defaults = Object.fromEntries(M.INPUT_FIELDS.map(f => [f.key, f.value]))
const money = M.fmtMoney

const inputsMd = [
  '# Inputs',
  '',
  'Generated from the value model. Every key below can be set with `casebuilder.mjs set <file> key=value`.',
  'Numbers and percentages feed the model and count toward case confidence. "Starts as" is the status a new case begins with: **assumption** until the customer says the number on a call.',
  '',
  ...Object.entries(
    M.INPUT_FIELDS.reduce((g, f) => ((g[f.group] ||= []).push(f), g), {})
  ).flatMap(([group, items]) => [
    `## ${group}`,
    '',
    '| Key | What it is | Type | Default | Starts as |',
    '|---|---|---|---|---|',
    ...items.map(f => `| \`${f.key}\` | ${f.label}${f.help ? `. ${f.help}` : ''} | ${f.type}${f.unit ? ` (${f.unit})` : ''}${f.options ? `: ${f.options.join(' / ')}` : ''} | ${f.value} | ${f.confirmed ? 'confirmed' : 'assumption'} |`),
    ''
  ])
].join('\n')
fs.writeFileSync(path.join(refs, 'inputs.md'), inputsMd)

const Model = await import(pathToFileURL(path.join(root, 'src/model.js')).href)
const computed = Model.computeModel(defaults)
const modelMd = [
  '# The value model',
  '',
  'Every figure is plain arithmetic in `src/model.js`; nothing is generated. Normally run `casebuilder.mjs calc` instead and never do the arithmetic yourself. Each saving is a difference between a "today" input and a "with Portal" input.',
  '',
  '## Figures, in order, with the default inputs',
  '',
  '| Figure | Working | Value |',
  '|---|---|---|',
  ...Model.FIGURE_ORDER.map(k => `| \`${k}\` | ${computed.figures[k].equation} | ${computed.figures[k].value} |`),
  '',
  'Division by zero gives 0, every value figure is floored at 0, and no figure is ever NaN or Infinity.',
  '',
  '## Against self-hosting',
  '',
  'The comparison that decides most deals is Portal against self-hosting open-source Backstage, never Portal against doing nothing.',
  '',
  '## Case confidence',
  '',
  'The share of numeric and percent inputs (excluding the calendar) that are **confirmed**. An input is confirmed only when the customer said it. Everything else is an assumption and is listed on the deck\'s honesty page as a question for the next call.',
  '',
  '## Archetypes',
  '',
  ...Object.entries(M.ARCHETYPES).map(([k, a]) => `- **${k}**: stakeholders ${a.stakeholders.join(', ')}; leads with ${a.pillars[0]}. ${a.note} Likely alternative: ${a.alternative}.`),
  ''
].join('\n')
fs.writeFileSync(path.join(refs, 'value-model.md'), modelMd)

const stakeMd = [
  '# Stakeholders',
  '',
  'The same numbers are framed differently for each person who has to approve the deal. Their goals can conflict: a director wants productivity, the CTO wants spend cut, and you arrive with a tool that costs money.',
  '',
  '> The text below is starter copy. Replace it with the seller\'s own words where they have better ones: edit the stakeholder in the case file (`stakeholder add`) or in the app.',
  '',
  ...M.STAKEHOLDERS.flatMap(s => [
    `## ${s.role} (\`${s.key}\`)`,
    `- **Who:** ${s.tag}`,
    `- **Cares about:** ${s.cares}`,
    `- **Value drivers to lead with:** ${s.lead.join(', ')}`,
    `- **Headline with default inputs:** ${s.headline(computed)}`,
    `- **Needs to see:**`,
    ...s.needsToSee.map(n => `  - ${n}`),
    `- **Likely objection:** "${s.objection}"`,
    `- **Counter:** ${s.counter}`,
    ''
  ])
].join('\n')
fs.writeFileSync(path.join(refs, 'stakeholders.md'), stakeMd)

console.log(`refs     ${path.relative(root, refs)}  (inputs.md, value-model.md, stakeholders.md)`)

// 4. optional zip for Cowork / Claude desktop (Customize > Plugins > Upload).
//    Built in Node so entries use forward slashes on every OS (Windows
//    PowerShell's Compress-Archive writes backslashes that break elsewhere), and
//    so .claude-plugin/plugin.json sits at the archive root.
if (process.argv.includes('--zip')) {
  const { default: JSZip } = await import('jszip')
  const outDir = path.join(root, 'dist-plugin')
  fs.mkdirSync(outDir, { recursive: true })
  const zip = new JSZip()
  const walk = (dir, rel = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      const name = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(abs, name)
      else zip.file(name, fs.readFileSync(abs))
    }
  }
  walk(plugin)
  const out = path.join(outDir, 'casebuilder-plugin.zip')
  fs.writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }))
  console.log(`zip      ${path.relative(root, out)}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`)
}
