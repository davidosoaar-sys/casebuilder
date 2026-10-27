import React, { useEffect, useRef, useState } from 'react'
import { download } from './download.js'
import { Select } from '../components/ui.jsx'
import {normalizeBrand,officeFont} from '../brand.js'

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

export default function Preview({ preview, onClose, audience, onView, onDownloadSlides, busy, hidden, onFillInputs, brand }) {
  const frame = useRef(null)
  const [destination,setDestination]=useState(preview.destination||'powerpoint')
  useEffect(()=>{setDestination(preview.destination||'powerpoint')},[preview.destination])
  const identity=normalizeBrand(brand)
  const label=destination==='google-slides'?'Google Slides':destination==='canva'?'Canva':'PowerPoint'

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
            {onView && <Select className="preview-format" aria-label="Preview format" value={preview.kind} options={FORMATS} onChange={onView} />}
            {preview.kind === 'slides' ? <>
              <button className="ghost" onClick={() => frame.current?.requestFullscreen?.()}>Present fullscreen</button>
              <button className="primary" disabled={busy} onClick={()=>onDownloadSlides(destination)}>{busy ? 'Preparing…' : destination==='powerpoint'?'Download PPTX':`Download for ${label}`}</button>
            </> : <button className="primary" title="Open the browser’s Save as PDF dialog" onClick={async () => { await frame.current?.contentDocument?.fonts?.ready; frame.current?.contentWindow?.print() }}>Download PDF</button>}
            {preview.kind === 'onepager' && <button className="ghost" onClick={() => download(preview.file, new Blob([preview.html], { type: 'text/html' }))}>Download HTML</button>}
            <button className="ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        {preview.kind==='slides'&&<section className="slide-import-options" aria-label="Slide export options">
          <label>Export for <Select aria-label="Slide export destination" value={destination} options={[{value:'powerpoint',label:'PowerPoint'},{value:'google-slides',label:'Google Slides'},{value:'canva',label:'Canva'}]} onChange={setDestination}/></label>
          <div><p><strong>Editable text</strong> · Headings: {officeFont(identity.headingFont)} · Body: {officeFont(identity.bodyFont)}</p><p>Font names are preserved in the file. Fonts are not embedded; the destination may substitute fonts it does not support.</p>
          {destination==='google-slides'&&<p>Download the PPTX, then in <a href="https://slides.google.com/" target="_blank" rel="noopener noreferrer">Google Slides</a> choose File → Open → Upload. This imports a file; it does not connect your Google account.</p>}
          {destination==='canva'&&<p>Download the PPTX, then <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer">upload it in Canva</a>. Charts export as editable shapes so they survive import. For custom fonts, use a supported, licensed font in your Canva Brand Kit.</p>}
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
