import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Serves /api/research during `npm run dev` / `vite preview` by calling the same
// handler the Vercel function uses, so the agent works locally without the
// Vercel CLI. Reads ANTHROPIC_API_KEY etc. from .env.local.
function localApi() {
  const makeMiddleware = loadHandler => async (req, res, next) => {
    if (!req.url?.startsWith('/api/research')) return next()
    const chunks = []
    for await (const c of req) chunks.push(c)
    let body = {}
    try {
      body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
    } catch {
      // fall through with an empty body; the handler will reject it
    }
    const { handle } = await loadHandler()
    const { status, body: out } = await handle({ body, headers: req.headers })
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(out))
  }

  const file = pathToFileURL(path.resolve('server/handler.js')).href

  return {
    name: 'local-api',
    config(_, { mode }) {
      Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ''), ...process.env })
    },
    configureServer(server) {
      // ssrLoadModule re-reads the file after edits, so server code hot-reloads.
      server.middlewares.use(makeMiddleware(() => server.ssrLoadModule('/server/handler.js')))
    },
    configurePreviewServer(server) {
      server.middlewares.use(makeMiddleware(() => import(/* @vite-ignore */ file)))
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
