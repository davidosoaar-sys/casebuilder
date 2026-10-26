import {normalizeBrand,COLOR_KEYS} from '../src/brand.js'
import {contrast,luminance} from '../src/export/websiteFramework.js'
import {agentPrompt} from './agent-commands/index.js'
import {fitLogo} from './logoFit.js'
import {AGENT_COMMANDS} from '../src/agentCommands.js'

const HEX=/^#[0-9a-f]{6}$/i
const short=value=>String(value||'').slice(0,160)
const generic=/^(Arial|ui-sans-serif|system-ui|sans-serif|serif)$/i
export function buildBrandCatalog({company,website,parsed,logos,cssSources=[]}){
  const colors=[]
  const add=(value,label,role,sourceUrl,origin='observed')=>{
    if(!HEX.test(value))return
    const prior=colors.find(c=>c.value.toLowerCase()===value.toLowerCase())
    if(prior){if(role&&!prior.roles.includes(role))prior.roles.push(role);if(label.startsWith('--')){prior.label=short(label);prior.sourceUrl=sourceUrl}return}
    colors.push({id:'color-'+(colors.length+1),value,label:short(label),roles:role?[role]:[],sourceUrl,origin})
  }
  for(const key of COLOR_KEYS)if(parsed[key])add(parsed[key],key,key,website,(parsed.derivedColors||['surface','muted']).includes(key)?'readability-adjustment':'observed')
  for(const e of parsed.colorEvidence||[]){
    const source=cssSources.find(s=>e.token&&s.text.includes('--'+e.token))?.url||website
    add(e.value,e.label,e.role,source,e.origin)
  }
  for(const color of parsed.colors||[])add(color,'Observed CSS color','',website)
  const fonts=[]
  for(const role of ['heading','body']){
    const family=parsed[role+'Font']
    if(!family)continue
    let font=fonts.find(f=>f.family===family)
    if(!font){font={id:'font-'+(fonts.length+1),family,roles:[],sourceUrl:website,generic:generic.test(family)};fonts.push(font)}
    font.roles.push(role)
  }
  return {company,website,logos:logos.map((l,i)=>({id:'logo-'+(i+1),sourceUrl:l.sourceUrl,location:l.location,variant:l.variant,score:l.score})),colors:colors.slice(0,24),fonts}
}

export function applyBrandSelection({catalog,logos,baseline,proposal,mode='deterministic-fallback',warnings=[]}){
  const brand=normalizeBrand(baseline),decisions=[],adjustments=[]
  let logoIndex=0,valid=!!proposal
  const colorFor=id=>catalog.colors.find(c=>c.id===id)
  const fontFor=id=>catalog.fonts.find(f=>f.id===id)
  if(proposal){
    logoIndex=catalog.logos.findIndex(l=>l.id===proposal.logoId)
    valid=logoIndex>=0&&COLOR_KEYS.every(key=>!!colorFor(proposal.colors?.[key]))&&['heading','body'].every(role=>fontFor(proposal.fonts?.[role])?.roles.includes(role))
    if(!valid){logoIndex=0;mode='deterministic-fallback';warnings.push('The agent returned an unsupported choice; the extracted brand was kept for review.')}
    else{
      for(const key of COLOR_KEYS)brand[key]=colorFor(proposal.colors[key]).value
      brand.headingFont=fontFor(proposal.fonts.heading).family
      brand.bodyFont=fontFor(proposal.fonts.body).family
    }
  }
  // Readability is code, never a claim that a new color was found on the site.
  const surfaces=()=>[brand.background,brand.surface]
  if(!['#000000','#ffffff'].some(c=>surfaces().every(bg=>contrast(c,bg)>=4.5))){brand.surface=brand.background;adjustments.push('Panel background matched the canvas so one text color can remain readable.')}
  for(const key of ['text','muted'])if(surfaces().some(bg=>contrast(brand[key],bg)<4.5)){
    brand[key]=['#000000','#ffffff'].sort((a,b)=>Math.min(...surfaces().map(bg=>contrast(b,bg)))-Math.min(...surfaces().map(bg=>contrast(a,bg))))[0]
    adjustments.push(key+' adjusted for readable contrast; this is a layout adjustment, not a discovered brand color.')
  }
  if(contrast(brand.primary,brand.background)<4.5)warnings.push('The brand accent needs a contrast check for small labels; its original color was preserved.')
  let selected=logos[logoIndex]||null
  const incompatible=l=>l?.variant==='light'&&luminance(brand.background)>.4||l?.variant==='dark'&&luminance(brand.background)<.2
  if(incompatible(selected)){
    const alternative=logos.find(l=>l.variant!=='unknown'&&!incompatible(l))
    if(alternative){selected=alternative;adjustments.push('Used an available official logo variant suited to the canvas.')}
  }
  // A single-colour mark whose ink would vanish on the canvas (a black glyph on
  // a dark page): recolour the SVG to the text colour, or back a PNG.
  const fit=selected?fitLogo(selected.dataUrl,brand.background,brand.text):{dataUrl:''}
  if(fit.recoloured)adjustments.push('The single-colour logo was shown in '+fit.recoloured+' so it reads on the page background.')
  else if(fit.logoBackground){brand.logoBackground=fit.logoBackground;adjustments.push('Added a plain field behind the single-colour logo so it reads on the page background.')}
  else if(incompatible(selected)){brand.logoBackground=selected.variant==='light'?'#111111':'#ffffff';adjustments.push('Added a bounded neutral field behind the original logo; the mark was not recolored.')}
  brand.logo=fit.dataUrl||''
  if(selected)decisions.push({field:'Logo',value:selected.location,sourceUrl:selected.sourceUrl,origin:'observed'})
  for(const key of COLOR_KEYS){const evidence=catalog.colors.find(c=>c.value.toLowerCase()===brand[key].toLowerCase());decisions.push({field:key,value:brand[key],sourceUrl:evidence?.sourceUrl||'',origin:evidence?.origin||'fallback'})}
  for(const role of ['heading','body']){const family=brand[role+'Font'];const e=catalog.fonts.find(f=>f.family===family);decisions.push({field:role+' font',value:family,sourceUrl:e?.sourceUrl||'',origin:e?'observed':'fallback'});if(!e)warnings.push(role+' font was not established; '+family+' is a fallback.')}
  if(!selected)warnings.push('No usable company logo was found.')
  return {brand,review:{version:1,mode:valid?mode:'deterministic-fallback',status:'needs-review',decisions,adjustments,warnings:[...new Set(warnings)],checks:{logoPresent:!!brand.logo,textContrast:surfaces().every(bg=>contrast(brand.text,bg)>=4.5),secondaryContrast:surfaces().every(bg=>contrast(brand.muted,bg)>=4.5),visualReviewPerformed:false}},selected}
}

export async function curateBrand({company,website,parsed,logos,cssSources,baseline,client,timeBudget=10000}){
  const catalog=buildBrandCatalog({company,website,parsed,logos,cssSources})
  let proposal=null,mode='deterministic-fallback',warnings=[]
  if(client&&timeBudget>=1000&&logos.length&&catalog.colors.length&&['heading','body'].every(role=>catalog.fonts.some(f=>f.roles.includes(role))))try{
    const response=await client.messages.create({model:process.env.RESEARCH_MODEL||'claude-sonnet-5-5',max_tokens:1100,system:agentPrompt(AGENT_COMMANDS.DISCOVER_BRAND,'asset-selection'),messages:[{role:'user',content:JSON.stringify({phase:'asset-selection',evidence:catalog})}]},{signal:AbortSignal.timeout(Math.min(10000,timeBudget))})
    const text=response.content.filter(b=>b.type==='text').map(b=>b.text).join('')
    proposal=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));mode='agent-selected'
  }catch(error){const billing=error?.status===400&&/credit balance|insufficient.*credit|billing/i.test(String(error?.error?.error?.message||error?.message||''));const reason=billing?'The research API key has insufficient credit. Add credits or use a funded key saved in Settings.':error instanceof SyntaxError?'The model did not return usable selection JSON.':error?.status===401?'The research API key was rejected.':error?.status===404?'The configured research model is unavailable.':error?.status===429?'The research API rate limit was reached.':error?.name?.includes('Abort')||error?.name?.includes('Timeout')?'The selection time budget was reached.':'The research service could not complete the request.';warnings.push('The asset selection pass could not finish; extracted assets were kept for review. '+reason)}
  else warnings.push('No model selection pass ran; the extracted brand needs review.')
  return applyBrandSelection({catalog,logos,baseline,proposal,mode,warnings})
}
