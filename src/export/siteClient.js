// The browser-side program inside the exported interactive website. It is
// stringified into the downloaded HTML file, so it must be completely
// self-contained: no imports, no references to anything outside this function.
//
// DATA: { company, slides, stakeholders, activeKey, inputs, openFields, sliders, logo }
// VM:   the value model (drivers, totals, formatting) inlined from valueModel.js
export function siteMain(DATA, VM) {
  const $ = s => document.querySelector(s)
  const esc = s =>
    String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  const inputs = Object.assign({}, DATA.inputs)
  let activeKey = DATA.activeKey
  let current = 0

  const NONE = {
    key: 'none',
    role: 'Everyone',
    tag: '',
    cares: '',
    objection: '-',
    counter: '-',
    needsToSee: [],
    lead: [],
    builtin: false
  }
  const stakeholder = () => DATA.stakeholders.find(s => s.key === activeKey) || DATA.stakeholders[0] || NONE

  function headlineFor(st) {
    if (st.builtin) {
      const base = VM.STAKEHOLDERS.find(b => b.key === st.key)
      if (base) return base.headline(inputs)
    }
    return VM.fmtMoney(VM.totalBenefit(inputs)) + ' of annual value'
  }

  function numbers() {
    const total = VM.totalBenefit(inputs)
    const net = VM.netValue(inputs)
    return {
      total: total,
      net: net,
      roi: VM.roiMultiple(inputs),
      months: VM.paybackMonths(inputs),
      five: VM.fiveYearValue(inputs)
    }
  }

  function context(st) {
    const n = numbers()
    return {
      company: DATA.company,
      role: st.role,
      archetype: inputs.archetype,
      headline: headlineFor(st),
      cares: st.cares,
      tag: st.tag,
      annual: VM.fmtMoney(n.total),
      cost: VM.fmtMoney(inputs.portalCost),
      net: VM.fmtMoney(n.net),
      payback: n.months + ' months',
      roi: n.roi.toFixed(1) + 'x',
      five: VM.fmtMoney(n.five)
    }
  }

  const fill = (str, ctx) => String(str == null ? '' : str).replace(/\{(\w+)\}/g, (m, k) => (k in ctx ? ctx[k] : m))

  function paras(str) {
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

  const bodyHtml = list =>
    '<div class="body">' +
    list
      .map(p => (p.type === 'ul' ? '<ul>' + p.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>' : '<p>' + esc(p.text) + '</p>'))
      .join('') +
    '</div>'

  const TAGS = {
    hero: ['h1', 'hero'],
    headline: ['h2', 'headline'],
    title: ['h2', ''],
    sub: ['p', 'sub'],
    lede: ['p', 'lede'],
    note: ['p', 'note'],
    label: ['div', 'label'],
    eyebrow: ['p', 'eyebrow'],
    tag: ['p', 'tag'],
    forwhom: ['p', 'forwhom'],
    caption: ['p', 'caption']
  }

  function statItem(key) {
    const n = numbers()
    if (key === 'annual') return { label: 'Annual value', value: VM.fmtMoney(n.total) }
    if (key === 'cost') return { label: 'Portal cost', value: VM.fmtMoney(inputs.portalCost) }
    if (key === 'net') return { label: 'Net, year one', value: VM.fmtMoney(n.net), tone: n.net > 0 ? 'good' : 'bad' }
    if (key === 'payback') return { label: 'Payback', value: n.months + ' mo' }
    if (key === 'roi') return { label: 'Return', value: n.roi.toFixed(1) + 'x' }
    if (key === 'five') return { label: 'Five-year net', value: VM.fmtMoney(n.five) }
    return null
  }

  function blockHtml(b, st, ctx) {
    switch (b.type) {
      case 'text': {
        if (b.style === 'body') return bodyHtml(paras(fill(b.text, ctx)))
        const t = TAGS[b.style] || ['p', '']
        return '<' + t[0] + ' class="' + t[1] + '">' + esc(fill(b.text, ctx)) + '</' + t[0] + '>'
      }
      case 'quote':
        return '<blockquote>' + esc(fill(b.text, ctx)) + '</blockquote>'
      case 'columns':
        return '<div class="cols">' + bodyHtml(paras(fill(b.left, ctx))) + bodyHtml(paras(fill(b.right, ctx))) + '</div>'
      case 'image':
        return b.src
          ? '<figure><img src="' + esc(b.src) + '" alt="">' + (b.caption ? '<figcaption>' + esc(fill(b.caption, ctx)) + '</figcaption>' : '') + '</figure>'
          : ''
      case 'logo':
        return '<div class="logo">' + DATA.logo + '</div>'
      case 'divider':
        return '<hr>'
      case 'spacer':
        return '<div class="spacer"></div>'
      case 'stats': {
        const keys = b.items || ['annual', 'cost', 'net', 'payback', 'roi', 'five']
        return (
          '<div class="stats">' +
          keys
            .map(statItem)
            .filter(Boolean)
            .map(i => '<div class="stat ' + (i.tone || '') + '"><span>' + esc(i.label) + '</span><strong>' + esc(i.value) + '</strong></div>')
            .join('') +
          '</div>'
        )
      }
      case 'drivers': {
        const rows = VM.allDrivers(inputs)
        const max = Math.max.apply(null, rows.map(r => r.value).concat([1]))
        return (
          '<div class="chart">' +
          rows
            .map(d => {
              const lead = st.lead.indexOf(d.key) >= 0
              return (
                '<div class="bar-row' + (lead ? ' lead' : '') + '" title="' + esc(d.detail) + '">' +
                '<div class="bar-label">' + esc(d.label) + (lead ? '<i></i>' : '') + '</div>' +
                '<div class="track"><div class="fill" style="width:' + ((d.value / max) * 100).toFixed(1) + '%;background:' + d.color + ';opacity:' + (lead ? 1 : 0.45) + '"></div></div>' +
                '<div class="bar-value">' + esc(VM.fmtMoney(d.value)) + '</div>' +
                '<div class="bar-detail">' + esc(d.detail) + '</div></div>'
              )
            })
            .join('') +
          '</div><div class="total"><span>Total annual value</span><strong>' + esc(VM.fmtMoneyFull(numbers().total)) + '</strong></div>'
        )
      }
      case 'versus': {
        const v = VM.versusSelfHost(inputs)
        const max = Math.max(v.selfHost, v.portal, 1)
        const row = (name, val, tone) =>
          '<div class="v-row"><span>' + name + '</span><div class="track"><div class="fill ' + tone + '" style="width:' + ((val / max) * 100).toFixed(1) + '%"></div></div><b>' + esc(VM.fmtMoney(val)) + '/yr</b></div>'
        return (
          '<div class="versus">' + row('Self-host open source', v.selfHost, 'bad') + row('Spotify Portal', v.portal, 'good') + '</div>' +
          '<p class="v-note">' + esc(inputs.selfHostEngineers) + ' platform engineers at ' + esc(VM.fmtMoney(inputs.selfHostSalary)) +
          ' fully loaded, permanently, for upgrades, patches and infrastructure. <strong>' +
          esc(v.cheaper === 'portal'
            ? 'Portal is ' + VM.fmtMoney(Math.abs(v.delta)) + '/yr cheaper before any of the value above.'
            : 'On these figures self-hosting is cheaper. The case has to rest on the value drivers, not on cost avoidance.') +
          '</strong></p>'
        )
      }
      case 'assumptions': {
        const open = DATA.openFields
        if (!open.length) return '<p class="allgood">Every material input is confirmed. This case is ready to go upward.</p>'
        return (
          '<p class="still">' + open.length + ' input' + (open.length === 1 ? '' : 's') + ' still assumed:</p><ul class="assume">' +
          open.map(f => '<li><strong>' + esc(f.label) + '</strong><span>' + esc(f.assumed) + '</span></li>').join('') +
          '</ul>'
        )
      }
      case 'room':
        return (
          '<div class="cols"><div><h3>What they need to see</h3><ul>' +
          (st.needsToSee || []).filter(Boolean).map(n => '<li>' + esc(n) + '</li>').join('') +
          '</ul></div><div><h3>The objection</h3><blockquote>' + esc(st.objection) + '</blockquote><h3>The counter</h3><p>' + esc(st.counter) + '</p></div></div>'
        )
      default:
        return ''
    }
  }

  function render() {
    const st = stakeholder()
    const ctx = context(st)
    const main = $('main')
    const keep = main.scrollTop
    main.innerHTML = DATA.slides
      .map(
        (s, i) =>
          '<section class="slide ' + (s.variant === 'hero' ? 'hero-bg' : '') + '" data-i="' + i + '"><div class="inner">' +
          s.blocks.map(b => blockHtml(b, st, ctx)).join('') +
          '</div></section>'
      )
      .join('')
    main.scrollTop = keep

    $('#audience').innerHTML = DATA.stakeholders
      .map(s => '<button class="' + (s.key === st.key ? 'on' : '') + '" data-key="' + esc(s.key) + '">' + esc(s.role) + '</button>')
      .join('')
    $('#dots').innerHTML = DATA.slides
      .map((s, i) => '<button class="dot ' + (i === current ? 'on' : '') + '" data-go="' + i + '" aria-label="Go to page ' + (i + 1) + '"></button>')
      .join('')
    $('#count').textContent = current + 1 + ' / ' + DATA.slides.length
  }

  function go(i) {
    const slides = document.querySelectorAll('.slide')
    if (!slides.length) return
    current = Math.max(0, Math.min(slides.length - 1, i))
    slides[current].scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function buildSliders() {
    $('#sliders').innerHTML = DATA.sliders
      .map(
        s =>
          '<label><span>' + esc(s.label) + '<b id="v-' + s.key + '"></b></span><input type="range" data-key="' + s.key +
          '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + inputs[s.key] + '"></label>'
      )
      .join('')
    const show = () =>
      DATA.sliders.forEach(s => {
        $('#v-' + s.key).textContent = ' ' + (s.unit === '%' ? inputs[s.key] + '%' : s.unit === '$' ? '$' + Number(inputs[s.key]).toLocaleString() : Number(inputs[s.key]).toLocaleString())
      })
    show()
    $('#sliders').addEventListener('input', e => {
      const k = e.target.getAttribute('data-key')
      if (!k) return
      inputs[k] = Number(e.target.value)
      show()
      render()
    })
  }

  $('#audience').addEventListener('click', e => {
    const k = e.target.getAttribute && e.target.getAttribute('data-key')
    if (k) {
      activeKey = k
      render()
    }
  })
  $('#dots').addEventListener('click', e => {
    const i = e.target.getAttribute && e.target.getAttribute('data-go')
    if (i != null) go(Number(i))
  })
  $('#whatif-toggle').addEventListener('click', () => $('#whatif').classList.toggle('open'))
  $('#whatif-reset').addEventListener('click', () => {
    Object.assign(inputs, DATA.inputs)
    buildSliders()
    render()
  })
  $('#prev').addEventListener('click', () => go(current - 1))
  $('#next').addEventListener('click', () => go(current + 1))
  document.addEventListener('keydown', e => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      go(current + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault()
      go(current - 1)
    }
  })
  // Keep the page counter and dots in step with scrolling.
  $('main').addEventListener('scroll', () => {
    const slides = document.querySelectorAll('.slide')
    const top = $('main').getBoundingClientRect().top
    let best = 0
    let dist = Infinity
    slides.forEach((s, i) => {
      const d = Math.abs(s.getBoundingClientRect().top - top)
      if (d < dist) {
        dist = d
        best = i
      }
    })
    if (best !== current) {
      current = best
      document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('on', i === current))
      $('#count').textContent = current + 1 + ' / ' + slides.length
    }
  })

  if (DATA.sliders.length) buildSliders()
  else $('#whatif-toggle').style.display = 'none'
  render()
}
