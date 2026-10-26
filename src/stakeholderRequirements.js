import {profilePhotoData,publicProfileUrl} from './profileMedia.js'
export const REQUIREMENT_STATUS=['Not started','In progress','Waiting for approval','Actioned']
export const REQUIREMENTS_CSS='.client-requirements,.client-requirements ul{list-style:none;padding:0}.client-requirements li{display:grid;grid-template-columns:18px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid var(--line2);align-items:start}.client-requirements small{grid-column:2;color:var(--dim);font-size:11px}.requirement-box{display:inline-block;width:14px;height:14px;border:1px solid currentColor;margin-top:4px}.requirement-box.is-done:after{content:"";display:block;width:7px;height:4px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);margin:3px 2px}'
export function clientRequirements(stakeholder){
 return (Array.isArray(stakeholder?.requirements)?stakeholder.requirements:[]).filter(r=>r&&typeof r.text==='string'&&r.text.trim()).slice(0,30).map((r,index)=>({id:String(r.id||'requirement-'+index).slice(0,80),text:r.text.slice(0,1000),status:REQUIREMENT_STATUS.includes(r.status)?r.status:'Not started'}))
}
// Explicit allowlist: do not serialize private notes, objections or inferred needs.
export function clientStakeholder(s={}){
 return {key:s.key,role:s.role||'Stakeholder',pos:s.pos,requirements:clientRequirements(s),
  namedPeople:(s.namedPeople||[]).map(p=>({name:p.name,title:p.title,photo:p.photo&&profilePhotoData(p.photo.dataUrl)&&publicProfileUrl(p.photo.sourceUrl)?{dataUrl:profilePhotoData(p.photo.dataUrl),sourceUrl:publicProfileUrl(p.photo.sourceUrl)}:null})),
  builtin:!!s.builtin,lead:s.lead||[],headline:s.headline,needsToSee:clientRequirements(s).map(r=>r.text),cares:'',tag:'',objection:'',counter:'',clientFacing:true}
}
// Client output: the heading and list, or nothing when there are none (an
// empty placeholder is for the editor, never for the client).
export function requirementListHtml(s,heading=''){
 const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
 const rows=clientRequirements(s)
 return rows.length?heading+'<ul class="client-requirements">'+rows.map(r=>'<li><span class="requirement-box '+(r.status==='Actioned'?'is-done':'')+'" aria-hidden="true"></span><span>'+esc(r.text)+'</span><small>'+esc(r.status)+'</small></li>').join('')+'</ul>':''
}
