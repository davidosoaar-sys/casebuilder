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
  assert.equal(parsed.logoUrl, 'https://example.com/icon.png')
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
 assert.deepEqual(calls,['https://lovable.dev/','https://lovable.dev/brand'])
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
