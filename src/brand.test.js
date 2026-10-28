import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeBrand, brandVars, brandDocument, brandLogoHtml, blockDesign } from './brand.js'
import { discoverBrand, parseBrand, publicAddress, fetchPublic } from '../server/brand.js'
import { newProject, hydrate } from './projects.js'
import { projectToCaseFile, caseFileToProject } from './caseFile.js'
import { buildEnv, resolveSlides } from './deck/model.js'
import { NO_ONE } from './deck/stakeholders.js'
import { buildPptx } from './export/pptx.js'
import PptxGenJS from 'pptxgenjs'
import JSZip from 'jszip'
const logoPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAKAAAAAoCAYAAAB5LPGYAAAAg0lEQVR4nO3SIQEAIBDAwE9CJsLSD2JMcOL8xGbtc6EydQB/MyApA5IyICkDkjIgKQOSMiApA5IyICkDkjIgKQOSMiApA5IyICkDkjIgKQOSMiApA5IyICkDkjIgKQOSMiApA5IyICkDkjIgKQOSMiApA5IyICkDkjIgKQOSMiApA5J6Mvc8HCzG4hMAAAAASUVORK5CYII=','base64')

test('brand input cannot inject CSS, HTML or external assets', () => {
  const b = normalizeBrand({ primary: 'red;position:fixed', headingFont: "X';}</style><script>alert(1)</script>", logo: 'javascript:alert(1)', fontData: 'https://tracker.example/font' })
  assert.equal(b.primary, '#9bf0de')
  assert.equal(b.logo, '')
  assert.equal(b.fontData, '')
  assert.ok(!brandDocument('<html><head></head></html>', b).includes('<script>'))
  assert.deepEqual(blockDesign({ color: 'red;}', fontSize: 999, align: 'evil' }), { fontSize: '120px' })
  assert.equal(brandLogoHtml({ hideLogo: true }, '<svg/>'), '')
})
test('public fetch rejects private, local and unsupported protocols', async () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '192.168.1.1', '169.254.169.254', '172.16.0.1', '100.64.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1']) assert.equal(publicAddress(ip), false, ip)
  assert.equal(publicAddress('8.8.8.8'), true)
  await assert.rejects(fetchPublic('http://localhost/'), /public HTTPS/)
  await assert.rejects(fetchPublic('https://user:pass@example.com/'), /public HTTPS/)
})
test('discovery extracts actual site assets, embeds them, and cites their source', async () => {
  const responses = {
    'https://example.com/': ['text/html', '<link rel="stylesheet" href="/style.css"><img alt="Company logo" src="/logo.svg">'],
    'https://example.com/style.css': ['text/css', ':root{--primary:#6633cc}body{font-family:Test Sans,sans-serif}h1{font-family:Test Sans}@font-face{font-family:Test Sans;src:url(/font.woff2)}'],
    'https://example.com/logo.svg': ['image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#6633cc"/></svg>'],
    'https://example.com/font.woff2': ['font/woff2', 'wOF2fixture']
  }
  const result = await discoverBrand({ website: 'https://example.com/' }, async url => { const [type, content] = responses[url]; return { url, type, buffer: Buffer.from(content) } })
  assert.equal(result.primary, '#6633cc')
  assert.equal(result.headingFont, 'Test Sans')
  assert.ok(result.logo.startsWith('data:image/svg+xml;base64,'))
  assert.ok(result.fontData.startsWith('data:font/woff2;base64,'))
  assert.equal(result.sources.length, 4)
  assert.equal(result.status, 'ready')
  const parsed = parseBrand('<link rel="icon" href="/icon.png">', '', 'https://example.com/')
  assert.equal(parsed.logoUrl, '') // a favicon is not a presentation logo
})
test('brand and formatting survive project hydration, case-file handoff and client resolution', () => {
  const p = newProject('Test')
  p.brand = normalizeBrand({ primary: '#123456', headingFont: 'Georgia', hideLogo: true })
  p.deck[0].design = { background: '#010203' }
  p.deck[0].blocks[2].design = { color: '#abcdef', fontSize: 52, align: 'center' }
  const again = hydrate(caseFileToProject(projectToCaseFile(p)))
  assert.equal(again.brand.primary, '#123456')
  assert.equal(again.brand.headingFont, 'Georgia')
  const inputs = Object.fromEntries(again.fields.map(f => [f.key, f.value]))
  const slides = resolveSlides(again.deck, buildEnv(inputs, again.fields, NO_ONE))
  assert.equal(slides[0].design.background, '#010203')
  assert.deepEqual(slides[0].blocks[2].design, p.deck[0].blocks[2].design)
  assert.equal(brandVars(p.brand)['--deck-primary'], '#123456')
})
test('PowerPoint honors customer colors, fonts and block overrides without leaking them across exports', async () => {
  let captured
  class FakePptx {
    constructor() { this.slides = []; captured = this }
    addSlide() { const s = { texts: [], addText(t, o) { this.texts.push({ t, o }) }, addShape() {} }; this.slides.push(s); return s }
  }
  const slides = [{ variant: 'plain', blocks: [{ kind: 'text', style: 'title', text: 'Hello', design: { color: '#445566', align: 'center' } }] }]
  await buildPptx({ company: 'Test', slides, brand: { background: '#abcdef', headingFont: 'Georgia' }, deps: { PptxGenJS: FakePptx } })
  assert.equal(captured.slides[0].background.color, 'ABCDEF')
  assert.equal(captured.slides[0].texts[0].o.fontFace, 'Georgia')
  assert.equal(captured.slides[0].texts[0].o.color, '445566')
  assert.equal(captured.slides[0].texts[0].o.align, 'center')
  await buildPptx({ company: 'Another', slides, deps: { PptxGenJS: FakePptx } })
  assert.equal(captured.slides[0].background.color, '111111')
})
test('a real PowerPoint file contains the chosen page palette and editable formatted text', async () => {
  const deck = await buildPptx({ company: 'Acme', brand: { primary: '#a855f7', background: '#102030', headingFont: 'Georgia' },
    slides: [{ variant: 'plain', design: { background: '#123456' }, blocks: [{ kind: 'text', style: 'hero', text: 'Company case', design: { color: '#ff9900', fontSize: 60, align: 'center' } }, { kind: 'text', style: 'tag', text: 'Review label', design: { badgeBackground: '#253453' } }] }], deps: { PptxGenJS } })
  const bytes = await deck.write({ outputType: 'nodebuffer' })
  const zip = await JSZip.loadAsync(bytes)
  const slide = await zip.file('ppt/slides/slide1.xml').async('string')
  assert.match(slide, /123456/)
  assert.match(slide, /FF9900/)
  assert.match(slide, /Georgia/)
  assert.match(slide, /Company case/)
  assert.match(slide, /253453/)
  assert.match(slide, /Review label/i)
})
test('unquoted HTML attributes and framework theme variables resolve to actual branding', () => {
  const css = ':root{--ifm-color-primary:#0000ff;--ifm-font-family-base:system-ui,sans-serif;--ifm-heading-font-family:var(--ifm-font-family-base);--backstage-logo:url(/logo.svg)}:root{--ifm-color-primary:#36baa2}'
  const parsed = parseBrand('<link rel=stylesheet href=/styles.css>', css, 'https://example.com/')
  assert.equal(parsed.primary, '#36baa2')
  assert.equal(parsed.headingFont, 'system-ui')
  assert.equal(parsed.logoUrl, 'https://example.com/logo.svg')
})


test('home-link identity wins over customer logos and promotional imagery', () => {
 const html='<img alt="Customer logo" src="/wrong.svg"><a href="/" aria-label="Microsoft home"><img alt="Microsoft" src="/official.png"></a><img alt="Microsoft Edge logo scenery" src="/promo.png">'
 assert.equal(parseBrand(html,'','https://www.microsoft.com/','Microsoft').logoUrl,'https://www.microsoft.com/official.png')
 assert.equal(parseBrand('<img alt="Other company logo" src="/other.svg">','','https://example.com/','Example').logoUrl,'')
})
test('inline home-link logos, public brand-page fallback and theme tokens are preserved', async () => {
 const calls=[]
 const result=await discoverBrand({company:'Loveable'},async url=>{
  calls.push(url)
  if(url==='https://lovable.dev/')throw Error('Website returned 403.')
  return {url,type:'text/html',buffer:Buffer.from('<a href="/home" aria-label="Go to homepage"><svg viewBox="0 0 10 10"><path fill="currentColor" d="M0 0h10v10z"/></svg></a><style>:root{--marketing-background:45 40% 98%;--marketing-primary:0 0% 11%;--marketing-foreground:0 0% 11%}.dark{--marketing-background:0 0% 11%;--marketing-primary:45 40% 98%}</style>')}
 })
 // The page itself: homepage, then the brand-page fallback. Icon lookups follow.
 assert.deepEqual(calls.slice(0,2),['https://lovable.dev/','https://lovable.dev/brand'])
 assert.ok(calls.slice(2).every(u=>/\/(icon\.svg|apple-touch-icon\.png)$/.test(u)))
 assert.ok(result.logo.startsWith('data:image/svg+xml;base64,'))
 assert.equal(result.background,'#fcfbf8')
 assert.equal(result.primary,'#1c1c1c')
 assert.equal(result.text,'#1c1c1c')
})
test('unsafe inline logo is dropped and an unrelated first font face is not substituted', async()=>{
 const result=await discoverBrand({website:'https://example.com/'},async url=>({url,type:'text/html',buffer:Buffer.from('<a href="/" aria-label="Home"><svg onload="bad()"><path/></svg></a><style>@font-face{font-family:Icons;src:url(/icons.woff2)}h1{font-family:Company Sans}</style>')}))
 assert.equal(result.logo,'')
 assert.equal(result.fontData,'')
 assert.equal(result.headingFont,'Company Sans')
})


test('branding reads the official site and its verified public company LinkedIn logo without adopting LinkedIn fonts',async()=>{
 const calls=[],linkedin='https://www.linkedin.com/company/example'
 const r=await discoverBrand({company:'Example',website:'https://company.example/'},async url=>{
  calls.push(url)
  if(url==='https://company.example/')return {url,type:'text/html',buffer:Buffer.from('<a href="'+linkedin+'">LinkedIn</a><style>:root{--primary:#123456}body{font-family:Company Sans}</style>')}
  if(url===linkedin)return {url,type:'text/html',buffer:Buffer.from('<img alt="Example logo" src="https://media.licdn.com/example.png"><style>body{font-family:LinkedIn Sans;color:#0a66c2}</style>')}
  if(url==='https://media.licdn.com/example.png')return {url,type:'image/png',buffer:logoPng}
  throw Error('Unexpected request '+url)
 })
 assert.ok(calls.includes(linkedin));assert.ok(r.logo.startsWith('data:image/png;base64,'))
 assert.equal(r.linkedinUrl,linkedin);assert.equal(r.headingFont,'Company Sans');assert.equal(r.primary,'#123456')
 assert.ok(r.sources.includes(linkedin))
})
test('blocked LinkedIn does not break official website assets or pretend its assets were used',async()=>{
 const linkedin='https://www.linkedin.com/company/example'
 const r=await discoverBrand({company:'Example',website:'https://company.example/'},async url=>{
  if(url===linkedin)throw Error('403')
  return {url,type:url.endsWith('.png')?'image/png':'text/html',buffer:(url.endsWith('.png')?logoPng:Buffer.from('<a href="/" aria-label="Example home"><img alt="Example" src="/logo.png"></a><a href="'+linkedin+'">LinkedIn</a>'))}
 })
 assert.ok(r.logo);assert.equal(r.status,'ready');assert.ok(!r.sources.includes(linkedin))
 assert.equal(r.sourceNotes[0].status,'unavailable')
})


test('branding can search for a verified company LinkedIn page when the official site does not link it',async()=>{
 const linkedin='https://www.linkedin.com/company/example',calls=[]
 const client={messages:{stream:options=>{assert.equal(options.tools[0].max_uses,1);return {finalMessage:async()=>({content:[{type:'web_search_tool_result',content:[{url:linkedin}]},{type:'text',text:JSON.stringify({website:'https://company.example/',linkedinUrl:linkedin})}]})}}}}
 const result=await discoverBrand({company:'Example',website:'https://company.example/'},async url=>{calls.push(url);return {url,type:'text/html',buffer:Buffer.from('<p>No logo</p>')}},client)
 assert.equal(result.linkedinUrl,linkedin);assert.ok(calls.includes(linkedin))
})


test('localized home titles and HTML base paths work with or without trailing slash',async()=>{
 for(const homepage of ['https://company.example/en','https://company.example/en/']){
  const requested=[]
  const r=await discoverBrand({company:'A misspelled company',website:homepage},async url=>{
   requested.push(url)
   if(url===homepage)return {url,type:'text/html',buffer:Buffer.from('<base href="/en/"><link rel="stylesheet" href="public/styles.css"><a href="/en" title="home"><img src="public/company-logo-white.svg"></a>')}
   if(url==='https://company.example/en/public/styles.css')return {url,type:'text/css',buffer:Buffer.from(':root{--font-sans:ui-sans-serif;--font-company:Company Display}html{font-family:Company Body,sans-serif}h1:not(.hidden){font-family:var(--font-company)}@font-face{font-family:Company Display;src:url(assets/display.ttf)}')}
   if(url==='https://company.example/en/public/company-logo-white.svg')return {url,type:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M0 0h10v10H0z"/></svg>')}
   if(url==='https://company.example/en/public/assets/display.ttf')return {url,type:'font/ttf',buffer:Buffer.concat([Buffer.from([0,1,0,0]),Buffer.from('font-fixture')])}
   throw Error('Wrong relative path: '+url)
  })
  assert.equal(r.status,'ready');assert.ok(r.logo);assert.equal(r.headingFont,'Company Display');assert.equal(r.bodyFont,'Company Body')
  assert.ok(r.fontData.startsWith('data:font/ttf;base64,'));assert.ok(requested.includes('https://company.example/en/public/company-logo-white.svg'))
 }
})
test('a successful company-page fetch without a usable logo is not reported ready',async()=>{
 const r=await discoverBrand({company:'Example',website:'https://company.example/'},async url=>({url,type:'text/html',buffer:Buffer.from('<p>No logo assets</p>')}))
 assert.equal(r.status,'error');assert.equal(r.logo,'');assert.match(r.message,/no usable company logo/i)
})
test('the verified Adidas corporate domain also handles the observed addidas spelling',async()=>{
 const requested=[]
 const r=await discoverBrand({company:'addidas'},async url=>{requested.push(url);return {url,type:'text/html',buffer:Buffer.from('<p>No assets in this fixture</p>')}})
 assert.equal(requested[0],'https://www.adidas-group.com/en/');assert.equal(r.status,'error')
})
test('the square icon is found separately from the wordmark logo', async () => {
 const html='<link rel="icon" href="/favicon.ico"><link rel="icon" href="/favicon-16x16.png" sizes="16x16"><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"><link rel="icon" href="/icon.svg" type="image/svg+xml"><a href="/" aria-label="Home"><svg viewBox="0 0 755 129"><path d="M0 0h10v10z"/></svg></a>'
 const icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 38"><path d="M0 0h37v38z"/></svg>'
 const calls=[]
 const result=await discoverBrand({website:'https://example.com/'},async url=>{
  calls.push(url)
  if(url==='https://example.com/icon.svg')return {url,type:'image/svg+xml',buffer:Buffer.from(icon)}
  return {url,type:'text/html',buffer:Buffer.from(html)}
 })
 assert.ok(result.logo.startsWith('data:image/svg+xml;base64,'))
 assert.equal(Buffer.from(result.icon.split(',')[1],'base64').toString(),icon)
 assert.notEqual(result.icon,result.logo)
 assert.ok(!calls.some(u=>/favicon\.ico|16x16/.test(u)),'tiny favicons are never used')
})

test('discovered hero choices keep only embedded images with HTTPS provenance', () => {
  const heroImage='data:image/png;base64,YWJj'
  const b=normalizeBrand({heroCandidates:[{heroImage,heroSource:'https://company.example/image',heroAlt:'Campus'},{heroImage:'https://tracker.example/image',heroSource:'https://company.example/'}]})
  assert.deepEqual(b.heroCandidates,[{heroImage,heroSource:'https://company.example/image',heroAlt:'Campus'}])
})

test('Poppins is embedded as fallback without replacing an observed company font', async () => {
 const {fontFaceCss,fontStack,officeFont}=await import('./brand.js');
 assert.equal(normalizeBrand({}).bodyFont,'Poppins');
 assert.equal(normalizeBrand({}).headingFont,'Poppins');
 assert.match(fontFaceCss({}),/font-family:'Poppins';src:url\('data:font\/ttf;base64,/);
 assert.match(fontStack('Company Sans'),/^'Company Sans','Poppins'/);
 assert.equal(officeFont(''),'Poppins');
 assert.equal(normalizeBrand({headingFont:'Company Sans'}).headingFont,'Company Sans');
});

test('Apple company name resolves the verified official site without a model key', async () => {
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 44"><path d="M2 16h10v15H2z"/></svg>';
 const result=await discoverBrand({company:'Apple'},async url=>{if(url!=='https://www.apple.com/')throw Error('Unavailable fixture');return {url,type:'text/html',buffer:Buffer.from('<a href="/" aria-label="Apple">'+svg+'</a>')}});
 assert.equal(result.website,'https://www.apple.com/');assert.ok(result.logo);assert.ok(result.sources.includes('https://www.apple.com/'));
});

test('asset search accepts only pages on the verified official company domain', async () => {
 const {searchOfficialBrandPages}=await import('../server/brand.js');let query='';
 const pages=await searchOfficialBrandPages('Apple','https://www.apple.com/',{search:async q=>{query=q;return [{url:'https://www.apple.com/newsroom/'},{url:'https://apple.com.evil.example/logo'},{url:'https://unrelated.example/apple-logo'}]}});
 assert.match(query,/official brand assets/);assert.deepEqual(pages,['https://www.apple.com/newsroom/']);
});
