import {buildDealReport} from './dealReport.js'
import {FIGURE_DEPS} from './model.js'
import {isBlank} from './source.js'
const text=value=>typeof value==='string'?value:''
const sourceLink=url=>{try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
export function buildEvidenceReview(project){
  const report=buildDealReport(project),fields=(project.fields||[]).filter(f=>!f.deleted)
  const labels=Object.fromEntries([...report.figures,...report.pending].map(f=>[f.key,f.label]))
  const leaves=(key,visited=new Set())=>visited.has(key)?[]:FIGURE_DEPS[key]?FIGURE_DEPS[key].flatMap(k=>leaves(k,new Set([...visited,key]))):[key]
  const dependencies=Object.fromEntries(Object.keys(FIGURE_DEPS).map(key=>[key,new Set(leaves(key))]))
  const rows=report.inputs.map(row=>{
    const field=fields.find(f=>f.key===row.key),source=field.source||{}
    return {...row,link:sourceLink(source.link),quote:text(source.quote),origin:text(source.origin),pinnedAt:text(source.pinnedAt),missing:isBlank(field.value),affected:Object.entries(dependencies).filter(([,keys])=>keys.has(row.key)).map(([key])=>labels[key]||key)}
  })
  return {company:report.company,rows,figures:report.figures,pending:report.pending,
    questions:rows.filter(r=>r.missing||r.state!=='input'),
    questionText:rows.filter(r=>r.missing||r.state!=='input').map(r=>r.label+(r.missing?' — not entered':r.state==='assumption'?' — currently assumed':' — suggested; not confirmed')).join('\n')}
}
