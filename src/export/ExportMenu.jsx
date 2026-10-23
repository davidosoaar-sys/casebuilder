import React, { useState, useRef, useEffect } from 'react'
import logoSvg from '../assets/backstage-logo.svg?raw'
import vmSource from '../valueModel.js?raw'
import { prepareOnePager, prepareWebsite, pickAudience } from './prepare.js'
import { buildEnv, resolveSlides } from '../deck/model.js'
import { buildOnePager, buildWebsite } from './html.js'

// Export menu: PDF, PowerPoint, one-pager and an interactive website, all built
// from the deck on screen for the stakeholder selected in the toolbar.

const slug = s => String(s || 'deck').replace(/[^\w\- ]+/g, '').trim() || 'deck'

function download(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Browser helpers the PowerPoint builder needs.
function rasterLogo() {
  return new Promise(resolve => {
    const img = new Image()
    const ratio = 2079.95 / 456.05
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = Math.round(1200 / ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({ data: canvas.toDataURL('image/png'), ratio })
    }
    img.onerror = () => resolve(null)
    const withSize = logoSvg.replace('<svg ', '<svg width="1200" height="263" ')
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withSize)}`
  })
}

function imageSize(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 4, h: img.naturalHeight || 3 })
    img.onerror = () => resolve({ w: 4, h: 3 })
    img.src = src
  })
}

export default function ExportMenu({ company: projectName, deck, inputs, fields, stakeholders, activeKey }) {
  // The deck itself says {company} from the Company input, so use that name everywhere.
  const company = inputs.companyName || projectName
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // { kind, html, title }
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = e => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  // With no stakeholders left, export for "everyone" with a neutral headline.
  const who = pickAudience(stakeholders, activeKey)

  function pdf() {
    setOpen(false)
    // Let the menu close before the print dialog opens.
    setTimeout(() => window.print(), 80)
  }

  async function pptx() {
    setOpen(false)
    setError('')
    setBusy('Building the PowerPoint…')
    try {
      const [{ default: PptxGenJS }, { buildPptx }] = await Promise.all([import('pptxgenjs'), import('./pptx.js')])
      const env = buildEnv(inputs, fields, who)
      const file = await buildPptx({
        company,
        slides: resolveSlides(deck, env),
        deps: { PptxGenJS, logoPng: rasterLogo, imageSize }
      })
      await file.writeFile({ fileName: `${slug(company)} - business case.pptx` })
    } catch (err) {
      console.error(err)
      setError('Could not build the PowerPoint. ' + (err?.message || ''))
    } finally {
      setBusy('')
    }
  }

  function onePager() {
    setOpen(false)
    const facts = prepareOnePager({ inputs, fields, who })
    setPreview({ kind: 'onepager', title: 'One-pager', file: `${slug(company)} - one-pager.html`, html: buildOnePager({ facts, logoSvg }) })
  }

  function website() {
    setOpen(false)
    const args = prepareWebsite({ company, deck, inputs, fields, stakeholders, who })
    setPreview({
      kind: 'website',
      title: 'Interactive website',
      file: `${slug(company)} - business case.html`,
      html: buildWebsite({ ...args, logoSvg, vmSource })
    })
  }

  const items = [
    { name: 'PDF', note: 'Print or save every page', run: pdf },
    { name: 'PowerPoint', note: '.pptx, editable', run: pptx },
    { name: 'One-pager', note: 'A single A4 summary', run: onePager },
    { name: 'Interactive website', note: 'One file, works offline', run: website }
  ]

  return (
    <div className="export" ref={ref}>
      <button className="primary" onClick={() => setOpen(o => !o)} aria-expanded={open} disabled={!!busy}>
        {busy ? 'Working…' : 'Export'} <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="menu export-menu" role="menu">
          {items.map(i => (
            <button key={i.name} role="menuitem" className="menu-item export-item" onClick={i.run}>
              <strong>{i.name}</strong>
              <span>{i.note}</span>
            </button>
          ))}
        </div>
      )}

      {busy && <div className="export-toast">{busy}</div>}
      {error && (
        <div className="export-toast export-error" role="alert">
          {error} <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {preview && (
        <Preview
          preview={preview}
          onClose={() => setPreview(null)}
          audience={who.role}
        />
      )}
    </div>
  )
}

function Preview({ preview, onClose, audience }) {
  const frame = useRef(null)
  const isPager = preview.kind === 'onepager'

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
            <span>For {audience}</span>
          </div>
          <div className="preview-actions">
            {isPager && (
              <button className="primary" onClick={() => frame.current?.contentWindow?.print()}>
                Print / Save as PDF
              </button>
            )}
            <button className="ghost" onClick={() => download(preview.file, new Blob([preview.html], { type: 'text/html' }))}>
              Download .html
            </button>
            {!isPager && (
              <button
                className="ghost"
                onClick={() => window.open(URL.createObjectURL(new Blob([preview.html], { type: 'text/html' })), '_blank')}
              >
                Open in new tab
              </button>
            )}
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
