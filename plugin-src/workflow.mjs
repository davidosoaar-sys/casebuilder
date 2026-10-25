// Bundled into plugin/scripts/workflow.mjs. Planning and validation only: no
// network access, research, case writes, connector calls or publishing.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sourceFor, matchPersonRole } from '../src/personLookup.js'

const parent=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const ROOT=fs.existsSync(path.join(parent,'framework/actions.json'))?parent:path.join(parent,'plugin')
const SOURCE_IDS=['web','claude','gong','hubspot','slack','clay','lemlist']
const text=v=>typeof v==='string'?v.trim():''

export function planAction(id,request,root=ROOT){
  if(!request||typeof request!=='object'||Array.isArray(request))throw Error('Request must be a JSON object.')
  const registry=JSON.parse(fs.readFileSync(path.join(root,'framework/actions.json'),'utf8'))
  const action=registry.actions.find(a=>a.id===id||a.command===id)
  if(!action)throw Error('Unknown action: '+id)
  for(const field of action.required)if(!text(request[field]))throw Error('Missing required field: '+field)
  const enabledSources=request.enabledSources??['web']
  if(!Array.isArray(enabledSources)||enabledSources.some(s=>!SOURCE_IDS.includes(s)))throw Error('Unknown or invalid enabledSources.')
  return {action:action.id,command:'/casebuilder:'+action.command,skill:path.join(root,action.skill),request:{...request,enabledSources},artifact:action.artifact,writePolicy:action.writes,executed:false,note:'Read the skill and execute with the host tools. Planning performs no research or writes.'}
}

export function validateFindings(data,{demo=false}={}){
  if(!data||!['brand','people'].includes(data.kind))throw Error('Findings kind must be brand or people.')
  if(!Array.isArray(data.enabledSources)||data.enabledSources.some(s=>!SOURCE_IDS.includes(s)))throw Error('enabledSources must contain known source IDs.')
  if(!Array.isArray(data.sourcesUsed)||!Array.isArray(data.sourcesSkipped))throw Error('Findings require sourcesUsed and sourcesSkipped arrays.')
  if(data.kind==='brand'&&!text(data.company))throw Error('Brand findings need a company.')
  if(data.kind==='people'&&!Array.isArray(data.people))throw Error('People findings need a people array.')
  const dropped=[],used=new Set(),errors=[]
  const claim=(item,at)=>{
    const source=sourceFor(item,data.enabledSources)
    if(!source||!text(item?.key)||!(typeof item.value==='number'&&Number.isFinite(item.value)||text(item?.value))){dropped.push({at,reason:'Missing value/key/evidence, invalid URL or disabled source.'});return null}
    const host=new URL(source.sourceUrl).hostname
    if(!demo&&(host.endsWith('.example')||host==='example.com'||host==='example.org'||host==='example.net')){dropped.push({at,reason:'Fictional evidence is allowed only with --demo.'});return null}
    if(data.kind==='brand'&&['background','surface','primary','text','muted'].includes(item.key)&&!/^#[a-f0-9]{6}$/i.test(item.value)){dropped.push({at,reason:'A palette value must be a six-digit hex color.'});return null}
    used.add(source.sourceType)
    return {key:text(item.key),value:item.value,...source,...(text(item.localFile)?{localFile:item.localFile}:{}),...(text(item.observedAt)?{observedAt:item.observedAt}:{})}
  }
  const claims=(items,at)=>(Array.isArray(items)?items:[]).map((v,i)=>claim(v,at+'['+i+']')).filter(Boolean)
  let result
  if(data.kind==='brand')result={kind:'brand',company:data.company,claims:claims(data.claims,'claims'),notFound:Array.isArray(data.notFound)?data.notFound:[],fallbacks:Array.isArray(data.fallbacks)?data.fallbacks:[]}
  else result={kind:'people',query:text(data.query),people:data.people.map((p,i)=>{
    if(!p||typeof p!=='object')throw Error('Each person must be an object.')
    const status=['resolved','ambiguous','not-found'].includes(p.status)?p.status:'not-found'
    const values=status==='resolved'?claims(p.claims,'people['+i+'].claims'):[]
    const title=values.find(c=>c.key==='title')
    // Mapping is inferred deterministically from the sourced title, using the
    // same nearest-role logic as the app. An agent cannot inflate its confidence.
    const roleMatch=title?{...matchPersonRole(title.value),state:'inferred',sourceUrl:title.sourceUrl,sourceType:title.sourceType}:null
    if(status==='resolved'&&!values.some(c=>c.key==='name'))errors.push('Resolved person '+i+' has no sourced name.')
    return {status,claims:values,roleMatch,notFound:Array.isArray(p.notFound)?p.notFound:[],candidates:(Array.isArray(p.candidates)?p.candidates:[]).map((c,j)=>({claims:claims(c?.claims,'people['+i+'].candidates['+j+']')})).filter(c=>c.claims.length),suggestedInputs:status==='resolved'?claims(p.suggestedInputs,'people['+i+'].suggestedInputs'):[]}
  })}
  const skipped=[]
  for(const item of data.sourcesSkipped){
    if(!SOURCE_IDS.includes(item.source)||!['disabled','unavailable','no-results'].includes(item.reason)){errors.push('Invalid skipped-source record.');continue}
    if(item.reason==='disabled'&&data.enabledSources.includes(item.source)){errors.push(item.source+' cannot be both enabled and disabled.');continue}
    if(used.has(item.source)){errors.push(item.source+' cannot be both used and skipped.');continue}
    skipped.push({source:item.source,reason:item.reason})
  }
  for(const source of data.sourcesUsed)if(!data.enabledSources.includes(source))errors.push('sourcesUsed names a disabled source: '+source)
  for(const source of SOURCE_IDS)if(!data.enabledSources.includes(source)&&!skipped.some(s=>s.source===source))skipped.push({source,reason:'disabled'})
  return {ok:errors.length===0,result:{...result,enabledSources:[...data.enabledSources],sourcesUsed:[...used],sourcesSkipped:skipped},dropped,errors,evidenceChecked:false,note:'URLs and source permissions were checked; the host agent must verify that each page supports its claim. No case was modified.'}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const [verb,kind,...args]=process.argv.slice(2)
    const flag=name=>{const at=args.indexOf(name);return at>=0?args[at+1]:null}
    const file=flag(verb==='plan'?'--request':'--file')
    if(!file)throw Error('Usage: workflow.mjs plan <action> --request file.json | validate <brand|people> --file findings.json [--demo]')
    const data=JSON.parse(fs.readFileSync(file,'utf8'))
    const out=verb==='plan'?planAction(kind,data):verb==='validate'&&data.kind===kind?validateFindings(data,{demo:args.includes('--demo')}):null
    if(!out)throw Error('Unknown operation or mismatched findings kind.')
    console.log(JSON.stringify(out,null,2));if(out.ok===false)process.exitCode=1
  }catch(error){console.error(error.message);process.exitCode=1}
}
