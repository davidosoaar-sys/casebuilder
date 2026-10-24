// Internal views only. These render the existing deterministic model; they do
// not change equations, inputs, or anything in the client deck/export pipeline.
import { computeModel, FIGURE_ORDER } from './model.js'
import { DRIVERS, confidence, fmtMoneyFull, fmtDec, fmtMonths } from './valueModel.js'
import { stateOf, isBlank } from './source.js'
import { resolveStakeholder } from './deck/stakeholders.js'

export const EXPRESSIONS = {
  platformEngineers: 'engineers * platformShare / 100',
  hoursSavedPerEngPerWeek: 'searchHoursToday - searchHoursPortal',
  productivityValue: 'max(0, searchHoursToday - searchHoursPortal) * engineers * weeksPerYear * hourlyCost',
  rampDaysSaved: 'rampDaysToday - rampDaysPortal',
  onboardingValue: 'max(0, rampDaysToday - rampDaysPortal) * newHiresPerYear * hoursPerDay * hourlyCost',
  incidentHoursSaved: 'max(0, incidentHoursToday - incidentHoursPortal) * peoplePerIncident * incidentsPerMonth * 12',
  incidentValue: 'incidentHoursSaved * hourlyCost',
  auditDaysSaved: 'auditPrepDaysToday - auditPrepDaysPortal',
  standardsValue: 'max(0, auditPrepDaysToday - auditPrepDaysPortal) * auditsPerYear * peoplePerAudit * hoursPerDay * hourlyCost',
  maintHoursSaved: 'platformEngineers * max(0, maintPctToday - maintPctPortal) / 100 * hoursPerYear',
  platformValue: 'maintHoursSaved * hourlyCost',
  toolingValue: 'toolSpendToday - toolSpendPortal',
  totalValue: 'sum of computable driver values',
  netValue: 'totalValue - portalCost',
  paybackMonths: 'portalCost / (totalValue / 12)',
  roiMultiple: 'totalValue / portalCost',
  fiveYearValue: 'netValue * 5',
  selfHostCost: 'selfHostEngineers * selfHostSalary',
  versusSelfHost: 'selfHostCost - portalCost'
}
const LABELS = {
  platformEngineers: 'Platform engineers', hoursSavedPerEngPerWeek: 'Hours saved per engineer per week',
  rampDaysSaved: 'Onboarding days saved', incidentHoursSaved: 'Incident hours saved per year',
  auditDaysSaved: 'Audit preparation days saved', maintHoursSaved: 'Platform maintenance hours saved per year',
  totalValue: 'Total annual value', netValue: 'Net year one', paybackMonths: 'Payback',
  roiMultiple: 'Return on spend', fiveYearValue: 'Five-year net', selfHostCost: 'Self-hosting cost', versusSelfHost: 'Portal versus self-hosting difference',
  ...Object.fromEntries(DRIVERS.map(d => [d.figure, d.label]))
}
const MONEY = new Set([...DRIVERS.map(d => d.figure), 'totalValue', 'netValue', 'fiveYearValue', 'selfHostCost', 'versusSelfHost'])
const rawValue = new Set(['netValue', 'fiveYearValue', 'versusSelfHost'])
export function showInput(f) {
  if (isBlank(f.value)) return 'Not entered'
  if (typeof f.value !== 'number') return String(f.value)
  const n = fmtDec(f.value, 2)
  if (f.type === 'percent') return `${n}%`
  if (f.unit?.startsWith('$')) return `${fmtMoneyFull(f.value)}${f.unit === '$/hr' ? '/hr' : f.unit === '$/yr' ? '/yr' : ''}`
  return `${n}${f.unit ? ` ${f.unit}` : ''}`
}
export function sourceText(source = {}) {
  return [source.origin || 'Not recorded', source.quote ? `Quote: ${source.quote}` : '', source.link ? `Link: ${source.link}` : '', source.pinnedAt ? `Pinned: ${source.pinnedAt}` : ''].filter(Boolean).join('; ')
}
const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function buildDealReport(deal, date = new Date()) {
  const fields = deal.fields || []
  const byKey = Object.fromEntries(fields.map(f => [f.key, f]))
  const inputs = Object.fromEntries(fields.map(f => [f.key, f.value]))
  const model = computeModel(inputs)
  const countable = fields.filter(f => !f.deleted && ['number', 'percent'].includes(f.type) && !f.structural)
  const format = (key, f) => {
    if (key === 'paybackMonths') return f.flag === 'divide-by-zero' ? 'Not reached' : fmtMonths(f.value)
    if (key === 'roiMultiple') return f.flag === 'divide-by-zero' ? 'Not defined' : `${fmtDec(f.value, 2)}x`
    const n = rawValue.has(key) ? f.raw : f.value
    return MONEY.has(key) ? fmtMoneyFull(n) : fmtDec(n, 2)
  }
  const figures = FIGURE_ORDER.filter(key => !model.figures[key].incomplete).map(key => ({ key, label: LABELS[key] || key, value: format(key, model.figures[key]), expression: EXPRESSIONS[key], arithmetic: model.figures[key].equation, flag: model.figures[key].flag }))
  const figureByKey = Object.fromEntries(figures.map(f => [f.key, f]))
  const pending = FIGURE_ORDER.filter(key => model.figures[key].incomplete).map(key => ({ key, label: LABELS[key] || key, missing: model.figures[key].missing.map(k => byKey[k]?.label || k) }))
  const stakeholders = (deal.stakeholders || []).map(resolveStakeholder).filter(Boolean).map(s => ({ role: s.role, needs: s.needsToSee || [], cares: s.cares || '', objection: s.objection || '', counter: s.counter || '' }))
  const active = (deal.stakeholders || []).map(resolveStakeholder).find(Boolean)
  const annual = figureByKey.totalValue
  const headline = annual ? active?.headline(model) || `${annual.value} of annual value` : ''
  const rows = fields.filter(f => !f.deleted).map(f => ({ key: f.key, label: f.label || f.key, value: showInput(f), state: stateOf(f), origin: sourceText(f.source), source: f.source || {} }))
  return {
    company: inputs.companyName || deal.name,
    archetype: inputs.archetype || 'Not specified', priority: inputs.strategicPriority || 'Not specified',
    date: localDate(date), confidence: confidence(fields), confirmedCount: countable.filter(f => stateOf(f) === 'input').length, inputCount: countable.length,
    headline, payback: figureByKey.paybackMonths?.value || '', roi: figureByKey.roiMultiple?.value || '',
    figures, figureByKey, drivers: DRIVERS.map(d => figureByKey[d.figure]).filter(Boolean), pending,
    stakeholders, inputs: rows, confirmed: rows.filter(f => f.state === 'input'), questions: rows.filter(f => f.state !== 'input'),
    alternative: { selfHost: figureByKey.selfHostCost?.value || '', portal: isBlank(inputs.portalCost) ? '' : showInput(byKey.portalCost), difference: figureByKey.versusSelfHost?.value || '', engineers: byKey.selfHostEngineers ? showInput(byKey.selfHostEngineers) : 'Not entered', salary: byKey.selfHostSalary ? showInput(byKey.selfHostSalary) : 'Not entered' }
  }
}
const questionText = q => `${q.label} (${q.state === 'empty' ? 'not yet entered' : q.state === 'assumption' ? 'currently assumed' : 'currently suggested'})`
export function cheatSheetBlocks(report) {
  const r = report
  const math = f => `${f.label}: ${f.value} — ${f.arithmetic} = ${f.value}`
  return [
    { title: 'Context', text: `${r.company}\nArchetype: ${r.archetype}\nLeadership priority this year: ${r.priority}\nConfidence: ${r.confidence}% (${r.confirmedCount} of ${r.inputCount} inputs confirmed)` },
    { title: 'Headline', text: `${r.headline || 'Headline pending: enter the missing driver inputs.'}\nPayback: ${r.payback || 'Pending — more inputs needed'}\nReturn on spend: ${r.roi || 'Pending — more inputs needed'}` },
    { title: 'Drivers and arithmetic', text: r.drivers.length ? r.drivers.map(math).join('\n') : 'No driver is computable yet. See open questions below.' },
    { title: 'Other figures', text: r.figures.filter(f => !r.drivers.some(d => d.key === f.key)).map(math).join('\n') || 'Waiting for inputs.' },
    { title: 'Portal versus self-hosting', text: `Self-hosting: ${r.alternative.selfHost || 'pending'} per year; ${r.alternative.engineers} engineers at ${r.alternative.salary}. Portal: ${r.alternative.portal || 'pending'}. Difference: ${r.alternative.difference || 'pending'} per year.` },
    ...r.stakeholders.map(s => ({ title: s.role, text: `${s.role}\nNeeds to hear: ${s.cares}\nNeeds to see: ${s.needs.join('; ')}\nObjection: ${s.objection}\nCounter: ${s.counter}` })),
    { title: 'Confirmed inputs and sources', text: r.confirmed.map(f => `${f.label}: ${f.value} — ${f.origin}`).join('\n') || 'No inputs confirmed yet.' },
    { title: 'Open questions', text: [...r.questions.map(questionText), ...r.pending.map(f => `${f.label}: waiting on ${f.missing.join(', ')}`)].join('\n') || 'No open questions.' }
  ]
}
export const copyEverythingText = report => cheatSheetBlocks(report).map(b => `${b.title}\n${b.text}`).join('\n\n')
const md = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/[`*_[\]<>#|]/g, c => '\\' + c).replace(/\r?\n/g, ' ')
const code = value => '`' + String(value || '').replace(/`/g, '′').replace(/\r?\n/g, ' ') + '`'

export function dealMarkdown(deal, date = new Date()) {
  const r = buildDealReport(deal, date)
  const f = r.figureByKey
  const lines = [
    `# Business case: ${md(r.company)}`, '',
    `Generated ${r.date} · Confidence ${r.confidence}% · ${r.confirmedCount} of ${r.inputCount} inputs confirmed`, '',
    '## Context', `- Archetype: ${md(r.archetype)}`, `- Leadership priority this year: ${md(r.priority)}`, `- Stakeholders: ${r.stakeholders.map(s => md(s.role)).join(', ') || 'Not specified'}`, '',
    '## Headline', `${md(r.headline || 'Headline pending')}, ${md(r.payback || 'pending')} payback, ${md(r.roi || 'pending')} return on spend.`, '',
    '## Figures', ''
  ]
  const figureLines = figure => [`### ${md(figure.label)} — ${md(figure.value)}`, `Equation: ${code(figure.expression)}`, `With values: ${code(`${figure.arithmetic} = ${figure.value}`)}`, '']
  const rollups = new Set(['totalValue', 'netValue', 'paybackMonths', 'roiMultiple', 'fiveYearValue', 'selfHostCost', 'versusSelfHost'])
  for (const figure of r.figures.filter(item => !rollups.has(item.key))) lines.push(...figureLines(figure))
  if (f.totalValue) {
    lines.push(`### Total annual value — ${md(f.totalValue.value)}`)
    const summary = [f.netValue ? `Net year one ${f.netValue.value}.` : '', f.paybackMonths ? `Payback ${f.paybackMonths.value}.` : '', f.fiveYearValue ? `Five-year net ${f.fiveYearValue.value}.` : ''].filter(Boolean).join(' ')
    if (summary) lines.push(summary)
    for (const key of ['totalValue', 'netValue', 'paybackMonths', 'roiMultiple', 'fiveYearValue']) if (f[key]) lines.push(`${key === 'totalValue' ? '' : md(f[key].label) + ' — '}Equation: ${code(f[key].expression)}`, `With values: ${code(`${f[key].arithmetic} = ${f[key].value}`)}`)
    lines.push('')
  }
  const a = r.alternative
  lines.push('## Portal versus self-hosting',
    a.selfHost ? `Self-hosting: ${md(a.selfHost)}/yr (${md(a.engineers)} engineers at ${md(a.salary)})` : 'Self-hosting: awaiting inputs (see open questions)',
    a.portal ? `Portal: ${md(a.portal)}` : 'Portal: awaiting subscription cost (see open questions)',
    a.difference ? `Difference: ${md(a.difference)}/yr` : 'Difference: awaiting inputs (see open questions)')
  for (const key of ['selfHostCost', 'versusSelfHost']) if (f[key]) lines.push(`Equation: ${code(f[key].expression)}`, `With values: ${code(`${f[key].arithmetic} = ${f[key].value}`)}`)
  lines.push('', '## Inputs', '', '| Input | Value | State | Where it came from |', '| --- | --- | --- | --- |')
  for (const input of r.inputs) lines.push(`| ${md(input.label)} | ${md(input.value)} | ${input.state} | ${md(input.origin)} |`)
  lines.push('', '## Open questions', 'Fields still unconfirmed. This is the list to send before granting a trial.')
  for (const question of r.questions) lines.push(`- ${md(questionText(question))}`)
  for (const figure of r.pending) lines.push(`- ${md(figure.label)}: waiting on ${md(figure.missing.join(', '))}`)
  if (!r.questions.length && !r.pending.length) lines.push('- None.')
  lines.push('', '## Stakeholders', '')
  for (const s of r.stakeholders) lines.push(`### ${md(s.role)}`, `Needs to see: ${md(s.needs.join('; ') || s.cares)}`, `Objection: ${md(s.objection)}`, `Counter: ${md(s.counter)}`, '')
  return lines.join('\n') + '\n'
}
export function markdownFilename(deal, date = new Date()) {
  const company = deal.fields.find(f => f.key === 'companyName')?.value || deal.name
  const slug = String(company).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deal'
  return `casebuilder-${slug}-${localDate(date)}.md`
}
