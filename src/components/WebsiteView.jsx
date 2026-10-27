import { clientCompanyName } from '../companyName.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { buildSiteHtml, hashText } from '../export/site.js'
import { download } from '../export/download.js'
import { SITE_CONFIG } from '../../server/publish.js'
import { Menu, Select, UndoRedo } from './ui.jsx'
import ExportMenu from '../export/ExportMenu.jsx'
import { HiddenPagesNotice } from '../export/Preview.jsx'
import { hiddenForClient } from '../export/prepare.js'
import { resolveStakeholder } from '../deck/stakeholders.js'

const FORMATS = [{ value: 'pdf', label: 'PDF' }, { value: 'slides', label: 'Slides' }, { value: 'onepager', label: 'One-pager' }, { value: 'website', label: 'Live Room' }, { value: 'editor', label: 'Slide editor' }]

// "View as website": the project's interactive website, exactly as visitors see
// it. Click any text on the page to edit it (the change is saved into the deck),
// then "Copy link" publishes the latest version to Vercel and copies the address.
// A case keeps the same address when you publish again, so a link you already
// sent shows your latest edits.

const ACCESS_KEY = 'casebuilder.access'
const readCode = () => {
  try {
    return localStorage.getItem(ACCESS_KEY) || ''
  } catch {
    return ''
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fall back to the old way, which works without clipboard permission
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

export default function WebsiteView({ project, inputs, onDeck, onSite, onBack, onScenario, audienceKey, onView, onFillInputs, history }) {
  const stakeholders = useMemo(() => project.stakeholders.map(resolveStakeholder).filter(Boolean), [project.stakeholders])
  const hidden = useMemo(() => hiddenForClient({ deck: project.deck, inputs, fields: project.fields, stakeholders, activeKey: audienceKey }), [project.deck, project.fields, inputs, stakeholders, audienceKey])
  const frame = useRef(null)
  const scenarioRef = useRef(null)
  scenarioRef.current = { saved: project.scenario, onScenario }
  const detachScenario = useRef(() => {})
  useEffect(() => () => detachScenario.current(), [])
  const [editing, setEditing] = useState(false)
  const [working, setWorking] = useState('') // '' | 'publish' | 'zip'
  const [problem, setProblem] = useState(null) // { message } | { setup: true } | { codeRequired: true }
  const [needCode, setNeedCode] = useState(false)
  const [code, setCode] = useState(readCode)
  const [copied, setCopied] = useState(false)

  const company = clientCompanyName(inputs.companyName, project.name)
  const site = project.site
  const slug = String(company).replace(/[^\w\- ]+/g, '').trim() || 'site'

  // What the frame shows is fixed while you edit inside it, so typing never
  // reloads the page under you. `current` always reflects the latest deck.
  const [shown,setShown] = useState(() => buildSiteHtml({ project, inputs, activeKey: audienceKey })) // eslint-disable-line react-hooks/exhaustive-deps
  const current = useMemo(() => buildSiteHtml({ project, inputs, activeKey: audienceKey }), [project.deck, project.fields, project.stakeholders, project.brand, inputs, audienceKey])
  const currentHash = useMemo(() => hashText(current), [current])
  const upToDate = !!site && site.hash === currentHash

  // Edits made on the page arrive as messages and are saved into the deck.
  useEffect(() => {
    const onMessage = e => {
      if (e.source !== frame.current?.contentWindow || e.data?.cb !== 'edit') return
      const { slideId, blockId, field, value } = e.data
      onDeck(list =>
        list.map(s =>
          s.id === slideId ? { ...s, blocks: s.blocks.map(b => (b.id === blockId ? { ...b, [field]: value } : b)) } : s
        ),
        { label: 'Edited text in the Live room', key: `text:${blockId}:${field}` }
      )
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onDeck])

  const sendMode = () => frame.current?.contentWindow?.postMessage({ cb: 'edit-mode', on: editing }, '*')
  useEffect(sendMode, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  function frameReady() {
    sendMode()
    detachScenario.current()
    const doc = frame.current?.contentDocument
    if (!doc) return
    const ranges = () => [...doc.querySelectorAll('#sliders input[data-key]')]
    for (const range of ranges()) {
      const value = scenarioRef.current.saved?.inputs?.[range.dataset.key]
      if (Number.isFinite(value)) {
        range.value = value
        range.dispatchEvent(new frame.current.contentWindow.Event('input', { bubbles: true }))
      }
    }
    const capture = e => {
      if (!e.target.matches('#sliders input[data-key], #whatif-reset')) return
      const values = Object.fromEntries(ranges().map(r => [r.dataset.key, Number(r.value)]))
      scenarioRef.current.onScenario?.(previous => ({ ...previous, inputs: values }))
    }
    doc.addEventListener('input', capture)
    doc.addEventListener('click', capture)
    detachScenario.current = () => { doc.removeEventListener('input', capture); doc.removeEventListener('click', capture) }
  }

  function flashCopied() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  // Only say "copied" if it really was; otherwise point at the link on screen.
  function copied_(ok) {
    if (ok) return flashCopied()
    setProblem({ message: 'The browser blocked copying. The link is shown above: select it and copy it.' })
  }

  async function copyLink() {
    setProblem(null)
    // Nothing changed since it was published: just copy the address.
    if (site?.url && upToDate) return copied_(await copyText(site.url))
    setWorking('publish')
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}) },
        body: JSON.stringify({ company, name: site?.name, html: current })
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503 && data.error === 'not_configured_publish') return setProblem({ setup: true })
      if (res.status === 503 && data.error === 'code_required') return setProblem({ codeRequired: true })
      if (res.status === 401) return setNeedCode(true)
      if (!res.ok) throw new Error(data.error || 'Publishing failed.')
      setNeedCode(false)
      onSite({ name: data.name, url: data.url, hash: currentHash, public: data.public, note: data.note })
      copied_(await copyText(data.url))
    } catch (err) {
      setProblem({ message: err.message || 'Publishing failed.' })
    } finally {
      setWorking('')
    }
  }

  function saveCode(e) {
    e.preventDefault()
    try {
      localStorage.setItem(ACCESS_KEY, code.trim())
    } catch {
      // ignore: the code just won't persist
    }
    setCode(code.trim())
    setNeedCode(false)
  }

  const openTab = () => window.open(URL.createObjectURL(new Blob([current], { type: 'text/html' })), '_blank')
  const saveHtml = () => download(`${slug} - business case.html`, new Blob([current], { type: 'text/html' }))

  async function saveProject() {
    setWorking('zip')
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      const dir = `${slug}-site`
      zip.file(`${dir}/index.html`, current)
      zip.file(`${dir}/vercel.json`, JSON.stringify(SITE_CONFIG, null, 2))
      zip.file(
        `${dir}/README.txt`,
        'A ready-to-deploy Vercel project: one page, no build.\n\n' +
          '  1. Install the Vercel CLI:   npm i -g vercel\n' +
          '  2. From this folder run:     vercel deploy --prod\n\n' +
          'Or drag this folder onto https://vercel.com/new .\n'
      )
      download(`${slug} - vercel project.zip`, await zip.generateAsync({ type: 'blob' }))
    } finally {
      setWorking('')
    }
  }

  const busy = !!working

  return (
    <div className="site-view">
      <div className="site-bar no-print">
        <div className="site-bar-left">
          <button className="link-btn" onClick={onBack}>
            Edit slides
          </button>
          <strong>Live Room</strong>
          <span className="toolbar-hint">
            {editing ? 'Click any text on the page to edit it. For layout changes, use Edit slides.' : 'Showing it as a visitor sees it.'}
          </span>
        </div>
        <div className="site-bar-actions">
          <UndoRedo history={history} />
          <Select className="website-view-format" aria-label="View as format" value="website" options={FORMATS}
            onChange={format => onView?.(format, frame.current?.contentDocument?.querySelector('#audience select')?.value || audienceKey)} />
          <button className={`ghost ${editing ? 'ghost-on' : ''}`} onClick={() => {if(!editing)setShown(current);setEditing(e => !e)}}>
            {editing ? 'Finish editing' : 'Edit content'}
          </button>
          <ExportMenu triggerClass="ghost" company={project.name} deck={project.deck} inputs={inputs} fields={project.fields} stakeholders={stakeholders}
            activeKey={audienceKey} brand={project.brand} onWebsite={() => {}} onFillInputs={onFillInputs} />
          <Menu label="More ways to share" title="More" className="icon-btn site-more" items={[
            { label: 'Open in new tab', onSelect: openTab, disabled: busy },
            { label: 'Download .html', onSelect: saveHtml, disabled: busy },
            { label: 'Vercel project', description: 'A folder you can deploy yourself with `vercel deploy --prod`', onSelect: saveProject, disabled: busy }
          ]} />
          <button className="primary" onClick={copyLink} disabled={busy}>
            {working === 'publish' ? 'Publishing…' : copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <HiddenPagesNotice hidden={hidden} onFill={onFillInputs} />

      {site?.url && !problem && !needCode && (
        <div className="preview-note preview-ok no-print" role="status">
          <strong>Live</strong>
          <a href={site.url} target="_blank" rel="noreferrer noopener">
            {site.url}
          </a>
          <span className="note-small">
            {upToDate
              ? 'Up to date. Anyone with the link can open it. It is unlisted and asks search engines not to index it.'
              : 'You have edits that are not published yet. Copy link will publish them first; the link stays the same.'}
          </span>
          {site.note && <span className="note-warn">{site.note}</span>}
        </div>
      )}

      {needCode && (
        <form className="preview-note no-print" onSubmit={saveCode}>
          <strong>This app is protected.</strong> Enter the access code to publish.
          <span className="note-row">
            <input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="Access code" autoFocus />
            <button className="primary" type="submit" disabled={!code.trim()}>
              Save code
            </button>
          </span>
        </form>
      )}

      {problem?.setup && (
        <div className="preview-note no-print">
          <strong>Copy link needs Vercel connected.</strong> Create a token at{' '}
          <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer noopener">
            vercel.com/account/tokens
          </a>
          , then put <code>VERCEL_TOKEN=…</code> in <code>.env.local</code> and restart the dev server (or add it under Project Settings → Environment
          Variables on Vercel and redeploy). Until then you can use "Download .html" or "Vercel project".
        </div>
      )}

      {problem?.codeRequired && (
        <div className="preview-note no-print">
          <strong>Publishing is switched off on this deployed copy.</strong> Set <code>RESEARCH_ACCESS_CODE</code> in the Vercel project's environment variables
          and redeploy. A deployed app must have an access code before it can publish, so strangers can't put pages on your account.
        </div>
      )}

      {problem?.message && (
        <div className="preview-note preview-error no-print" role="alert">
          {problem.message}
        </div>
      )}

      <iframe
        ref={frame}
        title="Live Room"
        srcDoc={editing ? shown : current}
        onLoad={frameReady}
        sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
      />
    </div>
  )
}
