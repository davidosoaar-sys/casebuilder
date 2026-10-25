// Message box for the agent chat, adapted from the "AI mascot input" component
// (Tailwind/TypeScript original) to this app's plain CSS + JSX.
//
// Kept: the robot mascot (reads while you type, thinks while the agent works,
// red ears while dictating), the welcome header, the model menu with a
// thinking-level switch, attachments, a web search toggle, voice dictation
// with the wave bars, the round send button.
// Changed on purpose:
//  - only models the worker can actually run (Anthropic, via the user's key)
//  - no "simulated speech": if the browser has no speech-to-text, the mic is hidden
//  - no cancel button: a sent job can't be stopped yet, so the button shows
//    "working" instead of pretending to cancel
//  - several text files at once (the agent reads their contents)
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const AGENT_MODELS = [
  { id: 'claude-sonnet-5-5', name: 'Sonnet 5.5', tag: 'Balanced', defaultLevel: 'medium' },
  { id: 'claude-haiku-5-5', name: 'Haiku 5.5', tag: 'Fastest', defaultLevel: 'low' },
  { id: 'claude-opus-5-5', name: 'Opus 5.5', tag: 'Most capable', defaultLevel: 'medium' }
]
export const LEVELS = [
  { id: 'low', label: 'Low', desc: 'Quick answers, light reasoning' },
  { id: 'medium', label: 'Medium', desc: 'Step-by-step reasoning for most requests' },
  { id: 'high', label: 'High', desc: 'Deep reasoning for tricky numbers. Slower' }
]
const MAX_FILE_BYTES = 1_000_000
const MAX_FILES = 5
const TEXT_FILES = '.txt,.md,.csv,.tsv,.json,.vtt,.srt,.html,.xml,.log,text/*'
const Speech = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

const I = ({ d, size = 16, fill }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const ic = {
  up: <path d="M8 13V3.5M3.8 7.7L8 3.5l4.2 4.2" />,
  clip: <path d="M13 7.4l-5.3 5.3a3.2 3.2 0 01-4.5-4.5l5.6-5.6a2.1 2.1 0 013 3l-5.6 5.6a1.05 1.05 0 01-1.5-1.5l5-5" />,
  mic: <><rect x="5.8" y="1.8" width="4.4" height="7.6" rx="2.2" /><path d="M3.4 7.6a4.6 4.6 0 009.2 0M8 12.3v2" /></>,
  caret: <path d="M4.5 6.2L8 9.7l3.5-3.5" />,
  check: <path d="M3.2 8.4l3 3 6.6-6.6" />,
  x: <path d="M4.3 4.3l7.4 7.4M11.7 4.3l-7.4 7.4" />,
  file: <><path d="M4 1.8h5l3 3v9.4H4z" /><path d="M9 1.8v3h3" /></>,
  globe: <><circle cx="8" cy="8" r="6.2" /><path d="M1.8 8h12.4M8 1.8c1.8 1.9 2.6 3.9 2.6 6.2S9.8 12.3 8 14.2C6.2 12.3 5.4 10.3 5.4 8S6.2 3.7 8 1.8z" /></>,
  anthropic: <path d="M11.5 2.4H9.1l4.4 11.2H16zM4.5 2.4L0 13.6h2.5l.9-2.4h4.6l.9 2.4h2.5L7 2.4zm-.3 6.8l1.5-3.9 1.5 3.9z" />
}

// ---------- the robot ----------
// Idle: bobs, blinks, and glances around on its own. Typing: eyes follow the
// end of the text. Thinking: amber, bounces, eyes scan side to side.
// Happy: a hop and "^ ^" eyes when a reply arrives.
export function Robot({ emotion = 'reading', textLength = 0, listening = false, typing = false }) {
  const [blink, setBlink] = useState(false)
  const [glance, setGlance] = useState({ x: 0, y: 0 })
  useEffect(() => {
    let t
    const loop = () => { t = setTimeout(() => { if (emotion !== 'thinking') { setBlink(true); setTimeout(() => setBlink(false), 140) } loop() }, 2400 + Math.random() * 2200) }
    loop(); return () => clearTimeout(t)
  }, [emotion])
  useEffect(() => { // idle glances
    if (typing || emotion !== 'reading') { setGlance({ x: 0, y: 0 }); return }
    let t
    const spots = [[0, 0], [-6, 0], [6, 0], [-4, -2], [4, -2], [0, 2], [0, 0]]
    const loop = () => { t = setTimeout(() => { const [x, y] = spots[Math.floor(Math.random() * spots.length)]; setGlance({ x, y }); loop() }, 1300 + Math.random() * 1700) }
    loop(); return () => clearTimeout(t)
  }, [typing, emotion])
  const follow = typing ? Math.max(-7, Math.min(7, -7 + (textLength % 60) * (14 / 60))) : glance.x
  const ears = listening ? 'is-listening' : emotion === 'thinking' ? 'is-thinking' : emotion === 'happy' ? 'is-happy' : ''
  const body = emotion === 'thinking' ? { y: [0, -6, 0], rotate: [0, -3, 0, 3, 0] }
    : emotion === 'happy' ? { y: [0, -12, 0, -4, 0], rotate: 0 }
    : listening ? { y: [0, -2, 0], rotate: [0, 2, 0, -2, 0] }
    : { y: [0, -3, 0], rotate: typing ? 0 : [0, -1.5, 0, 1.5, 0] }
  const timing = emotion === 'happy' ? { duration: 0.7, ease: 'easeOut' } : { duration: emotion === 'thinking' ? 1.4 : 2.6, repeat: Infinity, ease: 'easeInOut' }
  return (
    <motion.div className="robot" aria-hidden="true" animate={body} transition={{ y: timing, rotate: { ...timing, duration: emotion === 'thinking' ? 1.6 : 4.2 } }}>
      <div className="robot-horns"><span /><span /></div>
      <div className="robot-body">
        <span className={`robot-ear left ${ears}`} />
        <span className={`robot-ear right ${ears}`} />
        <div className="robot-head">
          <div className="robot-screen">
            <div className="robot-eyes"><Eye emotion={emotion} blink={blink} x={follow} y={typing ? 1 : glance.y} /><Eye emotion={emotion} blink={blink} x={follow} y={typing ? 1 : glance.y} /></div>
            <div className="robot-scan" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
function Eye({ emotion, blink, x, y }) {
  if (emotion === 'thinking') return <motion.span className="robot-eye thinking" animate={{ x: [-5, 5, -5], y: [-1, -3, -1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
  if (emotion === 'happy') return <span className="robot-eye happy" />
  if (blink) return <span className="robot-eye blink" />
  return <motion.span className="robot-eye" animate={{ x, y }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} />
}

// ---------- the composer ----------
export default function AgentComposer({ onSend, busy = false, disabled = false, showWelcome = false, title = 'What should we work on?', subtitle = 'Ask about this deal, or tell the agent what to change' }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const [web, setWeb] = useState(() => read('casebuilder.agent-web', '1') === '1')
  const [modelId, setModelId] = useState(() => read('casebuilder.agent-model', AGENT_MODELS[0].id))
  const [levels, setLevels] = useState(() => { try { return JSON.parse(localStorage.getItem('casebuilder.agent-levels') || '{}') } catch { return {} } })
  const [menu, setMenu] = useState(false)
  const [listening, setListening] = useState(false)
  const area = useRef(null), fileInput = useRef(null), menuRef = useRef(null), rec = useRef(null), base = useRef('')

  const model = AGENT_MODELS.find(m => m.id === modelId) || AGENT_MODELS[0]
  const levelId = levels[model.id] || model.defaultLevel
  const level = LEVELS.find(l => l.id === levelId) || LEVELS[1]

  useEffect(() => { write('casebuilder.agent-model', model.id) }, [model.id])
  useEffect(() => { write('casebuilder.agent-web', web ? '1' : '0') }, [web])
  useEffect(() => { write('casebuilder.agent-levels', JSON.stringify(levels)) }, [levels])
  useEffect(() => { const el = area.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.max(54, Math.min(el.scrollHeight, 260)) + 'px' }, [text])
  useEffect(() => () => rec.current?.abort?.(), [])
  useEffect(() => {
    if (!menu) return
    const out = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false) }
    const esc = e => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc) }
  }, [menu])

  async function addFiles(list) {
    setFileError('')
    const out = []
    for (const f of list) {
      if (f.size > MAX_FILE_BYTES) { setFileError(`${f.name} is over 1 MB.`); continue }
      if (/\.(pdf|docx?|pptx?|xlsx?|png|jpe?g|gif|webp|zip)$/i.test(f.name) || (f.type && !/^text\/|json|xml|csv/.test(f.type))) {
        setFileError(`${f.name}: text files only for now (.txt, .md, .csv, .json, call transcripts).`); continue
      }
      out.push({ name: f.name, text: await f.text() })
    }
    setFiles(fs => [...fs, ...out].slice(0, MAX_FILES))
  }

  function stopListening() { rec.current?.stop(); rec.current = null; setListening(false) }
  function toggleMic() {
    if (!Speech || disabled) return
    if (listening) return stopListening()
    const r = new Speech()
    r.lang = navigator.language || 'en-US'; r.interimResults = true; r.continuous = true
    base.current = text ? text.trim() + ' ' : ''
    r.onresult = e => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; if (t) setText(base.current + t) }
    r.onerror = e => { if (e.error !== 'no-speech') stopListening() }
    r.onend = () => setListening(false)
    rec.current = r; r.start(); setListening(true)
  }

  async function send() {
    if (disabled || busy || (!text.trim() && !files.length)) return
    stopListening()
    const ok = await onSend({ text: text.trim(), attachments: files, model: model.id, effort: level.id, web })
    if (ok) { setText(''); setFiles([]) }
  }

  const typing = text.length > 0 || files.length > 0 || listening
  const [happy, setHappy] = useState(false)
  const wasBusy = useRef(busy)
  useEffect(() => {
    if (wasBusy.current && !busy) { setHappy(true); const t = setTimeout(() => setHappy(false), 1600); wasBusy.current = busy; return () => clearTimeout(t) }
    wasBusy.current = busy
  }, [busy])
  const emotion = busy ? 'thinking' : happy ? 'happy' : 'reading'
  const canSend = !disabled && !busy && (text.trim() || files.length)

  return (
    <div className="mascot-wrap"
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!disabled) addFiles(Array.from(e.dataTransfer.files)) }}>
      <AnimatePresence>
        {showWelcome && !typing && !busy && (
          <motion.div key="welcome" className="mascot-welcome"
            initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0, transition: { duration: 0.22 } }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div layoutId="agent-robot"><Robot emotion="reading" listening={listening} /></motion.div>
            <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="mascot-stage" animate={{ paddingTop: (typing || busy || !showWelcome) ? 66 : 0 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
        {(typing || busy || !showWelcome) && (
          <motion.div layoutId="agent-robot" className="mascot-perch" transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
            <Robot emotion={emotion} textLength={text.length} listening={listening} typing={text.length > 0} />
          </motion.div>
        )}

        <div className={`mascot-card${disabled ? ' is-disabled' : ''}`}>
          {files.length > 0 && <div className="mascot-files">{files.map((f, i) => (
            <span key={i} className="mascot-file"><I d={ic.file} size={14} /><span>{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}><I d={ic.x} size={11} /></button></span>
          ))}</div>}

          <textarea id="chat-input" ref={area} value={text} disabled={disabled}
            data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" spellCheck

            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={listening ? 'Listening… speak your mind' : busy ? (web ? 'Searching and thinking…' : 'Thinking…') : 'Ask about this deal, or tell the agent what to change'} />
          {fileError && <p className="mascot-error">{fileError}</p>}

          <div className="mascot-bar">
            <div className="mascot-left">
              <div className="mascot-model" ref={menuRef}>
                <button type="button" className="mascot-model-btn" onClick={() => setMenu(m => !m)} disabled={disabled} aria-haspopup="true" aria-expanded={menu}>
                  <span className="mascot-anthropic"><I d={ic.anthropic} size={13} fill /></span>
                  <span className="mascot-model-name">{model.name}</span>
                  <span className="mascot-level">{level.label}</span>
                  <span className={`mascot-caret${menu ? ' open' : ''}`}><I d={ic.caret} size={12} /></span>
                </button>
                <AnimatePresence>
                  {menu && (
                    <motion.div className="mascot-menu" role="menu"
                      initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}>
                      <div className="mascot-menu-head"><span>Model</span><span>Anthropic</span></div>
                      {AGENT_MODELS.map(m => (
                        <button key={m.id} type="button" role="menuitemradio" aria-checked={m.id === model.id} className={`mascot-opt${m.id === model.id ? ' is-on' : ''}`} onClick={() => setModelId(m.id)}>
                          <span className="mascot-anthropic"><I d={ic.anthropic} size={15} fill /></span>
                          <span className="mascot-opt-text"><strong>{m.name}</strong><small>{m.tag} · {(levels[m.id] || m.defaultLevel).toUpperCase()}</small></span>
                          {m.id === model.id && <span className="mascot-check"><I d={ic.check} size={13} /></span>}
                        </button>
                      ))}
                      <div className="mascot-menu-split">
                        <div className="mascot-menu-head"><span>Thinking</span><strong>{level.label}</strong></div>
                        <div className="mascot-levels" role="radiogroup" aria-label="Thinking level">
                          {LEVELS.map(l => (
                            <button key={l.id} type="button" role="radio" aria-checked={l.id === level.id} className={l.id === level.id ? 'is-on' : ''}
                              onClick={() => setLevels(v => ({ ...v, [model.id]: l.id }))}>{l.label}</button>
                          ))}
                        </div>
                        <p className="mascot-level-desc">{level.desc}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input ref={fileInput} type="file" multiple accept={TEXT_FILES} hidden disabled={disabled} onChange={e => { addFiles(Array.from(e.target.files)); e.target.value = '' }} />
              <button type="button" className="mascot-icon" onClick={() => fileInput.current?.click()} disabled={disabled} title="Attach text files (notes, transcripts, CSV)" aria-label="Attach files"><I d={ic.clip} /></button>
              <button type="button" className={`mascot-search${web ? ' is-on' : ''}`} onClick={() => setWeb(w => !w)} disabled={disabled} aria-pressed={web}
                title={web ? 'The agent may search the web' : 'Let the agent search the web'}><I d={ic.globe} size={15} /><span>{web ? 'Search on' : 'Search'}</span></button>
            </div>

            <div className="mascot-right">
              <AnimatePresence>
                {listening && (
                  <motion.div className="mascot-wave" title="Dictating"
                    initial={{ opacity: 0, scale: 0.85, x: 6 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.85, x: 6 }} transition={{ duration: 0.18 }}>
                    {[[4, 13, .45], [6, 18, .55], [8, 22, .38], [5, 16, .5], [4, 11, .42]].map(([a, b, d], i) => (
                      <motion.span key={i} animate={{ height: [`${a}px`, `${b}px`, `${a}px`], opacity: [0.7, 1, 0.7] }} transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {Speech && <button type="button" className={`mascot-icon${listening ? ' is-live' : ''}`} onClick={toggleMic} disabled={disabled} title={listening ? 'Stop dictation' : 'Dictate'} aria-label={listening ? 'Stop dictation' : 'Dictate'}><I d={ic.mic} /></button>}
              <button type="button" className={`mascot-send${busy ? ' is-busy' : canSend ? ' is-ready' : ''}`} onClick={send} disabled={!canSend}
                aria-label={busy ? 'The agent is working' : 'Send message'} title={busy ? 'The agent is working…' : 'Send'}>
                {busy ? <span className="mascot-spin" /> : <I d={ic.up} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function read(k, d) { try { return localStorage.getItem(k) || d } catch { return d } }
function write(k, v) { try { localStorage.setItem(k, v) } catch {} }
