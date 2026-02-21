import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message as BedrockMessage,
  type ContentBlock,
} from '@aws-sdk/client-bedrock-runtime'

const MODEL_ID = 'amazon.nova-micro-v1:0'

interface BedrockClientOptions {
  maxTokens?: number
  temperature?: number
  region?: string
}

interface BedrockResponse {
  text: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

const DEFAULT_OPTIONS: Required<BedrockClientOptions> = {
  maxTokens: 2048,
  temperature: 0,
  region: 'eu-west-2',
}

export function createBedrockClient(options: BedrockClientOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const client = new BedrockRuntimeClient({ region: config.region })

  return async function callNovaMicro(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<BedrockResponse> {
    const bedrockMessages: BedrockMessage[] = messages.map((m) => ({
      role: m.role,
      content: [{ text: m.content } as ContentBlock],
    }))

    const start = Date.now()

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: systemPrompt }],
      messages: bedrockMessages,
      inferenceConfig: {
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      },
    })

    const response = await client.send(command)
    const latencyMs = Date.now() - start

    const text =
      response.output?.message?.content
        ?.map((block) => ('text' in block ? block.text : ''))
        .join('') ?? ''

    return {
      text,
      inputTokens: response.usage?.inputTokens ?? 0,
      outputTokens: response.usage?.outputTokens ?? 0,
      latencyMs,
    }
  }
}
