// The browser-side program inside the exported interactive website. It is
// stringified into the downloaded HTML file, so it must be completely
// self-contained: no imports, no references to anything outside this function.
//
// DATA: { company, slides, stakeholders, activeKey, inputs, openFields, sliders, logo }
// VM:   the model (computeModel), the content around it and the formatters, inlined
//       from model.js, valueModel.js and format.js. The site recomputes every figure
//       with the same arithmetic the app uses.
export function siteMain(DATA, VM) {
  const $ = s => document.querySelector(s)
  const esc = s =>
    String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  if (DATA.company) {
    document.title = DATA.company + ' · Business case'
    const co = document.querySelector('.co')
    if (co) co.textContent = DATA.company
  }
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

  const M = () => VM.computeModel(inputs)

  function headlineFor(st) {
    if (st.builtin) {
      const base = VM.STAKEHOLDERS.find(b => b.key === st.key)
      if (base) return base.headline(M())
    }
    return VM.fmtMoney(M().figures.totalValue.value) + ' of annual value'
  }

  function numbers() {
    const F = M().figures
    return {
      total: F.totalValue.value,
      net: F.netValue.raw,
      roi: F.roiMultiple.value,
      months: F.paybackMonths.value,
      five: F.fiveYearValue.raw,
      F: F
    }
  }

  const monthsText = m => (m > 0 ? VM.fmtMonths(m) : 'n/a')

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
      payback: monthsText(n.months),
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
    if (key === 'annual') return { label: 'Annual value', value: VM.fmtMoney(n.total), eq: n.F.totalValue.equation }
    if (key === 'cost') return { label: 'Portal cost', value: VM.fmtMoney(inputs.portalCost), eq: '' }
    if (key === 'net') return { label: 'Net, year one', value: VM.fmtMoney(n.net), tone: n.net > 0 ? 'good' : 'bad', eq: n.F.netValue.equation }
    if (key === 'payback') return { label: 'Payback', value: monthsText(n.months), eq: n.F.paybackMonths.equation }
    if (key === 'roi') return { label: 'Return', value: n.roi.toFixed(1) + 'x', eq: n.F.roiMultiple.equation }
    if (key === 'five') return { label: 'Five-year net', value: VM.fmtMoney(n.five), eq: n.F.fiveYearValue.equation }
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
            .map(i => '<div class="stat ' + (i.tone || '') + '"><span>' + esc(i.label) + '</span><strong>' + esc(i.value) + '</strong>' + (i.eq ? '<em class="eq">' + esc(i.eq) + '</em>' : '') + '</div>')
            .join('') +
          '</div>'
        )
      }
      case 'drivers': {
        const m = M()
        const groups = VM.driversByPillar(m, inputs.archetype)
        const max = Math.max.apply(null, [1].concat(groups.reduce((acc, g) => acc.concat(g.items.map(d => d.value)), [])))
        return (
          '<div class="chart">' +
          groups
            .map(
              g =>
                '<section class="pillar' + (g.leads ? ' pl' : '') + '"><h3>' + esc(g.label) + '<span>' + esc(VM.fmtMoney(g.total)) + '</span></h3>' +
                g.items
                  .map(d => {
                    const lead = st.lead.indexOf(d.key) >= 0
                    return (
                      '<div class="bar-row' + (lead ? ' lead' : '') + '">' +
                      '<div class="bar-label">' + esc(d.label) + (lead ? '<i></i>' : '') + '</div>' +
                      '<div class="track"><div class="fill" style="width:' + ((d.value / max) * 100).toFixed(1) + '%;background:' + d.color + ';opacity:' + (lead ? 1 : 0.45) + '"></div></div>' +
                      '<div class="bar-value">' + esc(VM.fmtMoney(d.value)) + '</div>' +
                      '<div class="bar-detail eq">' + esc(d.detail) + '</div></div>'
                    )
                  })
                  .join('') +
                '</section>'
            )
            .join('') +
          '</div><div class="total"><span>Total annual value</span><strong>' + esc(VM.fmtMoneyFull(m.figures.totalValue.value)) + '</strong></div><p class="eq">' + esc(m.figures.totalValue.equation) + '</p>'
        )
      }
      case 'pairs': {
        const m = M()
        const show = (p, n) => (p.money ? VM.fmtMoney(n) : VM.fmtDec(n, 2) + (p.unit === '%' ? '%' : ''))
        return (
          '<div class="pairs"><div class="pr ph"><span></span><span>today</span><span>with Portal</span><span>difference</span></div>' +
          VM.PAIRS.map(p => {
            const t = m.inputs[p.today]
            const q = m.inputs[p.portal]
            return (
              '<div class="pr"><span class="pl2">' + esc(p.label) + (p.money || p.unit === '%' ? '' : ' <i>(' + esc(p.unit) + ')</i>') + '</span><b>' + esc(show(p, t)) + '</b><b>' + esc(show(p, q)) +
              '</b><b class="pd">' + esc(show(p, Math.max(0, t - q))) + '</b><em class="eq">' + esc(p.saved) + ': worth ' + esc(VM.fmtMoney(m.figures[p.valueFigure].value)) + '</em></div>'
            )
          }).join('') +
          '</div>'
        )
      }
      case 'versus': {
        const F = M().figures
        const selfHost = F.selfHostCost.value
        const portal = inputs.portalCost >= 0 ? Number(inputs.portalCost) || 0 : 0
        const max = Math.max(selfHost, portal, 1)
        const delta = F.versusSelfHost.raw
        const row = (name, val, tone, eq) =>
          '<div class="v-row"><span>' + name + '</span><div class="track"><div class="fill ' + tone + '" style="width:' + ((val / max) * 100).toFixed(1) + '%"></div></div><b>' + esc(VM.fmtMoney(val)) + '/yr</b>' + (eq ? '<em class="eq">' + esc(eq) + '</em>' : '') + '</div>'
        return (
          '<div class="versus">' + row('Self-host open source', selfHost, 'bad', F.selfHostCost.equation) + row('Spotify Portal', portal, 'good', '') + '</div>' +
          '<p class="v-note">' + esc(VM.fmtDec(Number(inputs.selfHostEngineers) || 0, 1)) + ' platform engineers at ' + esc(VM.fmtMoney(Number(inputs.selfHostSalary) || 0)) +
          ' fully loaded, permanently, for upgrades, patches and infrastructure. <strong>' +
          esc(delta > 0
            ? 'Portal is ' + VM.fmtMoney(delta) + '/yr cheaper before any of the value above.'
            : 'On these figures self-hosting is cheaper. The case has to rest on the value drivers, not on cost avoidance.') +
          '</strong></p><p class="eq">' + esc(F.versusSelfHost.equation) + '</p>'
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

  // Blocks whose text can be edited in place when the page is shown inside the
  // CaseBuilder app (edit mode). A published page never enters edit mode.
  const EDITABLE = { text: 1, quote: 1, columns: 1, image: 1 }
  const SINGLE_LINE = { hero: 1, headline: 1, title: 1, label: 1, eyebrow: 1, tag: 1, forwhom: 1 }
  let editing = false

  function render() {
    const st = stakeholder()
    const ctx = context(st)
    const main = $('main')
    const keep = main.scrollTop
    main.innerHTML = DATA.slides
      .map(
        (s, i) =>
          '<section class="slide ' + (s.variant === 'hero' ? 'hero-bg' : '') + '" data-i="' + i + '"><div class="inner">' +
          s.blocks
            .map(
              (b, j) =>
                '<div class="blk" data-s="' + i + '" data-b="' + j + '"' + (EDITABLE[b.type] ? ' data-e="1"' : '') + '>' +
                blockHtml(b, st, ctx) +
                '</div>'
            )
            .join('') +
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

  // ---- edit mode: only when the CaseBuilder app (the parent window) switches it on.
  // Clicking text turns it into a box showing the raw template (so {tokens} stay),
  // and the change is sent to the app, which saves it into the deck.
  function startEdit(blk, target) {
    if (blk.querySelector('textarea')) return
    const slide = DATA.slides[Number(blk.getAttribute('data-s'))]
    const block = slide && slide.blocks[Number(blk.getAttribute('data-b'))]
    if (!block) return

    let field = null
    let host = null
    if (block.type === 'text' || block.type === 'quote') {
      field = 'text'
      host = blk.firstElementChild
    } else if (block.type === 'columns') {
      const bodies = Array.prototype.slice.call(blk.querySelectorAll('.cols > .body'))
      const k = bodies.indexOf(target.closest('.body'))
      if (k < 0) return
      field = k === 0 ? 'left' : 'right'
      host = bodies[k]
    } else if (block.type === 'image') {
      host = target.closest('figcaption')
      if (!host) return
      field = 'caption'
    }
    if (!host || !field) return

    const ta = document.createElement('textarea')
    ta.className = 'edit-ta'
    ta.value = block[field] || ''
    host.innerHTML = ''
    host.appendChild(ta)
    const fit = () => {
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    }
    fit()
    ta.addEventListener('input', fit)
    ta.focus()
    ta.setSelectionRange(ta.value.length, ta.value.length)

    const single = block.type === 'text' && SINGLE_LINE[block.style]
    ta.addEventListener('keydown', e => {
      if (e.key === 'Escape' || (single && e.key === 'Enter')) {
        e.preventDefault()
        ta.blur()
      }
    })
    ta.addEventListener('blur', () => {
      const value = ta.value
      if (value !== (block[field] || '')) {
        block[field] = value
        window.parent.postMessage({ cb: 'edit', slideId: slide.id, blockId: block.id, field: field, value: value }, '*')
      }
      render()
    })
  }

  $('main').addEventListener('click', e => {
    if (!editing) return
    const blk = e.target.closest('.blk')
    if (blk && blk.getAttribute('data-e')) startEdit(blk, e.target)
  })
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !e.data || e.data.cb !== 'edit-mode') return
    editing = !!e.data.on
    document.body.classList.toggle('editing', editing)
  })

  if (DATA.sliders.length) buildSliders()
  else $('#whatif-toggle').style.display = 'none'
  render()
}
