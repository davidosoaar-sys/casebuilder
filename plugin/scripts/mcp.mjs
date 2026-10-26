// Local MCP bridge: no network credentials, arbitrary shell commands or publishing.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {randomUUID} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import readline from 'node:readline'

const root=path.resolve(process.env.CASEBUILDER_HOME||path.join(os.homedir(),'.casebuilder'))
fs.mkdirSync(root,{recursive:true,mode:0o700})
const cli=fileURLToPath(new URL('../skills/business-case/scripts/casebuilder.mjs',import.meta.url))
const schema=properties=>({type:'object',properties,additionalProperties:false})
const str={type:'string'}
const tools=[
 {name:'casebuilder_info',description:'List canonical inputs, roles and archetypes. No network access.',inputSchema:schema({})},
 {name:'casebuilder_create',description:'Create an empty local case. Does not connect accounts or sync to the app.',inputSchema:{...schema({company:str}),required:['company']}},
 {name:'casebuilder_read',description:'Read a local case and its evidence.',inputSchema:{...schema({caseId:str}),required:['caseId']}},
 {name:'casebuilder_apply_inputs',description:'Apply user-reviewed sourced inputs only. Never infer confirmation from a transcript automatically.',inputSchema:{...schema({caseId:str,approved:{type:'boolean'},inputs:{type:'array',items:{...schema({key:str,value:{type:['string','number']},state:{enum:['input','assumption','suggestion']},origin:str,quote:str,link:str}),required:['key','value','state','origin']}}}),required:['caseId','approved','inputs']}},
 {name:'casebuilder_calculate',description:'Run CaseBuilder canonical equations; missing values remain unknown.',inputSchema:{...schema({caseId:str}),required:['caseId']}},
 {name:'casebuilder_build',description:'Generate local PPTX, one-pager HTML or interactive Live Room HTML using the same exporters as the app. Does not publish.',inputSchema:{...schema({caseId:str,format:{enum:['pptx','onepager','website','all']}}),required:['caseId','format']}}
]
function file(id){if(typeof id!=='string'||!/^[-a-z0-9]{36}$/.test(id))throw Error('Invalid case ID');const f=path.join(root,id+'.case.json');if(fs.existsSync(f)&&fs.lstatSync(f).isSymbolicLink())throw Error('Case symlinks are not supported');return f}
function run(args){return execFileSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:60000,maxBuffer:8e6})}
function atomic(f,data){const tmp=f+'.'+randomUUID()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(tmp,f)}
function call(name,a){
 if(name==='casebuilder_info')return run(['info'])
 if(name==='casebuilder_create'){
  if(typeof a.company!=='string'||!a.company.trim()||a.company.length>200)throw Error('Company name required')
  const id=randomUUID();run(['init',a.company,'--out',file(id)]);return JSON.stringify({caseId:id,case:JSON.parse(fs.readFileSync(file(id),'utf8'))})
 }
 const f=file(a.caseId)
 if(name==='casebuilder_read')return fs.readFileSync(f,'utf8')
 if(name==='casebuilder_calculate')return run(['calc',f])
 if(name==='casebuilder_build'){
  if(!['pptx','onepager','website','all'].includes(a.format))throw Error('Invalid format')
  return run(['build',f,'--format',a.format,'--out',path.join(root,a.caseId+'-artifacts')])
 }
 if(name==='casebuilder_apply_inputs'){
  if(a.approved!==true)throw Error('Review proposed inputs with the user before applying')
  if(!Array.isArray(a.inputs)||!a.inputs.length||a.inputs.length>100)throw Error('Provide 1–100 reviewed inputs')
  const data=JSON.parse(fs.readFileSync(f,'utf8'))
  const keys=new Set()
  for(const i of a.inputs){
   if(!i||!Object.hasOwn(data.inputs,i.key)||keys.has(i.key))throw Error('Unknown or duplicate input')
   keys.add(i.key)
   if(!['input','assumption','suggestion'].includes(i.state)||typeof i.origin!=='string'||!i.origin.trim())throw Error('State and origin required')
   if(!['string','number'].includes(typeof i.value)||typeof i.value==='number'&&!Number.isFinite(i.value))throw Error('Invalid value')
   if(i.link&&!/^https?:\/\//i.test(i.link))throw Error('Source link must be HTTP(S)')
   data.inputs[i.key]={...data.inputs[i.key],value:i.value,confirmed:i.state==='input',source:{state:i.state,origin:i.origin,quote:i.quote||'',link:i.link||'',pinnedAt:''}}
  }
  // Validate a temporary full case before touching the original.
  const tmp=f+'.review.case.json'
  try{fs.writeFileSync(tmp,JSON.stringify(data),{mode:0o600});run(['validate',tmp]);atomic(f,data)}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}
  return JSON.stringify({saved:true,inputs:[...keys]})
 }
 throw Error('Unknown tool')
}
const reply=(id,result,error)=>process.stdout.write(JSON.stringify({jsonrpc:'2.0',id,...(error?{error}:{result})})+'\n')
for await(const line of readline.createInterface({input:process.stdin,crlfDelay:Infinity})){
 let msg;try{msg=JSON.parse(line)}catch{reply(null,null,{code:-32700,message:'Invalid JSON'});continue}
 if(msg.id===undefined)continue
 try{
  if(msg.method==='initialize')reply(msg.id,{protocolVersion:['2024-11-05','2025-03-26','2025-06-18'].includes(msg.params?.protocolVersion)?msg.params.protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'casebuilder-local',version:'0.1.0'}})
  else if(msg.method==='ping')reply(msg.id,{})
  else if(msg.method==='tools/list')reply(msg.id,{tools})
  else if(msg.method==='tools/call'){
   if(!tools.some(t=>t.name===msg.params?.name))throw Error('Unknown tool')
   try{reply(msg.id,{content:[{type:'text',text:call(msg.params.name,msg.params.arguments||{})}]})}catch(e){reply(msg.id,{isError:true,content:[{type:'text',text:String(e.message).slice(0,1500)}]})}
  }else reply(msg.id,null,{code:-32601,message:'Method not found'})
 }catch(e){reply(msg.id,null,{code:-32602,message:e.message})}
}
