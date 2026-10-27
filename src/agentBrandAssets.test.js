import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareBrandOps, artifactReplyText } from './agentBrandAssets.js'
import { applyDeckOps } from './agentDeckEdits.js'
const image = 'data:image/png;base64,YWJj'

test('search image URLs are validated server-side and final source is recorded', async () => {
  const r = await prepareBrandOps([{op:'set_brand',heroImage:'https://company.example/image',heroSource:'https://wrong.example/'}], {}, async (url,kind) => {
    assert.equal(kind,'heroImage'); assert.equal(url,'https://company.example/image')
    return {data:image,source:'https://cdn.example/final.png'}
  })
  const applied = applyDeckOps([],{},r.deckOps)
  assert.equal(applied.brand.heroImage,image)
  assert.equal(applied.brand.heroSource,'https://cdn.example/final.png')
  assert.equal(applied.refused.length,0)
})

test('discovered candidates reuse embedded assets; failed fetch preserves existing image', async () => {
  const brand = {heroImage:image,heroSource:'https://company.example/old',heroCandidates:[{heroImage:image,heroSource:'https://company.example/new',heroAlt:'Campus'}]}
  const selected = await prepareBrandOps([{op:'set_brand',heroImage:'candidate:heroImage:0'}],brand,()=>{throw Error('unexpected fetch')})
  assert.equal(selected.deckOps[0].heroSource,'https://company.example/new')
  const failed = await prepareBrandOps([{op:'set_brand',hideLogo:true,heroImage:'https://company.example/broken',heroSource:'https://wrong.example',heroAlt:'Wrong'}],brand,()=>{throw Error('Invalid bytes')})
  const applied = applyDeckOps([],brand,failed.deckOps)
  assert.equal(applied.brand.heroImage,image); assert.equal(applied.brand.heroSource,brand.heroSource)
  assert.equal(applied.brand.hideLogo,true); assert.equal(failed.deckRefused.length,1)
})

test('artifact reply follows application rather than the model success claim', () => {
  const meta={deck_ops:[{op:'set_brand',hideLogo:true}]}
  assert.match(artifactReplyText('Done! Published!',meta,null),/Checking/)
  assert.match(artifactReplyText('Done! Published!',meta,{deckChanges:[],deckRefused:['failed']}),/No case changes/)
  assert.match(artifactReplyText('Done! Published!',meta,{deckChanges:[{sentence:'Changed logo visibility'}]}),/Changed logo visibility/)
  assert.doesNotMatch(artifactReplyText('Done! Published!',meta,{deckChanges:[]}),/Published!/)
})

test('a newer image description prevents replacement from overwriting any of the image group', async () => {
  const before={heroImage:image,heroSource:'https://company.example/old',heroAlt:'Old'}
  const prepared=await prepareBrandOps([{op:'set_brand',heroImage:'https://company.example/new'}],before,async()=>({data:'data:image/png;base64,ZGVm',source:'https://company.example/new'}))
  const current={...before,heroAlt:'My edit'}
  const result=applyDeckOps([],current,prepared.deckOps)
  assert.deepEqual(result.brand,current)
  assert.equal(result.refused.length,1)
})

test('empty operation blocks cannot claim success', () => {
  assert.match(artifactReplyText('Changed and published!',{deck_requested:true},null),/No case changes were applied/)
})
