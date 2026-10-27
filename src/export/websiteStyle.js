// Website-only presentation. PDF and slide layouts deliberately stay separate.
export const WEBSITE_CSS = `
.view-website{--site-width:1120px;container-type:inline-size}
.view-website{display:flex;flex-direction:column;height:100dvh;overflow:hidden}.view-website .top,.view-website .dots,.website-progress{flex:none}
.view-website main{flex:1;min-height:0;height:auto!important}
.view-website .blk[data-custom-size]:has(h2){font-size:min(var(--authored-size),clamp(30px,5cqw,64px))!important}
.view-website .blk[data-custom-size]:has(h1.hero){font-size:min(var(--authored-size),clamp(42px,7cqw,88px))!important}
.view-website .dots{scrollbar-width:none}.view-website .dots::-webkit-scrollbar{display:none}
.view-website .top{padding:18px max(24px,calc((100cqw - var(--site-width))/2));min-height:78px;background:var(--bg)}
.view-website .co{font-size:16px;letter-spacing:-.03em}
.view-website .website-audience{border-radius:99px;padding:10px 32px 10px 16px;background:var(--panel)}
.view-website .dots{padding:0 max(24px,calc((100cqw - var(--site-width))/2));gap:24px;min-height:52px;align-items:stretch}
.view-website .dot{border:0;border-radius:0;padding:16px 0;background:none;color:var(--dim);position:relative;font-weight:600}
.view-website .dot:after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--accent);transform:scaleX(0);transition:transform .2s}
.view-website .dot.on{background:none;color:var(--strong)}.view-website .dot.on:after{transform:scaleX(1)}
.website-progress{height:2px;background:var(--line)}.website-progress span{display:block;height:100%;width:0;background:var(--accent);transition:width .15s}
.view-website main{height:calc(100dvh - 132px);scroll-padding-top:20px}
.view-website .slide{padding:76px max(24px,calc((100cqw - var(--site-width))/2));border-bottom:1px solid var(--line)}
.view-website .slide .inner{max-width:var(--site-width)}
.view-website .slide:first-child{padding-top:88px;padding-bottom:72px;min-height:510px}
.view-website h1.hero{font-size:clamp(42px,6.5cqw,86px);letter-spacing:-.055em;max-width:17ch;line-height:1.02}
.view-website h2{letter-spacing:-.035em}.view-website .lede{max-width:55ch;line-height:1.6}
.website-section-number{font-size:11px;color:var(--faint);letter-spacing:.12em;margin-bottom:24px;font-variant-numeric:tabular-nums}
.website-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.website-actions button{border:1px solid var(--line2);background:transparent;color:var(--ink);border-radius:99px;padding:12px 20px;cursor:pointer;font-weight:600;font-size:13px}
.website-actions button:first-child{background:var(--accent);border-color:var(--accent);color:#111}.website-actions button:hover{filter:brightness(1.12)}
.view-website .stats{gap:16px;margin-top:32px}.view-website .stat{padding:26px;border-radius:18px;background:var(--panel);border-color:var(--line)}
.view-website .stat strong{font-size:clamp(28px,3.5cqw,42px);letter-spacing:-.04em}.view-website .stat span{color:var(--dim);text-transform:none;letter-spacing:0;font-size:13px}
.view-website .stat .eq{margin-top:16px;padding-top:12px;border-top:1px solid var(--line);line-height:1.5}
.view-website .pillar{padding:24px;border:1px solid var(--line);border-radius:16px;background:var(--panel)}
.view-website .pillar h3{font-size:15px;text-transform:none;letter-spacing:0}.view-website .bar-row{margin-top:16px}.view-website .track{height:8px}
.view-website .pr{padding:18px 20px;border-radius:12px}.view-website .pr.ph{padding:0 20px}
.view-website .cols{gap:40px}.view-website blockquote{padding:24px;border-radius:0 16px 16px 0}
.view-website .whatif-btn{left:auto;right:28px;bottom:24px;padding:14px 22px}
.view-website .whatif{left:auto;right:28px;bottom:84px;width:360px;max-height:calc(100dvh - 110px);padding:24px;box-shadow:0 20px 70px #0008}
.whatif-heading{display:flex;justify-content:space-between;gap:16px;align-items:center}.view-website .whatif .whatif-close{margin:0;padding:5px 10px;font-size:18px;line-height:1}
.scenario-summary{padding:14px 0;border-block:1px solid var(--line);margin:16px 0;font-size:13px;color:var(--dim)}.scenario-summary strong{display:block;color:var(--strong);font-size:24px;letter-spacing:-.03em}
.website-end{padding:28px max(24px,calc((100cqw - var(--site-width))/2)) 100px;display:flex;justify-content:space-between;gap:20px;color:var(--faint);font-size:12px}.website-end button{border:0;background:none;color:var(--ink);cursor:pointer}
@container (max-width:780px){.view-website .top{min-height:72px;padding:14px 20px}.view-website .dots{padding:0 20px;gap:22px}.view-website main{height:calc(100dvh - 126px)}.view-website .slide{padding:48px 22px}.view-website .slide:first-child{padding-top:56px;min-height:420px}.view-website .whatif{left:12px;right:12px;width:auto}.view-website .whatif-btn{right:16px;bottom:16px}.view-website .pillar{padding:18px}.view-website .website-audience{max-width:230px}.view-website .pr{gap:8px;font-size:12px;padding:12px}.website-end{padding-inline:22px}}
@media(prefers-reduced-motion:reduce){.view-website main{scroll-behavior:auto}.view-website *{transition:none!important}}

/* Six-column Bento layout adapted from designali-in's 21st.dev component.
   Active/hover navigation treatment adapted from ln-dev7's navigation tabs. */
.view-website .dot:hover{color:var(--strong);background:color-mix(in srgb,var(--accent) 9%,transparent)}
.view-website .dot:hover:after{transform:scaleX(1)}
.view-website .website-actions button:first-child,.view-website .whatif-btn{color:var(--site-on-primary,#111)}
.view-website .label,.view-website .stat.good strong,.view-website .pillar.pl h3,.view-website .pr .pd,.view-website .whatif label b{color:var(--site-accent-text,var(--mint))}
.view-website .top .co{display:block;overflow:hidden;text-overflow:ellipsis;max-width:32ch;min-width:0}
.view-website .brand{flex-shrink:0;max-width:180px}.view-website .brand img{max-width:100%;object-fit:contain}
.company-monogram{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;color:var(--site-on-primary,#111);background:var(--accent);font-weight:800}
.view-website .slide{background:var(--bg);color:var(--ink)}
.view-website .slide.hero-bg{background:var(--bg)!important;position:relative}
.view-website .slide.hero-bg:before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 65%)}
.view-website .slide .inner{position:relative;min-width:0}
.view-website :is(h1,h2,h3,p,li,strong,.co,.bar-label,.body){overflow-wrap:anywhere}
.view-website h1,.view-website h2{text-wrap:balance}.view-website .blk{min-width:0;max-width:100%}
.view-website h1.hero{letter-spacing:-.035em}.view-website .blk[data-custom-size]:has(.long-title){font-size:min(var(--authored-size),clamp(30px,5cqw,64px))!important}.view-website h1.long-title{font-size:clamp(36px,5cqw,64px)}
.view-website .blk:has(.body),.view-website .blk:has(.lede),.view-website .blk:has(.note){max-width:78ch}
.view-website .blk[data-custom-size]:has(p,li,blockquote){font-size:min(var(--authored-size),22px)!important}
.view-website .logo:empty{display:none}.view-website .logo img{max-width:200px;height:auto}
.overview-bento{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;border:1px solid var(--line);border-radius:24px;margin-top:48px;overflow:hidden;background:var(--panel)}
.bento-cell{grid-column:span 2;padding:28px;min-width:0;border-right:1px solid var(--line)}.bento-cell:last-child{border:0}.bento-cell:first-child{grid-column:span 2;background:color-mix(in srgb,var(--accent) 8%,var(--panel))}
.bento-cell span{display:block;color:var(--dim);font-size:13px;margin-bottom:10px}.bento-cell strong{display:block;color:var(--strong);font-size:clamp(28px,3.3cqw,44px);letter-spacing:-.045em;line-height:1.15}
.overview-bento:has(.bento-cell:only-child) .bento-cell{grid-column:1/-1}.overview-bento:has(.bento-cell:nth-child(2):last-child) .bento-cell{grid-column:span 3}
.view-website .stats{grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.view-website .stats[data-card-count="1"]{max-width:560px}
.figure-math{margin-top:18px;color:var(--dim);font-size:12px}.figure-math summary{cursor:pointer;padding:6px 0;list-style-position:inside}.figure-math summary:hover{color:var(--strong)}.figure-math[open] .eq{padding:12px;background:var(--bg);border-radius:8px}
.view-website .pairs{overflow-x:auto;padding-bottom:4px}.view-website .pr{min-width:540px}
.view-website .cols{grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.view-website .bar-label{overflow-wrap:anywhere}.view-website .bar-detail{line-height:1.6}.view-website .v-row{min-width:0}
.view-website :is(.whatif,.stat,.pillar,.pr){color:var(--ink)}
.website-empty{max-width:720px;margin:0 auto;padding:80px 24px}.website-empty h1{font-size:clamp(36px,6cqw,72px);line-height:1.1;letter-spacing:-.04em}.website-empty p{max-width:52ch;color:var(--dim)}
.view-website .website-audience{max-width:min(320px,38cqw)}.view-website .aud-wrap>span{white-space:nowrap}
@container (max-width:780px){.view-website .top{gap:12px;flex-wrap:wrap}.view-website .top .co{font-size:13px;max-width:calc(100% - 60px);flex:1}.view-website .aud-wrap{flex:1;justify-content:flex-end}.view-website .website-audience{max-width:45cqw}.view-website .brand{max-width:100px}.overview-bento{margin-top:32px;border-radius:18px}.bento-cell{padding:20px}.view-website .stats{grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}}
@container (max-width:480px){.view-website .top .co{max-width:calc(100% - 55px)}.view-website .aud-wrap{flex-basis:100%;margin:0;justify-content:flex-start}.view-website .aud-wrap>span{display:inline;font-size:10px}.view-website .website-audience{max-width:100%;width:100%;font-size:12px}.view-website .audience{flex:1}.overview-bento{grid-template-columns:1fr}.overview-bento .bento-cell,.overview-bento .bento-cell:first-child{grid-column:1/-1!important;border:0;border-bottom:1px solid var(--line)}.overview-bento .bento-cell:last-child{border:0}.view-website .whatif{max-height:calc(100dvh - 110px)}}

/* Interactions are shared by every brand, with no continuous background motion. */
.view-website .website-actions button,.view-website .whatif-btn{display:inline-flex;align-items:center;justify-content:center;gap:18px;min-height:48px;font-weight:650;box-shadow:0 1px 2px #0001;transition:transform .2s,box-shadow .2s,background .2s}
.view-website .website-actions button:first-child:after{content:'↓';display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:color-mix(in srgb,var(--site-on-primary) 12%,transparent);transition:transform .2s}
.view-website .website-actions button:hover:after{transform:translateY(3px)}
.view-website .whatif-btn:before{content:'';width:16px;height:16px;background:currentColor;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg stroke='black' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M4 7h16M4 17h16'/%3E%3Ccircle cx='9' cy='7' r='3' fill='white'/%3E%3Ccircle cx='15' cy='17' r='3' fill='white'/%3E%3C/g%3E%3C/svg%3E") center/contain no-repeat}
.view-website .website-actions button:active,.view-website .whatif-btn:active{transform:scale(.98)}
.view-website .whatif-btn[aria-expanded="true"]{box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 20%,transparent)}
.view-website .whatif.open{animation:scenario-enter .22s ease-out;transform-origin:bottom right}
.view-website .figure-math summary{display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none;border-top:1px solid var(--line);padding-top:14px}.view-website .figure-math summary::-webkit-details-marker{display:none}.view-website .figure-math summary:after{content:'+';font-size:18px;line-height:1}.view-website .figure-math[open] summary:after{content:'−'}
.view-website :is(.stat,.pillar,.bento-cell){transition:border-color .2s,box-shadow .2s,transform .2s}
.view-website .blk{transition:opacity .5s ease,transform .5s cubic-bezier(.2,.65,.3,1);transition-delay:var(--reveal-delay,0ms)}
.view-website .motion-pending{opacity:0;transform:translateY(20px)}
.view-website .motion-visible{opacity:1;transform:none}
.view-website .overview-bento,.view-website .website-actions{transition:opacity .5s ease,transform .5s ease}
.view-website .fill{transform-origin:left;transition:transform .7s ease}.view-website .motion-pending .fill{transform:scaleX(.15)}
.view-website :is(button,select,summary,input):focus-visible{outline:2px solid var(--site-accent-text);outline-offset:4px}
@media(hover:hover){.view-website .website-actions button:hover,.view-website .whatif-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px #0002}.view-website .stat:hover,.view-website .pillar:hover{transform:translateY(-3px);border-color:var(--site-accent-text);box-shadow:0 8px 28px #0001}.view-website .bento-cell:hover{background:color-mix(in srgb,var(--accent) 9%,var(--panel))}}
@keyframes scenario-enter{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.view-website .motion-pending{opacity:1;transform:none}.view-website *{animation:none!important;transition:none!important}.view-website .fill{transform:none!important}}
@media print{.view-website .motion-pending{opacity:1;transform:none}.view-website .website-actions{display:none}}
`
