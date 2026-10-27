import { createHash } from 'node:crypto'
import { supabaseServerEnv } from './accountKey.js'
import { computeModel } from '../src/model.js'
import { assertCompleteDeal } from '../src/dealStorage.js'
import { reviewedInputs } from '../plugin/scripts/reviewed-inputs.mjs'

export const hashToken = token => createHash('sha256').update(token).digest('hex')
const str = {type:'string', minLength:1}
const schema = (properties, required = Object.keys(properties)) => ({type:'object',properties,required,additionalProperties:false})
const identity = {caseId:str}
export const mcpTools = [
  ['list_deals','List your saved deals.',schema({})],
  ['read_deal','Read a deal, its version and enabled project context.',schema(identity)],
  ['apply_inputs','Apply user-reviewed inputs. Read first and pass its version; stale writes are refused.',schema({...identity,expectedVersion:{type:'integer',minimum:1},approved:{type:'boolean'},inputs:{type:'array',minItems:1,maxItems:100,items:schema({key:str,value:{type:['string','number']},state:{enum:['input','assumption','suggestion']},origin:str,quote:{type:'string'},link:{type:'string'}},['key','value','state','origin'])}})],
  ['add_context','Add a user-approved context note to project files.',schema({...identity,approved:{type:'boolean'},name:str,text:str,origin:str})],
  ['calculate','Calculate with the canonical model; missing values stay unknown.',schema(identity)],
  ['links','Get signed-in app links to the Live Room and deck. Does not publish.',schema(identity)]
].map(([name,description,inputSchema]) => ({name:`casebuilder_${name}`,description,inputSchema}))
const versions = ['2025-11-25','2025-06-18','2025-03-26','2024-11-05']
function validate(value, s) {
  if (s.enum && !s.enum.includes(value)) throw Error('Invalid argument value')
  if (s.type && !(Array.isArray(s.type) ? s.type : [s.type]).some(t => t === 'array' ? Array.isArray(value) : t === 'integer' ? Number.isInteger(value) : t === 'object' ? value && typeof value === 'object' && !Array.isArray(value) : typeof value === t)) throw Error('Invalid argument type')
  if (typeof value === 'string' && s.minLength && !value.trim()) throw Error('Non-empty text required')
  if (s.minimum && value < s.minimum) throw Error('Invalid version')
  if (s.properties) {
    if (Object.keys(value).some(k => !Object.hasOwn(s.properties,k)) || s.required.some(k => !Object.hasOwn(value,k))) throw Error('Unknown or missing argument')
    for (const k of Object.keys(value)) validate(value[k],s.properties[k])
  }
  if (s.items) { if (value.length < s.minItems || value.length > s.maxItems) throw Error('Invalid input count'); value.forEach(v => validate(v,s.items)) }
}
export function createMcpHandler({env = process.env, fetchImpl = fetch} = {}) {
  return async (req,res) => {
    res.setHeader('Cache-Control','no-store')
    const send = (status,body) => body === undefined ? res.status(status).end() : res.status(status).json(body)
    if (req.method !== 'POST') { res.setHeader('Allow','POST'); return send(405,{error:'Method not allowed'}) }
    const appUrl = env.APP_URL || env.VITE_APP_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
    if (req.headers?.origin && ![appUrl && new URL(appUrl).origin,'https://claude.ai','https://claude.com'].includes(req.headers.origin)) return send(403,{error:'Origin not allowed'})
    const {url,secret} = supabaseServerEnv(env)
    if (!url || !secret) return send(503,{error:'Connector unavailable'})
    const db = async (table,params,method='GET',body) => {
      const response = await fetchImpl(`${url}/rest/v1/${table}?${new URLSearchParams(params)}`,{method,headers:{apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json',Prefer:'return=representation'},...(body === undefined ? {} : {body:JSON.stringify(body)})})
      if (!response.ok) throw Error('Database request failed; retry or check project file limits')
      return response.status === 204 ? [] : response.json()
    }
    let owner
    try {
      const token = new URL(req.url,'https://connector.invalid').searchParams.get('k')
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return send(401,{error:'Invalid connector token'})
      const rows = await db('mcp_tokens',{token_hash:`eq.${hashToken(token)}`,revoked_at:'is.null',select:'id,owner_id'})
      if (rows.length !== 1) return send(401,{error:'Invalid connector token'})
      owner = rows[0].owner_id
      await db('mcp_tokens',{id:`eq.${rows[0].id}`,owner_id:`eq.${owner}`,revoked_at:'is.null'},'PATCH',{last_used_at:new Date().toISOString()})
    } catch { return send(503,{error:'Connector unavailable'}) }
    let msg
    try { msg = typeof req.body === 'string' ? JSON.parse(req.body) : req.body } catch { return send(400,{jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON'}}) }
    const error = (code,message) => send(400,{jsonrpc:'2.0',id:msg?.id ?? null,error:{code,message}})
    if (!msg || Array.isArray(msg) || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string' || (msg.id !== undefined && typeof msg.id !== 'string' && typeof msg.id !== 'number')) return error(-32600,'Invalid request')
    if (msg.id === undefined) return send(202)
    const reply = result => send(200,{jsonrpc:'2.0',id:msg.id,result})
    if (msg.method === 'initialize') return reply({protocolVersion:versions.includes(msg.params?.protocolVersion) ? msg.params.protocolVersion : versions[0],capabilities:{tools:{}},serverInfo:{name:'casebuilder-remote',version:'0.1.0'}})
    if (msg.method === 'ping') return reply({})
    if (msg.method === 'tools/list') return reply({tools:mcpTools})
    if (msg.method !== 'tools/call') return error(-32601,'Method not found')
    const tool = mcpTools.find(t => t.name === msg.params?.name)
    if (!tool) return error(-32602,'Unknown tool')
    try {
      const a = msg.params.arguments || {}
      validate(a,tool.inputSchema)
      const scoped = {owner_id:`eq.${owner}`}
      let result
      if (tool.name === 'casebuilder_list_deals') result = await db('deals',{...scoped,select:'id,name,version,updated_at',order:'updated_at.desc'})
      else {
        const rows = await db('deals',{...scoped,id:`eq.${a.caseId}`,select:'id,data,version'})
        if (rows.length !== 1) throw Error('Deal not found')
        const row = rows[0], deal = row.data
        if (tool.name === 'casebuilder_read_deal') result = {deal,version:row.version,context:await db('project_files',{...scoped,deal_id:`eq.${a.caseId}`,enabled:'eq.true',select:'id,name,text,kind'})}
        if (tool.name === 'casebuilder_calculate') result = computeModel(Object.fromEntries(deal.fields.map(f => [f.key,f.value])))
        if (tool.name === 'casebuilder_links') {
          if (!appUrl) throw Error('APP_URL is not configured')
          result = {liveRoom:`${appUrl}/?deal=${encodeURIComponent(a.caseId)}&view=website`,deck:`${appUrl}/?deal=${encodeURIComponent(a.caseId)}&view=deck`}
        }
        if (tool.name === 'casebuilder_apply_inputs') {
          if (a.expectedVersion !== row.version) throw Error('A newer copy exists. Read the deal and review again.')
          const patch = reviewedInputs(Object.fromEntries(deal.fields.map(f => [f.key,f])),a.approved,a.inputs)
          const updated = {...deal,fields:deal.fields.map(f => patch[f.key] || f),updatedAt:Date.now()}
          assertCompleteDeal(updated)
          const saved = await db('deals',{...scoped,id:`eq.${a.caseId}`,version:`eq.${a.expectedVersion}`,select:'version'},'PATCH',{data:updated})
          if (saved.length !== 1) throw Error('A newer copy exists. Read the deal and review again.')
          result = {saved:true,version:saved[0].version,inputs:Object.keys(patch)}
        }
        if (tool.name === 'casebuilder_add_context') {
          if (a.approved !== true) throw Error('User approval required before adding context')
          const text = `Source: ${a.origin}\n\n${a.text}`
          if (a.name.length > 200 || text.length > 300000) throw Error('Context exceeds project file limits')
          result = await db('project_files',{select:'id,name'},'POST',{owner_id:owner,deal_id:a.caseId,name:a.name,kind:'context',mime:'text/plain',size_bytes:Buffer.byteLength(text),text,enabled:true})
        }
      }
      return reply({content:[{type:'text',text:JSON.stringify(result)}]})
    } catch (e) { return reply({isError:true,content:[{type:'text',text:e.message}]}) }
  }
}
