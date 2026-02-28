/**
 * Local dev server for serverless functions.
 * Uses Amazon Bedrock with Nova Lite to mirror production.
 * Run alongside `npm run dev` (Vite proxies /api to this).
 */
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({ region: 'eu-west-2' })
const MODEL_ID = 'amazon.nova-lite-v1:0'
const PORT = 3001

// Load .env for MissingBenefit API key
try {
  const envFile = readFileSync('.env', 'utf8')
  for (const line of envFile.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key?.trim() && rest.length) {
      process.env[key.trim()] = rest.join('=').trim()
    }
  }
} catch { /* no .env file */ }

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

  // Route: MissingBenefit proxy
  if (req.method === 'POST' && req.url?.startsWith('/api/ctr')) {
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const { handler } = await import('./lambda/missing-benefit/index.mjs')
      process.env.MISSING_BENEFIT_API_KEY = process.env.MISSING_BENEFIT_API_KEY || ''
      const result = await handler({ body, requestContext: { http: { method: 'POST' } } })
      res.writeHead(result.statusCode, { 'Content-Type': 'application/json' })
      res.end(result.body)
    } catch (err) {
      console.error('MB proxy error:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'MissingBenefit proxy error' }))
    }
    return
  }

  if (req.method !== 'POST' || !req.url?.startsWith('/api/chat')) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  // Read request body
  let body = ''
  for await (const chunk of req) body += chunk

  try {
    const { messages, system } = JSON.parse(body)

    // Bedrock requires conversation to start with a user message.
    // The frontend sends the opening assistant greeting — strip leading assistant messages.
    const filtered = messages.filter((m) => m.role === 'user' || m.role === 'assistant')
    const firstUserIdx = filtered.findIndex((m) => m.role === 'user')
    const trimmed = firstUserIdx >= 0 ? filtered.slice(firstUserIdx) : filtered

    const bedrockMessages = trimmed.map((m) => ({
      role: m.role,
      content: [{ text: m.content?.trim() || '...' }],
    }))

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: system }],
      messages: bedrockMessages,
      inferenceConfig: { maxTokens: 4096, temperature: 0.7 },
    })

    const result = await client.send(command)

    const text = result.output?.message?.content
      ?.map((block) => ('text' in block ? block.text : ''))
      .join('') ?? ''

    // Return Anthropic-compatible response shape so the frontend works unchanged
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ content: [{ type: 'text', text }] }))
  } catch (err) {
    console.error('Bedrock error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Failed to call Bedrock' }))
  }
})

server.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`)
  console.log('Using Amazon Bedrock Nova Lite (eu-west-2)')
})
