// The website inherits the company palette and typography. Decoration never
// competes with the company identity; motion is reserved for the stakeholder story.
export const EDITORIAL_CSS = `
.landing-art.cover-art.has-brand-image{position:relative;width:min(1120px,88vw);margin:0 auto 24px}.cover-art .brand-logo-overlay{position:absolute;left:24px;bottom:24px;background:var(--bg);padding:18px 24px}@media(max-width:599px){.cover-art.has-brand-image .brand-cover-image figcaption{top:8px;bottom:auto;right:8px}.cover-art .brand-logo-overlay{left:12px;bottom:12px;padding:10px 12px;max-width:calc(100% - 24px)}.cover-art .brand-logo-overlay .co-brand{gap:10px!important}.view-website .slide[data-kind="cover"]:has(.brand-cover-image) .brand-logo-overlay img{height:36px!important;max-height:36px!important;max-width:42vw!important;min-width:0}}.brand-cover-image{width:min(1120px,88vw);height:clamp(220px,38vw,480px);margin:0 auto 44px;position:relative;overflow:hidden}.brand-cover-image img{width:100%;height:100%;object-fit:cover}.cover-art.has-brand-image .brand-cover-image{margin:0;width:100%}.brand-cover-image figcaption{position:absolute;bottom:8px;right:12px;font-size:10px;background:var(--bg);color:var(--ink);padding:4px 8px}.brand-cover-image a{color:inherit}.view-website .slide[data-kind="cover"]:has(.brand-cover-image){padding-top:56px;min-height:100svh}.view-website .slide[data-kind="cover"]:has(.brand-cover-image) .landing-logo img{height:72px!important;max-height:72px!important;max-width:220px!important;width:auto!important}.client-requirements{list-style:none!important;padding:0!important;margin:16px 0}.client-requirements li{display:grid;grid-template-columns:18px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid var(--line);align-items:start}.client-requirements small{grid-column:2;color:var(--dim);font-size:11px}.requirement-box{display:inline-block;width:14px;height:14px;border:1px solid currentColor;margin-top:4px;flex:none}.requirement-box.is-done:after{content:'';display:block;width:7px;height:4px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);margin:3px 2px}@media(max-width:799px){.relation-center{width:88px;padding:8px}.relation-node{width:116px}}.relation-badge img{width:100%;height:100%;object-fit:cover;border-radius:50%}.view-website .slide[data-kind="overview"] h2{font-size:clamp(32px,4.5vw,60px);max-width:19ch}.view-website .overview-bento{border-top:1px solid var(--line);border-bottom:1px solid var(--line)}

html:has(.view-website){height:auto;scroll-behavior:smooth;scroll-padding-top:120px}
body.view-website{display:block;height:auto;min-height:100svh;overflow:visible;background:var(--bg)}
.view-website main{height:auto!important;overflow:visible;padding:0;min-height:0}
.view-website .top{position:fixed;top:0;left:0;margin:0;width:100%;max-width:none;height:64px;min-height:64px;padding:12px max(24px,calc((100vw - 1120px)/2));border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none;background:var(--bg);z-index:30;transition:opacity .2s}
.view-website .top .brand img,.view-website .top .brand svg{height:24px;max-width:100px}.view-website .top .co{font-size:13px}
.view-website.on-cover .top,.view-website.on-cover .dots{opacity:0;visibility:hidden;pointer-events:none}
.view-website .aud-wrap{margin-left:auto;gap:12px}.view-website .audience{gap:14px}
.view-website .audience button{font:inherit;font-size:11px;border:0;border-radius:0;background:none;color:var(--ink);padding:8px 0;font-weight:600}
.view-website .audience button:hover{text-decoration:underline;text-underline-offset:5px}
.view-website .dots{position:fixed;top:64px;left:0;right:0;margin:0 auto;padding:0 max(24px,calc((100vw - 1120px)/2));min-height:42px;width:100%;max-width:none;border:0;border-bottom:1px solid var(--line);border-radius:0;background:var(--bg);gap:24px;z-index:29;transition:opacity .2s}
.view-website .dot{padding:12px 0;font-size:10px;border-radius:0}.view-website .dot:hover{background:none}.view-website .dot:after{height:1px;bottom:0}
.website-progress{position:fixed;inset:0 0 auto;height:1px;background:none;z-index:40}
.view-website .slide{padding:96px max(24px,calc((100vw - 1120px)/2));border:0;background:var(--bg);min-height:0}
.view-website .slide.hero-bg,.view-website .slide[data-kind="cover"]{background:var(--bg)!important}
.view-website .slide.hero-bg:before{display:none}
.view-website .slide[data-kind="cover"]{min-height:100svh;margin-top:0;display:flex;align-items:center;justify-content:center;padding-top:120px;padding-bottom:80px;text-align:center}
.view-website .slide[data-kind="cover"] .inner{display:flex;flex-direction:column;align-items:center;gap:0}
.view-website .slide[data-kind="cover"] .blk:has(.logo){display:none}
.view-website .slide[data-kind="cover"] .blk{width:100%;text-align:center!important}
.view-website .slide[data-kind="cover"] h1.hero{font-size:clamp(28px,3vw,44px);font-weight:600;max-width:28ch;margin:20px auto 0;letter-spacing:-.02em;line-height:1.15}
.view-website .slide[data-kind="cover"] .blk[data-custom-size]:has(h1.hero){font-size:min(var(--authored-size),clamp(28px,3vw,44px))!important}
.landing-art.cover-art{width:auto;height:auto;display:block;margin:0 auto 12px}
.landing-logo{border:0;border-radius:0;background:none;box-shadow:none;animation:none;width:auto;height:auto;display:flex;align-items:center;justify-content:center}
.landing-logo img,.landing-logo svg{width:clamp(160px,22vw,280px)!important;height:auto!important;max-width:280px!important;max-height:150px!important;object-fit:contain}.landing-initial{font-size:90px;line-height:1;font-weight:700;color:var(--strong)}
.view-website .website-actions{justify-content:center;margin-top:44px;gap:26px}
.view-website .website-actions button{border:0;border-bottom:1px solid var(--line2);border-radius:0;background:none!important;color:var(--ink)!important;box-shadow:none!important;padding:10px 0;min-height:0;gap:12px;font-size:11px;font-weight:500}
.view-website .website-actions button:first-child:after{background:none;width:auto;height:auto;font-size:14px}
.view-website .website-actions button:hover{transform:none!important;text-decoration:underline;text-underline-offset:5px}
.view-website .slide[data-kind="cover"] .website-actions button[data-scenario]{display:none}
.view-website .slide:not([data-kind="cover"]) .inner{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.3fr);gap:64px;align-items:start}
.view-website .section-copy{position:sticky;top:140px;min-width:0}.view-website .section-content{min-width:0}
.view-website .website-section-number{display:none}
.view-website .section-copy h2{font-size:clamp(28px,3vw,42px);line-height:1.15;max-width:23ch;letter-spacing:-.025em}
.view-website .section-copy .blk[data-custom-size]:has(h2){font-size:min(var(--authored-size),clamp(28px,3vw,42px))!important}
.view-website .section-copy .blk[data-custom-size]:has(.note,.sub,.lede){font-size:min(var(--authored-size),16px)!important}
.view-website .stats{margin:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border-top:1px solid var(--line)}
.view-website .stat{background:none;border:0;border-bottom:1px solid var(--line);border-radius:0;padding:24px 20px 24px 0;box-shadow:none;min-width:0}
.view-website .stat:hover,.view-website .pillar:hover{transform:none;box-shadow:none;border-color:var(--line)}
.view-website .stat strong{font-size:clamp(26px,3vw,40px)}.view-website .stat .eq{border:0}
.view-website .overview-bento{grid-column:1/-1;width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:none;border:0;border-block:1px solid var(--line);border-radius:0;margin:0}
.view-website .bento-cell,.view-website .bento-cell:first-child{grid-column:auto;background:none;border-right:1px solid var(--line);padding:24px}.view-website .bento-cell:last-child{border:0}.view-website .bento-cell:hover{background:none}
.overview-context,.story-waiting{padding:24px 0;border:0;border-top:1px solid var(--line);background:none;color:var(--ink)}.overview-context h3{font-size:24px;text-transform:none;letter-spacing:-.02em;color:var(--strong);margin:8px 0 22px}.overview-context dl{margin:0}.overview-context dt{font-size:10px;color:var(--dim);margin:16px 0 4px}.overview-context dd{margin:0;font-size:16px}.story-waiting h3{text-transform:none;color:var(--strong);font-size:22px}.story-waiting p{color:var(--dim);font-size:14px}
.view-website .pillar{background:none;border:0;border-radius:0;border-top:1px solid var(--line);padding:20px 0}.view-website .section-content .chart,.view-website .section-content .pairs,.view-website .section-content .versus{margin-top:0}.view-website .section-content .bar-row{grid-template-columns:1fr 80px;grid-template-areas:"l v" "t t" "d d"}.view-website .bar-detail{padding-left:0}
.view-website .pr{border-radius:0;background:none}.view-website .cols{grid-template-columns:1fr}
.view-website .whatif-btn{display:none}
.view-website .whatif{border-radius:4px;box-shadow:0 8px 30px #0003}.view-website .whatif input{accent-color:var(--accent)}
.view-website .slide[data-kind="stakeholder"]{padding-top:72px;padding-bottom:0}.view-website .slide[data-kind="stakeholder"]>.inner{display:block;max-width:1120px}.view-website .slide[data-kind="stakeholder"] .section-copy{position:static;margin-bottom:40px;max-width:650px}
.stakeholder-journey{height:calc(var(--journey-stops)*80svh + 70svh);position:relative}
.journey-stage{position:sticky;top:110px;height:calc(100svh - 126px);min-height:340px;max-height:850px;overflow:hidden}
.journey-map{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:92%;height:min(420px,calc(100% - 60px));transition:left .65s cubic-bezier(.2,.7,.3,1),width .65s cubic-bezier(.2,.7,.3,1)}
.journey-stage.has-focus .journey-map{left:25%;width:48%}.journey-stage.has-focus.map-on-right .journey-map{left:75%}
.relation-map{position:relative;width:100%;height:100%}.relation-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.relation-lines line{stroke:var(--line2);stroke-width:1;transition:stroke .3s}.relation-lines line.is-selected{stroke:var(--site-accent-text)}
.relation-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:130px;min-height:76px;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;text-align:center;padding:12px;background:var(--bg);border:1px solid var(--line);border-radius:4px;z-index:2}.relation-center img,.relation-center svg{max-width:65px;max-height:26px;width:auto;height:26px}.relation-center small{font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em}.relation-center strong{font-size:12px;overflow-wrap:anywhere;line-height:1.4}
.relation-node{position:absolute;transform:translate(-50%,-50%);width:168px;min-height:60px;display:flex;align-items:center;gap:9px;padding:10px;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:4px;text-align:left;font:inherit;cursor:pointer;z-index:3;transition:left .65s cubic-bezier(.2,.7,.3,1),top .65s cubic-bezier(.2,.7,.3,1),border-color .2s}
.relation-badge{width:28px;height:28px;flex:none;display:grid;place-items:center;background:var(--panel);border:1px solid var(--line);border-radius:3px;font-size:9px;font-weight:600;color:var(--dim)}.relation-node strong{display:block;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.relation-node small{display:block;font-size:9px;color:var(--dim)}.relation-node.is-selected,.relation-node:hover{border-color:var(--site-accent-text)}.relation-node.is-selected .relation-badge{color:var(--site-accent-text)}
.journey-copy{position:absolute;left:55%;top:50%;transform:translateY(-50%);width:43%;max-height:calc(100% - 72px);overflow:auto;scrollbar-width:thin;scroll-margin-top:118px}.journey-stage.map-on-right .journey-copy{left:0}
.journey-brief{animation:brief-enter .4s ease-out both;padding-right:12px}.journey-brief h3{font-size:clamp(24px,2.5vw,36px);text-transform:none;line-height:1.12;letter-spacing:-.025em;color:var(--strong);margin:14px 0 20px}.journey-brief h4{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:26px 0 8px}.journey-brief p,.journey-brief li{font-size:13px;line-height:1.75;color:var(--ink)}.journey-brief ul{padding-left:18px}.journey-brief .label{font-size:9px;color:var(--site-accent-text)}
.journey-brief .label{margin:0}.journey-brief h3{margin:12px 0 14px}.journey-brief h4{margin:18px 0 6px}.journey-brief ul{margin:0 0 14px}.journey-brief li{margin-bottom:5px}.journey-response{border-top:1px solid var(--line);padding-top:12px;margin-top:14px}.journey-response summary{font-size:11px;color:var(--dim);cursor:pointer}.journey-response[open] summary{color:var(--ink)}.view-website .slide:focus,.journey-copy:focus,.journey-stage:focus{outline:none}
.journey-controls{position:absolute;bottom:8px;left:0;right:0;display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid var(--line);padding-top:14px}.journey-controls button{font:inherit;font-size:10px;background:none;border:0;padding:5px 0;color:var(--ink);cursor:pointer}.journey-controls button:hover{text-decoration:underline}.journey-controls button:disabled{opacity:.4;cursor:default}.journey-step-label{font-size:10px;letter-spacing:.06em;color:var(--dim)}
.view-website .website-end{border-top:1px solid var(--line);padding:28px max(24px,calc((100vw - 1120px)/2)) 80px}
@keyframes brief-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* Distinct compositions let the evidence, rather than repeated containers,
   establish the rhythm. All colors and faces still come from the company. */
.view-website{scrollbar-color:var(--dim) var(--bg)}
.view-website ::selection{background:var(--accent);color:var(--bg)}
.view-website button:focus-visible,.view-website summary:focus-visible,.view-website input:focus-visible{outline:2px solid var(--site-accent-text);outline-offset:5px}
.view-website .slide:not([data-kind="cover"]){border-top:1px solid var(--line);padding-top:100px;padding-bottom:100px}
.view-website .section-copy h2{font-size:clamp(34px,4.6vw,58px);line-height:1.06;letter-spacing:-.035em;text-wrap:balance;margin:0 0 28px;max-width:20ch}
.view-website .section-copy .blk[data-custom-size]:has(h2){font-size:min(var(--authored-size),clamp(34px,4.6vw,58px))!important}
.view-website .section-copy p{line-height:1.7;max-width:65ch}
.view-website .slide[data-kind="cover"]{position:relative}
.cover-scroll-hint{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;align-items:center;flex-direction:column;gap:14px;color:var(--dim);font-size:11px}
.view-website .overview-context>.label{display:none}
.view-website .slide[data-kind="overview"] .overview-context{padding-top:0;border-top:0}
.view-website .overview-bento{margin-top:28px;border-bottom:0}
.view-website .bento-cell{padding:32px 28px 0 0}
.view-website .bento-cell:not(:first-child){padding-left:28px}
.view-website .bento-cell strong{font-size:clamp(30px,4vw,52px);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.view-website .slide[data-kind="impact"] .inner{display:block}
.view-website .slide[data-kind="impact"] .section-copy{position:static;display:grid;grid-template-columns:1.1fr 1fr;gap:40px;margin-bottom:48px;align-items:end}
.view-website .slide[data-kind="impact"] .section-copy h2{max-width:17ch;margin:0}
.view-website .slide[data-kind="impact"] .section-copy p{margin:0;padding-bottom:5px}
.view-website .slide[data-kind="impact"] .section-content .blk{display:grid;grid-template-columns:1fr 1.15fr;gap:52px;align-items:start}
.view-website .slide[data-kind="impact"] .annual-graphic{border:0;margin:0;padding:20px 0}
.view-website .slide[data-kind="impact"] .stats{border-top:0}
.view-website .slide[data-kind="drivers"] .inner{grid-template-columns:minmax(0,1.35fr) minmax(0,.8fr)}
.view-website .slide[data-kind="drivers"] .section-content{grid-column:1;grid-row:1}
.view-website .slide[data-kind="drivers"] .section-copy{grid-column:2;grid-row:1}
.view-website .slide[data-kind="alternative"] .inner{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:80px}
.view-website .website-calculation-notes summary{padding:8px 0}
.view-website .graphic-legend li{padding:9px 0;border-bottom:1px solid var(--line)}
.view-website .graphic-legend li:hover{color:var(--site-accent-text)}
.view-website .annual-graphic-row>div{font-size:14px}
.view-website .annual-graphic-row strong{font-size:20px;font-weight:500;letter-spacing:-.02em}
.view-website .change-graphic-row{padding:24px 0}
.view-website .change-graphic-label strong{font-size:15px}
.view-website .change-graphic-values{font-size:12px}
.view-website .change-graphic-values b{font-size:16px}
.view-website .website-end button{font:inherit;font-size:12px;background:none;color:var(--ink);border:0;padding:12px 0;cursor:pointer;text-underline-offset:5px}
.view-website .website-end button:hover{text-decoration:underline}
@media(max-width:799px){
 .view-website .slide:not([data-kind="cover"]){padding-top:64px;padding-bottom:64px}
 .view-website .slide[data-kind="impact"] .section-copy,.view-website .slide[data-kind="impact"] .section-content .blk{display:block}
 .view-website .slide[data-kind="impact"] .section-copy h2{margin-bottom:24px}
 .view-website .slide[data-kind="drivers"] .inner,.view-website .slide[data-kind="alternative"] .inner{grid-template-columns:1fr;gap:28px}
 .view-website .slide[data-kind="drivers"] .section-copy,.view-website .slide[data-kind="drivers"] .section-content{grid-column:auto;grid-row:auto}
 .view-website .slide[data-kind="drivers"] .section-copy{order:-1}
 .view-website .bento-cell:not(:first-child){padding-left:0}
 .view-website .cover-scroll-hint{bottom:24px}
}
@media(max-width:1000px){.relation-node{width:140px}.relation-center{width:112px}.view-website .slide:not([data-kind="cover"]) .inner{gap:32px}}
@media(max-width:799px){.view-website .top{height:58px;min-height:58px;gap:12px;padding:10px 18px;flex-wrap:nowrap}.view-website .top .co{max-width:24ch;font-size:11px}.view-website .aud-wrap{margin-left:auto;flex:0 0 auto}.view-website .audience button{font-size:10px}.view-website .dots{top:58px;padding:0 18px;gap:20px}.view-website .slide{padding:56px 22px}.view-website .slide:not([data-kind="cover"]) .inner{grid-template-columns:1fr}.view-website .section-copy{position:static}.view-website .overview-bento{grid-template-columns:1fr}.view-website .bento-cell{padding:20px;border:0;border-bottom:1px solid var(--line)}.view-website .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.stakeholder-journey{height:auto}.journey-stage{position:relative;top:0;height:auto;min-height:420px;max-height:none;overflow:visible;display:flex;flex-direction:column}.journey-map,.journey-stage.has-focus .journey-map,.journey-stage.has-focus.map-on-right .journey-map{position:relative;left:auto;top:auto;width:100%;height:360px;transform:none;flex:none}.relation-node{width:140px}.relation-center{width:110px}.journey-copy,.journey-stage.map-on-right .journey-copy{position:relative;left:auto;top:auto;width:100%;transform:none;max-height:none;overflow:visible;padding:24px 0}.journey-controls{position:relative;bottom:auto;order:3;margin-top:16px}.journey-brief h3{font-size:28px}.journey-brief p,.journey-brief li{font-size:14px}.view-website .slide[data-kind="cover"]{padding-top:116px;margin-top:0}.view-website .top .brand{min-width:24px}.view-website .top .brand img{max-width:56px}.relation-node strong{font-size:9px}.relation-badge{width:22px;height:22px;font-size:8px}}
@media(prefers-reduced-motion:reduce){html:has(.view-website){scroll-behavior:auto}.view-website *{animation:none!important;transition:none!important}}
@media print{.stakeholder-journey{height:auto}.journey-stage{position:relative;top:0;height:auto;min-height:500px}.journey-map{position:relative;left:0;top:0;transform:none;width:100%;height:420px}.journey-controls{display:none}}
`
