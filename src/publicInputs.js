import {isBlank,withSuggestion} from './source.js'

// Only directly published company figures, never benchmarks or Portal estimates.
export const PUBLIC_INPUT_KEYS=['engineers','newHiresPerYear']
export const publicInputKeys=fields=>fields.filter(f=>!f.deleted&&PUBLIC_INPUT_KEYS.includes(f.key)&&isBlank(f.value)).map(f=>f.key)
export async function researchPublicInputs({company,fields,agent}) {
  const only=publicInputKeys(fields)
  if(!only.length)return {suggestions:[]}
  return agent({company,only,filled:Object.fromEntries(fields.filter(f=>!isBlank(f.value)).map(f=>[f.key,f.value])),documents:[],web:true,publicOnly:true,labels:Object.fromEntries(fields.map(f=>[f.key,f.label]))})
}
export function applyPublicInputs(fields,result,now=new Date().toISOString()) {
  return fields.map(f=>{
    if(f.deleted||!PUBLIC_INPUT_KEYS.includes(f.key)||!isBlank(f.value))return f
    const s=result.suggestions?.find(s=>s.key===f.key&&s.kind==='public'&&typeof s.value==='number'&&Number.isFinite(s.value)&&s.value>=0&&/^https?:\/\//i.test(s.link||'')&&s.quote)
    return s?withSuggestion(f,{...s,state:'suggestion'},{now,enabled:[]}):f
  })
}
