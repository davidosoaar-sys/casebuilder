import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { uid } from '../uid.js'
import BrandPanel from './BrandPanel.jsx'
import DeckLogo from './DeckLogo.jsx'
import { Select } from './ui.jsx'
import { brandVars, fontFaceCss, blockDesign, normalizeBrand } from '../brand.js'
import ExportMenu from '../export/ExportMenu.jsx'
import { NO_ONE, resolveStakeholder } from '../deck/stakeholders.js'
import { fileToDataUrl } from '../deck/image.js'
import {
  TEXT_STYLES,
  STAT_KEYS,
  TOKENS,
  BLOCK_MENU,
  SLIDE_TEMPLATES,
  buildEnv,
  fill,
  parseBody,
  resolveBlock,
  isEmptyLive,
  slideIsEmpty
} from '../deck/model.js'
import { STAKEHOLDERS } from '../valueModel.js'

// The deck editor. A deck is a list of slides and a slide is a list of blocks.
// Click any text to edit it. Hover a block for its controls, use the bar above
// each page to move, duplicate, restyle or delete it, and add blocks or whole
// pages from the "+" menus. Live blocks (numbers, charts) recompute from the
// project; text can use tokens like {company} that fill in automatically.

// Re-exported because the map and people screens resolve stakeholders too.
export const resolve = resolveStakeholder

// How each text style renders: [tag, class].
const TEXT_TAG = {
  hero: ['h1', 'b-hero'],
  headline: ['h2', 'headline'],
  title: ['h2', ''],
  sub: ['p', 'headline-sub'],
  lede: ['p', 'lede'],
  body: ['div', 'body-text'],
  note: ['p', 'note'],
  label: ['div', 'slide-label'],
  eyebrow: ['p', 'eyebrow'],
  tag: ['p', 'tag'],
  forwhom: ['p', 'for-whom'],
  caption: ['p', 'caption']
}
const SINGLE_LINE = new Set(['hero', 'headline', 'title', 'label', 'eyebrow', 'tag', 'forwhom'])

export default function Deck({ inputs, model, fields, connectors, stakeholders, onStakeholders, deck, onDeck, company, onWebsite, brand, onBrand, onScanBrand, initialAudienceKey, previewRequest, onPreviewOpened }) {
  const [designOpen, setDesignOpen] = useState(false)
  const available = stakeholders.map(resolve).filter(Boolean)
  const [activeKey, setActiveKey] = useState(initialAudienceKey || available[0]?.key)
  const active = available.find(s => s.key === activeKey) || available[0] || NO_ONE
  const canEditStakeholder = active.key !== 'none'
  const env = buildEnv(inputs, fields, active, model)

  // ---- slide and block operations
  const patchSlide = (id, fn) => onDeck(list => list.map(s => (s.id === id ? fn(s) : s)))
  const moveSlide = (id, dir) =>
    onDeck(list => {
      const i = list.findIndex(s => s.id === id)
      const j = i + dir
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const duplicateSlide = id =>
    onDeck(list => {
      const i = list.findIndex(s => s.id === id)
      const copy = { ...list[i], id: uid(), blocks: list[i].blocks.map(b => ({ ...b, id: uid() })) }
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]
    })
  const removeSlide = id => onDeck(list => list.filter(s => s.id !== id))

  const patchBlock = (slideId, blockId, fn) =>
    patchSlide(slideId, s => ({ ...s, blocks: s.blocks.map(b => (b.id === blockId ? fn(b) : b)) }))
  const moveBlock = (slideId, blockId, dir) =>
    patchSlide(slideId, s => {
      const i = s.blocks.findIndex(b => b.id === blockId)
      const j = i + dir
      if (j < 0 || j >= s.blocks.length) return s
      const blocks = [...s.blocks]
      ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
      return { ...s, blocks }
    })
  const removeBlock = (slideId, blockId) =>
    patchSlide(slideId, s => ({ ...s, blocks: s.blocks.filter(b => b.id !== blockId) }))
  const addBlock = (slideId, make) => patchSlide(slideId, s => ({ ...s, blocks: [...s.blocks, make()] }))

  function setStakeholderText(field, value) {
    onStakeholders(list =>
      list.map(s => (s.key === active.key ? { ...s, edit: { ...(s.edit || {}), [field]: value } } : s))
    )
  }

  return (
    <main className="deck-wrap">
      <nav className="toolbar no-print">
        <div className="who">
          <label className="who-label" htmlFor="deck-stakeholder">Stakeholder</label>
          <div className="stakeholder-select-row">
            <Select id="deck-stakeholder" aria-label="Stakeholder framing" value={active.key} disabled={!available.length} onChange={setActiveKey}
              options={available.length ? available.map(s => ({ value: s.key, label: `${s.role}${stakeholders.find(x => x.key === s.key)?.namedPeople?.length ? ` · ${stakeholders.find(x => x.key === s.key).namedPeople.map(p => p.name).join(', ')}` : ''}` })) : [{ value: 'none', label: 'No stakeholder selected' }]} />
            <AddStakeholder
              existing={stakeholders}
              onAdd={s => {
                onStakeholders(list => [...list, s])
                setActiveKey(s.key)
              }}
            />
            <button className="ghost stakeholder-remove" disabled={!canEditStakeholder} title={`Remove ${active.role}`} aria-label={`Remove ${active.role}`} onClick={() => onStakeholders(list => list.filter(s => s.key !== active.key))}>×</button>
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="ghost" onClick={() => setDesignOpen(v => !v)} aria-expanded={designOpen}>Deck design{brand?.status === 'scanning' ? ' · scanning' : ''}</button>
          <ExportMenu
            requestedView={previewRequest}
            onViewOpened={onPreviewOpened}
            brand={brand}
            company={company}
            deck={deck}
            inputs={inputs}
            fields={fields}
            connectors={connectors}
            stakeholders={available}
            activeKey={active.key}
            onWebsite={key => onWebsite(key || active.key)}
          />
        </div>
      </nav>

      {designOpen && <BrandPanel brand={brand} onChange={onBrand} onScan={onScanBrand} onClose={() => setDesignOpen(false)} />}
      <style>{fontFaceCss(brand)}</style>
      <div className="deck customer-deck" style={brandVars(brand)}>
        {deck.map((slide, idx) => (
          <div className={`slide-wrap ${slideIsEmpty(slide, env) ? 'slide-incomplete' : ''}`} key={slide.id}>
            <div className="slide-bar no-print">
              <span className="slide-num">Page {idx + 1}</span>
              <div className="slide-bar-tools">
                <label className="slide-color-control">Page color<input type="color" aria-label={`Page ${idx + 1} background`} value={slide.design?.background || normalizeBrand(brand).background} onChange={e => patchSlide(slide.id, s => ({ ...s, design: { ...s.design, background: e.target.value } }))} /></label>
                <label className="slide-color-control">Text color<input type="color" aria-label={`Page ${idx + 1} text color`} value={slide.blocks.find(b => b.design?.color)?.design.color || normalizeBrand(brand).text} onChange={e => { const color = e.target.value; patchSlide(slide.id, s => ({ ...s, blocks: s.blocks.map(b => ['logo', 'image'].includes(b.type) ? b : { ...b, design: { ...b.design, color } }) })) }} /></label>
                <button
                  className={`tool tool-text ${slide.variant === 'hero' ? 'tool-on' : ''}`}
                  onClick={() => patchSlide(slide.id, s => ({ ...s, variant: s.variant === 'hero' ? 'plain' : 'hero' }))}
                  title="Toggle the hero background"
                >
                  Hero background
                </button>
                <button className="tool" onClick={() => moveSlide(slide.id, -1)} disabled={idx === 0} title="Move page up" aria-label="Move page up">
                  ↑
                </button>
                <button className="tool" onClick={() => moveSlide(slide.id, 1)} disabled={idx === deck.length - 1} title="Move page down" aria-label="Move page down">
                  ↓
                </button>
                <button className="tool tool-text" onClick={() => duplicateSlide(slide.id)} title="Duplicate this page">
                  Duplicate
                </button>
                <button
                  className="tool tool-danger"
                  onClick={() => {
                    if (window.confirm('Delete this page?')) removeSlide(slide.id)
                  }}
                  title="Delete this page"
                  aria-label="Delete page"
                >
                  ✕
                </button>
              </div>
            </div>

            <section className={`slide ${slide.variant === 'hero' ? 'slide-hero' : ''}`} style={/^#[0-9a-f]{6}$/i.test(slide.design?.background) ? { background: slide.design.background, '--page-background': slide.design.background } : undefined}>
              <div className="blocks">
                {slide.blocks.map((b, bi) => (
                  <BlockEditor
                    key={b.id}
                    block={b}
                    brand={brand}
                    first={bi === 0}
                    last={bi === slide.blocks.length - 1}
                    env={env}
                    canEditStakeholder={canEditStakeholder}
                    onPatch={fn => patchBlock(slide.id, b.id, fn)}
                    onMove={dir => moveBlock(slide.id, b.id, dir)}
                    onRemove={() => removeBlock(slide.id, b.id)}
                    onStakeholderText={setStakeholderText}
                  />
                ))}
                {slide.blocks.length === 0 && <p className="empty-slide">This page is empty. Add a block below.</p>}
              </div>
              <AddMenu
                className="add-block no-print"
                label="+ Add block"
                items={BLOCK_MENU}
                onPick={item => addBlock(slide.id, item.make)}
              />
            </section>
          </div>
        ))}

        <AddMenu
          className="add-page no-print"
          label="+ Add page"
          title="Add a page"
          items={SLIDE_TEMPLATES}
          grid
          onPick={item => onDeck(list => [...list, item.make()])}
        />
      </div>
    </main>
  )
}

// ----------------------------------------------------------------- blocks

function BlockEditor({ block: b, first, last, env, canEditStakeholder, onPatch, onMove, onRemove, onStakeholderText, brand }) {
  const [settings, setSettings] = useState(false)
  const [formatting, setFormatting] = useState(false)
  const [badgeColors, setBadgeColors] = useState(false)
  const [badgeTextEditing, setBadgeTextEditing] = useState(false)
  const backgroundKey = b.type === 'text' && b.style === 'tag' ? 'badgeBackground' : 'background'
  const [colorDraft, setColorDraft] = useState(b.design?.color || '')
  useEffect(() => { setColorDraft(b.design?.color || '') }, [b.design?.color])
  const r = resolveBlock(b, env)
  const hasSettings = b.type === 'stats' || b.type === 'image'

  const tools = (
    <div className="block-tools no-print">
      <button className="tool tool-text" aria-expanded={formatting} onClick={() => setFormatting(v => !v)}>Text & style</button>
      {!['logo', 'image'].includes(b.type) && <label className="block-quick-color" title="Change text color">Text color<input type="color" aria-label="Text color" value={b.design?.color || normalizeBrand(brand).text} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, color: e.target.value } }))} /></label>}
      {b.type === 'text' && (
        <Select
          className="block-style"
          value={b.style}
          onChange={style => onPatch(x => ({ ...x, style }))}
          title="Text style"
          aria-label="Text style"
          options={TEXT_STYLES.map(([k, label]) => ({ value: k, label }))}
        />
      )}
      {hasSettings && (
        <button className={`tool tool-text ${settings ? 'tool-on' : ''}`} onClick={() => setSettings(s => !s)}>
          {b.type === 'image' ? 'Image' : 'Show'}
        </button>
      )}
      <button className="tool" onClick={() => onMove(-1)} disabled={first} title="Move up" aria-label="Move block up">
        ↑
      </button>
      <button className="tool" onClick={() => onMove(1)} disabled={last} title="Move down" aria-label="Move block down">
        ↓
      </button>
      <button className="tool tool-danger" onClick={onRemove} title="Delete this block" aria-label="Delete block">
        ✕
      </button>
    </div>
  )

  let content = null
  switch (b.type) {
    case 'text': {
      const [Tag, cls] = TEXT_TAG[b.style] || TEXT_TAG.body
      const body = b.style === 'body'
      if (b.style === 'tag' && !badgeTextEditing) {
        content = <div className="editable-badge">
          <button className="tag tag-color-target" aria-label="Change badge background color" aria-expanded={badgeColors} title="Click to change background color" onClick={() => setBadgeColors(v => !v)}>{r.text || 'Add a label'}</button>
          {badgeColors && <div className="badge-color-panel no-print" role="group" aria-label="Badge background colors">
            <div className="badge-panel-head"><strong>Text background</strong><button className="tool" aria-label="Close badge colors" onClick={() => setBadgeColors(false)}>×</button></div>
            <div className="badge-swatches">{['#29261F', '#1DB954', '#123D32', '#253453', '#482B54', '#733A22', '#FFFFFF', '#000000'].map(color => <button key={color} type="button" className="badge-swatch" style={{ background: color }} aria-label={`Badge background ${color}`} onClick={() => onPatch(x => ({ ...x, design: { ...x.design, badgeBackground: color } }))} />)}</div>
            <button className="ghost transparent-color" aria-pressed={b.design?.badgeBackground === 'transparent'} onClick={() => onPatch(x => ({ ...x, design: { ...x.design, badgeBackground: 'transparent' } }))}><span className="transparency-swatch" />Transparent</button>
            <label className="badge-custom-color">Custom color<input type="color" aria-label="Badge background color" value={/^#[0-9a-f]{6}$/i.test(b.design?.badgeBackground) ? b.design.badgeBackground : '#29261F'} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, badgeBackground: e.target.value } }))} /></label>
            <button className="ghost" onClick={() => { setBadgeColors(false); setBadgeTextEditing(true) }}>Edit label text</button>
            <button className="ghost delete-element" onClick={onRemove}>Delete label</button>
          </div>}
        </div>
        break
      }
      content = (
        <Editable
          as={Tag}
          className={cls}
          single={SINGLE_LINE.has(b.style)}
          minRows={body ? 3 : 1}
          value={b.text}
          hint={tokenHint(b.text)}
          onChange={v => onPatch(x => ({ ...x, text: v }))}
          onFinish={b.style === 'tag' ? () => setBadgeTextEditing(false) : undefined}
        >
          {body ? <Body paras={r.paras} /> : r.text}
        </Editable>
      )
      break
    }
    case 'quote':
      content = (
        <Editable
          as="blockquote"
          value={b.text}
          minRows={2}
          onChange={v => onPatch(x => ({ ...x, text: v }))}
        >
          {r.text}
        </Editable>
      )
      break
    case 'columns':
      content = (
        <div className="two-col">
          {['left', 'right'].map(side => (
            <Editable
              key={side}
              as="div"
              minRows={4}
              value={b[side]}
              hint="Start a line with “- ” for a bullet."
              onChange={v => onPatch(x => ({ ...x, [side]: v }))}
            >
              <Body paras={r[side]} />
            </Editable>
          ))}
        </div>
      )
      break
    case 'image':
      content = (
        <figure className="b-image">
          {b.src ? (
            <img src={b.src} alt={b.caption || ''} />
          ) : (
            <label className="image-drop no-print">
              <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && pickImage(e.target.files[0], onPatch)} />
              Choose an image
            </label>
          )}
          {(b.src || b.caption) && (
            <Editable
              as="figcaption"
              single
              value={b.caption || ''}
              placeholder="Add a caption"
              onChange={v => onPatch(x => ({ ...x, caption: v }))}
            >
              {r.caption}
            </Editable>
          )}
        </figure>
      )
      break
    case 'stats':
      content = (
        <div className="stats">
          {r.items.map(i => (
            <div key={i.key} className={`stat ${i.tone ? `stat-${i.tone}` : ''}`}>
              <span className="stat-label">{i.label}</span>
              <strong className="stat-value">{i.value}</strong>
              {i.eq && <span className="eq">{i.eq}</span>}
            </div>
          ))}
        </div>
      )
      break
    case 'drivers':
      content = (
        <>
          <div className="chart">
            {r.groups.map(g => (
              <section key={g.key} className={`pillar ${g.leads ? 'pillar-lead' : ''}`} data-pillar={g.key}>
                <h3 className="pillar-head">
                  {g.label}
                  <span className="pillar-total">{g.total}</span>
                </h3>
                {g.rows.map(d => (
                  <div key={d.key} className={`bar-row ${d.lead ? 'bar-lead' : ''}`} data-driver={d.key}>
                    <div className="bar-label">
                      {d.label}
                      {d.lead && <span className="lead-dot" title="Leads for this stakeholder" />}
                    </div>
                    <div className="bar-track">
                      <div className="bar-bar" style={{ width: `${d.pct}%`, background: d.color, opacity: d.lead ? 1 : 0.45 }} />
                    </div>
                    <div className="bar-value">{d.valueStr}</div>
                    <div className="bar-detail eq">
                      {d.detail}
                      {d.flag && <span className="flag"> ({d.flag})</span>}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <div className="total-row">
            <span>Total annual value</span>
            <strong>{r.total}</strong>
          </div>
          <p className="eq eq-total">{r.totalEq}</p>
        </>
      )
      break
    case 'pairs':
      content = (
        <div className="pairs-table">
          <div className="pairs-head">
            <span />
            <span>today</span>
            <span>with Portal</span>
            <span>difference</span>
          </div>
          {r.rows.map(p => (
            <div className="pairs-row" key={p.key} data-pair={p.key}>
              <div className="pairs-label">
                {p.label}
                {p.unit && <span className="unit"> ({p.unit})</span>}
              </div>
              <div className="pairs-num">{p.today}</div>
              <div className="pairs-num">{p.portal}</div>
              <div className="pairs-num pairs-diff">{p.diff}</div>
              <div className="pairs-eq eq">
                {p.saved}: worth {p.value}
              </div>
            </div>
          ))}
        </div>
      )
      break
    case 'versus':
      content = (
        <>
          <div className="versus">
            {r.rows.map(row => (
              <div className="versus-row" key={row.name}>
                <span className="versus-name">{row.name}</span>
                <div className="versus-track">
                  <div className={`versus-bar versus-${row.tone}`} style={{ width: `${row.pct}%` }} />
                </div>
                <span className="versus-num">{row.valueStr}</span>
                {row.eq && <span className="eq versus-eq">{row.eq}</span>}
              </div>
            ))}
          </div>
          <p className="versus-note">
            {r.lead} <strong>{r.verdict}</strong>
          </p>
          <p className="eq">{r.eq}</p>
        </>
      )
      break
    case 'room': {
      const st = env.active
      const can = canEditStakeholder
      content = (
        <div className="two-col">
          <div>
            <h3>What they need to see</h3>
            <Editable
              as="div"
              disabled={!can}
              value={(st.needsToSee || []).join('\n')}
              hint="One point per line."
              onChange={v => onStakeholderText('needsToSee', v.split('\n'))}
            >
              <ul>
                {r.needs.map(n => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Editable>
          </div>
          <div>
            <h3>The objection</h3>
            <Editable as="blockquote" disabled={!can} value={st.objection} onChange={v => onStakeholderText('objection', v)} />
            <h3>The counter</h3>
            <Editable as="p" disabled={!can} value={st.counter} onChange={v => onStakeholderText('counter', v)} />
          </div>
        </div>
      )
      break
    }
    case 'logo':
      content = (
        <div className="title-logo">
          <DeckLogo brand={brand} />
        </div>
      )
      break
    case 'divider':
      content = <hr className="b-divider" />
      break
    case 'spacer':
      content = <div className="b-spacer" />
      break
    default:
      content = null
  }

  // Chris's view only: what a figure is still waiting on. Never printed or exported.
  const waiting = isEmptyLive(r)
  if (waiting) {
    content = (
      <p className="waiting no-print">
        Not shown to the client yet. Still needed: {r.waiting && r.waiting.length ? r.waiting.join(', ') : 'more inputs'}.
      </p>
    )
  }

  return (
    <div className={`block block-${b.type} ${formatting ? 'block-selected' : ''}`} onClick={e => { if (e.target.closest('.block-content') && !e.target.closest('.tag-color-target, .badge-color-panel, input, textarea, select, a')) setFormatting(true) }}>
      {tools}
      {formatting && (
        <div className="block-settings block-format no-print">
          <label>Text color<input type="color" aria-label="Block text color" value={b.design?.color || normalizeBrand(brand).text} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, color: e.target.value } }))} /></label>
          <label>Color hex<input aria-label="Block text color hex" value={colorDraft} onChange={e => { const color = e.target.value; setColorDraft(color); if (/^#[0-9a-f]{6}$/i.test(color)) onPatch(x => ({ ...x, design: { ...x.design, color } })) }} placeholder="#ffffff" maxLength={7} onBlur={() => setColorDraft(b.design?.color || '')} /></label>
          <label>Background<input type="color" aria-label="Block background" value={/^#[0-9a-f]{6}$/i.test(b.design?.[backgroundKey]) ? b.design[backgroundKey] : normalizeBrand(brand).background} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, [backgroundKey]: e.target.value } }))} /></label>
          <button className="ghost transparent-color" aria-pressed={b.design?.[backgroundKey] === 'transparent'} onClick={() => onPatch(x => ({ ...x, design: { ...x.design, [backgroundKey]: 'transparent' } }))}><span className="transparency-swatch" />Transparent background</button>
          <label>Font size<input type="number" aria-label="Block font size" min="10" max="120" placeholder="Auto" value={b.design?.fontSize || ''} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, fontSize: e.target.value } }))} /></label>
          <label>Font<input aria-label="Block font" placeholder="Use deck font" value={b.design?.font || ''} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, font: e.target.value } }))} /></label>
          <label>Alignment<select aria-label="Block alignment" value={b.design?.align || 'left'} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, align: e.target.value } }))}>{['left', 'center', 'right'].map(a => <option key={a}>{a}</option>)}</select></label>
          <label>Weight<select aria-label="Block font weight" value={b.design?.weight || ''} onChange={e => onPatch(x => ({ ...x, design: { ...x.design, weight: e.target.value } }))}><option value="">Auto</option>{['400', '500', '600', '700', '800', '900'].map(w => <option key={w}>{w}</option>)}</select></label>
          <button className="tool tool-text" onClick={() => onPatch(x => ({ ...x, design: {} }))}>Reset formatting</button>
          <button className="ghost delete-element" onClick={onRemove}>Delete element</button>
          <button className="tool" aria-label="Close element styles" onClick={() => setFormatting(false)}>×</button>
        </div>
      )}
      {settings && b.type === 'stats' && (
        <div className="block-settings no-print">
          {STAT_KEYS.map(([k, label]) => {
            const on = (b.items || STAT_KEYS.map(([x]) => x)).includes(k)
            return (
              <label key={k} className={`chip ${on ? 'chip-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    onPatch(x => {
                      const cur = x.items || STAT_KEYS.map(([y]) => y)
                      const next = on ? cur.filter(y => y !== k) : STAT_KEYS.map(([y]) => y).filter(y => cur.includes(y) || y === k)
                      return { ...x, items: next }
                    })
                  }
                />
                {label}
              </label>
            )
          })}
        </div>
      )}
      {settings && b.type === 'image' && (
        <div className="block-settings no-print">
          <label className="tool tool-text">
            <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && pickImage(e.target.files[0], onPatch)} />
            {b.src ? 'Replace image' : 'Choose image'}
          </label>
          {b.src && (
            <button className="tool tool-text" onClick={() => onPatch(x => ({ ...x, src: '' }))}>
              Remove image
            </button>
          )}
        </div>
      )}
      <div className={`block-content ${b.design?.color ? 'custom-color' : ''} ${b.design?.fontSize ? 'custom-size' : ''} ${b.design?.font ? 'custom-font' : ''} ${b.design?.weight ? 'custom-weight' : ''}`} style={blockDesign(b.design)}>{content}</div>
    </div>
  )
}

async function pickImage(file, onPatch) {
  try {
    const src = await fileToDataUrl(file)
    onPatch(x => ({ ...x, src }))
  } catch (err) {
    window.alert(err.message)
  }
}

// Reminds you which tokens fill in while you are typing a template.
function tokenHint(t) {
  const used = [...String(t || '').matchAll(/\{(\w+)\}/g)].map(m => m[1])
  const known = TOKENS.filter(([k]) => used.includes(k))
  return known.length
    ? `{${known.map(([k]) => k).join('}, {')}} fill in automatically.`
    : `Tokens such as ${TOKENS.slice(0, 3).map(([k]) => `{${k}}`).join(', ')} fill in automatically.`
}

// ------------------------------------------------------------ small pieces

// Text you click to edit. Shows `children` (or the plain value) until clicked,
// then a box you type in. Single-line text commits on Enter; everything
// commits on blur; Esc also closes it.
function Editable({
  as: Tag = 'span',
  className,
  value,
  onChange,
  single = false,
  minRows = 1,
  placeholder = 'Click to add text',
  hint,
  disabled = false,
  onFinish,
  children
}) {
  const [editing, setEditing] = useState(false)

  if (editing && !disabled) {
    return (
      <Tag className={className}>
        <AutoText
          autoFocus
          value={value}
          single={single}
          minRows={minRows}
          onChange={onChange}
          onDone={() => { setEditing(false); onFinish?.() }}
        />
        {hint && <span className="edit-hint no-print">{hint}</span>}
      </Tag>
    )
  }

  return (
    <Tag
      className={`${className || ''} ${disabled ? '' : 'editable'}`.trim()}
      data-placeholder={placeholder}
      tabIndex={disabled ? undefined : 0}
      title={disabled ? undefined : 'Click to edit'}
      onClick={disabled ? undefined : () => setEditing(true)}
      onKeyDown={disabled ? undefined : e => e.key === 'Enter' && setEditing(true)}
    >
      {children ?? value}
    </Tag>
  )
}

function AutoText({ value, onChange, onDone, single, minRows = 1, autoFocus }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  useLayoutEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
      const end = ref.current.value.length
      ref.current.setSelectionRange(end, end)
    }
  }, [autoFocus])
  return (
    <textarea
      ref={ref}
      className="edit-field"
      rows={minRows}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={e => {
        if (e.key === 'Escape' || (single && e.key === 'Enter')) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
    />
  )
}

// Plain-text body: "- " lines are bullets, blank lines split paragraphs.
function Body({ paras }) {
  return (
    <div className="page-body">
      {(paras || []).map((p, i) =>
        p.type === 'ul' ? (
          <ul key={i}>
            {p.items.map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{p.text}</p>
        )
      )}
    </div>
  )
}

// A small dropdown of things to add.
function AddMenu({ className, label, title, items, onPick, grid }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = e => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className={className} ref={ref}>
      {title && <p className="mono-label">{title}</p>}
      <button className="ghost" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {label}
      </button>
      {open && (
        <div className={`menu ${grid ? 'menu-grid' : ''}`} role="menu">
          {items.map(item => (
            <button
              key={item.key || item.name}
              role="menuitem"
              className="menu-item"
              onClick={() => {
                onPick(item)
                setOpen(false)
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AddStakeholder({ existing, onAdd }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const have = new Set(existing.map(s => s.key))
  const removed = STAKEHOLDERS.filter(s => !have.has(s.key))

  function addCustom(e) {
    e.preventDefault()
    const name = role.trim()
    if (!name) return
    onAdd({
      key: `custom_${uid()}`,
      role: name,
      tag: 'Custom stakeholder',
      cares: 'What they care about',
      objection: '-',
      counter: '-'
    })
    setRole('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="tab tab-add" onClick={() => setOpen(true)}>
        + Add
      </button>
    )
  }

  return (
    <form className="stake-add" onSubmit={addCustom}>
      {removed.map(s => (
        <button
          key={s.key}
          type="button"
          className="tab"
          onClick={() => {
            onAdd({ key: s.key, builtin: true })
            setOpen(false)
          }}
        >
          + {s.role}
        </button>
      ))}
      <input
        type="text"
        placeholder="Or a new role"
        value={role}
        onChange={e => setRole(e.target.value)}
        autoFocus
      />
      <button className="primary" type="submit" disabled={!role.trim()}>
        Add
      </button>
      <button className="ghost" type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  )
}
