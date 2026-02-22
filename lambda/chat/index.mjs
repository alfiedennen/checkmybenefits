import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({ region: 'eu-west-2' })
const MODEL_ID = 'amazon.nova-lite-v1:0'

export async function handler(event) {
  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: '',
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { messages, system } = body

    if (!messages || !system) {
      return response(400, { error: 'Missing messages or system prompt' })
    }

    // Bedrock requires conversation to start with a user message.
    // The frontend sends the opening assistant greeting — strip leading assistant messages.
    const filtered = messages.filter((m) => m.role === 'user' || m.role === 'assistant')
    const firstUserIdx = filtered.findIndex((m) => m.role === 'user')
    const trimmed = firstUserIdx >= 0 ? filtered.slice(firstUserIdx) : filtered

    const bedrockMessages = trimmed.map((m) => ({
      role: m.role,
      content: [{ text: m.content }],
    }))

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: system }],
      messages: bedrockMessages,
      inferenceConfig: { maxTokens: 4096, temperature: 0.7 },
      guardrailConfig: {
        guardrailIdentifier: process.env.GUARDRAIL_ID,
        guardrailVersion: process.env.GUARDRAIL_VERSION,
      },
    })

    const result = await client.send(command)

    // Handle guardrail intervention
    if (result.stopReason === 'guardrail_intervened') {
      const blockedText = result.output?.message?.content
        ?.map((block) => ('text' in block ? block.text : ''))
        .join('') ?? "I can only help with questions about UK benefits and entitlements. Please try rephrasing your question."

      return response(200, { content: [{ type: 'text', text: blockedText }] })
    }

    const text = result.output?.message?.content
      ?.map((block) => ('text' in block ? block.text : ''))
      .join('') ?? ''

    // Return Anthropic-compatible response shape so the frontend works unchanged
    return response(200, { content: [{ type: 'text', text }] })
  } catch (err) {
    console.error('Bedrock error:', err)
    return response(500, { error: 'Failed to call Bedrock' })
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
