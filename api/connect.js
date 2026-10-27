import { handleConnect } from '../server/composio.js'
export default async function connect(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const result = await handleConnect(req)
  res.status(result.status).json(result.body)
}
