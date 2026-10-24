import { handlePublish } from '../server/handler.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'POST only' })
  }
  const { status, body } = await handlePublish({ body: req.body, headers: req.headers })
  res.status(status).json(body)
}
