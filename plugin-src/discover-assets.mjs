import fs from 'node:fs'
import {discoverBrand} from '../server/brand.js'
import {checkCaseFile} from '../src/caseFile.js'

const [file, website = '', enabled, approved] = process.argv.slice(2)
try {
  if (enabled !== 'web-enabled' || approved !== 'approved') throw Error('Web access and brand replacement must be authorized before searching')
  const original = fs.readFileSync(file, 'utf8')
  const data = JSON.parse(original)
  const result = checkCaseFile(data)
  if (result.errors.length) throw Error(result.errors.join('; '))
  const brand = await discoverBrand({company:data.company,website:website || data.brand?.website || ''})
  if (!brand.logo) throw Error(brand.message || 'No verified logo found; the case was not changed')
  if (fs.readFileSync(file, 'utf8') !== original) throw Error('The case changed during discovery; retry without overwriting it')
  data.brand = {...data.brand,...brand}
  const tmp = file + '.assets.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data,null,2)+'\n', {flag:'wx',mode:0o600})
  fs.renameSync(tmp,file)
  console.log(JSON.stringify({saved:true,logoFound:true,headingFont:brand.headingFont,bodyFont:brand.bodyFont,fontFiles:brand.fontFaces.length,coverImageFound:!!brand.heroImage,sources:brand.sources,note:brand.heroImage?'Official cover image embedded.':'No usable official cover image found; typographic fallback retained.'}))
} catch (e) { console.error(e.message); process.exitCode=1 }
