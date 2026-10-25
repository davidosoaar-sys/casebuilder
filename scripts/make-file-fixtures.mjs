// Real fixture files for the Files tab test: a PDF, a Word doc, a PowerPoint
// and an Excel sheet, each holding one fact only that file has. Fictional.
// Usage: node scripts/make-file-fixtures.mjs <outdir>
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'

const out = process.argv[2] || '/tmp/cb-files'
fs.mkdirSync(out, { recursive: true })

// PDF: printed by headless Chrome, so it has a real text layer.
const browser = await puppeteer.launch({ headless: 'new' })
const pg = await browser.newPage()
await pg.setContent('<h1>Northwind Financial Report FY2026 (fictional)</h1><p>Northwind employs 1,480 software engineers across 9 hubs.</p><p>Platform team headcount: 37.</p>')
await pg.pdf({ path: path.join(out, 'Northwind Financial Report FY2026.pdf'), format: 'A4' })
await browser.close()

// Word: minimal valid docx.
const docx = new JSZip()
docx.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
docx.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
docx.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Discovery call notes, Northwind</w:t></w:r></w:p><w:p><w:r><w:t>The CFO, Dana Whitlock, wants payback inside 9 months.</w:t></w:r></w:p></w:body></w:document>')
fs.writeFileSync(path.join(out, 'Northwind discovery notes.docx'), await docx.generateAsync({ type: 'nodebuffer' }))

// PowerPoint: a real deck via pptxgenjs.
const pptx = new PptxGenJS()
pptx.addSlide().addText('Our best deck: open with the number', { x: 0.5, y: 0.5, w: 9, h: 1 })
const s2 = pptx.addSlide(); s2.addText('Slide 2: always end on a 90-day implementation plan', { x: 0.5, y: 0.5, w: 9, h: 1 })
await pptx.writeFile({ fileName: path.join(out, 'Best deck we ever sent.pptx') })

// Excel: minimal valid xlsx.
const x = new JSZip()
x.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>')
x.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
x.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>')
x.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Cost model" sheetId="1" r:id="rId1"/></sheets></workbook>')
x.file('xl/sharedStrings.xml', '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Loaded cost per engineer hour (USD)</t></si></sst>')
x.file('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>118</v></c></row></sheetData></worksheet>')
fs.writeFileSync(path.join(out, 'Northwind finance model.xlsx'), await x.generateAsync({ type: 'nodebuffer' }))

console.log(fs.readdirSync(out).map(f => `${f} ${fs.statSync(path.join(out, f)).size}`).join('\n'))
