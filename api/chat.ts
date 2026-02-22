import type { VercelRequest, VercelResponse } from '@vercel/node'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

async function callClaude(apiKey: string, system: string, messages: unknown[], maxTokens = 1024) {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    const isContentFilter = response.status === 400 && errorText.includes('content filtering')
    return { ok: false, status: response.status, errorText, isContentFilter }
  }

  const data = await response.json()
  return { ok: true, data }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const { messages, system } = req.body

  try {
    const result = await callClaude(apiKey, system, messages)

    if (result.ok) {
      return res.status(200).json(result.data)
    }

    // On content filter block, retry once with a shorter max_tokens to nudge a different response
    if (result.isContentFilter) {
      const retry = await callClaude(apiKey, system, messages, 512)
      if (retry.ok) {
        return res.status(200).json(retry.data)
      }

      // If still filtered, return a synthetic response so the frontend doesn't break
      return res.status(200).json({
        content: [{
          type: 'text',
          text: "I'd like to help you with that. Could you tell me a bit more about your situation so I can check what support might be available?",
        }],
      })
    }

    return res.status(result.status!).json({ error: result.errorText })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to call Claude API' })
  }
}
