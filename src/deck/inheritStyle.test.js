import test from 'node:test'
import assert from 'node:assert/strict'
import {inheritSlideStyle} from './inheritStyle.js'
test('new pages inherit appearance without copying content or sharing styles',()=>{
 const ref={design:{background:'#111111'},blocks:[{type:'text',style:'title',text:'Old',design:{color:'#ffffff',font:'Brand font'}}]}
 const fresh={id:'new',blocks:[{id:'new-title',type:'text',style:'title',text:'New'}]}
 const result=inheritSlideStyle(fresh,ref)
 assert.equal(result.design.background,'#111111')
 assert.equal(result.blocks[0].design.font,'Brand font')
 assert.equal(result.blocks[0].text,'New')
 assert.equal(result.blocks[0].id,'new-title')
 result.blocks[0].design.color='#000000'
 assert.equal(ref.blocks[0].design.color,'#ffffff')
 assert.equal(inheritSlideStyle(fresh,null),fresh)
})
