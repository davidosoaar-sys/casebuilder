// Files: the project's own context, like files in a Claude Project.
// Instructions (how to work on this account), Context (client material) and
// Deck inspiration (decks you liked). The agent reads every enabled file on
// each chat and deck run for this project.
import React, { useEffect, useRef, useState } from 'react'
import PageHead from './PageHead.jsx'
import { Skeleton } from './ui.jsx'
import { supabase } from '../supabase.js'
import { ACCEPT } from '../fileText.js'
import { listFiles, uploadFile, setEnabled, removeFile, saveInstructions, fmtSize, extOf } from '../projectFiles.js'

function FileCard({ f, onToggle, onRemove, onOpen }) {
  return (
    <li className={`pf-card${f.enabled ? '' : ' is-off'}`}>
      <button type="button" className="pf-card-main" onClick={() => onOpen(f)} title="Preview the text the agent reads">
        <span className="pf-card-name">{f.name}</span>
        <span className="pf-card-meta">{f.pages ? `${f.pages} ${/PPTX/.test(extOf(f.name)) ? 'slide' : /XLSX/.test(extOf(f.name)) ? 'sheet' : 'page'}${f.pages === 1 ? '' : 's'} · ` : ''}{fmtSize(f.size_bytes)}</span>
        <span className="pf-ext">{extOf(f.name)}</span>
      </button>
      <div className="pf-card-actions">
        <label className="pf-toggle" title={f.enabled ? 'The agent reads this file' : 'The agent ignores this file'}>
          <input type="checkbox" checked={f.enabled} onChange={e => onToggle(f, e.target.checked)} aria-label={`Agent reads ${f.name}`} />
          <span>{f.enabled ? 'On' : 'Off'}</span>
        </label>
        <button type="button" className="icon-btn sm" onClick={() => onRemove(f)} aria-label={`Remove ${f.name}`} title="Remove">×</button>
      </div>
    </li>
  )
}

export default function ProjectFiles({ project, userId }) {
  const [files, setFiles] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState([]) // names uploading
  const [drag, setDrag] = useState(false)
  const [instr, setInstr] = useState('')
  const [instrSaved, setInstrSaved] = useState('')
  const [editing, setEditing] = useState(false)
  const box = useRef(null)
  // Opening Edit puts the cursor at the end of the saved text, ready to add to it.
  useEffect(() => { const b = box.current; if (editing && b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length) } }, [editing])
  const [preview, setPreview] = useState(null)
  const input = useRef(null)

  const load = async () => {
    try {
      const list = await listFiles(supabase, project.id)
      setFiles(list)
      const i = list.find(f => f.kind === 'instructions')
      setInstr(i?.text || ''); setInstrSaved(i?.text || '')
    } catch (e) { setError(e.message); setFiles([]) }
  }
  useEffect(() => { load() }, [project.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function add(list) {
    setError('')
    for (const file of list) {
      setBusy(b => [...b, file.name])
      try {
        const row = await uploadFile(supabase, { userId, dealId: project.id, file })
        setFiles(fs => [...(fs || []), row])
        if (row.truncated) setError(`${file.name} is very long; the agent reads the first 300,000 characters.`)
      } catch (e) { setError(e.message) }
      finally { setBusy(b => b.filter(n => n !== file.name)) }
    }
  }
  const act = async (fn, after) => { setError(''); try { await fn(); after() } catch (e) { setError(e.message) } }
  const instructions = files?.find(f => f.kind === 'instructions')
  const visible = (files || []).filter(f => f.kind !== 'instructions')
  const totalChars = visible.filter(f => f.enabled).reduce((a, f) => a + (f.text?.length || 0), 0)

  return (
    <section className="page pf-page" aria-label="Files">
      <PageHead title="Files" sub={`Everything the agent should know about ${project.name}. It reads every file that is on.`} />

      <section className="pf-section">
        <div className="pf-section-head"><h2>Instructions</h2><p>How to work on this account. Tone, must-have slides, who to avoid naming. Like a CLAUDE.md for this deal.</p></div>
        {files === null ? <Skeleton label="Loading instructions" rows={1} height={96} listClass="pf-skeleton" /> : instrSaved && !editing ? <>
          <div className="pf-instr-view">{instrSaved}</div>
          <div className="pf-instr-bar">
            <span className="pf-saved"><span aria-hidden="true">✓</span> Saved. The agent follows these on every run.</span>
            <button type="button" className="ghost" onClick={() => setEditing(true)}>Edit</button>
          </div>
        </> : <>
          <textarea className="pf-instructions" value={instr} onChange={e => setInstr(e.target.value)} rows={5} maxLength={20000} ref={box}
            placeholder={'e.g. Always open with the CFO\'s cost target. Every deck needs an implementation plan slide. Use "developer experience", never "DevEx".'} />
          <div className="pf-instr-bar">
            {instrSaved && <button type="button" className="ghost" onClick={() => { setInstr(instrSaved); setEditing(false) }}>Cancel</button>}
            <button type="button" className="primary" disabled={instr === instrSaved || !instr.trim()}
              onClick={() => act(async () => { const row = await saveInstructions(supabase, { userId, dealId: project.id, existing: instructions, text: instr }); setFiles(fs => instructions ? fs.map(f => f.id === row.id ? row : f) : [...fs, row]) }, () => { setInstrSaved(instr); setEditing(false) })}>{instrSaved ? 'Save changes' : 'Save instructions'}</button>
          </div>
        </>}
      </section>

      <section className="pf-section">
        <div className="pf-section-head">
          <h2>Files <span className="pf-count">{visible.length}</span></h2>
          <p>{totalChars ? `${totalChars.toLocaleString()} characters the agent can read.` : 'PDF, Word, PowerPoint, Excel or text. Up to 50 files.'}</p>
        </div>
        <div className={`pf-drop${drag ? ' is-drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); add(Array.from(e.dataTransfer.files)) }}>
          <p><strong>Drop files here</strong> or <button type="button" className="link-btn pf-browse" onClick={() => input.current?.click()}>choose files</button></p>
          <p className="pf-kind-help">Financial reports, call notes, a deck you liked. When you chat, say what a file is for: "check my deck against the one I attached".</p>
          <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { add(Array.from(e.target.files)); e.target.value = '' }} />
        </div>
        {busy.length > 0 && <p className="pf-busy" role="status"><span className="cmd-spin" aria-hidden="true" />Reading {busy.join(', ')}…</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {files === null ? <Skeleton label="Loading files" rows={2} height={64} listClass="pf-skeleton" /> : visible.length > 0 && <ul className="pf-grid pf-list">{visible.map(f => (
          <FileCard key={f.id} f={f} onOpen={setPreview}
            onToggle={(f, on) => act(() => setEnabled(supabase, f.id, on), () => setFiles(fs => fs.map(x => x.id === f.id ? { ...x, enabled: on } : x)))}
            onRemove={f => act(() => removeFile(supabase, f.id), () => setFiles(fs => fs.filter(x => x.id !== f.id)))} />
        ))}</ul>}
        {files && !visible.length && <p className="pf-empty">No files yet. Start with the client's latest financial report or a deck you were proud of.</p>}
      </section>

      {preview && (
        <div className="pf-preview-backdrop" onClick={() => setPreview(null)}>
          <div className="pf-preview" role="dialog" aria-modal="true" aria-label={`Text of ${preview.name}`} onClick={e => e.stopPropagation()}>
            <header><strong>{preview.name}</strong><button type="button" className="icon-btn" onClick={() => setPreview(null)} aria-label="Close">×</button></header>
            <p className="pf-preview-note">This is the text the agent reads.</p>
            <pre>{preview.text}</pre>
          </div>
        </div>
      )}
    </section>
  )
}
