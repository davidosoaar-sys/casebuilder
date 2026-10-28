import families from './googleFonts.js'
import {officeFont} from '../brand.js'
const supported=new Map([...families,'Arial','Arial Black','Times New Roman','Georgia','Verdana','Courier New','Trebuchet MS','Comic Sans MS','Impact'].map(f=>[f.toLowerCase(),f]))
export function googleSlideFont(value){
 const requested=officeFont(value)
 const family=supported.get(requested.toLowerCase())||'Poppins'
 return {requested,family,substituted:requested.toLowerCase()!==family.toLowerCase()}
}
