import { clientCompanyName } from '../companyName.js'
import {clientStakeholder} from '../stakeholderRequirements.js'
import React, { useState, useRef, useEffect } from 'react'
import faviconSvg from '../../public/favicon.svg?raw'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { EASE_OUT } from '../components/ui.jsx'
import { prepareOnePager, pickAudience, hiddenForClient } from './prepare.js'
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
    if (brand?.hideLogo || !normalizeBrand(brand).logo) return resolve(null)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      const ratio = (img.naturalWidth || 2079.95) / (img.naturalHeight || 456.05)
      canvas.height = Math.round(1200 / ratio)
      const ctx=canvas.getContext('2d'),b=normalizeBrand(brand)
      if(b.logoBackground!=='transparent'){ctx.fillStyle=b.logoBackground;ctx.fillRect(0,0,canvas.width,canvas.height)}
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({ data: canvas.toDataURL('image/png'), ratio })
    }
    img.onerror = () => resolve(null)
    img.src = normalizeBrand(brand).logo
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

export default function ExportMenu({ company: projectName, deck, inputs, fields, connectors, stakeholders, activeKey, onWebsite, brand, requestedView, onViewOpened, onFillInputs, triggerClass = 'primary' }) {
  // The deck itself says {company} from the Company input, so use that name everywhere.
  const company = clientCompanyName(inputs.companyName, projectName)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // { kind, html, title }
  const ref = useRef(null)
  const menu = useRef(null)
  const trigger = useRef(null)

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
      const env = buildEnv(inputs, fields, clientStakeholder(who))
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
    setPreview({ kind: 'onepager', title: 'One-pager', file: `${slug(company)} - one-pager.html`, html: brandDocument(buildOnePager({ facts, brand, logoSvg: brandLogoHtml(brand, ''), faviconSvg }), brand) })
  }

  // Each format: what it is, how you get it, and the file you end up with.
  const items = [
    { name: 'PDF', note: 'Preview, then save as PDF', gets: 'PDF', run: () => show('pdf') },
    { name: 'Slides', note: 'Present, or download PowerPoint (.pptx)', gets: 'PPTX', run: () => show('slides') },
    { name: 'One-pager', note: 'Preview, then PDF or HTML', gets: 'PDF, HTML', run: () => show('onepager') },
    { name: 'Live room', note: 'Interactive page you can share', gets: 'Link', run: () => show('website') }
  ]

  // Focus the first item on open; arrows move, Escape closes back to the button.
  useEffect(() => {
    if (!open) return
    menu.current?.querySelector('[role=menuitem]')?.focus()
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); trigger.current?.focus() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  function onMenuKey(e) {
    const all = [...menu.current.querySelectorAll('[role=menuitem]')]
    const i = all.indexOf(document.activeElement)
    const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : null
    if (to == null) return
    e.preventDefault(); all[(to + all.length) % all.length]?.focus()
  }

  return (
    <div className="export" ref={ref}>
      <button ref={trigger} className={`${triggerClass} export-trigger`} onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} disabled={!!busy}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2.5v7.5M4.75 6.75 8 10l3.25-3.25M3 12.5h10" /></svg>
        {busy ? 'Working…' : 'Export'}
        <svg className="export-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 4.5L6 7.5l3-3" /></svg>
      </button>

      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {open && (
            <motion.div key="export-menu" ref={menu} className="export-menu" role="menu" aria-label="Export" onKeyDown={onMenuKey}
              initial={{ opacity: 0, transform: 'scale(0.97)' }} animate={{ opacity: 1, transform: 'scale(1)' }} exit={{ opacity: 0, transform: 'scale(0.97)' }} transition={{ duration: 0.14, ease: EASE_OUT }}>
              {items.map(i => (
                <button key={i.name} type="button" role="menuitem" tabIndex={-1} className="export-item" onClick={i.run}>
                  <span className="export-item-text"><strong>{i.name}</strong><span>{i.note}</span></span>
                  <small className="export-item-gets">{i.gets}</small>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>

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
          hidden={hiddenForClient({ deck, inputs, fields, stakeholders, activeKey })}
          onFillInputs={onFillInputs}
        />
      )}
    </div>
  )
}
