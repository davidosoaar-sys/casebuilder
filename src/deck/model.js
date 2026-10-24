import { uid } from '../uid.js'
import { computeModel } from '../model.js'
import {
  driversByPillar,
  unconfirmed,
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
  ['role', 'Selected stakeholder'],
  ['headline', "The stakeholder's headline number"],
  ['cares', 'What they care about'],
  ['archetype', 'Archetype'],
  ['annual', 'Annual value'],
  ['net', 'Net, year one'],
  ['payback', 'Payback'],
  ['roi', 'Return'],
  ['five', 'Five-year net']
]

const block = (type, props = {}) => ({ id: uid(), type, ...props })
const text = (style, t) => block('text', { style, text: t })
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
  const ctx = {
    company: inputs.companyName || 'Untitled',
    role: active.role,
    archetype: inputs.archetype,
    headline: active.headline(model),
    cares: active.cares,
    tag: active.tag,
    annual: fmtMoney(F.totalValue.value),
    cost: fmtMoney(model.inputs.portalCost),
    net: fmtMoney(F.netValue.raw),
    payback: F.paybackMonths.value > 0 ? fmtMonths(F.paybackMonths.value) : 'n/a',
    roi: `${F.roiMultiple.value.toFixed(1)}x`,
    five: fmtMoney(F.fiveYearValue.raw)
  }
  return { inputs, fields, active, ctx, model }
}

// ----------------------------------------------------- built-in templates

// Each built-in slide is just blocks. `ed` is the old per-slide text override
// from before decks were block based; it is only used when migrating.
function builtin(type, ed = {}) {
  switch (type) {
    case 'title':
      return slide('hero', [
        block('logo'),
        text('eyebrow', 'Technology / Business case'),
        text('hero', ed.title ?? '{company}'),
        text('lede', ed.lede ?? "Spotify Portal for Backstage, costed against {company}'s own numbers."),
        text('forwhom', ed.forwhom ?? 'Prepared for {role} · {archetype}')
      ])
    case 'headline':
      return slide('plain', [
        text('label', 'The number'),
        text('headline', ed.headline ?? '{headline}'),
        text('sub', ed.sub ?? '{cares}'),
        block('stats', { items: STAT_KEYS.map(([k]) => k) })
      ])
    case 'drivers':
      return slide('plain', [
        text('label', 'Where the value comes from'),
        text('title', ed.title ?? 'Speed, chaos-control, scale'),
        text('note', ed.note ?? "Grouped under the three pillars. Under each bar is the arithmetic with this customer's numbers. The two {role} cares about most are marked."),
        block('drivers')
      ])
    case 'pairs':
      return slide('plain', [
        text('label', 'Today and with Portal'),
        text('title', ed.title ?? 'What changes, input by input'),
        text('note', ed.note ?? 'Each pair is a number the customer can check against their own. The difference is what the case is built on.'),
        block('pairs')
      ])
    case 'versus':
      return slide('plain', [
        text('label', 'Against the alternative'),
        text('title', ed.title ?? 'Backstage is free. Running it is not.'),
        text(
          'note',
          ed.note ??
            'The comparison that decides most deals is Portal against self-hosting the open-source project, not Portal against doing nothing.'
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
    case 'assumptions':
      return slide('plain', [
        text('label', 'Honesty slide'),
        text('title', ed.title ?? 'What is confirmed and what is not'),
        text('note', ed.note ?? 'Finance will ask. Showing it first is stronger than being caught by it.'),
        block('assumptions'),
        text(
          'note',
          ed.note2 ??
            'Each one is a question for the next call. Confirming them is what turns this from a pitch into a case.'
        )
      ])
    default:
      return null
  }
}

export const BUILTIN_TYPES = ['title', 'headline', 'drivers', 'pairs', 'versus', 'stakeholder', 'assumptions']

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
  { key: 'stakeholder', name: 'This room', make: () => builtin('stakeholder') },
  { key: 'assumptions', name: 'Confirmed vs assumed', make: () => builtin('assumptions') }
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
  { name: 'Today vs with Portal', make: () => block('pairs') },
  { name: 'Portal vs self-hosting', make: () => block('versus') },
  { name: 'Assumptions list', make: () => block('assumptions') },
  { name: 'Stakeholder brief', make: () => block('room') },
  { name: 'Logo', make: () => block('logo') },
  { name: 'Divider', make: () => block('divider') },
  { name: 'Spacer', make: () => block('spacer') }
]

export function defaultDeck() {
  return BUILTIN_TYPES.map(t => builtin(t))
}

// ------------------------------------------------------------- migration

// Decks saved before blocks existed were [{ id, type, ed }] or custom pages
// { type: 'custom', label, title, body }. Turn them into block slides, keeping
// every edit the user had made.
export function migrateDeck(deck) {
  return deck
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
  switch (key) {
    case 'annual':
      return { label: 'Annual value', value: fmtMoney(F.totalValue.value), eq: F.totalValue.equation }
    case 'cost':
      return { label: 'Portal cost', value: fmtMoney(env.model.inputs.portalCost), eq: '' }
    case 'net':
      return { label: 'Net, year one', value: fmtMoney(F.netValue.raw), tone: F.netValue.raw > 0 ? 'good' : 'bad', eq: F.netValue.equation }
    case 'payback':
      return { label: 'Payback', value: F.paybackMonths.value > 0 ? fmtMonths(F.paybackMonths.value) : 'n/a', eq: F.paybackMonths.equation }
    case 'roi':
      return { label: 'Return', value: `${F.roiMultiple.value.toFixed(1)}x`, eq: F.roiMultiple.equation }
    case 'five':
      return { label: 'Five-year net', value: fmtMoney(F.fiveYearValue.raw), eq: F.fiveYearValue.equation }
    default:
      return null
  }
}

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
    case 'stats':
      return {
        kind: 'stats',
        items: (b.items || STAT_KEYS.map(([k]) => k)).map(k => ({ key: k, ...statValue(k, env) })).filter(i => i.label)
      }
    case 'drivers': {
      const groups = driversByPillar(model, inputs.archetype)
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
            lead: active.lead.includes(d.key),
            pct: (d.value / max) * 100
          }))
        })),
        total: fmtMoneyFull(model.figures.totalValue.value),
        totalEq: model.figures.totalValue.equation
      }
    }
    case 'pairs': {
      const I = model.inputs
      return {
        kind: 'pairs',
        rows: PAIRS.map(p => {
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
    case 'assumptions': {
      const open = unconfirmed(env.fields)
      return {
        kind: 'assumptions',
        count: open.length,
        items: open.map(f => ({
          label: f.label,
          assumed: `assumed at ${f.type === 'percent' ? `${f.value}%` : fmtDec(f.value, 2)}${f.unit && f.unit !== '%' ? ` ${f.unit}` : ''}`
        }))
      }
    }
    case 'room':
      return {
        kind: 'room',
        needs: (active.needsToSee || []).filter(Boolean),
        objection: active.objection,
        counter: active.counter
      }
    default:
      return { kind: b.type }
  }
}

export function resolveSlides(deck, env) {
  return deck.map(s => ({ id: s.id, variant: s.variant || 'plain', blocks: s.blocks.map(b => ({ id: b.id, ...resolveBlock(b, env) })) }))
}
