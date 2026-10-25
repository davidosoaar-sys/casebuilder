import test from 'node:test'
import assert from 'node:assert/strict'
import {brandAccountAuthorized} from '../server/handler.js'
test('brand endpoint validates the bearer session server-side and rejects invalid or anonymous sessions',async()=>{
 const before={url:process.env.VITE_SUPABASE_URL,key:process.env.VITE_SUPABASE_PUBLISHABLE_KEY}
 process.env.VITE_SUPABASE_URL='https://test.supabase.co';process.env.VITE_SUPABASE_PUBLISHABLE_KEY='public-fixture'
 try{
  let calls=0
  const fetcher=async(url,options)=>{calls++;assert.equal(String(url),'https://test.supabase.co/auth/v1/user');assert.equal(options.headers.Authorization,'Bearer fixture');return {ok:true,json:async()=>({id:'user'})}}
  assert.equal(await brandAccountAuthorized({},fetcher),false);assert.equal(calls,0)
  assert.equal(await brandAccountAuthorized({authorization:'Bearer fixture'},fetcher),true)
  assert.equal(await brandAccountAuthorized({authorization:'Bearer fixture'},async()=>({ok:false})),false)
  assert.equal(await brandAccountAuthorized({authorization:'Bearer fixture'},async()=>({ok:true,json:async()=>({id:'user',is_anonymous:true})})),false)
 }finally{for(const [key,value] of [['VITE_SUPABASE_URL',before.url],['VITE_SUPABASE_PUBLISHABLE_KEY',before.key]])if(value===undefined)delete process.env[key];else process.env[key]=value}
})
