import test from 'node:test'
import assert from 'node:assert/strict'
import {publishSite} from './publish.js'
test('publish returns the real production alias when Vercel truncates the name',async()=>{
 const result=await publishSite({html:'<!doctype html><html></html>',company:'Test',name:'bc-a-long-company-project-name',token:'fixture',verify:false,fetchImpl:async(url,init)=>({ok:true,status:200,json:async()=>init.method==='POST'&&url.includes('/deployments')?{id:'dpl-fixture',readyState:'READY',alias:['bc-a-long-company-project.vercel.app'],url:'bc-build-123.vercel.app'}:{}})})
 assert.equal(result.url,'https://bc-a-long-company-project.vercel.app')
})
