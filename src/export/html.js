import { siteMain } from './siteClient.js'

// HTML exports. Both builders are pure: they take plain data and return a
// complete HTML document as a string, so the same output can be previewed,
// downloaded, printed, or tested.

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// The Backstage mark as an inline icon, so a downloaded or published page has it in
// its tab without needing any other file.
const iconLink = svg => (svg ? `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(svg)}">` : '')

const FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif, BlinkMacSystemFont, Helvetica, Arial'

// ------------------------------------------------------------ one-pager

// facts: { company, role, headline, cares, stats[{label,value,tone}], drivers[{label,valueStr,pct,color,lead}],
//          total, groups[{label,rows[{label,valueStr,pct,color,lead,detail}]}], versus{rows,lead,verdict}, needs[], objection, counter, open[{label,assumed}], openCount, date }
export function buildOnePager({ facts: f, logoSvg, faviconSvg }) {
  const logo = (logoSvg || '').replace(/#7df3e1/gi, '#1f8a76')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(f.company)} - business case one-pager</title>
${iconLink(faviconSvg)}
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #e9eaec; }
  body { font-family: ${FONT}; color: #15171a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; margin: 0 auto; background: #fff; padding: 14mm 15mm 12mm; display: flex; flex-direction: column; gap: 5mm; position: relative; overflow: hidden; }
  @media print { html, body { background: #fff; } .page { margin: 0; } }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .top .logo svg { height: 22px; width: auto; display: block; }
  .top .meta { font-size: 8.5pt; color: #5b6168; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
  .bar { height: 3px; width: 46px; background: linear-gradient(90deg, #2fc7a8, rgba(155,240,225,0)); margin-top: 1mm; }
  .eyebrow { font-size: 8.5pt; letter-spacing: .06em; text-transform: uppercase; color: #1f8a76; font-weight: 700; margin: 0; }
  h1 { font-size: 27pt; line-height: 1.08; margin: 1mm 0 1.5mm; font-weight: 800; letter-spacing: -.01em; }
  .cares { margin: 0; font-size: 11pt; color: #4a5057; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.5mm; }
  .stat { border: 1px solid #dfe2e6; border-radius: 6px; padding: 2.6mm 2.8mm; background: #f6f8f9; }
  .stat span { display: block; font-size: 6.8pt; letter-spacing: .05em; text-transform: uppercase; color: #6a7078; font-weight: 600; }
  .stat strong { display: block; font-size: 15pt; margin-top: 1mm; font-weight: 800; }
  .stat.good strong { color: #1f8a76; } .stat.bad strong { color: #c8434a; }
  h2 { font-size: 8.5pt; letter-spacing: .06em; text-transform: uppercase; color: #1f8a76; margin: 0 0 2.2mm; font-weight: 700; }
  .row { display: grid; grid-template-columns: 52mm 1fr 20mm; align-items: center; gap: 1mm 3mm; margin-bottom: 1.6mm; font-size: 9pt; }
  .row .lbl { font-weight: 600; }
  .eqline { grid-column: 2 / 4; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 6.6pt; color: #7b838b; margin-top: -1.2mm; }
  .pgroup { font-size: 7.4pt; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; color: #15171a; margin: 1.5mm 0 1.2mm; }
  .row .lbl.dim { font-weight: 400; color: #5b6168; }
  .track { height: 3.2mm; background: #e8ebee; border-radius: 99px; overflow: hidden; }
  .fill { height: 100%; border-radius: 99px; }
  .val { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
  .total { display: flex; justify-content: space-between; border-top: 1px solid #dfe2e6; margin-top: 2mm; padding-top: 2mm; font-size: 9pt; color: #5b6168; }
  .total strong { font-size: 12pt; color: #15171a; }
  .vs { font-size: 9pt; line-height: 1.5; color: #3e444a; margin: 1.5mm 0 0; }
  .vs strong { color: #15171a; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
  ul { margin: 0; padding-left: 4.5mm; font-size: 9.3pt; line-height: 1.5; color: #2f343a; }
  li { margin-bottom: 1mm; }
  blockquote { margin: 0 0 2.5mm; padding: 2mm 3mm; border-left: 3px solid #2fc7a8; background: #f1f8f6; font-style: italic; font-size: 9.5pt; }
  p.small { margin: 0; font-size: 9.3pt; line-height: 1.5; color: #2f343a; }
  .assume { columns: 2; column-gap: 8mm; font-size: 8.6pt; list-style: none; padding: 0; }
  .assume li { display: flex; justify-content: space-between; gap: 3mm; border-bottom: 1px solid #eceff1; padding: .8mm 0; break-inside: avoid; margin: 0; }
  .assume span { color: #6a7078; white-space: nowrap; }
  .foot { margin-top: auto; display: flex; justify-content: space-between; font-size: 7.8pt; color: #7b838b; border-top: 1px solid #dfe2e6; padding-top: 2.5mm; }
  .toolbar { position: fixed; top: 12px; right: 16px; }
  .toolbar button { font: inherit; font-weight: 700; padding: 8px 14px; border-radius: 4px; border: 0; background: #2fc7a8; color: #111; cursor: pointer; }
  @media print { .toolbar { display: none; } }
</style></head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page">
  <div class="top"><div class="logo">${logo}</div><div class="meta">Business case · ${esc(f.date)}</div></div>
  <div>
    <div class="bar"></div>
    <p class="eyebrow">${esc(f.company)} · prepared for ${esc(f.role)}</p>
    <h1>${esc(f.headline)}</h1>
    <p class="cares">${esc(f.cares)}</p>
  </div>

  <div class="stats">${f.stats
    .map(s => `<div class="stat ${s.tone || ''}"><span>${esc(s.label)}</span><strong>${esc(s.value)}</strong></div>`)
    .join('')}</div>

  <section>
    <h2>Where the value comes from</h2>
    ${f.groups
      .map(
        g => `<div class="pgroup">${esc(g.label)}</div>` +
          g.rows
            .map(
              d => `<div class="row"><span class="lbl ${d.lead ? '' : 'dim'}">${esc(d.label)}</span>
          <div class="track"><div class="fill" style="width:${d.pct.toFixed(1)}%;background:${esc(d.color)};opacity:${d.lead ? 1 : 0.5}"></div></div>
          <span class="val">${esc(d.valueStr)}</span><span class="eqline">${esc(d.detail)}</span></div>`
            )
            .join('')
      )
      .join('')}
    <div class="total"><span>Total annual value</span><strong>${esc(f.total)}</strong></div>
  </section>

  <section>
    <h2>Against self-hosting Backstage</h2>
    ${f.versus.rows
      .map(
        r => `<div class="row"><span class="lbl">${esc(r.name)}</span>
          <div class="track"><div class="fill" style="width:${r.pct.toFixed(1)}%;background:${r.tone === 'bad' ? '#e0636a' : '#2fc7a8'}"></div></div>
          <span class="val">${esc(r.valueStr)}</span></div>`
      )
      .join('')}
    <p class="vs">${esc(f.versus.lead)} <strong>${esc(f.versus.verdict)}</strong></p>
  </section>

  <section class="cols">
    <div><h2>What ${esc(f.role)} needs to see</h2><ul>${f.needs.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>
    <div><h2>The objection, and the answer</h2><blockquote>${esc(f.objection)}</blockquote><p class="small">${esc(f.counter)}</p></div>
  </section>

  <section>
    <h2>${f.openCount ? `${f.openCount} input${f.openCount === 1 ? '' : 's'} still to confirm` : 'Every input is confirmed'}</h2>
    ${
      f.openCount
        ? `<ul class="assume">${f.open.map(o => `<li><span style="color:#15171a">${esc(o.label)}</span><span>${esc(o.assumed)}</span></li>`).join('')}</ul>`
        : '<p class="small">Every material input has been confirmed by the customer.</p>'
    }
  </section>

  <div class="foot"><span>${esc(f.company)} · Spotify Portal for Backstage</span><span>Figures come from the inputs above and the value model.</span></div>
</div>
</body></html>`
}

// -------------------------------------------------------------- website

// The model files are inlined into the page as one script, so their import and
// export lines are removed (everything lands in one scope).
export function stripModules(src) {
  return String(src)
    .replace(/^import [^\n]*$/gm, '')
    .replace(/^export \{[^}]*\} from [^\n]*$/gm, '')
    .replace(/^export /gm, '')
}


// args: { company, slides, stakeholders, activeKey, inputs, openFields, sliders, logoSvg, vmSource }
//   slides:       the raw deck (blocks hold text templates, so the site can re-fill them)
//   stakeholders: plain objects { key, role, tag, cares, objection, counter, needsToSee, lead, builtin }
//   vmSource:     the text of format.js, model.js and valueModel.js joined, inlined so the site can recompute live
export function buildWebsite({ company, slides, stakeholders, activeKey, inputs, openFields, sliders, logoSvg, faviconSvg, vmSource }) {
  const data = { company, slides, stakeholders, activeKey, inputs, openFields, sliders, logo: logoSvg }
  // JSON inside a <script> must not be able to close the tag.
  const safe = obj => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  const json = safe(data)
  // The value model, turned into a function that returns what the site needs.
  const vm = `(function(){${stripModules(vmSource)}
return {computeModel:computeModel,STAKEHOLDERS:STAKEHOLDERS,PAIRS:PAIRS,driversByPillar:driversByPillar,fmtMoney:fmtMoney,fmtMoneyFull:fmtMoneyFull,fmtDec:fmtDec,fmtMonths:fmtMonths};})()`

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${iconLink(faviconSvg)}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap">
<title>${esc(company)} · Business case</title>
<style>${SITE_CSS}</style></head>
<body>
<header class="top">
  <div class="brand">${logoSvg}</div>
  <div class="co">${esc(company)}</div>
  <div class="aud-wrap"><span>View as</span><div id="audience" class="audience"></div></div>
  <div class="pager"><button id="prev" aria-label="Previous page">←</button><span id="count"></span><button id="next" aria-label="Next page">→</button></div>
</header>
<nav class="dots" id="dots" aria-label="Pages"></nav>
<main></main>
<button id="whatif-toggle" class="whatif-btn">Adjust the numbers</button>
<aside id="whatif" class="whatif">
  <h3>Adjust the numbers</h3>
  <p>Move a slider and every figure on every page updates.</p>
  <div id="sliders"></div>
  <button id="whatif-reset">Reset to the original</button>
</aside>
<script id="data" type="application/json">${json}</script>
<script>
var DATA = JSON.parse(document.getElementById('data').textContent);
var VM = ${vm};
(${String(siteMain)})(DATA, VM);
</script>
</body></html>`
}

const SITE_CSS = `
:root{--bg:#111111;--panel:#242526;--panel3:#303132;--line:#2e2f31;--line2:#46484b;--ink:#e3e3e3;--strong:#fff;--dim:#a9acb1;--faint:#797c82;--accent:#9bf0de;--mint:#9bf0de;--pink:#e5399a;--bad:#e5399a;--warn:#ffba00}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font-family:${FONT};font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.top{position:fixed;top:0;left:0;right:0;height:56px;display:flex;align-items:center;gap:18px;padding:0 24px;background:var(--bg);border-bottom:1px solid var(--line);z-index:20}
.brand svg{height:22px;width:auto;display:block}.co{font-weight:700;color:var(--strong);white-space:nowrap}
.aud-wrap{display:flex;align-items:center;gap:10px;margin-left:auto;min-width:0}.aud-wrap>span{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);font-weight:600}
.audience{display:flex;gap:6px;overflow-x:auto}.audience button{background:var(--panel);border:1px solid var(--line);color:var(--dim);padding:6px 13px;border-radius:4px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.audience button:hover{color:var(--strong)}.audience button.on{background:var(--accent);border-color:var(--accent);color:#111}
.pager{display:flex;align-items:center;gap:8px;color:var(--dim);font-size:13px}.pager button{width:30px;height:30px;border-radius:4px;border:1px solid var(--line2);background:none;color:var(--ink);cursor:pointer}
.pager button:hover{border-color:var(--ink)}
main{height:100vh;overflow-y:auto;padding-top:56px;scroll-snap-type:y proximity}
.slide{min-height:calc(100vh - 56px);scroll-snap-align:start;display:flex;align-items:center;padding:56px 72px 56px 32px;border-bottom:1px solid var(--line)}
.slide.hero-bg{background:linear-gradient(70.44deg,#111111 55%,#1f3a35)}
.inner{max-width:1000px;margin:0 auto;width:100%}
.label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mint);margin:0 0 16px}
.eyebrow,.forwhom{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--dim);margin:0 0 16px}.forwhom{color:var(--faint);margin-top:28px;border-top:1px solid var(--line2);padding-top:14px;display:inline-block}
h1.hero,h2,.stat strong,.pillar h3{font-family:Outfit,'Avenir Next','Century Gothic',system-ui,sans-serif}
h1.hero{font-size:clamp(44px,8vw,88px);line-height:1.05;margin:0;color:var(--strong);font-weight:800}
h2{font-size:clamp(28px,4vw,40px);line-height:1.12;margin:0 0 10px;color:var(--strong);font-weight:700}
h2.headline{font-size:clamp(34px,6vw,60px);line-height:1.08;font-weight:800;max-width:18ch}
h3{font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--dim);margin:0 0 10px;font-weight:600}
p{margin:0 0 14px}.sub{color:var(--dim);font-size:17px}.lede{font-size:19px;color:var(--dim);max-width:46ch}.note{color:var(--dim);max-width:62ch}.caption{color:var(--faint);font-size:13px}
.tag{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--warn);border:1px solid rgba(255,186,0,.35);border-radius:4px;padding:3px 10px}
.body p{font-size:17px;line-height:1.7;color:var(--dim)}.body ul,.cols ul{margin:0 0 14px;padding-left:22px}.body li,.cols li{font-size:16px;line-height:1.6;color:var(--dim);margin-bottom:8px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:10px}
blockquote{margin:0 0 20px;padding:14px 18px;background:var(--bg);border-left:3px solid var(--accent);border-radius:0 4px 4px 0;font-style:italic;color:var(--strong)}
figure{margin:0 0 16px}figure img{max-width:100%;max-height:60vh;border-radius:6px;display:block}figcaption{color:var(--faint);font-size:13px;margin-top:8px}
hr{border:0;border-top:1px solid var(--line2);margin:22px 0}.spacer{height:40px}.logo svg{height:26px;width:auto;display:block;margin-bottom:34px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 20px}.stat span{display:block;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);margin-bottom:8px}
.stat strong{font-size:32px;font-weight:700;color:var(--strong);font-variant-numeric:tabular-nums}.stat.good strong{color:var(--accent)}.stat.bad strong{color:var(--bad)}
.chart{display:flex;flex-direction:column;gap:18px;margin-top:22px}
.bar-row{display:grid;grid-template-columns:210px 1fr 80px;grid-template-areas:"l t v" "d d d";gap:4px 16px;align-items:center}
.bar-label{grid-area:l;color:var(--dim);font-size:14px;display:flex;align-items:center;gap:8px}.bar-row.lead .bar-label{color:var(--strong);font-weight:600}
.bar-label i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(155,240,222,.2);flex:none}
.track{grid-area:t;height:12px;background:var(--panel3);border-radius:99px;overflow:hidden}.fill{height:100%;border-radius:99px}.fill.bad{background:#e0636a}.fill.good{background:var(--accent)}
.bar-value{grid-area:v;text-align:right;font-variant-numeric:tabular-nums;color:var(--dim)}.bar-row.lead .bar-value{color:var(--strong);font-weight:700}
.bar-detail{grid-area:d;color:var(--faint);font-size:12px;padding-left:226px}
.eq{display:block;font-family:ui-monospace,Menlo,Consolas,monospace;font-style:normal;font-size:12px;color:var(--faint);margin-top:6px;overflow-wrap:anywhere}p.eq{margin:8px 0 0}
.stat .eq{font-size:11px}
.pillar{margin-bottom:6px}.pillar h3{display:flex;justify-content:space-between;color:var(--strong);border-bottom:1px solid var(--line2);padding-bottom:8px;margin-bottom:12px}.pillar.pl h3{color:var(--accent)}.pillar h3 span{font-variant-numeric:tabular-nums}
.pairs{display:flex;flex-direction:column;gap:10px;margin-top:20px}.pr{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:12px;align-items:baseline;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px 16px}.pr.ph{background:none;border:0;padding:0 16px;color:var(--faint);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.pr b{font-variant-numeric:tabular-nums;color:var(--strong);text-align:right}.pr .pd{color:var(--accent)}.pr .eq{grid-column:1/-1;margin:0}.pr .pl2 i{color:var(--faint);font-style:normal;font-size:12px}
.total{display:flex;justify-content:space-between;align-items:baseline;margin-top:26px;padding-top:16px;border-top:1px solid var(--line);color:var(--dim);font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.v-row .track{grid-area:auto}.total strong{font-size:32px;text-transform:none;letter-spacing:0;color:var(--strong)}
.versus{display:flex;flex-direction:column;gap:16px;margin:22px 0}.v-row{display:grid;grid-template-columns:185px 1fr 120px;gap:16px;align-items:center}.v-row .track{height:18px}.v-row b{text-align:right}
.v-note{color:var(--dim);max-width:68ch}.v-note strong{color:var(--strong);display:block;margin-top:8px}
.still{color:var(--strong)}.allgood{color:var(--accent);background:rgba(155,240,222,.07);border:1px solid rgba(155,240,222,.25);padding:18px;border-radius:8px}
.assume{list-style:none;padding:0;margin:14px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px}
.assume li{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:11px 15px;display:flex;justify-content:space-between;gap:12px;font-size:13px}.assume span{color:var(--faint);font-size:12px}
.dots{position:fixed;right:20px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:15}
.dot{width:11px;height:11px;border-radius:50%;border:2px solid var(--line2);background:none;padding:0;cursor:pointer}.dot:hover{border-color:var(--ink)}.dot.on{background:var(--accent);border-color:var(--accent)}
.whatif-btn{position:fixed;left:24px;bottom:24px;z-index:25;background:var(--accent);color:#111;border:0;border-radius:4px;padding:11px 18px;font:inherit;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.03em;cursor:pointer}
.whatif{position:fixed;left:24px;bottom:76px;width:340px;max-height:70vh;overflow:auto;background:var(--panel);border:1px solid var(--line2);border-radius:10px;padding:18px 20px;z-index:25;display:none;box-shadow:0 12px 40px rgba(0,0,0,.5)}
.whatif.open{display:block}.whatif h3{color:var(--strong);font-size:15px;text-transform:none;letter-spacing:0;margin:0 0 4px}.whatif p{color:var(--dim);font-size:13px}
.whatif label{display:block;margin:14px 0}.whatif label span{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}.whatif label b{color:var(--accent)}
.whatif input[type=range]{width:100%;accent-color:var(--accent)}.whatif button{margin-top:6px;background:none;border:1px solid var(--line2);color:var(--ink);border-radius:4px;padding:7px 12px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.editing .blk[data-e]:hover{outline:1px dashed rgba(155,240,222,.6);outline-offset:6px;cursor:text;border-radius:4px}
.edit-ta{display:block;width:100%;resize:none;overflow:hidden;font:inherit;color:inherit;letter-spacing:inherit;line-height:inherit;text-transform:inherit;background:rgba(155,240,222,.1);border:1px dashed var(--accent);border-radius:4px;padding:2px 8px;margin:0}
.edit-ta:focus{outline:none;border-style:solid}
@media(max-width:780px){.top{gap:10px;padding:0 12px}.co{display:none}.aud-wrap>span{display:none}.slide{padding:40px 36px 40px 16px}.cols,.stats{grid-template-columns:1fr}.bar-row{grid-template-columns:1fr 70px;grid-template-areas:"l v" "t t" "d d"}.bar-detail{padding-left:0}.v-row{grid-template-columns:1fr 90px}.v-row .track{grid-column:1/-1;order:3}.whatif{left:12px;right:12px;width:auto}}
`
