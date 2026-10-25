import React, { useEffect, useRef } from 'react'
import { download } from './download.js'

// A full-screen preview of the one-pager, with print / save as PDF.

export default function Preview({ preview, onClose, audience, onView, onDownloadSlides, busy }) {
  const frame = useRef(null)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
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
            {onView && <select aria-label="Preview format" value={preview.kind} onChange={e => onView(e.target.value)}><option value="pdf">PDF</option><option value="slides">Slides</option><option value="onepager">One-pager</option><option value="website">Live room</option></select>}
            {preview.kind === 'slides' ? <>
              <button className="ghost" onClick={() => frame.current?.requestFullscreen?.()}>Present fullscreen</button>
              <button className="primary" disabled={busy} onClick={onDownloadSlides}>{busy ? 'Preparing…' : 'Download PPTX'}</button>
            </> : <button className="primary" title="Open the browser’s Save as PDF dialog" onClick={async () => { await frame.current?.contentDocument?.fonts?.ready; frame.current?.contentWindow?.print() }}>Download PDF</button>}
            {preview.kind === 'onepager' && <button className="ghost" onClick={() => download(preview.file, new Blob([preview.html], { type: 'text/html' }))}>Download HTML</button>}
            <button className="ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
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
