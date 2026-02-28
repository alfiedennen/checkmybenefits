/**
 * Lambda proxy for MissingBenefit MCP server.
 * Accepts mapped MB answers from the client, handles the MCP session
 * lifecycle (initialize → notify → tools/call), and returns the result.
 *
 * Env vars: MISSING_BENEFIT_API_KEY
 */

const MCP_URL = 'https://missingbenefit.com/mcp'
const TIMEOUT_MS = 15000

export async function handler(event) {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return response(400, { error: 'Missing answers object' })
    }

    const apiKey = process.env.MISSING_BENEFIT_API_KEY
    if (!apiKey) {
      console.error('MISSING_BENEFIT_API_KEY not configured')
      return response(500, { error: 'API key not configured' })
    }

    const result = await callMCP(apiKey, answers)
    if (!result) {
      return response(502, { error: 'MissingBenefit MCP server unavailable' })
    }

    return response(200, result)
  } catch (err) {
    console.error('MissingBenefit proxy error:', err)
    return response(500, { error: 'Internal error' })
  }
}

async function callMCP(apiKey, answers) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  }

  // Step 1: Initialize MCP session
  const initRes = await mcpRequest(headers, null, {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'checkmybenefits-proxy', version: '1.0' },
    },
    id: 1,
  })

  if (!initRes) return null

  // Extract session ID from response headers
  const sessionId = initRes.sessionId
  if (!sessionId) {
    console.error('No Mcp-Session-Id in init response')
    return null
  }

  const sessionHeaders = { ...headers, 'Mcp-Session-Id': sessionId }

  // Step 2: Send initialized notification
  await mcpRequest(sessionHeaders, sessionId, {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {},
  })

  // Step 3: Call calculate-benefits
  const calcRes = await mcpRequest(sessionHeaders, sessionId, {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'calculate-benefits',
      arguments: { answers, skipDataCheck: true },
    },
    id: 2,
  })

  if (!calcRes?.data?.result?.content?.[0]?.text) return null

  try {
    return JSON.parse(calcRes.data.result.content[0].text)
  } catch {
    console.error('Failed to parse MCP response text')
    return null
  }
}

async function mcpRequest(headers, sessionId, body) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Extract session ID from headers
    const sid = res.headers.get('mcp-session-id')

    // Notifications return 202/204 with no body
    if (res.status === 202 || res.status === 204) {
      return { sessionId: sid || sessionId, data: null }
    }

    // SSE responses: parse the data lines
    const text = await res.text()
    const dataLine = text.split('\n').find((l) => l.startsWith('data: '))
    if (dataLine) {
      const data = JSON.parse(dataLine.slice(6))
      return { sessionId: sid || sessionId, data }
    }

    // Plain JSON response
    try {
      const data = JSON.parse(text)
      return { sessionId: sid || sessionId, data }
    } catch {
      return { sessionId: sid || sessionId, data: null }
    }
  } catch (err) {
    clearTimeout(timeoutId)
    console.error('MCP request failed:', err.message)
    return null
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
