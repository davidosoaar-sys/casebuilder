import test from 'node:test'
import assert from 'node:assert/strict'
import {templateBrand,chooseDeckTemplate} from './template.js'
import {newProject} from '../projects.js'
test('new cases use white; template selection retains fonts and clears page palette only',()=>{
 assert.equal(newProject('Example',{}).brand.background,'#ffffff')
 assert.equal(newProject('Spotify',{}).brand.background,'#ffffff')
 const project={deck:[{id:'s',design:{background:'#000000',padding:20},blocks:[{id:'b',text:'Keep me',design:{color:'#ffffff',font:'Brand font'}}]}]}
 const changed=chooseDeckTemplate(project,{template:'company',headingFont:'Brand font',primary:'#ff0000'})
 assert.equal(changed.brand.background,'#ffffff')
 assert.equal(changed.brand.headingFont,'Brand font')
 assert.equal(changed.brand.primary,'#ff0000')
 assert.equal(changed.deck[0].blocks[0].text,'Keep me')
 assert.equal(changed.deck[0].blocks[0].design.font,'Brand font')
 assert.equal(changed.deck[0].design.background,undefined)
 assert.equal(project.deck[0].design.background,'#000000')
 assert.equal(templateBrand(changed.brand,'backstage').background,'#111111')
 assert.equal(templateBrand({background:'#123456'},undefined).background,'#123456')
})
