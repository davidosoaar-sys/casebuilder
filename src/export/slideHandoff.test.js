import test from 'node:test'
import assert from 'node:assert/strict'
import {landingArtwork} from './websiteLanding.js'
test('client cover retains imagery without showing an image-source caption',()=>{
 const html=landingArtwork({company:'Example',brand:{heroImage:'data:image/png;base64,aGVsbG8=',heroSource:'https://example.com/campaign',heroAlt:'Campaign image'}})
 assert.match(html,/<img/)
 assert.equal(html.includes('Image source'),false)
 assert.equal(html.includes('<figcaption>'),false)
})
