/**
 * Local dev server for the /api/chat serverless function.
 * Loads .env.local and proxies Claude API requests.
 * Run alongside `npm run dev` (Vite proxies /api to this).
 */
import { readFileSync } from 'fs'
import { createServer } from 'http'

// Load .env.local
try {
  const envFile = readFileSync('.env.local', 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  }
} catch {
  console.error('Warning: .env.local not found')
}

const PORT = 3001

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method !== 'POST' || !req.url?.startsWith('/api/chat')) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env.local' }))
    return
  }

  // Read request body
  let body = ''
  for await (const chunk of req) body += chunk

  try {
    const { messages, system } = JSON.parse(body)

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system,
        messages,
      }),
    })

    const data = await apiResponse.json()

    res.writeHead(apiResponse.ok ? 200 : apiResponse.status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  } catch (err) {
    console.error('API error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Failed to call Claude API' }))
  }
})

server.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`)
  console.log('API key loaded:', process.env.ANTHROPIC_API_KEY ? 'yes' : 'NO - check .env.local')
})
