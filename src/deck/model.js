import { stateOf } from '../source.js'
import { clientCompanyName } from '../companyName.js'
import {caseNarrative} from '../caseNarrative.js'
import { uid } from '../uid.js'
import { computeModel } from '../model.js'
import {
  driversByPillar,
  PAIRS,
  fmtMoney,
  fmtMoneyFull,
  fmtDec,
  fmtMonths
} from '../valueModel.js'

// The deck model. A deck is an ordered list of slides; a slide is a list of
// blocks. Blocks are either content you write (text, quote, columns, image) or
// live blocks computed from the project (key numbers, the driver chart, the
// self-host comparison, assumptions, the stakeholder brief). Text can hold
// tokens such as {company} or {headline}, which fill in from the project and
// follow the selected stakeholder until you type over them.

export const TEXT_STYLES = [
  ['hero', 'Hero title'],
  ['headline', 'Headline'],
  ['title', 'Title'],
  ['sub', 'Subtitle'],
  ['lede', 'Lede'],
  ['body', 'Body'],
  ['note', 'Note'],
  ['label', 'Label'],
  ['eyebrow', 'Eyebrow'],
  ['tag', 'Tag'],
  ['forwhom', 'Small caps'],
  ['caption', 'Caption']
]

export const STAT_KEYS = [
  ['annual', 'Annual value'],
  ['cost', 'Portal cost'],
  ['net', 'Net, year one'],
  ['payback', 'Payback'],
  ['roi', 'Return'],
  ['five', 'Five-year net']
]

export const TOKENS = [
  ['company', 'Company name'],
  ['caseContext', 'Team, workflow and customer problem'],
  ['decisionHeadline', 'Modeled Portal versus self-hosting comparison'],
  ['valueHeadline', 'Modeled annual value summary'],
  ['role', 'Selected stakeholder'],
  ['headline', "The stakeholder's headline number"],
  ['cares', 'What they care about'],
  ['archetype', 'Archetype'],
  ['annual', 'Annual value'],
  ['net', 'Net, year one'],
  ['payback', 'Payback'],
  ['paybackShort', 'Payback (headline)'],
  ['roi', 'Return'],
  ['five', 'Five-year net']
]

const block = (type, props = {}) => ({ id: uid(), type, ...props })
const text = (style, t) => block('text', { style, text: t })
export const textBlock = text
const slide = (variant, blocks) => ({ id: uid(), variant, blocks })

// ---------------------------------------------------------------- tokens

export function fill(str, ctx) {
  return String(str ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in ctx ? ctx[k] : m))
}

// Everything a slide can be computed from, for one audience. The deck holds no
// numbers of its own: `model` is computeModel(inputs), and every figure below is
// read from it.
export function buildEnv(inputs, fields, active, model = computeModel(inputs)) {
  const F = model.figures
  // a figure that is not computable yet reads as nothing, never as $0
  const show = (f, fn) => (f.incomplete ? '' : fn(f))
  const total = F.totalValue
  const ctx = {
    company: clientCompanyName(inputs.companyName) || 'Untitled',
    ...caseNarrative(inputs,F,fmtMoney),
    role: active.role,
    archetype: inputs.archetype,
    headline: active.headline(model) ?? show(total, f => `${fmtMoney(f.value)} of annual value`),
    cares: active.cares,
    tag: active.tag,
    annual: show(total, f => fmtMoney(f.value)),
    cost: model.blankInputs.includes('portalCost') ? '' : fmtMoney(model.inputs.portalCost),
    net: show(F.netValue, f => fmtMoney(f.raw)),
    payback: show(F.paybackMonths, f => (f.value > 0 ? fmtMonths(f.value) : 'n/a')),
    paybackShort: show(F.paybackMonths, f => (!(f.value > 0) ? 'n/a' : f.value < 1 ? 'under a month' : f.value < 10 ? `${Math.round(f.value * 10) / 10} months` : `${Math.round(f.value)} months`)),
    roi: show(F.roiMultiple, f => `${f.value.toFixed(1)}x`),
    five: show(F.fiveYearValue, f => fmtMoney(f.raw))
  }
  return { inputs, fields, active, ctx, model }
}

// What Chris still has to fill in for some figures, by label (his view only).
export function waitingFor(env, figureKeys) {
  const keys = [...new Set(figureKeys.flatMap(k => env.model.figures[k].missing))]
  return keys.map(k => (env.fields.find(f => f.key === k) || {}).label || k)
}

// ----------------------------------------------------- built-in templates

// Each built-in slide is just blocks. `ed` is the old per-slide text override
// from before decks were block based; it is only used when migrating.
function builtin(type, ed = {}) {
  switch (type) {
    case 'title':
      return slide('hero', [
        block('logo'),
        text('hero', ed.title ?? '{company}'),
        text('lede', ed.lede ?? 'The case for Spotify Portal for Backstage at {company}.'),
        text('body', '{caseContext}'),
        text('forwhom', ed.forwhom ?? 'Prepared for {role} · {archetype}')
      ])
    case 'headline':
      return slide('plain', [
        text('label', 'Business impact'),
        text('headline', ed.headline ?? '{valueHeadline}'),
        text('sub', ed.sub ?? 'Engineering capacity and potential spend reductions, valued using this case’s inputs. Capacity value is not automatically a cash saving.'),
        text('note', '{cares}'),
        block('stats', { items: STAT_KEYS.map(([k]) => k) })
      ])
    case 'drivers':
      return slide('plain', [
        text('title', ed.title ?? 'Recover engineering time across everyday workflows'),
        text('note', ed.note ?? 'Find service information faster, shorten onboarding and incident coordination, and reduce platform upkeep. The arithmetic uses this case’s inputs.'),
        block('drivers')
      ])
    case 'pairs':
      return slide('plain', [
        text('label', 'Today and with Portal'),
        text('title', ed.title ?? 'Less time coordinating and maintaining the platform'),
        text('note', ed.note ?? 'Compare the current workflow with the proposed one: finding service information, onboarding, incident coordination and platform upkeep.'),
        block('pairs')
      ])
    case 'versus':
      return slide('plain', [
        text('label', 'Against the alternative'),
        text('title', ed.title ?? '{decisionHeadline}'),
        text(
          'note',
          ed.note ??
            'Compare the annual Portal subscription with the modeled engineering cost of running Backstage in-house. This is a cost comparison, not a promise of budget savings.'
        ),
        block('versus')
      ])
    case 'stakeholder':
      return slide('plain', [
        text('label', 'This room'),
        text('title', '{role}'),
        text('tag', '{tag}'),
        block('room')
      ])
    default:
      return null
  }
}

export const BUILTIN_TYPES = ['title', 'headline', 'drivers', 'pairs', 'versus', 'stakeholder']

export const SLIDE_TEMPLATES = [
  { key: 'blank', name: 'Blank page', make: () => slide('plain', [text('label', 'Notes'), text('title', 'New page')]) },
  {
    key: 'text',
    name: 'Text page',
    make: () => slide('plain', [text('label', 'Notes'), text('title', 'New page'), text('body', 'Write your page here.')])
  },
  {
    key: 'bullets',
    name: 'Bullet page',
    make: () =>
      slide('plain', [
        text('label', 'Notes'),
        text('title', 'Key points'),
        text('body', '- First point\n- Second point\n- Third point')
      ])
  },
  {
    key: 'columns',
    name: 'Two columns',
    make: () =>
      slide('plain', [
        text('label', 'Notes'),
        text('title', 'Side by side'),
        block('columns', { left: '- Left point\n- Another point', right: '- Right point\n- Another point' })
      ])
  },
  {
    key: 'image',
    name: 'Image page',
    make: () => slide('plain', [text('label', 'Notes'), text('title', 'Picture'), block('image', { src: '', caption: '' })])
  },
  { key: 'title', name: 'Title', make: () => builtin('title') },
  { key: 'headline', name: 'The number', make: () => builtin('headline') },
  { key: 'drivers', name: 'Value drivers', make: () => builtin('drivers') },
  { key: 'pairs', name: 'Today vs with Portal', make: () => builtin('pairs') },
  { key: 'versus', name: 'Against self-hosting', make: () => builtin('versus') },
  { key: 'stakeholder', name: 'This room', make: () => builtin('stakeholder') }
]

export const BLOCK_MENU = [
  { name: 'Text', make: () => text('body', 'New text') },
  { name: 'Heading', make: () => text('title', 'New heading') },
  { name: 'Bullet list', make: () => text('body', '- First point\n- Second point\n- Third point') },
  { name: 'Quote', make: () => block('quote', { text: 'A quote worth repeating.' }) },
  { name: 'Two columns', make: () => block('columns', { left: 'Left side', right: 'Right side' }) },
  { name: 'Image', make: () => block('image', { src: '', caption: '' }) },
  { name: 'Key numbers', make: () => block('stats', { items: STAT_KEYS.map(([k]) => k) }) },
  { name: 'Value drivers chart', make: () => block('drivers') },
  { name: 'Payback chart', make: () => block('chart', { kind: 'payback' }) },
  { name: 'Value breakdown chart', make: () => block('chart', { kind: 'breakdown' }) },
  { name: 'Input confidence chart', make: () => block('chart', { kind: 'confidence' }) },
  { name: 'Today vs with Portal', make: () => block('pairs') },
  { name: 'Portal vs self-hosting', make: () => block('versus') },
  { name: 'Stakeholder brief', make: () => block('room') },
  { name: 'Logo', make: () => block('logo') },
  { name: 'Divider', make: () => block('divider') },
  { name: 'Spacer', make: () => block('spacer') }
]

// Default pitch flow for new projects: impact first, then the workflow and
// value drivers, then the money, the alternative, the room and the decision.
export const DEFAULT_FLOW = ['title', 'headline', 'problem', 'breakdown', 'drivers', 'pairs', 'payback', 'versus', 'stakeholder', 'assumptions', 'next']

function flowSlide(key) {
  switch (key) {
    case 'problem':
      return slide('plain', [
        text('label', 'Today'),
        text('title', 'Where engineering time goes today at {company}'),
        text('body', '{caseContext}'),
        text('note', 'What this room cares about: {cares}')
      ])
    case 'breakdown':
      return slide('plain', [
        text('label', 'Value breakdown'),
        text('title', 'Where the modeled value comes from'),
        text('note', 'Each source of value, from this case’s inputs. Capacity value is not automatically a cash saving.'),
        block('chart', { kind: 'breakdown' })
      ])
    case 'payback':
      return slide('plain', [
        text('label', 'Payback'),
        text('title', 'Pays back in {paybackShort}, {roi} return in year one'),
        text('note', 'Cumulative modeled value against the annual subscription of {cost}.'),
        block('chart', { kind: 'payback' })
      ])
    case 'assumptions':
      return slide('plain', [
        text('label', 'Assumptions'),
        text('title', 'What is confirmed and what is still an assumption'),
        text('note', 'Confirmed inputs came from {company}. Assumptions are benchmarks to replace with real numbers before a decision.'),
        block('chart', { kind: 'confidence' })
      ])
    case 'next':
      return slide('plain', [
        text('label', 'Next steps'),
        text('title', 'The decision and next steps'),
        text('body', '- Confirm the open inputs with {company}\n- Agree the pilot scope and success measures\n- Name the approver and the decision date')
      ])
    default:
      return builtin(key)
  }
}

export function defaultDeck() {
  return DEFAULT_FLOW.map(flowSlide)
}

// ------------------------------------------------------------- migration

// Decks saved before blocks existed were [{ id, type, ed }] or custom pages
// { type: 'custom', label, title, body }. Turn them into block slides, keeping
// every edit the user had made.
export function migrateDeck(deck) {
  return deck
    // the old "what is confirmed and what is not" page is internal: it moved to Chris's view
    .filter(s => !(Array.isArray(s.blocks) && s.blocks.some(b => b.type === 'assumptions')) && s.type !== 'assumptions')
    .map(s => {
      if (Array.isArray(s.blocks)) return s
      if (s.type === 'custom') {
        return {
          id: s.id,
          variant: 'plain',
          blocks: [text('label', s.label || 'Notes'), text('title', s.title || ''), text('body', s.body || '')]
        }
      }
      const made = builtin(s.type, s.ed || {})
      return made && { ...made, id: s.id || made.id }
    })
    .filter(Boolean)
    .map(s => ({ ...s, blocks: s.blocks.filter(b => !(b.type === 'text' && /^technology\s*\/\s*business case$/i.test(String(b.text || '').trim()))) }))
}

// ------------------------------------------------------------- resolving

export function parseBody(str) {
  return String(str || '')
    .split(/\n\s*\n/)
    .map(b => b.split('\n').filter(l => l.trim()))
    .filter(b => b.length)
    .map(lines =>
      lines.every(l => /^\s*[-•]\s+/.test(l))
        ? { type: 'ul', items: lines.map(l => l.replace(/^\s*[-•]\s+/, '')) }
        : { type: 'p', text: lines.join(' ') }
    )
}

export function statValue(key, env) {
  const F = env.model.figures
  const money = f => fmtMoney(f.raw)
  switch (key) {
    case 'annual':
      return F.totalValue.incomplete ? null : { label: 'Annual value', value: fmtMoney(F.totalValue.value), eq: F.totalValue.equation }
    case 'cost':
      return env.model.blankInputs.includes('portalCost') ? null : { label: 'Portal cost', value: fmtMoney(env.model.inputs.portalCost), eq: '' }
    case 'net':
      return F.netValue.incomplete ? null : { label: 'Net, year one', value: money(F.netValue), tone: F.netValue.raw > 0 ? 'good' : 'bad', eq: F.netValue.equation }
    case 'payback':
      return F.paybackMonths.incomplete ? null : { label: 'Payback', value: F.paybackMonths.value > 0 ? fmtMonths(F.paybackMonths.value) : 'n/a', eq: F.paybackMonths.equation }
    case 'roi':
      return F.roiMultiple.incomplete ? null : { label: 'Return', value: `${F.roiMultiple.value.toFixed(1)}x`, eq: F.roiMultiple.equation }
    case 'five':
      return F.fiveYearValue.incomplete ? null : { label: 'Five-year net', value: money(F.fiveYearValue), eq: F.fiveYearValue.equation }
    default:
      return null
  }
}

const STAT_FIGURE = { annual: 'totalValue', cost: 'portalCost', net: 'netValue', payback: 'paybackMonths', roi: 'roiMultiple', five: 'fiveYearValue' }

// A plain, serialisable description of a block for one audience. The editor,
// the PowerPoint export, the one-pager and the website all read this.
export function resolveBlock(b, env) {
  const { ctx, inputs, active, model } = env
  switch (b.type) {
    case 'text': {
      const t = fill(b.text, ctx)
      return { kind: 'text', style: b.style, text: t, paras: b.style === 'body' ? parseBody(t) : null }
    }
    case 'quote':
      return { kind: 'quote', text: fill(b.text, ctx) }
    case 'columns':
      return { kind: 'columns', left: parseBody(fill(b.left, ctx)), right: parseBody(fill(b.right, ctx)) }
    case 'image':
      return { kind: 'image', src: b.src || '', caption: fill(b.caption || '', ctx) }
    case 'stats': {
      const keys = b.items || STAT_KEYS.map(([k]) => k)
      return {
        kind: 'stats',
        items: keys.map(k => ({ key: k, ...statValue(k, env) })).filter(i => i.label),
        waiting: waitingFor(env, ['totalValue', 'netValue', 'paybackMonths'].filter(k => keys.some(x => STAT_FIGURE[x] === k)))
      }
    }
    case 'chart':
      return resolveChart(b, env)
    case 'drivers': {
      const groups = driversByPillar(model, inputs.archetype, inputs.strategicPriority)
      const max = Math.max(...groups.flatMap(g => g.items.map(d => d.value)), 1)
      return {
        kind: 'drivers',
        groups: groups.map(g => ({
          key: g.key,
          label: g.label,
          blurb: g.blurb,
          leads: g.leads,
          total: fmtMoney(g.total),
          rows: g.items.map(d => ({
            key: d.key,
            label: d.label,
            value: d.value,
            valueStr: fmtMoney(d.value),
            detail: d.detail,
            flag: d.flag,
            color: d.color,
            lead: active.lead.includes(d.key) || d.priority,
            pct: (d.value / max) * 100
          }))
        })),
        total: fmtMoneyFull(model.figures.totalValue.value),
        totalEq: model.figures.totalValue.equation,
        waiting: waitingFor(env, ['totalValue'])
      }
    }
    case 'pairs': {
      const I = model.inputs
      return {
        kind: 'pairs',
        waiting: waitingFor(env, PAIRS.map(p => p.valueFigure)),
        rows: PAIRS.filter(p => !model.figures[p.valueFigure].incomplete && !(p.key === 'audit' && I.auditsPerYear === 0)).map(p => {
          const today = I[p.today]
          const portal = I[p.portal]
          const show = n => (p.money ? fmtMoney(n) : `${fmtDec(n, 2)}${p.unit === '%' ? '%' : ''}`)
          const f = model.figures[p.valueFigure]
          return {
            key: p.key,
            group: p.group,
            label: p.label,
            unit: p.money || p.unit === '%' ? '' : p.unit,
            today: show(today),
            portal: show(portal),
            diff: show(Math.max(0, today - portal)),
            saved: p.saved,
            value: fmtMoney(f.value),
            eq: f.equation
          }
        })
      }
    }
    case 'versus': {
      const F = model.figures
      if (F.versusSelfHost.incomplete) return { kind: 'versus', rows: [], incomplete: true, waiting: waitingFor(env, ['versusSelfHost']) }
      const selfHost = F.selfHostCost.value
      const portalCost = model.inputs.portalCost
      const max = Math.max(selfHost, portalCost, 1)
      const delta = F.versusSelfHost.raw
      return {
        kind: 'versus',
        rows: [
          { name: 'Self-host open source', value: selfHost, valueStr: `${fmtMoney(selfHost)}/yr`, tone: 'bad', pct: (selfHost / max) * 100, eq: F.selfHostCost.equation },
          { name: 'Spotify Portal', value: portalCost, valueStr: `${fmtMoney(portalCost)}/yr`, tone: 'good', pct: (portalCost / max) * 100, eq: '' }
        ],
        lead: `${fmtDec(model.inputs.selfHostEngineers, 1)} platform engineers at ${fmtMoney(model.inputs.selfHostSalary)} fully loaded, permanently, for upgrades, patches and infrastructure.`,
        verdict:
          delta > 0
            ? `Portal is ${fmtMoney(delta)}/yr cheaper before any of the value above.`
            : 'On these figures self-hosting is cheaper. The case has to rest on the value drivers, not on cost avoidance.',
        eq: F.versusSelfHost.equation
      }
    }
    case 'room':
      return {
        kind: 'room',
        needs: (active.needsToSee || []).filter(Boolean),
        clientFacing:active.clientFacing===true, requirements:active.requirements||[],
        objection: active.objection,
        counter: active.counter
      }
    default:
      return { kind: b.type }
  }
}

export const LIVE = new Set(['stats', 'drivers', 'pairs', 'versus', 'chart'])

// A live block with nothing it can compute yet.
export const isEmptyLive = r =>
  (r.kind === 'drivers' && !r.groups.length) ||
  (r.kind === 'pairs' && !r.rows.length) ||
  (r.kind === 'stats' && !r.items.length) ||
  (r.kind === 'versus' && r.incomplete)

// The deck as the CLIENT sees it. A figure that cannot be computed yet is absent
// (never a $0 bar), a slide whose figures are all absent is dropped, and nothing
// internal (assumptions, sources, confidence) is ever in here.
export function resolveSlides(deck, env) {
  return deck
    .map(s => {
      const all = s.blocks.map(b => ({ id: b.id, ...resolveBlock(b, env), ...(b.design ? { design: b.design } : {}) }))
      const live = all.filter(r => LIVE.has(r.kind))
      const blocks = all.filter(r => r.kind !== 'assumptions' && !isEmptyLive(r) && !(r.kind === 'text' && !r.text.trim()))
      const shown = live.filter(r => !isEmptyLive(r)).length
      const dropped = (live.length > 0 && shown === 0) || blocks.length === 0
      return { id: s.id, variant: s.variant || 'plain', blocks, dropped, ...(s.design ? { design: s.design } : {}) }
    })
    .filter(s => !s.dropped)
    .map(({ dropped, ...s }) => s)
}

// The pages resolveSlides leaves out because none of their figures can be
// computed yet, and the inputs (by label) that would bring them back.
export function hiddenPages(deck, env) {
  const missing = new Set()
  let count = 0
  for (const s of deck) {
    const live = s.blocks.map(b => resolveBlock(b, env)).filter(r => LIVE.has(r.kind))
    if (!live.length || !live.every(isEmptyLive)) continue
    count++
    for (const r of live) for (const label of r.waiting || []) missing.add(label)
  }
  return { count, missing: [...missing] }
}

// True when a slide has figures in it but none can be computed yet, so the client
// deck leaves the whole page out. (The editor still shows it, with what is missing.)
export function slideIsEmpty(slide, env) {
  const live = slide.blocks.map(b => resolveBlock(b, env)).filter(r => LIVE.has(r.kind))
  return live.length > 0 && live.every(isEmptyLive)
}

// ----------------------------------------------------- chart blocks
// Charts read the model's figures; nothing is recomputed differently here.
// A chart with nothing to show returns its waiting list instead of zeros.
const CHART_DRIVERS = [
  ['productivityValue', 'Engineer time recovered', 'capacity'],
  ['onboardingValue', 'Faster onboarding', 'capacity'],
  ['incidentValue', 'Shorter incidents', 'capacity'],
  ['standardsValue', 'Audit and compliance work avoided', 'capacity'],
  ['platformValue', 'Platform team maintenance avoided', 'capacity'],
  ['toolingValue', 'Overlapping tooling retired', 'spend']
]
export const CHART_GROUP_LABEL = { capacity: 'Capacity value', spend: 'Spend reduction' }
export const CONFIDENCE_STATES = [
  ['input', 'Confirmed'],
  ['assumption', 'Assumption'],
  ['suggestion', 'Suggested'],
  ['empty', 'Empty']
]

export function resolveChart(b, env) {
  const { model } = env
  const F = model.figures
  const kind = b.kind || 'payback'
  if (kind === 'payback') {
    const waiting = waitingFor(env, ['paybackMonths'])
    const costBlank = model.blankInputs.includes('portalCost')
    if (F.totalValue.incomplete || F.paybackMonths.incomplete || costBlank) {
      return { kind: 'chart', chart: 'payback', incomplete: true, waiting: waiting.length ? waiting : ['Annual subscription cost'] }
    }
    const monthly = F.totalValue.value / 12
    const cost = model.inputs.portalCost / 12
    const months = Array.from({ length: 36 }, (_, i) => i + 1)
    return {
      kind: 'chart', chart: 'payback', waiting: [],
      months,
      value: months.map(m => Math.round(monthly * m)),
      cost: months.map(m => Math.round(cost * m)),
      payback: F.paybackMonths.value > 0 ? fmtMonths(F.paybackMonths.value) : 'n/a',
      max: Math.max(monthly * 36, cost * 36, 1)
    }
  }
  if (kind === 'breakdown') {
    const rows = CHART_DRIVERS.filter(([k]) => !F[k].incomplete).map(([k, label, group]) => ({
      key: k, label, group, groupLabel: CHART_GROUP_LABEL[group], value: Math.max(F[k].value, 0), valueStr: fmtMoney(F[k].value)
    }))
    const waiting = waitingFor(env, CHART_DRIVERS.map(([k]) => k))
    if (!rows.length) return { kind: 'chart', chart: 'breakdown', incomplete: true, rows: [], waiting }
    const max = Math.max(...rows.map(r => r.value), 1)
    rows.forEach(r => { r.pct = (r.value / max) * 100 })
    return { kind: 'chart', chart: 'breakdown', rows, waiting: [] }
  }
  if (kind === 'confidence') {
    const fields = (env.fields || []).filter(f => !f.deleted && ['number', 'percent'].includes(f.type) && !f.structural)
    const counts = Object.fromEntries(CONFIDENCE_STATES.map(([k]) => [k, 0]))
    fields.forEach(f => { counts[stateOf(f)]++ })
    const total = fields.length
    if (!total) return { kind: 'chart', chart: 'confidence', incomplete: true, rows: [], waiting: ['Case inputs'] }
    return {
      kind: 'chart', chart: 'confidence', total, waiting: [],
      rows: CONFIDENCE_STATES.map(([k, label]) => ({ key: k, label, count: counts[k], pct: (counts[k] / total) * 100 }))
    }
  }
  return { kind: 'chart', chart: kind, incomplete: true, waiting: [] }
}
