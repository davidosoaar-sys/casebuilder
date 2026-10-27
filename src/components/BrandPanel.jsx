import React, { useState, useEffect } from 'react'
import { DEFAULT_BRAND, normalizeBrand, safeAsset, BRAND_FONTS } from '../brand.js'
import BrandReview from './BrandReview.jsx'
import { fileToDataUrl } from '../deck/image.js'

export default function BrandPanel({ brand, onChange, onScan, onClose }) {
  const b = normalizeBrand(brand)
  const [website, setWebsite] = useState(b.website)
  const [problem, setProblem] = useState('')
  const [hexDrafts, setHexDrafts] = useState({})
  useEffect(() => { setWebsite(b.website) }, [b.website])
  const set = patch => onChange({ ...b, ...patch })
  async function logo(file) {
    if (!file) return
    try { const image = await fileToDataUrl(file); if (!safeAsset(image)) throw Error('Choose a smaller PNG, JPG, WebP or SVG logo.'); set({ logo: image, hideLogo: false, logoBackground: 'transparent' }); setProblem('') } catch (error) { setProblem(error.message || 'Could not load that image.') }
  }
  async function font(file) {
    if (!file) return
    if (!/\.woff2?$/i.test(file.name) || file.size > 600_000) return setProblem('Choose a WOFF or WOFF2 file smaller than 600 KB.')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const sig = String.fromCharCode(...bytes.slice(0, 4))
    if (!['wOF2', 'wOFF'].includes(sig)) return setProblem('That file is not a supported web font.')
    const name = file.name.replace(/\.woff2?$/i, '').replace(/[^a-z0-9 _-]/gi, '')
    const base64 = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(file) })
    set({ fontData: `data:font/${sig === 'wOF2' ? 'woff2' : 'woff'};base64,${base64}`, fontName: name, headingFont: name, bodyFont: name, fontFaces: [] })
    setProblem('')
  }
  return (
    <aside className="brand-panel no-print" aria-label="Deck design">
      <div className="brand-panel-head"><div><h2>Deck design</h2><p>Use the company’s branding, or make it your own.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close deck design">×</button></div>
      <form className="brand-scan" onSubmit={e => { e.preventDefault(); onScan(website.trim()) }}>
        <label htmlFor="brand-website">Official company website</label>
        <input id="brand-website" type="text" placeholder="https://company.com" value={website} onChange={e => setWebsite(e.target.value)} />
        <button className="ghost" disabled={b.status === 'scanning'}>{b.status === 'scanning' ? 'Finding brand assets…' : 'Find company branding'}</button>
      </form>
      {b.message && <p className="help" role="status">{b.message}</p>}
      {b.linkedinUrl&&<p className="help"><a href={b.linkedinUrl} target="_blank" rel="noreferrer noopener">Company LinkedIn page</a></p>}{b.sourceNotes?.map((n,i)=><p key={i} className="help">{n.message} <a href={n.url} target="_blank" rel="noreferrer noopener">Source</a></p>)}
      <BrandReview review={b.review}/>
      {b.sources.length > 0 && <details><summary>Brand sources</summary>{b.sources.map(s => <a key={s} href={s} target="_blank" rel="noreferrer">{s}</a>)}</details>}
      <section><h3>Company logo</h3>{b.logo && <div className="brand-logo-preview" style={{ background: b.background }} title="On the deck background"><img src={b.logo} alt="Current company logo" style={b.logoBackground!=='transparent'?{background:b.logoBackground,padding:8,borderRadius:4}:undefined}/></div>}<div className="brand-actions"><label className="ghost file-btn">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={e => logo(e.target.files[0])} /></label><button className="ghost" onClick={() => set({ logo: '', hideLogo: true })}>Remove logo</button></div></section>
      <label className="brand-hide-logo"><input type="checkbox" checked={b.hideLogo} onChange={e=>set({hideLogo:e.target.checked})}/> Hide logo in case artifacts</label>
      {b.logoVariants.length>0&&<section><h3>Discovered logos</h3><div className="brand-actions">{b.logoVariants.map((v,i)=><button type="button" className="ghost" key={i} onClick={()=>set({logo:v.logo,hideLogo:false,logoBackground:'transparent'})} aria-label={`Use discovered logo ${i+1}`}><img src={v.logo} alt={`Logo option ${i+1}`} style={{width:100,height:50,objectFit:'contain'}}/></button>)}</div></section>}
      <section><h3>Company icon</h3><p className="help">The square mark without the name. Used on project cards and small spaces.</p>{b.icon && <div className="brand-logo-preview brand-icon-preview" style={{ background: b.background }}><img src={b.icon} alt="Current company icon" /></div>}<div className="brand-actions"><label className="ghost file-btn">Upload icon<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={async e => { try { set({ icon: await fileToDataUrl(e.target.files[0]) }); setProblem('') } catch { setProblem('Could not load that image. Try PNG, JPG or WebP.') } }} /></label>{b.icon && <button className="ghost" onClick={() => set({ icon: '' })}>Remove icon</button>}</div></section>
      <section><h3>Brand imagery</h3><p className="help">Optional company photography for the Live Room and one-pager. Use an image you have permission to use; the logo and fonts stay unchanged.</p>{b.heroImage&&<img src={b.heroImage} alt={b.heroAlt||'Brand image preview'} style={{width:'100%',maxHeight:160,objectFit:'cover'}}/>}<label className="ghost file-btn">Choose image<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async e=>{try{const image=await fileToDataUrl(e.target.files[0]);if(image.length>=1200000)throw Error('Choose a smaller image.');set({heroImage:image,heroSource:'',heroAlt:''});setProblem('')}catch(error){setProblem(error.message||'Could not load image.')}}}/></label>{b.heroImage&&<><button className="ghost" onClick={()=>set({heroImage:'',heroAlt:'',heroSource:''})}>Remove image</button><label>Image description<input value={b.heroAlt} maxLength={240} onChange={e=>set({heroAlt:e.target.value})}/></label><label>Image source<input value={b.heroSource} onChange={e=>set({heroSource:e.target.value})} placeholder="https://company.com/…"/></label></>}</section>
      {b.heroCandidates.length>0&&<section><h3>Discovered images</h3>{b.heroCandidates.map((v,i)=><button type="button" className="ghost" key={i} onClick={()=>set(v)} aria-label={`Use discovered image ${i+1}`}><img src={v.heroImage} alt={v.heroAlt||`Image option ${i+1}`} style={{width:'100%',maxHeight:100,objectFit:'cover'}}/></button>)}</section>}
      <section><h3>Colors</h3>{[['primary', 'Accent'], ['background', 'Page background'], ['surface', 'Cards and panels'], ['text', 'Text'], ['muted', 'Secondary text']].map(([key, label]) => <label className="brand-color" key={key}><span>{label}</span><input type="color" aria-label={label} value={b[key]} onChange={e => { setHexDrafts(d => ({ ...d, [key]: undefined })); set({ [key]: e.target.value }) }} /><input aria-label={`${label} hex`} value={hexDrafts[key] ?? b[key]} maxLength={7} onChange={e => { const value = e.target.value; setHexDrafts(d => ({ ...d, [key]: value })); if (/^#[0-9a-f]{6}$/i.test(value)) set({ [key]: value }) }} onBlur={() => setHexDrafts(d => ({ ...d, [key]: undefined }))} /></label>)}</section>
      <section><h3>Typography</h3><label>Heading font<input list="brand-fonts" value={b.headingFont} onChange={e => set({ headingFont: e.target.value })} /></label><label>Body font<input list="brand-fonts" value={b.bodyFont} onChange={e => set({ bodyFont: e.target.value })} /></label><datalist id="brand-fonts">{BRAND_FONTS.map(f => <option key={f} value={f} />)}</datalist><label className="ghost file-btn">Upload font<input type="file" accept=".woff,.woff2" hidden onChange={e => font(e.target.files[0])} /></label><p className="help">Use an installed font or upload a web font you’re licensed to use. PowerPoint recipients need the font installed.</p></section>
      {problem && <p role="alert" className="help">{problem}</p>}
      <button className="ghost" onClick={() => onChange({ ...DEFAULT_BRAND, status: 'ready' })}>Reset deck styling</button>
    </aside>
  )
}
