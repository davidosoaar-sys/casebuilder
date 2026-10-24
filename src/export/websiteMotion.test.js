import test from 'node:test'
import assert from 'node:assert/strict'
import { createWebsiteMotion } from './websiteMotion.js'

function fixture({ reduced = false, supported = true } = {}) {
  const node = (index, top) => {
    const classes = new Set()
    return { dataset:{s:'0',b:String(index)},style:{setProperty(){}},hasAttribute:()=>true,
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
      getBoundingClientRect:()=>({top,bottom:top+100}) }
  }
  let nodes = [node(0,20),node(1,900)]
  const root = { querySelectorAll: selector => selector === '.motion-pending' ? nodes.filter(n=>n.classList.contains('motion-pending')) : nodes, getBoundingClientRect:()=>({top:0,bottom:600}) }
  let callback, change
  const preference = {matches:reduced,addEventListener:(_,fn)=>{change=fn},removeEventListener(){} }
  const env = {matchMedia:()=>preference}
  if (supported) env.IntersectionObserver = class {constructor(fn){callback=fn} observe(){} disconnect(){} unobserve(){} }
  return {root,env,preference,get nodes(){return nodes},replace:()=>{nodes=[node(0,20),node(1,900)]},intersect:()=>callback([{isIntersecting:true,target:nodes[1]}]),change:()=>change()}
}

test('scroll reveals once and does not re-hide revealed content after scenario rerender', () => {
  const f=fixture(), motion=createWebsiteMotion(f.root,f.env)
  motion.refresh()
  assert.ok(f.nodes[0].classList.contains('motion-visible'))
  assert.ok(f.nodes[1].classList.contains('motion-pending'))
  f.intersect()
  assert.ok(f.nodes[1].classList.contains('motion-visible'))
  f.replace();motion.refresh()
  assert.equal(f.nodes[1].classList.contains('motion-pending'),false)
})

test('reduced motion, unsupported observers and cleanup always leave content readable', () => {
  for (const options of [{reduced:true},{supported:false}]) {
    const f=fixture(options), motion=createWebsiteMotion(f.root,f.env)
    motion.refresh()
    assert.ok(f.nodes.every(n=>n.classList.contains('motion-visible')))
  }
  const f=fixture(), motion=createWebsiteMotion(f.root,f.env)
  motion.refresh();f.preference.matches=true;f.change()
  assert.ok(f.nodes.every(n=>!n.classList.contains('motion-pending')))
  motion.destroy()
  assert.ok(f.nodes.every(n=>n.classList.contains('motion-visible')))
})

test('document scrolling observes the viewport rather than the full document height', () => {
  const f=fixture()
  f.env.innerHeight=600
  f.root.getBoundingClientRect=()=>({top:0,bottom:10000})
  const motion=createWebsiteMotion(f.root,f.env,{pageScroll:true})
  motion.refresh()
  assert.ok(f.nodes[1].classList.contains('motion-pending'))
  f.intersect()
  assert.ok(f.nodes[1].classList.contains('motion-visible'))
})
