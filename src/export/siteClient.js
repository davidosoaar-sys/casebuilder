// The browser-side program inside the exported interactive website. It is
// stringified into the downloaded HTML file, so it must be completely
// self-contained: no imports, no references to anything outside this function.
//
// DATA: { company, slides, stakeholders, activeKey, inputs, sliders, logo }
// VM:   the model (computeModel), the content around it and the formatters, inlined
//       from model.js, valueModel.js and format.js. The site recomputes every figure
//       with the same arithmetic the app uses.
export function siteMain(DATA, VM, createMotion, mountJourney, renderGraphic, narrative) {
  const graphic = (kind, rows) => DATA.viewMode === 'website' && renderGraphic ? renderGraphic(kind, rows) : ''
  const $ = s => document.querySelector(s)
  const mode = DATA.viewMode || 'website'
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
  const stakeholder = () => mode==='website' ? {...NONE,role:'Company leadership',cares:inputs.strategicPriority ? 'Strategic priority: '+inputs.strategicPriority : '',lead:[]} : DATA.stakeholders.find(s => s.key === activeKey) || DATA.stakeholders[0] || NONE

  const M = () => VM.computeModel(inputs)

  function headlineFor(st) {
    if (st.builtin) {
      const base = VM.STAKEHOLDERS.find(b => b.key === st.key)
      if (base) {
        const h = base.headline(M())
        if (h != null) return h
      }
    }
    const t = M().figures.totalValue
    return t.incomplete ? '' : VM.fmtMoney(t.value) + ' of annual value'
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

  // a figure that cannot be computed yet reads as nothing, never as $0
  function context(st) {
    const n = numbers()
    const F = n.F
    const when = (f, fn) => (f.incomplete ? '' : fn(f))
    return {
      ...narrative(inputs,F,VM.fmtMoney),
      company: DATA.company,
      role: mode==='website'?DATA.company:st.role,
      archetype: inputs.archetype,
      headline: headlineFor(st),
      cares: st.cares,
      tag: st.tag,
      annual: when(F.totalValue, f => VM.fmtMoney(f.value)),
      cost: inputs.portalCost === '' || inputs.portalCost == null ? '' : VM.fmtMoney(Number(inputs.portalCost) || 0),
      net: when(F.netValue, f => VM.fmtMoney(f.raw)),
      payback: when(F.paybackMonths, f => monthsText(f.value)),
      paybackShort: when(F.paybackMonths, f => (!(f.value > 0) ? 'n/a' : f.value < 1 ? 'under a month' : f.value < 10 ? Math.round(f.value * 10) / 10 + ' months' : Math.round(f.value) + ' months')),
      roi: when(F.roiMultiple, f => f.value.toFixed(1) + 'x'),
      five: when(F.fiveYearValue, f => VM.fmtMoney(f.raw))
    }
  }

  const fill = (str, ctx) => {
    const text = String(str == null ? '' : str).replace(/\{(\w+)\}/g, (m, k) => (k in ctx ? ctx[k] : m))
    return mode === 'website' ? text.replace('The two '+ctx.role+' cares about most are marked.','Drivers aligned with the strategic priority are marked.').replace(/\s*·\s*$/, '') : text
  }

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

  const equationHtml = equation => !equation ? '' : mode === 'website'
    ? '<details class="figure-math"><summary>How it is calculated</summary><em class="eq">' + esc(equation) + '</em></details>'
    : '<em class="eq">' + esc(equation) + '</em>'

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
    const F = n.F
    if (key === 'annual') return F.totalValue.incomplete ? null : { label: 'Annual value', value: VM.fmtMoney(n.total), eq: F.totalValue.equation }
    if (key === 'cost') return inputs.portalCost === '' || inputs.portalCost == null ? null : { label: 'Portal cost', value: VM.fmtMoney(Number(inputs.portalCost) || 0), eq: '' }
    if (key === 'net') return F.netValue.incomplete ? null : { label: 'Net, year one', value: VM.fmtMoney(n.net), tone: n.net > 0 ? 'good' : 'bad', eq: F.netValue.equation }
    if (key === 'payback') return F.paybackMonths.incomplete ? null : { label: 'Payback', value: monthsText(n.months), eq: F.paybackMonths.equation }
    if (key === 'roi') return F.roiMultiple.incomplete ? null : { label: 'Return', value: n.roi.toFixed(1) + 'x', eq: F.roiMultiple.equation }
    if (key === 'five') return F.fiveYearValue.incomplete ? null : { label: 'Five-year net', value: VM.fmtMoney(n.five), eq: F.fiveYearValue.equation }
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
      case 'overviewFacts':
        return '<div class="overview-context"><span class="label">THE DIRECTION</span><dl><dt>Company archetype</dt><dd>' + esc(inputs.archetype || 'Not yet specified') + '</dd><dt>Strategic priority</dt><dd>' + esc(inputs.strategicPriority || 'Not yet specified') + '</dd></dl></div>'
      case 'stakeholderMap': return DATA.journeyHtml || ''
      case 'divider':
        return '<hr>'
      case 'spacer':
        return '<div class="spacer"></div>'
      case 'stats': {
        const keys = b.items || ['annual', 'cost', 'net', 'payback', 'roi', 'five']
        if (!keys.map(statItem).filter(Boolean).length) return ''
        return (
          graphic('impact', [
            ...(!M().figures.totalValue.incomplete ? [{label:'Annual business value',value:M().figures.totalValue.value,display:VM.fmtMoney(M().figures.totalValue.value)}] : []),
            ...(inputs.portalCost !== '' && inputs.portalCost != null ? [{label:'Annual Portal spend',value:Number(inputs.portalCost),display:VM.fmtMoney(Number(inputs.portalCost))}] : [])
          ]) + '<div class="stats" data-card-count="' + keys.map(statItem).filter(Boolean).length + '">' +
          keys
            .map(statItem)
            .filter(Boolean)
            .map(i => '<div class="stat ' + (i.tone || '') + '"><span>' + esc(i.label) + '</span><strong>' + esc(i.value) + '</strong>' + equationHtml(i.eq) + '</div>')
            .join('') +
          '</div>'
        )
      }
      case 'drivers': {
        const m = M()
        const groups = VM.driversByPillar(m, inputs.archetype, inputs.strategicPriority)
        if (!groups.length) return ''
        const max = Math.max.apply(null, [1].concat(groups.reduce((acc, g) => acc.concat(g.items.map(d => d.value)), [])))
        const arithmetic = (
          '<div class="chart">' +
          groups
            .map(
              g =>
                '<section class="pillar' + (g.leads ? ' pl' : '') + '"><h3>' + esc(g.label) + '<span>' + esc(VM.fmtMoney(g.total)) + '</span></h3>' +
                g.items
                  .map(d => {
                    const lead = st.lead.indexOf(d.key) >= 0 || d.priority
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
          '</div>' + (DATA.viewMode === 'website' && m.figures.totalValue.incomplete ? '<p class="eq">Complete the remaining inputs to calculate total annual value.</p>' : '<div class="total"><span>Total annual value</span><strong>' + esc(VM.fmtMoneyFull(m.figures.totalValue.value)) + '</strong></div><p class="eq">' + esc(m.figures.totalValue.equation) + '</p>')
        )
        return DATA.viewMode === 'website' ? graphic('drivers', groups.flatMap(g=>g.items.map(d=>({label:d.label,value:d.value,display:VM.fmtMoney(d.value)})))) + '<details class="website-calculation-notes"><summary>View driver arithmetic</summary>'+arithmetic+'</details>' : arithmetic
      }
      case 'pairs': {
        const m = M()
        const show = (p, n) => (p.money ? VM.fmtMoney(n) : VM.fmtDec(n, 2) + (p.unit === '%' ? '%' : ''))
        const rowsOf = VM.PAIRS.filter(p => !m.figures[p.valueFigure].incomplete && !(p.key === 'audit' && !(Number(m.inputs.auditsPerYear) > 0)))
        if (!rowsOf.length) return ''
        const table = (
          '<div class="pairs"><div class="pr ph"><span></span><span>today</span><span>with Portal</span><span>difference</span></div>' +
          rowsOf.map(p => {
            const t = m.inputs[p.today]
            const q = m.inputs[p.portal]
            return (
              '<div class="pr"><span class="pl2">' + esc(p.label) + (p.money || p.unit === '%' ? '' : ' <i>(' + esc(p.unit) + ')</i>') + '</span><b>' + esc(show(p, t)) + '</b><b>' + esc(show(p, q)) +
              '</b><b class="pd">' + esc(show(p, Math.max(0, t - q))) + '</b><em class="eq">' + esc(p.saved) + ': worth ' + esc(VM.fmtMoney(m.figures[p.valueFigure].value)) + '</em></div>'
            )
          }).join('') +
          '</div>'
        )
        return DATA.viewMode === 'website' ? graphic('comparison',rowsOf.map(p=>({label:p.label,unit:p.unit,before:m.inputs[p.today],after:m.inputs[p.portal],beforeDisplay:show(p,m.inputs[p.today]),afterDisplay:show(p,m.inputs[p.portal])}))) + '<details class="website-calculation-notes"><summary>View the underlying numbers</summary>'+table+'</details>' : table
      }
      case 'versus': {
        const F = M().figures
        if (F.versusSelfHost.incomplete) return ''
        const selfHost = F.selfHostCost.value
        const portal = inputs.portalCost >= 0 ? Number(inputs.portalCost) || 0 : 0
        const max = Math.max(selfHost, portal, 1)
        const delta = F.versusSelfHost.raw
        const row = (name, val, tone, eq) =>
          '<div class="v-row"><span>' + name + '</span><div class="track"><div class="fill ' + tone + '" style="width:' + ((val / max) * 100).toFixed(1) + '%"></div></div><b>' + esc(VM.fmtMoney(val)) + '/yr</b>' + (eq ? '<em class="eq">' + esc(eq) + '</em>' : '') + '</div>'
        return (
          (DATA.viewMode === 'website' ? graphic('alternative',[{label:'Self-host open source',value:selfHost,display:VM.fmtMoney(selfHost)+'/yr'},{label:'Spotify Portal',value:portal,display:VM.fmtMoney(portal)+'/yr'}]) + '<div class="alternative-flow" aria-label="Self-hosting annual cost calculation"><div><small>Platform engineers</small><strong>'+esc(VM.fmtDec(Number(inputs.selfHostEngineers),1))+'</strong></div><span>×</span><div><small>Fully loaded salary</small><strong>'+esc(VM.fmtMoney(Number(inputs.selfHostSalary)))+'</strong></div><span>→</span><div><small>Annual self-host cost</small><strong>'+esc(VM.fmtMoney(selfHost))+'</strong></div></div>' : '<div class="versus">' + row('Self-host open source', selfHost, 'bad', F.selfHostCost.equation) + row('Spotify Portal', portal, 'good', '') + '</div>') +
          '<p class="v-note">' + esc(VM.fmtDec(Number(inputs.selfHostEngineers) || 0, 1)) + ' platform engineers at ' + esc(VM.fmtMoney(Number(inputs.selfHostSalary) || 0)) +
          ' fully loaded, permanently, for upgrades, patches and infrastructure. <strong>' +
          esc(delta > 0
            ? 'Portal is ' + VM.fmtMoney(delta) + '/yr cheaper before any of the value above.'
            : 'On these figures self-hosting is cheaper. The case has to rest on the value drivers, not on cost avoidance.') +
          '</strong></p><p class="eq">' + esc(F.versusSelfHost.equation) + '</p>'
        )
      }
      case 'room':
        // No requirements: no block. Client output never shows an empty placeholder.
        return (st.requirements||[]).length?'<section class="client-requirements"><h3>Requirements</h3><ul>'+st.requirements.map(r=>'<li><span aria-hidden="true" class="requirement-box '+(r.status==='Actioned'?'is-done':'')+'"></span><span>'+esc(r.text)+'</span><small>'+esc(r.status)+'</small></li>').join('')+'</ul></section>':''
      default:
        return ''
    }
  }

  function formatAttrs(d = {}) {
    const styles = [], flags = []
    if (/^#[0-9a-f]{6}$/i.test(d.color)) { styles.push('color:' + d.color); flags.push('data-custom-color="1"') }
    if (d.badgeBackground === 'transparent' || /^#[0-9a-f]{6}$/i.test(d.badgeBackground)) styles.push('--badge-background:' + d.badgeBackground)
    if (d.background === 'transparent' || /^#[0-9a-f]{6}$/i.test(d.background)) styles.push('background-color:' + d.background)
    if (d.fontSize && Number.isFinite(Number(d.fontSize))) { const size = Math.min(120, Math.max(10, Number(d.fontSize))) + 'px'; styles.push('font-size:' + size, '--authored-size:' + size); flags.push('data-custom-size="1"') }
    if (['left', 'center', 'right'].includes(d.align)) styles.push('text-align:' + d.align)
    if (['400', '500', '600', '700', '800', '900'].includes(String(d.weight))) { styles.push('font-weight:' + d.weight); flags.push('data-custom-weight="1"') }
    if (d.font) { styles.push('font-family:' + (DATA.fontStacks?.[d.font] || String(d.font).replace(/[^a-zA-Z0-9 _-]/g, '') + ',sans-serif')); flags.push('data-custom-font="1"') }
    return (styles.length ? ' style="' + styles.join(';') + '"' : '') + ' ' + flags.join(' ')
  }

  // Blocks whose text can be edited in place when the page is shown inside the
  // CaseBuilder app (edit mode). A published page never enters edit mode.
  const EDITABLE = { text: 1, quote: 1, columns: 1, image: 1 }
  const SINGLE_LINE = { hero: 1, headline: 1, title: 1, label: 1, eyebrow: 1, tag: 1, forwhom: 1 }
  let editing = false

  // Figures that cannot be computed are absent, and a page with none left is dropped.
  const LIVE = { stats: 1, drivers: 1, pairs: 1, versus: 1 }
  let shown = []
  const motion = mode === 'website' && createMotion ? createMotion($('main'), window, { pageScroll:true }) : null
  let detachJourney=()=>{}
  window.addEventListener('pagehide', () => motion?.destroy())
  window.addEventListener('pagehide', () => detachJourney())

  function render() {
    detachJourney()
    const st = stakeholder()
    const ctx = context(st)
    const main = $('main')
    const keep = mode === 'website' ? window.scrollY : main.scrollTop
    shown = []
    DATA.slides.forEach((s, i) => {
      const parts = s.blocks.map((b, j) => ({ b: b, j: j, html: b.type === 'assumptions' || (mode === 'website' && b.type === 'text' && !fill(b.text, ctx).trim()) ? '' : blockHtml(b, st, ctx) }))
      const live = parts.filter(p => LIVE[p.b.type])
      const liveShown = live.filter(p => p.html)
      const kept = parts.filter(p => (mode === 'website' || LIVE[p.b.type] ? p.html : p.b.type !== 'assumptions'))
      if (mode === 'website' && live.length && !liveShown.length) kept.push({b:{type:'waiting'},j:-1,html:'<div class="story-waiting"><h3>' + esc(DATA.layout?.[i]?.nav || 'Figures') + '</h3><p>These figures will appear when the required inputs are supplied.</p></div>'})
      if (mode !== 'website' && ((live.length && !liveShown.length) || !kept.length)) return
      shown.push({ s: s, i: i, kept: kept })
    })
    const slideHtml = shown
      .map(
        (v, n) =>
          '<section class="slide ' + (v.s.variant === 'hero' ? 'hero-bg' : '') + (DATA.splitCovers?.[v.i]?' brand-split-cover':'') + '" data-kind="' + esc(DATA.layout?.[v.i]?.kind || 'content') + '" data-i="' + n + '"' + (mode !== 'website' && /^#[0-9a-f]{6}$/i.test(v.s.design?.background) ? ' style="background:' + v.s.design.background + '!important"' : '') + '>' + (DATA.splitCovers?.[v.i]?'<img class="cover-photo" src="'+esc(DATA.coverPhoto)+'" alt="'+esc(DATA.coverAlt)+'">':'') + '<div class="inner">' +
          (mode === 'website' && n > 0 ? '<div class="website-section-number">' + String(n + 1).padStart(2, '0') + ' / ' + String(shown.length).padStart(2, '0') + '</div>' : '') + v.kept
            .map(
              p =>
                '<div class="blk" data-s="' + v.i + '" data-b="' + p.j + '"' + (EDITABLE[p.b.type] && (mode !== 'website' || p.b.sourceSlideId) ? ' data-e="1"' : '') + formatAttrs(p.b.design) + '>' +
                p.html +
                '</div>'
            )
            .join('') +
          '</div>' + (mode === 'pdf' ? '<footer class="pdf-footer"><span>' + esc(DATA.company) + ' · Business case</span><span>' + (n + 1) + ' / ' + shown.length + '</span></footer>' : '') + '</section>'
      )
    main.innerHTML = mode === 'pdf' ? slideHtml.map(html => '<div class="pdf-paper">' + html + '</div>').join('') : slideHtml.join('')
    main.scrollTop = keep
    if (mode === 'website') {
      const overview = main.querySelector('[data-kind="overview"] .inner')
      const cover = main.querySelector('[data-kind="cover"] .inner')
      if (cover) cover.insertAdjacentHTML('afterbegin', DATA.artwork || '')
      main.querySelectorAll('[data-perspective]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.perspective === st.key)))
      main.querySelectorAll('h1,h2').forEach(title => { if (title.textContent.length > 55) title.classList.add('long-title') })
      const summary = ['annual', 'payback', 'roi'].map(statItem).filter(Boolean)
      if (overview && summary.length) overview.insertAdjacentHTML('beforeend', '<div class="overview-bento">' + summary.map(i => '<div class="bento-cell"><span>' + esc(i.label) + '</span><strong>' + esc(i.value) + '</strong></div>').join('') + '</div>')
      if (!shown.length) main.innerHTML = '<section class="website-empty"><span class="label">Business case</span><h1>' + esc(DATA.company || 'Your company') + '</h1><p>Your business case is taking shape.</p><p>Add inputs and content to bring the value, comparisons and stakeholder perspectives into view.</p></section>'
      main.insertAdjacentHTML('beforeend', '<footer class="website-end"><span>Business case</span><button data-explore="0">Back to top ↑</button></footer>')
      const annual = statItem('annual')
      $('#scenario-summary').innerHTML = annual ? 'Annual value<strong>' + esc(annual.value) + '</strong>Figures update as you explore.' : 'Add the missing inputs to calculate annual value.'
      main.querySelectorAll('.slide:not([data-kind="cover"]):not([data-kind="content"])').forEach(section => {
        const inner = section.querySelector('.inner')
        const copy = document.createElement('div'), content = document.createElement('div'), more = document.createElement('div')
        const summaries=[]
        copy.className = 'section-copy'; content.className = 'section-content'; more.className = 'section-more'
        Array.from(inner.children).forEach(child => {
          if (child.classList.contains('overview-bento')) {summaries.push(child);return}
          const block = DATA.slides[Number(child.dataset.s)]?.blocks[Number(child.dataset.b)]
          if (block && block.websiteArea === 'more') {more.appendChild(child);return}
          ;(block && (LIVE[block.type] || ['room','overviewFacts','stakeholderMap'].includes(block.type)) || child.querySelector('.story-waiting') ? content : copy).appendChild(child)
        })
        inner.append(copy, content, ...summaries)
        if (more.children.length) inner.append(more)
      })
      window.scrollTo({top:keep,behavior:'instant'})
      updateProgress()
    }
    if (current > shown.length - 1) current = Math.max(0, shown.length - 1)

    $('#audience').innerHTML = mode === 'website' ? (DATA.sliders.length ? '<button data-header-scenario>Adjust the numbers</button>' : '') : DATA.stakeholders
      .map(s => '<button class="' + (s.key === st.key ? 'on' : '') + '" data-key="' + esc(s.key) + '">' + esc(s.role) + '</button>')
      .join('')
    $('#dots').innerHTML = shown
      .map((s, i) => {
        const title = s.s.blocks.find(b => b.type === 'text' && ['label', 'hero', 'title'].includes(b.style))
        const label = mode === 'website' ? fill(DATA.layout?.[s.i]?.nav || (title ? title.text : 'Section ' + (i + 1)), ctx) : ''
        return '<button class="dot ' + (i === current ? 'on' : '') + '" data-go="' + i + '" aria-current="' + (i === current ? 'location' : 'false') + '" aria-label="' + esc(mode === 'website' ? label : 'Go to page ' + (i + 1)) + '">' + esc(label) + '</button>'
      })
      .join('')
    $('#count').textContent = shown.length ? current + 1 + ' / ' + shown.length : ''
    if (mode === 'slides') document.querySelectorAll('.slide').forEach((s, i) => { s.classList.toggle('is-active', i === current); s.setAttribute('aria-hidden', String(i !== current)) })
    if (mode === 'pdf') layoutPdf()
    motion?.refresh()
    if(mode==='website'&&mountJourney)detachJourney=mountJourney($('main'),window)
  }

  function layoutPdf() {
    const scale = Math.min(1, Math.max(.15, ($('main').clientWidth - 32) / 1122.52))
    document.documentElement.style.setProperty('--pdf-scale', scale)
    document.querySelectorAll('.pdf-paper .inner').forEach(inner => {
      inner.style.transform = ''
      const fit = Math.min(1, 665 / Math.max(1, inner.scrollHeight))
      if (fit < 1) inner.style.transform = 'scale(' + fit + ')'
    })
  }
  if (mode === 'pdf') window.addEventListener('resize', layoutPdf)

  function go(i) {
    const slides = document.querySelectorAll('.slide')
    if (!slides.length) return
    current = Math.max(0, Math.min(slides.length - 1, i))
    if (mode === 'slides') {
      slides.forEach((s, n) => { s.classList.toggle('is-active', n === current); s.setAttribute('aria-hidden', String(n !== current)) })
      $('#count').textContent = current + 1 + ' / ' + slides.length
      document.querySelectorAll('.dot').forEach((d, n) => d.classList.toggle('on', n === current))
      return
    }
    const offset = $('.top').getBoundingClientRect().height + $('#dots').getBoundingClientRect().height + 48
    const target = slides[current].getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: Math.max(0,target), behavior: 'instant' })
    slides[current].setAttribute('tabindex','-1')
    slides[current].focus({preventScroll:true})
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
    if(e.target.closest('[data-header-explore]')){go(1);return}
    if(e.target.closest('[data-header-scenario]')){toggleScenario(true);return}
    const k = e.target.getAttribute && e.target.getAttribute('data-key')
    if (k) {
      activeKey = k
      render()
    }
  })
  $('#audience').addEventListener('change', e => { if (e.target.tagName === 'SELECT') { activeKey = e.target.value; render() } })
  $('#dots').addEventListener('click', e => {
    const i = e.target.getAttribute && e.target.getAttribute('data-go')
    if (i != null) go(Number(i))
  })
  function toggleScenario(open) {
    $('#whatif').classList.toggle('open', open)
    $('#whatif-toggle').setAttribute('aria-expanded', String(open))
    if (open) $('#whatif-close').focus()
    else $('#whatif-toggle').focus()
  }
  $('#whatif-toggle').addEventListener('click', () => toggleScenario(!$('#whatif').classList.contains('open')))
  $('#whatif-close').addEventListener('click', () => toggleScenario(false))
  $('main').addEventListener('click', e => {
    const explore = e.target.closest('[data-explore]')
    if (explore) go(Number(explore.dataset.explore))
    if (e.target.closest('[data-scenario]')) toggleScenario(true)
  })
  $('#whatif-reset').addEventListener('click', () => {
    Object.assign(inputs, DATA.inputs)
    buildSliders()
    render()
  })
  $('#prev').addEventListener('click', () => go(current - 1))
  $('#next').addEventListener('click', () => go(current + 1))
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#whatif').classList.contains('open')) { toggleScenario(false); return }
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
    if (mode !== 'slides') return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      go(current + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault()
      go(current - 1)
    }
  })
  // Keep the page counter and dots in step with scrolling.
  function updateProgress() {
    const progress = $('#reading-progress')
    if (!progress) return
    const distance = document.documentElement.scrollHeight - window.innerHeight
    progress.style.width = (distance > 0 ? Math.min(100, window.scrollY / distance * 100) : 100) + '%'
    const cover=$('[data-kind="cover"]')
    document.body.classList.toggle('on-cover',!!cover&&cover.getBoundingClientRect().bottom>Math.max(120,window.innerHeight*.45))
  }
  window.addEventListener('scroll', () => {
    if (mode === 'slides' || mode === 'pdf') return
    updateProgress()
    const slides = document.querySelectorAll('.slide')
    const top = $('.top').getBoundingClientRect().height + $('#dots').getBoundingClientRect().height + 48
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
      document.querySelectorAll('.dot').forEach((d, i) => { d.classList.toggle('on', i === current); d.setAttribute('aria-current', i === current ? 'location' : 'false') })
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
        window.parent.postMessage({ cb: 'edit', slideId: block.sourceSlideId || slide.id, blockId: block.id, field: field, value: value }, '*')
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

  if (DATA.sliders.length && mode === 'website') buildSliders()
  else $('#whatif-toggle').style.display = 'none'
  render()
}
