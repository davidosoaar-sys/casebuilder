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
  ['src/format.js', 'src/model.js', 'src/source.js', 'src/valueModel.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n')
)

fs.mkdirSync(refs, { recursive: true })
fs.copyFileSync(path.join(root,"assets/fonts/Poppins-OFL.txt"),path.join(refs,"Poppins-OFL.txt"))

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
fs.copyFileSync(path.join(root,'node_modules/@resvg/resvg-wasm/index_bg.wasm'),path.join(path.dirname(bundle),'resvg.wasm'))
await build({entryPoints:[path.join(root,'plugin-src/discover-assets.mjs')],outfile:path.join(plugin,'scripts/discover-assets.mjs'),bundle:true,platform:'node',format:'esm',target:'node18',loader:{'.svg':'text'},logLevel:'warning'})

// The framework planner and evidence validator use the app's source permission
// and title-mapping helpers, bundled so the distributed plugin stays portable.
await build({entryPoints:[path.join(root,'plugin-src/workflow.mjs')],outfile:path.join(plugin,'scripts/workflow.mjs'),bundle:true,platform:'node',format:'esm',target:'node18',logLevel:'warning'})
const designRefs=path.join(plugin,'skills/case-deliverables/references')
fs.mkdirSync(designRefs,{recursive:true})
for(const [source,name] of [['docs/agents/design-case.md','design-case.md'],['docs/agents/one-pager.md','one-pager.md'],['docs/design-reference-study.md','design-reference-study.md'],['docs/agents/design-plan.schema.json','design-plan.schema.json']]){
  let contents=fs.readFileSync(path.join(root,source),'utf8').replace(/\r\n/g,'\n')
  contents=contents.replaceAll('../design-reference-study.md','design-reference-study.md').replaceAll('agents/design-case.md','design-case.md')
  fs.writeFileSync(path.join(designRefs,name),contents)
}

// 3. reference docs, generated from the model
const M = await import(pathToFileURL(path.join(root, 'src/valueModel.js')).href)
fs.mkdirSync(refs, { recursive: true })

const defaults = M.DEMO_VALUES
const money = M.fmtMoney

const inputsMd = [
  '# Inputs',
  '',
  'Generated from the value model. Every key below can be set with `casebuilder.mjs set <file> key=value`.',
  'Numeric inputs start empty. Example numbers are illustrative only and are never inserted into a new case. Calendar constants are structural. Source state distinguishes verified inputs, assumptions, suggestions and empty fields.',
  '',
  ...Object.entries(
    M.INPUT_FIELDS.reduce((g, f) => ((g[f.group] ||= []).push(f), g), {})
  ).flatMap(([group, items]) => [
    `## ${group}`,
    '',
    '| Key | What it is | Type | Initial value | Example only |',
    '|---|---|---|---|---|',
    ...items.map(f => `| \`${f.key}\` | ${f.label}${f.help ? `. ${f.help}` : ''} | ${f.type}${f.unit ? ` (${f.unit})` : ''}${f.options ? `: ${f.options.join(' / ')}` : ''} | ${f.value===''?'empty':f.value} | ${defaults[f.key]??''} |`),
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
  '## Figures, in order, with illustrative inputs (not the initial case state)',
  '',
  '| Figure | Working | Value |',
  '|---|---|---|',
  ...Model.FIGURE_ORDER.map(k => `| \`${k}\` | ${computed.figures[k].equation} | ${computed.figures[k].value} |`),
  '',
  'Completeness and zero/negative handling come from the canonical model. Do not present an incomplete figure as zero. Preserve signed net/cost differences; do not recompute figures in the agent.',
  '',
  '## Against self-hosting',
  '',
  'The comparison that decides most deals is Portal against self-hosting open-source Backstage, never Portal against doing nothing.',
  '',
  '## Case confidence',
  '',
  'Internal confidence is the share of active numeric inputs supported as inputs, excluding calendar constants. Keep confidence and source metadata out of client outputs. Review incomplete or unconfirmed fields as internal follow-up questions.',
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
    `- **Headline with illustrative inputs:** ${s.headline(computed)}`,
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
