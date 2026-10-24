import { siteMain } from './siteClient.js'
import { WEBSITE_CSS } from './websiteStyle.js'
import { createWebsiteMotion } from './websiteMotion.js'
import { LANDING_CSS, landingArtwork } from './websiteLanding.js'
import { fontStack } from '../brand.js'
import { websiteStory } from './websiteStory.js'
import { renderWebsiteGraphic, GRAPHIC_CSS } from './websiteGraphics.js'
import { stakeholderJourneyHtml, mountStakeholderJourney } from './stakeholderJourney.js'
import { websiteSection, websiteBlockDesign, websiteThemeCss } from './websiteFramework.js'

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
export { buildOnePager } from './onePager.js'

// ------------------------------------------------------- internal summary (Chris's page)

const STATE_NAME = { empty: 'Empty', input: 'Input', assumption: 'Assumption', suggestion: 'Suggestion' }

// facts: from prepareInternal(). One printed page of everything still open.
export function buildInternalSummary({ facts: f, logoSvg, faviconSvg }) {
  const logo = (logoSvg || '').replace(/#7df3e1/gi, '#1f8a76')
  const when = iso => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(f.company)} - inputs and open questions</title>
${iconLink(faviconSvg)}
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #e9eaec; }
  body { font-family: ${FONT}; color: #15171a; font-size: 9pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; margin: 0 auto; background: #fff; padding: 12mm 14mm; }
  @media print { html, body { background: #fff; } .page { width: auto; margin: 0; padding: 0; } .toolbar { display: none; } }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; }
  .top svg { height: 20px; width: auto; display: block; }
  .meta { font-size: 8pt; color: #5b6168; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
  h1 { font-size: 19pt; margin: 0 0 1mm; line-height: 1.1; }
  h2 { font-size: 8pt; letter-spacing: .06em; text-transform: uppercase; color: #1f8a76; margin: 5mm 0 2mm; }
  .facts { display: flex; gap: 6mm; flex-wrap: wrap; margin: 3mm 0; }
  .fact { border: 1px solid #dfe2e6; border-radius: 6px; padding: 2mm 3mm; background: #f6f8f9; }
  .fact span { display: block; font-size: 6.5pt; text-transform: uppercase; letter-spacing: .05em; color: #6a7078; font-weight: 600; }
  .fact strong { font-size: 13pt; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 6.8pt; text-transform: uppercase; letter-spacing: .05em; color: #6a7078; border-bottom: 1px solid #c9ced3; padding: 1mm 1.5mm; }
  td { padding: 1.1mm 1.5mm; border-bottom: 1px solid #eceff1; vertical-align: top; }
  tr.grp td { background: #f1f4f6; font-weight: 700; font-size: 7.4pt; text-transform: uppercase; letter-spacing: .05em; }
  .st { display: inline-block; font-size: 6.8pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: .3mm 1.6mm; border-radius: 99px; border: 1px solid #c9ced3; white-space: nowrap; }
  .st-input { color: #1f8a76; border-color: #1f8a76; }
  .st-assumption { color: #8a6500; border-color: #c99a00; }
  .st-suggestion { color: #a3226f; border-color: #e5399a; }
  .st-empty { color: #6a7078; border-style: dashed; }
  .origin { color: #3e444a; } .origin a { color: inherit; }
  ul.q { margin: 0; padding-left: 5mm; } ul.q li { margin-bottom: 1.3mm; }
  .q em { color: #6a7078; font-style: normal; }
  .toolbar { position: fixed; top: 12px; right: 16px; }
  .toolbar button { font: inherit; font-weight: 700; padding: 8px 14px; border-radius: 4px; border: 0; background: #2fc7a8; color: #111; cursor: pointer; }
</style></head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page">
  <div class="top"><div>${logo}</div><div class="meta">Inputs and open questions · ${esc(f.date)}</div></div>
  <h1>${esc(f.company)}</h1>
  <div class="facts">
    <div class="fact"><span>Case confidence</span><strong>${f.confidence}%</strong></div>
    <div class="fact"><span>Figures computed</span><strong>${f.figuresDone} of ${f.figuresTotal}</strong></div>
    <div class="fact"><span>Connections the agent could read</span><strong style="font-size:9.5pt">${f.connections.length ? esc(f.connections.join(', ')) : 'None'}</strong></div>
  </div>
  <p style="margin:0;color:#5b6168">Confidence counts inputs only: what the customer stated or a public source shows. Assumptions and suggestions are listed below as questions to confirm. This page is for you; it is not part of the client deck.</p>

  ${
    f.waiting.length
      ? `<h2>Figures not yet in the deck</h2><ul class="q">${f.waiting.map(w => `<li><strong>${esc(w.label)}</strong> <em>needs ${esc(w.missing.join(', '))}</em></li>`).join('')}</ul>`
      : ''
  }

  <h2>Every input, its state and where it came from</h2>
  <table>
    <tr><th>Input</th><th>Value</th><th>State</th><th>Origin</th></tr>
    ${f.groups
      .map(
        g => `<tr class="grp"><td colspan="4">${esc(g.group)}</td></tr>` +
          g.rows
            .map(
              r => `<tr><td>${esc(r.label)}</td><td>${esc(r.value) || '—'}</td><td><span class="st st-${r.state}">${STATE_NAME[r.state]}</span></td><td class="origin">${esc(r.origin)}${r.pinnedAt ? ` <em style="color:#7b838b">· pinned ${esc(when(r.pinnedAt))}</em>` : ''}</td></tr>`
            )
            .join('')
      )
      .join('')}
  </table>

  <h2>Questions to confirm (${f.questions.length})</h2>
  ${
    f.questions.length
      ? `<ul class="q">${f.questions
          .map(q => `<li><strong>${esc(q.label)}</strong> ${q.value ? `<em>We have ${esc(q.value)} (${esc(STATE_NAME[q.state].toLowerCase())}).</em>` : '<em>Not yet known.</em>'}</li>`)
          .join('')}</ul>`
      : '<p>Every input is confirmed.</p>'
  }
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
export function buildWebsite({ company, slides, stakeholders, activeKey, inputs, openFields, sliders, logoSvg, faviconSvg, vmSource, viewMode = 'website', websiteBrand }) {
  viewMode = ['website', 'pdf', 'slides'].includes(viewMode) ? viewMode : 'website'
  if (viewMode === 'website') slides = websiteStory(slides).map(s => ({ ...s, blocks: s.blocks.map(b => ({ ...b, design: b.design?.color || b.design?.background ? websiteBlockDesign(b.design, websiteBrand) : b.design })) }))
  const data = { company, slides, stakeholders, activeKey, inputs, openFields, sliders: sliders || [], logo: logoSvg || '', viewMode, layout: viewMode === 'website' ? slides.map(websiteSection) : [], artwork: viewMode === 'website' ? landingArtwork({ company, logo:logoSvg, roles:stakeholders, cover:true }) : '' }
  // JSON inside a <script> must not be able to close the tag.
  const safe = obj => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  data.fontStacks = Object.fromEntries(slides.flatMap(s=>s.blocks).filter(b=>b.design?.font).map(b=>[b.design.font,fontStack(b.design.font)]))
  data.journeyHtml = viewMode==='website' ? stakeholderJourneyHtml(company,logoSvg,stakeholders) : ''
  const json = safe(data)
  const needsOutfit = [websiteBrand?.headingFont || 'Outfit', websiteBrand?.bodyFont, ...Object.keys(data.fontStacks)].some(font=>String(font).split(',').some(name=>name.trim()==='Outfit'))
  // The value model, turned into a function that returns what the site needs.
  const vm = `(function(){${stripModules(vmSource)}
return {computeModel:computeModel,STAKEHOLDERS:STAKEHOLDERS,PAIRS:PAIRS,driversByPillar:driversByPillar,fmtMoney:fmtMoney,fmtMoneyFull:fmtMoneyFull,fmtDec:fmtDec,fmtMonths:fmtMonths};})()`

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${iconLink(faviconSvg)}
${needsOutfit ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap">' : ''}
<title>${esc(company)} · Business case</title>
<style>${SITE_CSS}\n${VIEW_CSS}\n${viewMode === 'website' ? WEBSITE_CSS + LANDING_CSS + GRAPHIC_CSS + websiteThemeCss(websiteBrand) : ''}</style></head>
<body class="view-${viewMode}">
<header class="top">
  <div class="brand">${logoSvg || (viewMode === 'website' ? '<span class="company-monogram">' + esc(String(company || 'C').slice(0, 1).toUpperCase()) + '</span>' : '')}</div>
  <div class="co">${esc(company)}</div>
  <div class="aud-wrap">${viewMode==='website'?'':'<span>Perspective</span>'}<div id="audience" class="audience"></div></div>
  <div class="pager"><button id="prev" aria-label="Previous page">←</button><span id="count"></span><button id="next" aria-label="Next page">→</button></div>
</header>
<nav class="dots" id="dots" aria-label="Pages"></nav>
${viewMode === 'website' ? '<div class="website-progress" aria-hidden="true"><span id="reading-progress"></span></div>' : ''}
<main></main>
<button id="whatif-toggle" class="whatif-btn" aria-controls="whatif" aria-expanded="false">Adjust the numbers</button>
<aside id="whatif" class="whatif" aria-label="Scenario explorer">
  <div class="whatif-heading"><h3>Adjust the numbers</h3><button id="whatif-close" class="whatif-close" aria-label="Close scenario explorer">×</button></div>
  <p>Move a slider and every figure on every page updates.</p>
  <div id="scenario-summary" class="scenario-summary" aria-live="polite"></div>
  <div id="sliders"></div>
  <button id="whatif-reset">Reset to the original</button>
</aside>
<script id="data" type="application/json">${json}</script>
<script>
var DATA = JSON.parse(document.getElementById('data').textContent);
var VM = ${vm};
(${String(siteMain)})(DATA, VM, ${viewMode === 'website' ? String(createWebsiteMotion) : 'null'}, ${viewMode === 'website' ? String(mountStakeholderJourney) : 'null'}, ${viewMode === 'website' ? String(renderWebsiteGraphic) : 'null'});
</script>
</body></html>`
}

const VIEW_CSS = `
button,select{font:inherit}button{transition:background .15s,border-color .15s}button:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.view-slides .aud-wrap,.view-slides .whatif-btn,.view-slides .whatif{display:none!important}
.view-slides .pager{margin-left:auto}.view-slides main{overflow:hidden}
.view-slides .slide{display:none;height:calc(100dvh - 56px);min-height:0;overflow:auto;align-items:flex-start}
.view-slides .slide.is-active{display:flex}.view-slides .slide .inner{margin:auto}
.view-pdf{background:#343638!important}.view-pdf .top,.view-pdf .dots,.view-pdf .whatif,.view-pdf .whatif-btn{display:none!important}
.view-pdf main{height:100vh;overflow:auto;padding:0;scroll-snap-type:none}
.pdf-paper{position:relative;width:calc(1122.52px * var(--pdf-scale,1));height:calc(793.70px * var(--pdf-scale,1));margin:24px auto;box-shadow:0 5px 28px #0006;overflow:hidden}
.view-pdf .pdf-paper>.slide{box-sizing:border-box;width:1122.52px;height:793.70px;min-height:0;display:flex;align-items:flex-start;padding:48px 64px 58px;transform:scale(var(--pdf-scale,1));transform-origin:top left;position:relative;border:0;overflow:hidden}
.view-pdf .inner{width:100%;max-width:none;margin:0;transform-origin:top left}
.pdf-footer{position:absolute;bottom:18px;left:64px;right:64px;display:flex;justify-content:space-between;color:var(--faint);font-size:10px}
.view-website .top{position:relative;min-height:64px;height:auto;gap:18px;padding:14px 28px}
.view-website .brand{flex:none;min-width:28px}.view-website .brand img{height:28px;width:auto;max-width:160px;object-fit:contain;display:block}.view-website .brand svg{height:26px}
.view-website .pager{display:none}.view-website .aud-wrap{margin-left:auto}
.website-audience{max-width:320px;padding:8px 32px 8px 12px;border:1px solid var(--line2);border-radius:9px;background:var(--panel);color:var(--ink);font-size:13px}
.view-website .dots{position:relative;top:auto;right:auto;transform:none;display:flex;flex-direction:row;gap:8px;padding:10px 28px;overflow-x:auto;border-bottom:1px solid var(--line);background:var(--bg);min-height:54px}
.view-website .dot{width:auto;height:auto;flex:none;border:1px solid var(--line2);border-radius:99px;padding:6px 14px;font-size:12px;color:var(--dim);white-space:nowrap}
.view-website .dot.on{color:#111;border-color:var(--accent)}
.view-website main{height:calc(100dvh - 118px);padding-top:0;scroll-snap-type:none;scroll-behavior:smooth}
.view-website .slide{min-height:0;scroll-snap-align:none;display:block;padding:64px 48px}
.view-website .slide:first-child{padding-top:80px;padding-bottom:80px;min-height:440px}
.view-website .slide .inner{max-width:1100px}.view-website .whatif-btn{border-radius:99px;text-transform:none;letter-spacing:0;box-shadow:0 5px 24px #0004}
.view-website .whatif{border-radius:16px}.view-website .whatif button{border-radius:8px}
@media(max-width:780px){.view-website .top{padding:12px 16px}.view-website .dots{padding:10px 16px}.view-website .slide{padding:36px 24px}.website-audience{max-width:220px}.view-website .aud-wrap{margin-left:auto}}
@page{size:A4 landscape;margin:0}
@media print{
 html,body{height:auto!important;background:transparent!important;print-color-adjust:exact;-webkit-print-color-adjust:exact}
 .top,.dots,.whatif,.whatif-btn{display:none!important}
 main{height:auto!important;overflow:visible!important;padding:0!important}
 .pdf-paper{width:297mm!important;height:210mm!important;margin:0!important;box-shadow:none;break-after:page;page-break-after:always;overflow:hidden}
 .pdf-paper:last-child{break-after:auto;page-break-after:auto}
 .view-pdf .pdf-paper>.slide{width:297mm!important;height:210mm!important;transform:none!important}
 .view-slides .slide{display:flex!important;min-height:210mm;height:210mm;break-after:page;overflow:hidden}
}
`

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
