// Text out of the files people actually have: PDF, Word, PowerPoint, Excel,
// and plain text (txt, md, csv, json, vtt, srt). Runs in the browser, so the
// server never parses user files. Office files are zip archives of XML; we
// read the XML with JSZip (already a dependency) instead of adding a parser.
//
// Returns { text, pages } or throws a readable Error. `pages` is set for PDF
// pages and PowerPoint slides.

import JSZip from 'jszip'

export const MAX_FILE_BYTES = 15 * 1024 * 1024
export const MAX_TEXT_CHARS = 300000
export const ACCEPT = '.pdf,.docx,.pptx,.xlsx,.txt,.md,.markdown,.csv,.tsv,.json,.vtt,.srt,.html,.xml,text/*'

const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|vtt|srt|html?|xml|log|yaml|yml)$/i

export function kindOf(name = '', type = '') {
  const n = name.toLowerCase()
  if (n.endsWith('.pdf') || type === 'application/pdf') return 'pdf'
  if (n.endsWith('.docx')) return 'docx'
  if (n.endsWith('.pptx')) return 'pptx'
  if (n.endsWith('.xlsx')) return 'xlsx'
  if (TEXT_EXT.test(n) || /^text\//.test(type) || /json|xml|csv/.test(type)) return 'text'
  if (/\.(doc|ppt|xls)$/.test(n)) return 'legacy'
  return 'unknown'
}

const decode = s => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&')

// Paragraph-aware text from WordprocessingML / DrawingML: one line per <w:p> / <a:p>.
export function xmlText(xml, para = 'w:p', run = 'w:t') {
  const out = []
  const pRe = new RegExp(`<${para}[ >][\\s\\S]*?</${para}>|<${para}/>`, 'g')
  const tRe = new RegExp(`<${run}(?: [^>]*)?>([\\s\\S]*?)</${run}>`, 'g')
  for (const p of xml.match(pRe) || []) {
    let line = '', m
    tRe.lastIndex = 0
    while ((m = tRe.exec(p))) line += decode(m[1])
    if (/<w:tab\/>/.test(p) && !line) line = ''
    out.push(line)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

const num = s => Number((s.match(/(\d+)\.xml$/) || [])[1] || 0)

async function docx(zip) {
  const f = zip.file('word/document.xml')
  if (!f) throw new Error('This Word file has no document body.')
  return { text: xmlText(await f.async('string')) }
}

async function pptx(zip) {
  const slides = Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a, b) => num(a) - num(b))
  const parts = []
  for (const [i, p] of slides.entries()) {
    const body = xmlText(await zip.file(p).async('string'), 'a:p', 'a:t')
    const notesPath = `ppt/notesSlides/notesSlide${num(p)}.xml`
    const notes = zip.file(notesPath) ? xmlText(await zip.file(notesPath).async('string'), 'a:p', 'a:t') : ''
    parts.push(`--- Slide ${i + 1} ---\n${body}${notes ? `\nSpeaker notes: ${notes}` : ''}`)
  }
  return { text: parts.join('\n\n'), pages: slides.length }
}

// Column letters -> index, e.g. "AB" -> 27.
const colIndex = ref => [...ref.replace(/\d+/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1

export async function xlsxFromZip(zip) {
  const sharedXml = zip.file('xl/sharedStrings.xml') ? await zip.file('xl/sharedStrings.xml').async('string') : ''
  const shared = (sharedXml.match(/<si>[\s\S]*?<\/si>/g) || []).map(si => decode((si.match(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('')))
  const wb = zip.file('xl/workbook.xml') ? await zip.file('xl/workbook.xml').async('string') : ''
  const names = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"/g)].map(m => decode(m[1]))
  const sheets = Object.keys(zip.files).filter(p => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort((a, b) => num(a) - num(b))
  const out = []
  for (const [i, p] of sheets.entries()) {
    const xml = await zip.file(p).async('string')
    const rows = []
    for (const r of xml.match(/<row[ >][\s\S]*?<\/row>/g) || []) {
      const cells = []
      for (const c of r.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
        const ref = (c.match(/ r="([A-Z]+\d+)"/) || [])[1] || ''
        const type = (c.match(/ t="(\w+)"/) || [])[1] || ''
        const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1]
        const inline = (c.match(/<is>[\s\S]*?<t(?: [^>]*)?>([\s\S]*?)<\/t>/) || [])[1]
        let val = type === 's' && v != null ? shared[Number(v)] ?? '' : type === 'inlineStr' ? decode(inline || '') : v != null ? decode(v) : ''
        if (ref) cells[colIndex(ref)] = val
        else cells.push(val)
      }
      if (cells.some(x => x !== undefined && x !== '')) rows.push(Array.from(cells, x => x ?? '').join('\t'))
    }
    out.push(`--- Sheet: ${names[i] || `Sheet ${i + 1}`} ---\n${rows.join('\n')}`)
  }
  return { text: out.join('\n\n'), pages: sheets.length }
}

async function pdf(buffer) {
  const pdfjs = await import('pdfjs-dist')
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    let line = '', lastY = null
    const lines = []
    for (const it of content.items) {
      const y = it.transform?.[5]
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) { lines.push(line); line = '' }
      line += it.str + (it.hasEOL ? '\n' : '')
      lastY = y
    }
    lines.push(line)
    pages.push(`--- Page ${i} ---\n${lines.join('\n').replace(/[ \t]+\n/g, '\n').trim()}`)
  }
  const text = pages.join('\n\n')
  if (!text.replace(/--- Page \d+ ---/g, '').trim()) throw new Error('This PDF has no text layer (it is probably a scan), so the agent cannot read it.')
  return { text, pages: doc.numPages }
}

export async function extractText(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is over 15 MB.`)
  const k = kindOf(file.name, file.type)
  let out
  if (k === 'text') out = { text: await file.text() }
  else if (k === 'pdf') out = await pdf(await file.arrayBuffer())
  else if (k === 'docx' || k === 'pptx' || k === 'xlsx') {
    let zip
    try { zip = await JSZip.loadAsync(await file.arrayBuffer()) } catch { throw new Error(`${file.name} could not be opened. Is it a real ${k.toUpperCase()} file?`) }
    out = k === 'docx' ? await docx(zip) : k === 'pptx' ? await pptx(zip) : await xlsxFromZip(zip)
  } else if (k === 'legacy') throw new Error(`${file.name} is an old Office format. Save it as .docx, .pptx or .xlsx and upload that.`)
  else throw new Error(`${file.name}: this file type cannot be read. Use PDF, Word, PowerPoint, Excel or a text file.`)
  const text = (out.text || '').replace(/\u0000/g, '').trim()
  if (!text) throw new Error(`${file.name} has no readable text.`)
  return { ...out, text: text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text, truncated: text.length > MAX_TEXT_CHARS }
}
