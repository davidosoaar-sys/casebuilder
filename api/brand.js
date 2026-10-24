import { handleBrand } from '../server/handler.js'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const result = await handleBrand({ body: req.body, headers: req.headers })
  res.status(result.status).json(result.body)
}
