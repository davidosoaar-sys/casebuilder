// Serialized into the standalone website. Values come from the existing model;
// this renderer only scales geometry and escapes labels, never computes savings.
export function renderWebsiteGraphic(kind, input) {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const nonnegative=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0
  const rows=(input||[]).filter(r=>kind==='comparison'?nonnegative(r.before)&&nonnegative(r.after):nonnegative(r.value))
  if(!rows.length)return ''
  if(kind==='drivers') {
    const total=rows.reduce((sum,r)=>sum+r.value,0)
    if(!(total>0))return ''
    let start=0
    const segments=rows.map((r,i)=>{
      const width=r.value/total*800,x=start;start+=width
      return '<rect x="'+x.toFixed(3)+'" y="8" width="'+width.toFixed(3)+'" height="30" fill="var(--accent)" opacity="'+(1-(i%6)*.12)+'"><title>'+esc(r.label)+': '+esc(r.display)+' ('+(r.value/total*100).toFixed(1)+'%)</title></rect>'
    }).join('')
    return '<figure class="website-graphic driver-composition" aria-label="Annual value by driver"><figcaption>Where the computed annual value comes from</figcaption><svg viewBox="0 0 800 46" role="img" aria-label="Proportional contribution of each computed value driver">'+segments+'</svg><ol class="graphic-legend">'+rows.map((r,i)=>'<li><i style="opacity:'+(1-(i%6)*.12)+'" aria-hidden="true"></i><span>'+esc(r.label)+'</span><strong>'+esc(r.display)+'</strong><small>'+(r.value/total*100).toFixed(1)+'%</small></li>').join('')+'</ol></figure>'
  }
  if(kind==='comparison') {
    return '<figure class="website-graphic change-graphic"><figcaption>Today and with Portal</figcaption><p class="graphic-caption">Each row uses its own unit and scale.</p>'+rows.map(r=>{
      const max=Math.max(r.before,r.after,1),before=20+r.before/max*760,after=20+r.after/max*760
      return '<div class="change-graphic-row"><div class="change-graphic-label"><strong>'+esc(r.label)+'</strong><small>'+esc(r.unit)+'</small></div><svg viewBox="0 0 800 46" role="img" aria-label="'+esc(r.label+': '+r.beforeDisplay+' today; '+r.afterDisplay+' with Portal')+'"><line x1="20" y1="23" x2="780" y2="23" stroke="var(--line)" stroke-width="2"/><line x1="'+before.toFixed(2)+'" y1="23" x2="'+after.toFixed(2)+'" y2="23" stroke="var(--site-accent-text)" stroke-width="3"/><circle cx="'+before.toFixed(2)+'" cy="23" r="8" fill="var(--bg)" stroke="var(--dim)" stroke-width="3"><title>Today: '+esc(r.beforeDisplay)+'</title></circle><circle cx="'+after.toFixed(2)+'" cy="23" r="8" fill="var(--site-accent-text)"><title>With Portal: '+esc(r.afterDisplay)+'</title></circle></svg><div class="change-graphic-values"><span>Today <b>'+esc(r.beforeDisplay)+'</b></span><span>With Portal <b>'+esc(r.afterDisplay)+'</b></span></div></div>'
    }).join('')+'</figure>'
  }
  const max=Math.max(1,...rows.map(r=>r.value))
  const title=kind==='alternative'?'Annual operating cost':'Annual value and annual spend'
  return '<figure class="website-graphic annual-graphic" aria-label="'+title+'"><figcaption>'+title+'</figcaption>'+rows.map((r,i)=>'<div class="annual-graphic-row"><div><span>'+esc(r.label)+'</span><strong>'+esc(r.display)+'</strong></div><svg viewBox="0 0 800 28" role="img" aria-label="'+esc(r.label+': '+r.display)+'"><rect x="0" y="5" width="800" height="18" fill="var(--line)"/><rect x="0" y="5" width="'+(r.value/max*800).toFixed(2)+'" height="18" fill="'+(i?'var(--dim)':'var(--site-accent-text)')+'"><title>'+esc(r.label+': '+r.display)+'</title></rect></svg></div>').join('')+'</figure>'
}

export const GRAPHIC_CSS = `
.website-graphic{margin:0 0 30px;padding:22px 0;border-block:1px solid var(--line);width:100%;color:var(--ink)}
.website-graphic figcaption{font:inherit;font-size:11px;letter-spacing:.02em;color:var(--dim);margin:0 0 20px}.website-graphic svg{display:block;width:100%;height:auto;overflow:visible}.website-graphic svg:focus{outline:1px solid var(--site-accent-text)}
.graphic-caption{font-size:10px;color:var(--dim);margin:-12px 0 24px}.annual-graphic-row{margin-top:20px}.annual-graphic-row>div{display:flex;justify-content:space-between;gap:16px;font-size:12px;margin-bottom:8px}.annual-graphic-row strong{font-variant-numeric:tabular-nums}
.graphic-legend{padding:0;margin:18px 0 0;list-style:none;display:grid;gap:12px}.graphic-legend li{display:grid;grid-template-columns:8px minmax(0,1fr) auto 48px;gap:10px;align-items:baseline;font-size:11px}.graphic-legend i{width:8px;height:8px;background:var(--accent)}.graphic-legend strong{font-size:11px;font-variant-numeric:tabular-nums}.graphic-legend small{color:var(--dim);text-align:right;font-size:10px}
.change-graphic-row{padding:20px 0;border-top:1px solid var(--line)}.change-graphic-label{display:flex;align-items:baseline;gap:12px;justify-content:space-between}.change-graphic-label strong{font-size:12px;font-weight:500}.change-graphic-label small{font-size:10px;color:var(--dim)}.change-graphic-values{display:flex;justify-content:space-between;gap:20px;font-size:10px;color:var(--dim)}.change-graphic-values b{color:var(--ink);margin-left:6px;font-weight:600;font-variant-numeric:tabular-nums}
.website-calculation-notes{margin-top:22px;border-top:1px solid var(--line);padding-top:16px}.website-calculation-notes>summary{font-size:11px;color:var(--dim);cursor:pointer}.website-calculation-notes[open]>summary{margin-bottom:20px;color:var(--ink)}
.alternative-flow{display:grid;grid-template-columns:1fr 24px 1fr 24px 1.3fr;align-items:center;gap:10px;margin:0 0 28px;padding:24px 0;border-block:1px solid var(--line)}.alternative-flow>div{min-width:0}.alternative-flow small{display:block;font-size:9px;color:var(--dim);line-height:1.5}.alternative-flow strong{display:block;font-size:18px;color:var(--ink);font-weight:500;overflow-wrap:anywhere}.alternative-flow>span{font-size:18px;color:var(--dim);text-align:center}
.template-section-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:0 0 18px}
@media(max-width:550px){.graphic-legend li{grid-template-columns:8px minmax(0,1fr) auto;gap:8px}.graphic-legend small{grid-column:2/-1;text-align:left}.alternative-flow{grid-template-columns:1fr 16px 1fr;gap:8px}.alternative-flow>span:nth-of-type(2){display:none}.alternative-flow>div:last-child{grid-column:1/-1;border-top:1px solid var(--line);padding-top:12px}.alternative-flow strong{font-size:17px}}
`
