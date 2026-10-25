import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Serves /api/research and /api/publish during `npm run dev` / `vite preview` by
// calling the same handlers the Vercel functions use, so the people-finder and
// "Publish to Vercel" work locally without the Vercel CLI. Reads ANTHROPIC_API_KEY,
// VERCEL_TOKEN etc. from .env.local.
const ROUTES = { '/api/research': 'handle', '/api/publish': 'handlePublish', '/api/suggest': 'handleSuggest', '/api/brand': 'handleBrand' }

// Server-only secrets for the local /api routes (e.g. SUPABASE_SECRET_KEY, used to
// read the signed-in user's saved Anthropic key). Kept out of .env.local on
// purpose: that file holds the public VITE_ settings people share with each
// other. Never give a secret a VITE_ name: Vite would ship it to the browser.
function serverOnlyEnv() {
  try {
    const text = fs.readFileSync(path.resolve('.env.server.local'), 'utf8')
    return Object.fromEntries(text.split('\n').filter(l => /^[A-Z_][A-Z0-9_]*=/.test(l) && !l.startsWith('VITE_')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
  } catch { return {} }
}

function localApi() {
  const makeMiddleware = (loadHandlers, loadPerson) => async (req, res, next) => {
    if (req.url?.split('?')[0] === '/api/person') {
      const { servePerson } = await loadPerson()
      return servePerson(req, res)
    }
    const route = Object.keys(ROUTES).find(r => req.url?.startsWith(r))
    if (!route) return next()
    const chunks = []
    for await (const c of req) chunks.push(c)
    let body = {}
    try {
      body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
    } catch {
      // fall through with an empty body; the handler will reject it
    }
    const handlers = await loadHandlers()
    const { status, body: out } = await handlers[ROUTES[route]]({ body, headers: req.headers })
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(out))
  }

  const file = pathToFileURL(path.resolve('server/handler.js')).href
  const personFile = pathToFileURL(path.resolve('server/personAgent.js')).href

  return {
    name: 'local-api',
    config(_, { mode }) {
      Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ''), ...serverOnlyEnv(), ...process.env })
    },
    configureServer(server) {
      // ssrLoadModule re-reads the file after edits, so server code hot-reloads.
      server.middlewares.use(makeMiddleware(() => server.ssrLoadModule('/server/handler.js'), () => server.ssrLoadModule('/server/personAgent.js')))
    },
    configurePreviewServer(server) {
      server.middlewares.use(makeMiddleware(() => import(/* @vite-ignore */ file), () => import(/* @vite-ignore */ personFile)))
    }
  }
}

export default defineConfig({
  plugins: [react(), localApi()],
  // strictPort: if 5173 is taken, fail instead of quietly moving to 5174, 5175...
  // so there is only ever one local link. Same for `vite preview`.
  server: { port: 5173, strictPort: true, open: !process.env.NO_OPEN },
  preview: { port: 5173, strictPort: true }
})
