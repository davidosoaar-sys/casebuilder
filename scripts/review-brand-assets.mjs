// Reproduce brand display/export checks without touching saved deals or using paid AI.
// Run: node scripts/review-brand-assets.mjs --live [http://localhost:5173]
// Without --live, reuse the last .build/brand-live official-asset snapshots.
import puppeteer from 'puppeteer';import fs from 'node:fs';
import {discoverBrand} from '../server/brand.js';
const base=process.argv.find(a=>/^https?:/.test(a))||'http://localhost:5173';
const targets=[['microsoft','https://www.microsoft.com/'],['adidas','https://www.adidas-group.com/en/'],['shopify','https://www.shopify.com/'],['spotify','https://www.spotify.com/'],['nike','https://www.nike.com/'],['lovable','https://lovable.dev/']];
fs.mkdirSync('.build/brand-live',{recursive:true});
if(process.argv.includes('--live'))await Promise.all(targets.map(async([company,website])=>{const brand=await discoverBrand({company,website});fs.writeFileSync('.build/brand-live/'+company+'.json',JSON.stringify(brand))}));
const browser=await puppeteer.launch({headless:true}),page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/',{waitUntil:'domcontentloaded'});
const results=[],cards=[];
try{
for(const company of ['microsoft','adidas','shopify','spotify','nike','lovable']){
 const raw=JSON.parse(fs.readFileSync('.build/brand-live/'+company+'.json'));
 const checked=await page.evaluate(async brand=>{const {verifyBrandForDisplay}=await import('/src/verifyBrand.js');return verifyBrandForDisplay(brand)},raw);
 fs.writeFileSync('.build/brand-live/'+company+'-checked.json',JSON.stringify(checked));
 const docs=await page.evaluate(async({company,brand})=>{
  const {newProject}=await import('/src/projects.js'),{DEMO_VALUES}=await import('/src/valueModel.js'),{buildSiteHtml}=await import('/src/export/site.js'),{prepareOnePager,pickAudience}=await import('/src/export/prepare.js'),{resolveStakeholder}=await import('/src/deck/stakeholders.js'),{buildOnePager}=await import('/src/export/html.js'),{brandDocument,brandLogoHtml}=await import('/src/brand.js');
  const project=newProject(company,{});project.brand=brand;project.deck.forEach(s=>{delete s.design});project.fields=project.fields.map(f=>({...f,value:f.key==='companyName'?company:DEMO_VALUES[f.key]??f.value}));const inputs=Object.fromEntries(project.fields.map(f=>[f.key,f.value]));const docs={};for(const mode of ['website','pdf','slides'])docs[mode]=buildSiteHtml({project,inputs,mode});
  const who=pickAudience(project.stakeholders.map(resolveStakeholder).filter(Boolean));docs.onepager=brandDocument(buildOnePager({facts:prepareOnePager({inputs,fields:project.fields,who}),logoSvg:brandLogoHtml(brand)}),brand);return docs
 },{company,brand:checked});
 const result={company,logoPassed:checked.review?.checks.logoVisible,status:checked.status,font:checked.headingFont,body:checked.bodyFont,fontFilesLoaded:checked.review?.checks.fontFilesLoaded,views:[]};
 for(const[mode,html]of Object.entries(docs)){
  fs.writeFileSync('.build/brand-live/'+company+'-'+mode+'.html',html);
  const preview=await browser.newPage();await preview.setViewport({width:1280,height:900});await preview.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await preview.setContent(html,{waitUntil:'load'});await preview.evaluate(()=>document.fonts.ready);
  result.views.push({mode,...await preview.evaluate(()=>({logos:[...document.images].filter(i=>i.src.startsWith('data:image/')).every(i=>i.complete&&i.naturalWidth>0),fonts:getComputedStyle(document.body).fontFamily,overflow:document.documentElement.scrollWidth>innerWidth}))});
  if(mode==='website'){await preview.screenshot({path:'.build/brand-live/'+company+'-website.png'});await preview.setViewport({width:390,height:844});result.mobileOverflow=await preview.evaluate(()=>document.documentElement.scrollWidth>innerWidth);await preview.screenshot({path:'.build/brand-live/'+company+'-mobile.png'});}
  await preview.close();
 }
 results.push(result);console.log(JSON.stringify(result));
 cards.push(`<article style="background:${checked.background};color:${checked.text};padding:32px;min-height:220px"><h2>${company}</h2><img src="${checked.logo}" style="max-width:220px;max-height:65px;background:${checked.logoBackground};padding:10px"><p>${checked.headingFont} / ${checked.bodyFont}</p><p>${checked.message}</p></article>`);
}
fs.writeFileSync('.build/brand-live/browser-results.json',JSON.stringify({results,errors},null,2));
await page.setViewport({width:1200,height:1050});await page.setContent('<html><body style="margin:0;display:grid;grid-template-columns:1fr 1fr;font-family:Arial">'+cards.join('')+'</body></html>');await page.screenshot({path:'.build/brand-live/contact-sheet.png',fullPage:true});console.log('Errors',errors);
if(errors.length||results.some(r=>!r.logoPassed||r.mobileOverflow||r.views.some(v=>!v.logos||v.overflow)))process.exitCode=1;
}finally{await browser.close()}
