import React, { useEffect, useRef } from 'react'
import { download } from './download.js'

// A full-screen preview of the one-pager, with print / save as PDF.

export default function Preview({ preview, onClose, audience }) {
  const frame = useRef(null)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="preview-backdrop no-print">
      <div className="preview" role="dialog" aria-label={preview.title}>
        <header className="preview-bar">
          <div>
            <strong>{preview.title}</strong>
            <span>For {preview.for || audience}</span>
          </div>
          <div className="preview-actions">
            <button className="primary" onClick={() => frame.current?.contentWindow?.print()}>
              Print / Save as PDF
            </button>
            <button className="ghost" onClick={() => download(preview.file, new Blob([preview.html], { type: 'text/html' }))}>
              Download .html
            </button>
            <button className="ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <iframe
          ref={frame}
          title={preview.title}
          srcDoc={preview.html}
          sandbox="allow-scripts allow-modals allow-same-origin allow-popups"
        />
      </div>
    </div>
  )
}
