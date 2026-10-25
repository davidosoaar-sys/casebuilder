// Builds small real Office files with JSZip and checks extraction.
import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { extractText, kindOf, xmlText } from './fileText.js'

const asFile = async (name, zip) => {
  const buf = await zip.generateAsync({ type: 'uint8array' })
  return { name, size: buf.length, type: '', arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length), text: async () => '' }
}

test('kinds', () => {
  assert.equal(kindOf('Q3 forecast.xlsx'), 'xlsx')
  assert.equal(kindOf('call.vtt'), 'text')
  assert.equal(kindOf('deck.PPTX'), 'pptx')
  assert.equal(kindOf('old.doc'), 'legacy')
  assert.equal(kindOf('photo.png', 'image/png'), 'unknown')
})

test('word: paragraphs, entities, runs joined', async () => {
  const z = new JSZip()
  z.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Nike &amp; Backstage</w:t></w:r><w:r><w:t xml:space="preserve"> plan</w:t></w:r></w:p><w:p><w:r><w:t>Second line</w:t></w:r></w:p></w:body></w:document>')
  const r = await extractText(await asFile('brief.docx', z))
  assert.equal(r.text, 'Nike & Backstage plan\nSecond line')
})

test('powerpoint: slides in order with speaker notes', async () => {
  const z = new JSZip()
  z.file('ppt/slides/slide2.xml', '<p:sld><a:p><a:r><a:t>Second slide</a:t></a:r></a:p></p:sld>')
  z.file('ppt/slides/slide1.xml', '<p:sld><a:p><a:r><a:t>Title: Portal for Nike</a:t></a:r></a:p></p:sld>')
  z.file('ppt/slides/slide10.xml', '<p:sld><a:p><a:r><a:t>Tenth</a:t></a:r></a:p></p:sld>')
  z.file('ppt/notesSlides/notesSlide1.xml', '<p:notes><a:p><a:r><a:t>Open with the CFO quote</a:t></a:r></a:p></p:notes>')
  const r = await extractText(await asFile('best deck.pptx', z))
  assert.equal(r.pages, 3)
  assert.ok(r.text.indexOf('Portal for Nike') < r.text.indexOf('Second slide'))
  assert.ok(r.text.indexOf('Second slide') < r.text.indexOf('Tenth'))
  assert.match(r.text, /Speaker notes: Open with the CFO quote/)
})

test('excel: shared strings, numbers, sheet names, column gaps', async () => {
  const z = new JSZip()
  z.file('xl/workbook.xml', '<workbook><sheets><sheet name="Forecast" sheetId="1"/></sheets></workbook>')
  z.file('xl/sharedStrings.xml', '<sst><si><t>Engineers</t></si><si><t>Cost/hr</t></si></sst>')
  z.file('xl/worksheets/sheet1.xml', '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row><row r="2"><c r="A2"><v>1200</v></c><c r="C2"><v>95.5</v></c></row></sheetData></worksheet>')
  const r = await extractText(await asFile('Nike finance 2026.xlsx', z))
  assert.match(r.text, /--- Sheet: Forecast ---/)
  assert.match(r.text, /Engineers\t\tCost\/hr/)
  assert.match(r.text, /1200\t\t95.5/)
})

test('plain text and refusals', async () => {
  const t = { name: 'call.md', size: 10, type: 'text/markdown', text: async () => 'They have 900 engineers.' }
  assert.equal((await extractText(t)).text, 'They have 900 engineers.')
  await assert.rejects(extractText({ name: 'x.doc', size: 5, type: '' }), /old Office format/)
  await assert.rejects(extractText({ name: 'x.png', size: 5, type: 'image/png' }), /cannot be read/)
  await assert.rejects(extractText({ name: 'x.txt', size: 16 * 1024 * 1024, type: 'text/plain' }), /over 15 MB/)
  await assert.rejects(extractText({ name: 'x.txt', size: 3, type: 'text/plain', text: async () => '  ' }), /no readable text/)
})

test('xmlText keeps empty paragraphs as breaks only once', () => {
  assert.equal(xmlText('<w:p><w:t>a</w:t></w:p><w:p/><w:p/><w:p/><w:p><w:t>b</w:t></w:p>'), 'a\n\nb')
})
