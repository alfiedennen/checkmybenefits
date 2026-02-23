import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({ region: 'eu-west-2' })
const MODEL_ID = 'amazon.nova-lite-v1:0'

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

  const { messages, system } = req.body

  try {
    // Bedrock requires conversation to start with a user message.
    const filtered = messages.filter((m: any) => m.role === 'user' || m.role === 'assistant')
    const firstUserIdx = filtered.findIndex((m: any) => m.role === 'user')
    const trimmed = firstUserIdx >= 0 ? filtered.slice(firstUserIdx) : filtered

    const bedrockMessages = trimmed.map((m: any) => ({
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

    return res.status(200).json({ content: [{ type: 'text', text }] })
  } catch (err) {
    console.error('Bedrock error:', err)
    return res.status(500).json({ error: 'Failed to call Bedrock' })
  }
}
