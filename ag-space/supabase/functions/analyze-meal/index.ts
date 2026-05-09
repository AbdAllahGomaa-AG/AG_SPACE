import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")?.trim()
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash"

const MAX_REQUEST_SIZE = 5 * 1024 * 1024
const FUNCTION_TIMEOUT_MS = 25_000

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: unknown) {
  const entry = { timestamp: new Date().toISOString(), level, message, data }
  console.log(JSON.stringify(entry))
}

function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
  }
  return JSON.parse(cleaned)
}

function buildSuccessResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function buildErrorResponse(status: number, message: string, details?: unknown) {
  const body: Record<string, unknown> = { success: false, error: message }
  if (details) body.details = details
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`timed out`)), ms)
  })
  return await Promise.race([promise, timeout])
}

async function callGeminiAPI(promptParts: (string | object)[], requestId: string, modelName: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const url = `${GEMINI_API_BASE}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`

  const contents: { role: string; parts: any[] }[] = [{
    role: "user",
    parts: [],
  }]

  for (const part of promptParts) {
    if (typeof part === 'string') {
      contents[0].parts.push({ text: part })
    } else if (part && typeof part === 'object' && 'inlineData' in part) {
      contents[0].parts.push({ inlineData: (part as any).inlineData })
    } else {
      contents[0].parts.push(part)
    }
  }

  const body = {
    contents,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  }

  log('INFO', 'Calling Gemini REST API', { model: modelName, requestId, partCount: contents[0].parts.length })

  const response = await withTimeout(
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    FUNCTION_TIMEOUT_MS
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    log('ERROR', 'Gemini API returned error', { status: response.status, body: errorText, requestId })

    if (response.status === 429) {
      throw new Error('rate_limited')
    }
    if (response.status === 404) {
      throw new Error(`model_not_found: ${modelName}`)
    }
    if (response.status === 403) {
      throw new Error('api_key_invalid')
    }

    throw new Error(`Gemini API returned ${response.status}: ${errorText.slice(0, 200)}`)
  }

  const data = await response.json()
  const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!geminiText) {
    const finishReason = data?.candidates?.[0]?.finishReason
    const blockReason = data?.promptFeedback?.blockReason
    log('ERROR', 'Empty Gemini response', { finishReason, blockReason, requestId })
    throw new Error(`AI returned no content` + (blockReason ? ` (blocked: ${blockReason})` : ''))
  }

  try {
    return cleanAndParseJSON(geminiText)
  } catch {
    log('ERROR', 'Failed to parse Gemini response', { text: geminiText, requestId })
    throw new Error('invalid_response_format')
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = performance.now()

  log('INFO', 'Request started', { method: req.method, requestId })

  if (req.method === 'OPTIONS') {
    log('INFO', 'Preflight handled', { requestId })
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return buildErrorResponse(405, `Method ${req.method} not allowed`)
  }

  try {
    if (!GEMINI_API_KEY) {
      log('ERROR', 'GEMINI_API_KEY is not set', { requestId })
      return buildErrorResponse(500, 'AI service configuration error')
    }

    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      log('WARN', 'Request too large', { contentLength, requestId })
      return buildErrorResponse(413, 'Request payload too large')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return buildErrorResponse(401, 'Missing or invalid Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return buildErrorResponse(401, 'Empty Authorization token')
    }

    let bodyRecord: Record<string, unknown>
    try {
      bodyRecord = await req.json()
    } catch {
      return buildErrorResponse(400, 'Invalid JSON in request body')
    }

    const { imageBase64, mimeType, textDescription, mealType } = bodyRecord as {
      imageBase64?: string
      mimeType?: string
      textDescription?: string
      mealType?: string
    }

    if (!textDescription && !imageBase64) {
      return buildErrorResponse(400, 'Either textDescription or imageBase64 must be provided')
    }

    if (imageBase64 && typeof imageBase64 === 'string') {
      const decodedSize = Math.ceil((imageBase64.length * 3) / 4)
      if (decodedSize > MAX_REQUEST_SIZE) {
        return buildErrorResponse(413, 'Image data exceeds maximum allowed size')
      }
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
    const { data, error: authError } = await supabase.auth.getUser(token)
    const user = data?.user

    if (authError || !user) {
      return buildErrorResponse(401, authError?.message || 'Unauthorized')
    }

    log('INFO', 'User authenticated', { userId: user.id, requestId })

    const systemInstruction = `You are a senior nutrition expert AI. Your task is to analyze a meal from an image or a text description.
Provide a highly accurate estimation of the nutrients for each item in the meal and the overall totals.

RULES:
1. Be realistic. If portions look large, estimate accordingly.
2. If you are unsure, provide your best estimate but indicate lower confidence.
3. List individual ingredients if they are visible or described.
4. If the input is too vague or the image is not food, set analysis_confidence to a low value and ask a clarifying question.
5. Output MUST be valid JSON according to the schema provided.

JSON SCHEMA:
{
  "meal_name": "Descriptive name for the meal",
  "items": [
    {
      "name": "Item name",
      "estimated_quantity": "e.g., 2 large pieces, 1 cup",
      "estimated_weight_grams": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number,
      "sugars_g": number,
      "sodium_mg": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sugars_g": number,
    "sodium_mg": number
  },
  "analysis_confidence": number (0.0 to 1.0),
  "assumptions": ["list of assumptions made"],
  "clarifying_question": "string or null"
}`

    const promptParts: (string | object)[] = []
    if (textDescription) {
      promptParts.push(`Meal: ${textDescription}`)
    }
    if (mealType) {
      promptParts.push(`Meal Type: ${mealType}`)
    }
    if (imageBase64 && mimeType) {
      promptParts.push({
        inlineData: { data: imageBase64, mimeType },
      })
    }

    if (promptParts.length === 0) {
      promptParts.push("Analyze this meal")
    }

    let modelName = GEMINI_MODEL
    let analysis: Record<string, unknown> | null = null
    let lastError: string | null = null

    const modelsToTry = [
      modelName,
      ...(modelName === "gemini-2.0-flash" ? ["gemini-1.5-flash"] : ["gemini-2.0-flash"]),
    ]

    for (const currentModel of modelsToTry) {
      try {
        log('INFO', 'Attempting Gemini call', { model: currentModel, hasImage: !!imageBase64, requestId })
        analysis = await callGeminiAPI([systemInstruction, ...promptParts], requestId, currentModel)
        if (analysis) break
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        lastError = msg
        log('WARN', 'Gemini attempt failed', { model: currentModel, error: msg, requestId })

        if (msg === 'rate_limited' || msg === 'api_key_invalid') {
          break
        }
        if (msg.startsWith('model_not_found')) {
          log('INFO', 'Trying next model', { failedModel: currentModel, requestId })
          continue
        }
        break
      }
    }

    if (!analysis) {
      if (lastError === 'rate_limited') {
        return buildErrorResponse(429, 'AI service is currently busy. Please wait and try again.')
      }
      if (lastError === 'api_key_invalid') {
        return buildErrorResponse(500, 'AI service configuration error')
      }
      if (lastError?.startsWith('model_not_found') || lastError === 'invalid_response_format') {
        return buildErrorResponse(500, 'AI service returned an unexpected response. Please try again.')
      }
      return buildErrorResponse(500, lastError ? `AI service error: ${lastError}` : 'AI service is unavailable')
    }

    try {
      await supabase.from('analysis_events').insert({
        user_id: user.id,
        model_name: modelsToTry.find(m => m) || 'unknown',
        input_type: imageBase64 ? 'image' : 'text',
        status: (analysis.analysis_confidence as number) > 0.4 ? 'success' : 'low_confidence',
        created_at: new Date().toISOString(),
      })
    } catch (dbError) {
      log('WARN', 'Failed to log analysis event', { error: String(dbError), requestId })
    }

    const duration = performance.now() - startTime
    log('INFO', 'Request completed', { requestId, durationMs: Math.round(duration), model: modelsToTry.find(m => m) })

    return buildSuccessResponse(analysis)
  } catch (error) {
    const duration = performance.now() - startTime
    const errMsg = error instanceof Error ? error.message : String(error)
    log('ERROR', 'Unhandled error', { error: errMsg, requestId, durationMs: Math.round(duration) })
    return buildErrorResponse(500, 'An internal error occurred during analysis')
  }
})
