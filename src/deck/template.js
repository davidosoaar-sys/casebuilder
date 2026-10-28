import {normalizeBrand,DEFAULT_BRAND} from '../brand.js'
import {logoForTheme} from './themeLogo.js'
export function templateBrand(brand,template){
 const b=normalizeBrand(brand)
 const companyStyle=b.companyStyle||{primary:b.primary,headingFont:b.headingFont,bodyFont:b.bodyFont}
 if(template==='company')return {...b,...companyStyle,companyStyle,template,background:'#ffffff',surface:'#f5f5f5',text:'#111111',muted:'#606060'}
 if(template==='backstage')return {...b,companyStyle,template,background:DEFAULT_BRAND.background,surface:DEFAULT_BRAND.surface,text:DEFAULT_BRAND.text,muted:DEFAULT_BRAND.muted,primary:DEFAULT_BRAND.primary,headingFont:'Outfit',bodyFont:'Outfit'}
 return b
}
export async function prepareTemplateBrand(brand,template){
 const b=templateBrand(brand,template),original=b.originalLogo||b.logo
 return {...b,originalLogo:original,logo:await logoForTheme(original,template),logoBackground:['company','backstage'].includes(template)?'transparent':b.logoBackground}
}
export function chooseDeckTemplate(project,brand){
 const b=templateBrand(brand,brand.template)
 // A deliberate template change replaces per-page palette overrides, not content.
 const clean=design=>{const {background,color,...rest}=design||{};if(b.template==='backstage')delete rest.font;return rest}
 return {brand:b,deck:project.deck.map(s=>({...s,design:clean(s.design),blocks:s.blocks.map(block=>({...block,design:clean(block.design)}))}))}
}
