import {matchPersonRole, sourcedClaim} from './personLookup.js'

export function seniorityFromTitle(title='') {
  if (/\bchief\b|\b(?:ceo|cto|cfo|cio|coo|ciso)\b/i.test(title)) return {rank:0,label:'Executive'}
  if (/\bvp\b|vice president/i.test(title)) return {rank:1,label:'Vice president'}
  if (/\bpresident\b/i.test(title)) return {rank:0,label:'Executive'}
  if (/\bdirector\b|\bhead\b/i.test(title)) return {rank:2,label:'Director / head'}
  if (/\bmanager\b|\blead\b/i.test(title)) return {rank:3,label:'Manager / lead'}
  return {rank:4,label:'Seniority unclear'}
}

// Results are transient until Add to this deal. Never persist this projection.
export function lookupMapData(project, results=[]) {
  const people=new Map()
  const add=raw=>{
    const name=sourcedClaim(raw?.name,['web',...(raw?.sourcesUsed||[])]),title=sourcedClaim(raw?.title,['web',...(raw?.sourcesUsed||[])])
    if(!name||!title||raw.candidates?.length)return
    const company=raw.company?.value||project?.name||''
    const id=name.value.toLowerCase()+'|'+company.toLowerCase()
    const allowed=['web',...(raw.sourcesUsed||[])]
    people.set(id,{...raw,name,title,company,companyClaim:sourcedClaim(raw.company,allowed),reportsTo:sourcedClaim(raw.reportsTo,allowed),reports:(raw.reports||[]).map(r=>sourcedClaim(r,allowed)).filter(Boolean),seniority:seniorityFromTitle(title.value),roleMatch:matchPersonRole(title.value)})
  }
  for(const s of project?.stakeholders||[])for(const p of s.namedPeople||[])if(p.brief)add(p.brief)
  for(const found of Object.values(project?.people||{}))for(const p of found){
    if(!p.found||!p.sources?.length)continue
    const claim=value=>({value,sourceUrl:p.sources[0],sourceType:'web'})
    add({name:claim(p.name),title:claim(p.title),company:claim(project.name),photo:p.photo,sourcesUsed:['web']})
  }
  for(const r of results)if(r.status!=='error')add(r.person)
  const list=[...people.values()].sort((a,b)=>a.company.localeCompare(b.company)||a.seniority.rank-b.seniority.rank||a.name.value.localeCompare(b.name.value))
  const roles=new Map((project?.stakeholders||[]).map(s=>[s.key,{...s,namedPeople:[]}]))
  for(const p of list){
    const match=p.roleMatch
    if(!roles.has(match.key))roles.set(match.key,{key:match.key,builtin:true,namedPeople:[]})
    roles.get(match.key).namedPeople.push({name:p.name.value,sourceUrl:p.name.sourceUrl,photo:p.photo})
  }
  return {people:list,stakeholders:[...roles.values()]}
}
