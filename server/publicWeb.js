import https from 'node:https'
import { lookup } from 'node:dns/promises'
import {gunzipSync,inflateSync,brotliDecompressSync} from 'node:zlib'

export function decodePublicBody(buffer,encoding,limit){
  const options={maxOutputLength:limit}
  if(encoding==='gzip'||(buffer[0]===31&&buffer[1]===139))return gunzipSync(buffer,options)
  if(encoding==='br')return brotliDecompressSync(buffer,options)
  if(encoding==='deflate')return inflateSync(buffer,options)
  return buffer
}

export function publicAddress(address) {
  if (address.includes(':')) return /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(db8|0):/i.test(address)
  const p = address.split('.').map(Number)
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false
  return !([0, 10, 127].includes(p[0]) || p[0] >= 224 ||
    (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && [0, 168].includes(p[1])) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    (p[0] === 198 && [18, 19, 51].includes(p[1])) || (p[0] === 203 && p[1] === 0 && p[2] === 113))
}

// Resolve and pin public IPs for every request, including every redirect.
// Website content cannot turn this endpoint into an internal-network proxy.
export async function fetchPublic(input, { limit = 1_500_000, redirects = 3 } = {}) {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Use a public HTTPS website.')
  const records = await lookup(url.hostname, { all: true })
  if (!records.length || records.some(r => !publicAddress(r.address))) throw new Error('That website address is not public.')
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'CaseBuilder/1.0 (public company and professional profile research)', Accept: '*/*', 'Accept-Encoding': 'identity' },
      lookup: (_host, options, callback) => options.all ? callback(null, records) : callback(null, records[0].address, records[0].family)
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        if (!redirects) return reject(new Error('Too many website redirects.'))
        fetchPublic(new URL(res.headers.location, url).href, { limit, redirects: redirects - 1 }).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`Website returned ${res.statusCode}.`)) }
      const chunks = []
      let length = 0
      res.on('data', c => { length += c.length; if (length > limit) req.destroy(new Error('Brand asset is too large.')); else chunks.push(c) })
      res.on('end', () => {try{resolve({ buffer: decodePublicBody(Buffer.concat(chunks),String(res.headers['content-encoding']||''),limit), type: String(res.headers['content-type'] || ''), url: url.href })}catch{reject(new Error('Website content could not be decoded within the size limit.'))}})
      res.on('error', reject)
    })
    req.setTimeout(7000, () => req.destroy(new Error('Website took too long to respond.')))
    req.on('error', reject)
  })
}
