import React, { useState, useRef, useEffect } from 'react'
import logoSvg from '../assets/backstage-logo.svg?raw'
import faviconSvg from '../../public/favicon.svg?raw'
import { prepareOnePager, pickAudience } from './prepare.js'
import { buildEnv, resolveSlides } from '../deck/model.js'
import { buildOnePager } from './html.js'
import { buildSiteHtml } from './site.js'
import Preview from './Preview.jsx'
import { normalizeBrand, brandLogoHtml, brandDocument } from '../brand.js'

// Export menu: PDF, PowerPoint, a one-pager, and the website view, all built from
// the deck on screen for the stakeholder selected in the toolbar.

const slug = s => String(s || 'deck').replace(/[^\w\- ]+/g, '').trim() || 'deck'

// Browser helpers the PowerPoint builder needs.
function rasterLogo(brand) {
  return new Promise(resolve => {
    const img = new Image()
    if (brand?.hideLogo) return resolve(null)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      const ratio = (img.naturalWidth || 2079.95) / (img.naturalHeight || 456.05)
      canvas.height = Math.round(1200 / ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({ data: canvas.toDataURL('image/png'), ratio })
    }
    img.onerror = () => resolve(null)
    const withSize = logoSvg.replace('<svg ', '<svg width="1200" height="263" ')
    img.src = normalizeBrand(brand).logo || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withSize)}`
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

export default function ExportMenu({ company: projectName, deck, inputs, fields, connectors, stakeholders, activeKey, onWebsite, brand, requestedView, onViewOpened }) {
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
  useEffect(() => {
    if (!requestedView) return
    show(requestedView)
    onViewOpened?.()
  }, [requestedView]) // eslint-disable-line react-hooks/exhaustive-deps

  function show(kind) {
    setOpen(false)
    if (kind === 'website') { setPreview(null); onWebsite(activeKey); return }
    if (kind === 'onepager') { onePager(); return }
    setPreview({ kind, title: kind === 'pdf' ? 'PDF preview' : 'Slides', file: `${slug(company)} - ${kind}.html`, html: buildSiteHtml({ project: { name: company, deck, fields, stakeholders, brand }, inputs, activeKey, mode: kind }) })
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
        brand,
        slides: resolveSlides(deck, env),
        deps: { PptxGenJS, logoPng: () => rasterLogo(brand), imageSize }
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
    setPreview({ kind: 'onepager', title: 'One-pager', file: `${slug(company)} - one-pager.html`, html: brandDocument(buildOnePager({ facts, logoSvg: brandLogoHtml(brand, logoSvg), faviconSvg }), brand) })
  }

  const items = [
    { name: 'PDF', note: 'Preview the paginated document', run: () => show('pdf') },
    { name: 'Slides', note: 'Present one slide at a time', run: () => show('slides') },
    { name: 'One-pager', note: 'A concise executive brief', run: () => show('onepager') },
    { name: 'Website', note: 'Explore perspectives and scenarios', run: () => show('website') }
  ]

  return (
    <div className="export" ref={ref}>
      <button className="primary" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} disabled={!!busy}>
        {busy ? 'Working…' : 'View as'} <span aria-hidden="true">▾</span>
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
          onView={show}
          onDownloadSlides={pptx}
          busy={!!busy}
        />
      )}
    </div>
  )
}
