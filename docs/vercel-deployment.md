# Vercel deployment

CaseBuilder uses the existing Vercel project casebuilder, connected to davidosoaar-sys/casebuilder. Pushes to main create production deployments; other branches create previews. Production URL: https://casebuilder-three.vercel.app.

The tracked vercel.json specifies Vite, npm ci (skipping Puppeteer browser downloads), npm run build, and dist. Browser automation is for local checks and is not needed to serve the app.

Vercel production and preview environments require VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, and server-only ANTHROPIC_API_KEY. Values belong in Vercel settings, never in Git. The two VITE settings are public browser configuration; the Anthropic key must never receive a VITE prefix.

Brand discovery validates the signed-in Supabase session server-side. Older access-code clients can still use RESEARCH_ACCESS_CODE when configured. Other legacy research/publishing endpoints retain their existing configuration requirements; publishing customer websites needs its own hosting credentials.

Before a release, pull --ff-only, preserve local work, run npm test and npm run build, update CHANGELOG.md and package/lock versions, then push the authorized release and its specific tag. Inspect the resulting Vercel deployment for READY and verify the production URL; a successful Git push alone is not deployment confirmation.
