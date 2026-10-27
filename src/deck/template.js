import {normalizeBrand,DEFAULT_BRAND} from '../brand.js'
export function templateBrand(brand,template){
 const b=normalizeBrand(brand)
 if(template==='company')return {...b,template,background:'#ffffff',surface:'#f5f5f5',text:'#111111',muted:'#606060'}
 if(template==='backstage')return {...b,template,background:DEFAULT_BRAND.background,surface:DEFAULT_BRAND.surface,text:DEFAULT_BRAND.text,muted:DEFAULT_BRAND.muted,primary:DEFAULT_BRAND.primary}
 return b
}
export function chooseDeckTemplate(project,brand){
 const b=templateBrand(brand,brand.template)
 // A deliberate template change replaces per-page palette overrides, not content.
 const clean=design=>{const {background,color,...rest}=design||{};return rest}
 return {brand:b,deck:project.deck.map(s=>({...s,design:clean(s.design),blocks:s.blocks.map(block=>({...block,design:clean(block.design)}))}))}
}
