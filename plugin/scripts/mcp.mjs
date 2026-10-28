import { reviewedInputs } from './reviewed-inputs.mjs'
// Local MCP bridge: no bundled credentials or arbitrary shell commands; publishing requires explicit approval.
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
 {name:'casebuilder_discover_assets',description:'Search the official company website and embed validated logo, fonts, colors and cover photography. Requires authorized web access and explicit approval to replace the current brand. No AI key required for a known company or explicit website; never invent assets.',inputSchema:{...schema({caseId:str,website:str,webEnabled:{type:'boolean'},approved:{type:'boolean'}}),required:['caseId','webEnabled','approved']}},
 {name:'casebuilder_apply_brand',description:'Save reviewed official brand findings and embedded assets to a local case. Host research tools discover/download assets; this tool does not fetch URLs.',inputSchema:{...schema({caseId:str,approved:{type:'boolean'},brand:{type:'object'},sources:{type:'array',items:str}}),required:['caseId','approved','brand','sources']}},
 {name:'casebuilder_info',description:'List canonical inputs, roles and archetypes. No network access.',inputSchema:schema({})},
 {name:'casebuilder_create',description:'Create an empty local case. Does not connect accounts or sync to the app.',inputSchema:{...schema({company:str}),required:['company']}},
 {name:'casebuilder_read',description:'Read a local case and its evidence.',inputSchema:{...schema({caseId:str}),required:['caseId']}},
 {name:'casebuilder_apply_inputs',description:'Apply user-reviewed sourced inputs only. Never infer confirmation from a transcript automatically.',inputSchema:{...schema({caseId:str,approved:{type:'boolean'},inputs:{type:'array',items:{...schema({key:str,value:{type:['string','number']},state:{enum:['input','assumption','suggestion']},origin:str,quote:str,link:str}),required:['key','value','state','origin']}}}),required:['caseId','approved','inputs']}},
 {name:'casebuilder_calculate',description:'Run CaseBuilder canonical equations; missing values remain unknown.',inputSchema:{...schema({caseId:str}),required:['caseId']}},
 {name:'casebuilder_publish',description:'Publish a local case as a shareable Vercel website only after explicit human approval. Without approved:true, returns a dry run. Requires host VERCEL_TOKEN or logged-in Vercel CLI; never include credentials in arguments.',inputSchema:{...schema({caseId:str,approved:{type:'boolean'}}),required:['caseId','approved']}},
 {name:'casebuilder_build',description:'Generate editable PowerPoint, Google Slides/Canva import PPTX, one-pager HTML or interactive Live Room HTML using the app exporters. Does not publish.',inputSchema:{...schema({caseId:str,format:{enum:['pptx','google-slides','canva','onepager','website','all']}}),required:['caseId','format']}}
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
 if(name==='casebuilder_discover_assets'){
  if(a.webEnabled!==true||a.approved!==true)throw Error('Web access and brand replacement must be authorized')
  if(a.website!==undefined&&typeof a.website!=='string')throw Error('Website must be a string')
  return execFileSync(process.execPath,[fileURLToPath(new URL('./discover-assets.mjs',import.meta.url)),f,a.website||'','web-enabled','approved'],{encoding:'utf8',timeout:65000,maxBuffer:8e6})
 }
 if(name==='casebuilder_apply_brand'){
  if(a.approved!==true)throw Error('Brand replacement must be authorized')
  if(!a.brand||typeof a.brand!=='object'||Array.isArray(a.brand)||!Array.isArray(a.sources)||!a.sources.length||a.sources.some(s=>typeof s!=='string'||!/^https:\/\//i.test(s)))throw Error('Official HTTPS source URLs and brand findings required')
  if(JSON.stringify(a.brand).length>4500000)throw Error('Brand assets exceed the local size limit')
  const data=JSON.parse(fs.readFileSync(f,'utf8'))
  const allowed=['logo','logoBackground','headingFont','bodyFont','fontFaces','fontData','fontName','primary','background','surface','text','muted','heroImage','heroSource','heroAlt','website']
  const patch=Object.fromEntries(allowed.filter(k=>Object.hasOwn(a.brand,k)).map(k=>[k,a.brand[k]]))
  if(patch.logo&&!/^data:image\/(png|jpeg|svg\+xml);base64,[a-zA-Z0-9+/=]+$/.test(patch.logo))throw Error('Embed a validated image, not a remote logo URL')
  if(patch.heroImage&&!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(patch.heroImage))throw Error('Embed a validated raster hero image')
  data.brand={...data.brand,...patch,sources:a.sources,status:'ready'}
  const tmp=f+'.brand.case.json'
  try{fs.writeFileSync(tmp,JSON.stringify(data),{mode:0o600});run(['validate',tmp]);atomic(f,data)}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}
  return JSON.stringify({saved:true,fields:Object.keys(patch),sources:a.sources,note:'Discovery provenance and font availability still require visual verification.'})
 }
 if(name==='casebuilder_read')return fs.readFileSync(f,'utf8')
 if(name==='casebuilder_calculate')return run(['calc',f])
 if(name==='casebuilder_publish'){
  if(typeof a.approved!=='boolean')throw Error('approved must be a boolean')
  return run(['publish',f,...(a.approved?['--yes']:[])])
 }
 if(name==='casebuilder_build'){
  if(!['pptx','google-slides','canva','onepager','website','all'].includes(a.format))throw Error('Invalid format')
  return run(['build',f,'--format',a.format,'--out',path.join(root,a.caseId+'-artifacts')])
 }
 if(name==='casebuilder_apply_inputs'){
  const data=JSON.parse(fs.readFileSync(f,'utf8'))
  const patch=reviewedInputs(data.inputs,a.approved,a.inputs)
  const keys=new Set(Object.keys(patch))
  Object.assign(data.inputs,patch)
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
