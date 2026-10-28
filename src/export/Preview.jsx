import React, { useEffect, useRef, useState } from 'react'
import { download } from './download.js'
import { Select } from '../components/ui.jsx'
import {normalizeBrand,officeFont} from '../brand.js'
import {googleSlideFont} from './googleSlideFont.js'

// A full-screen preview of the one-pager, with print / save as PDF.

const FORMATS = [{ value: 'pdf', label: 'PDF' }, { value: 'slides', label: 'Slides' }, { value: 'onepager', label: 'One-pager' }, { value: 'website', label: 'Live room' }]

// Pages without numbers are left out of client output. Say so, name what is
// missing, and offer the way back to the inputs.
export function HiddenPagesNotice({ hidden, onFill }) {
  if (!hidden?.count) return null
  const names = hidden.missing.slice(0, 4)
  const more = hidden.missing.length - names.length
  const list = names.join(', ') + (more > 0 ? ` and ${more} more` : '')
  const lead = hidden.count === 1 ? '1 page is hidden until its numbers are filled in' : `${hidden.count} pages are hidden until their numbers are filled in`
  return (
    <div className="hidden-pages no-print" role="status">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.25" /><path d="M8 7.25v4M8 4.9v.1" /></svg>
      <p>{lead}{list ? <>: <span className="hidden-pages-list">{list}</span>.</> : '.'}</p>
      {onFill && <button type="button" className="ghost hidden-pages-fill" onClick={onFill}>Fill them in</button>}
    </div>
  )
}

export default function Preview({ preview, onClose, audience, onView, onDownloadSlides, busy, hidden, onFillInputs, brand,exportError,handoff,connectToolkit,onConnect }) {
  const frame = useRef(null)
  const [destination,setDestination]=useState(preview.destination||'powerpoint')
  useEffect(()=>{setDestination(preview.destination||'powerpoint')},[preview.destination])
  const identity=normalizeBrand(brand)
  const fonts=[identity.headingFont,identity.bodyFont].map(font=>destination==='google-slides'?googleSlideFont(font):{requested:officeFont(font),family:officeFont(font),substituted:false})
  const label=destination==='google-slides'?'Google Slides':'PowerPoint'

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && !e.defaultPrevented && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="preview-backdrop no-print">
      <div className="preview" role="dialog" aria-modal="true" aria-label={preview.title}>
        <header className="preview-bar">
          <div>
            <strong>{preview.title}</strong>
            <span>For {preview.for || audience}</span>
          </div>
          <div className="preview-actions">
            {onView && <label>View as <Select className="preview-format" aria-label="View as format" value={preview.kind} options={FORMATS} onChange={onView} /></label>}
            {preview.kind === 'slides' ? <>
              <button className="ghost" onClick={() => frame.current?.requestFullscreen?.()}>Present fullscreen</button>
              <button className="primary" disabled={busy} onClick={()=>onDownloadSlides(destination)}>{busy ? 'Preparing…' : destination==='powerpoint'?'Download PPTX':`Open in ${label}`}</button>
            </> : <button className="primary" title="Open the browser’s Save as PDF dialog" onClick={async () => { await frame.current?.contentDocument?.fonts?.ready; frame.current?.contentWindow?.print() }}>Download PDF</button>}
            {preview.kind === 'onepager' && <button className="ghost" onClick={() => download(preview.file, new Blob([preview.html], { type: 'text/html' }))}>Download HTML</button>}
            <button className="ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        {preview.kind==='slides'&&<section className="slide-import-options" aria-label="Slide export options">
          <label>Export for <Select aria-label="Slide export destination" value={destination} options={[{value:'powerpoint',label:'PowerPoint'},{value:'google-slides',label:'Google Slides'}]} onChange={setDestination}/></label>
          <div><p><strong>Editable text</strong> · Headings: {fonts[0].family} · Body: {fonts[1].family}</p><p>Company font names are retained in PowerPoint; Google Slides uses its supported fonts. Custom font files cannot be uploaded to Google Slides.</p>
          {fonts.some(f=>f.substituted)&&<p>{[...new Set(fonts.filter(f=>f.substituted).map(f=>f.requested))].join(', ')} is unavailable in Google Slides. This export uses Poppins; your saved company fonts are unchanged.</p>}
          {destination!=='powerpoint'&&<p>Imports this deck into your connected {label} account and opens the editing link. Account authorization and write/import permission are required. Choose PowerPoint to download a file instead.</p>}
          {exportError&&<p role="alert">{exportError} {connectToolkit&&<button className="ghost" disabled={busy} onClick={onConnect}>Connect Google Drive</button>}</p>}
          {handoff&&<p role="status">{handoff.instructions} <a href={handoff.url} target="_blank" rel="noopener noreferrer">Open {handoff.name}</a></p>}
          </div>
        </section>}
        <HiddenPagesNotice hidden={hidden} onFill={onFillInputs && (() => { onClose(); onFillInputs() })} />
        <iframe
          ref={frame}
          title={preview.title}
          srcDoc={preview.html}
          allow="fullscreen"
          sandbox="allow-scripts allow-modals allow-same-origin allow-popups"
        />
      </div>
    </div>
  )
}
