import test from 'node:test'
import assert from 'node:assert/strict'
import {enrichPublicProfile} from './publicProfile.js'
import {sanitizePerson,addPersonToDeal} from '../src/personLookup.js'
import {searchPerson} from './personAgent.js'
import {research} from './research.js'
const source='https://company.example/team/alex',image='https://company.example/alex.png',linkedin='https://www.linkedin.com/in/alex-example',github='https://github.com/alex-example'
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=','base64')
const claim=value=>({value,sourceUrl:source,sourceType:'web'})
const raw={name:claim('Alex Example'),photo:{url:image,sourceUrl:source},links:[{label:'GitHub',url:github,sourceUrl:source}],email:{value:'alex@company.example',sourceUrl:source},linkedin:{value:linkedin,sourceUrl:source}}
const html='<img alt="Alex Example" src="/alex.png"><a href="'+linkedin+'">LinkedIn</a><a href="'+github+'">GitHub</a> alex@company.example'
const fetcher=async url=>({url,type:url===image?'image/png':'text/html',buffer:url===image?png:Buffer.from(html)})
test('public photo bytes, email and professional links require an observed supporting page',async()=>{
 const r=await enrichPublicProfile(raw,{observedUrls:[source],fetcher})
 assert.ok(r.photo.dataUrl.startsWith('data:image/png;base64,'));assert.equal(r.photo.sourceUrl,source)
 assert.equal(r.email,'alex@company.example');assert.equal(r.linkedin,linkedin);assert.ok(r.links.some(x=>x.url===github))
 const p=sanitizePerson({...raw,title:claim('Head of Platform'),...r,email:claim(r.email),linkedin:claim(r.linkedin)},['web'])
 assert.ok(p.photo);assert.equal(p.links.length,2)
 const deal=addPersonToDeal({stakeholders:[],people:{}},p)
 assert.equal(deal.stakeholders[0].namedPeople[0].photo.dataUrl,r.photo.dataUrl)
})
test('unobserved sources, fabricated image URLs, SVG photos and disabled web do not yield photos',async()=>{
 let calls=0
 assert.equal((await enrichPublicProfile(raw,{observedUrls:[],fetcher:async()=>{calls++;throw Error()}})).photo,null)
 assert.equal(calls,0)
 assert.equal((await enrichPublicProfile({...raw,photo:{url:'https://company.example/invented.png',sourceUrl:source}},{observedUrls:[source],fetcher})).photo,null)
 assert.equal((await enrichPublicProfile(raw,{observedUrls:[source],fetcher:async url=>url===image?{url,type:'image/svg+xml',buffer:Buffer.from('<svg/>')}:fetcher(url)})).photo,null)
 assert.equal((await enrichPublicProfile(raw,{web:false,observedUrls:[source],fetcher:async()=>{throw Error('Must not query')}})).photo,null)
 assert.equal(sanitizePerson({photo:{dataUrl:'data:image/png;base64,AAAA',sourceUrl:source,sourceType:'web'}},[]).photo,null)
})
test('a named public biography image can be extracted without a model inventing its asset URL',async()=>{
 const r=await enrichPublicProfile({name:claim('Alex Example'),photo:null,links:[]},{observedUrls:[source],fetcher})
 assert.equal(r.photo.imageUrl,image)
 const missing=await enrichPublicProfile({name:claim('Different Person'),photo:null},{observedUrls:[source],fetcher})
 assert.equal(missing.photo,null)
})
test('lookup streams current role before optional public media and keeps photo failure nonfatal',async()=>{
 const snapshots=[]
 for await(const s of searchPerson({name:'Alex',enabledSources:['web']},{provider:async({phase})=>({data:phase==='identity'?{name:claim('Alex Example'),title:claim('Head of Platform')}:{...raw,title:claim('Head of Platform')},urls:[source]}),assetFetcher:fetcher}))snapshots.push(s)
 assert.equal(snapshots[0].title.value,'Head of Platform');assert.ok(!snapshots[0].photo)
 assert.ok(snapshots.at(-1).photo);assert.equal(snapshots.at(-1).linkedin.value,linkedin)
})
test('find people passes validated media through the agent result, not just its prompt',async()=>{
 const payload={people:[{name:'Alex Example',title:'Head of Platform',source_urls:[source],photo:null,links:[{url:github,sourceUrl:source,label:'GitHub'}]}]}
 const response={stop_reason:'end_turn',content:[{type:'web_search_tool_result',content:[{url:source}]},{type:'text',text:JSON.stringify(payload)}]}
 const client={messages:{stream:()=>({finalMessage:async()=>response})}}
 const r=await research({company:'Example',role:'Head of Platform'},client,{fetcher})
 assert.ok(r.people[0].photo);assert.equal(r.people[0].links[0].url,github)
})

test('selected portraits and public links survive case-file roundtrip',async()=>{
 const {newProject}=await import('../src/projects.js');const {projectToCaseFile,caseFileToProject}=await import('../src/caseFile.js')
 const media=await enrichPublicProfile(raw,{observedUrls:[source],fetcher});const project=newProject('Example')
 project.people={champion:[{name:'Alex Example',title:'Head of Platform',...media,sources:[source],found:true}]}
 const restored=caseFileToProject(projectToCaseFile(project)).people.champion[0]
 assert.deepEqual(restored.photo,media.photo);assert.deepEqual(restored.links,media.links);assert.equal(restored.emailSourceUrl,source)
})
