import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.11.0"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType, textDescription, mealType } = await req.json()

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Prepare Gemini Prompt
    const systemInstruction = `
      You are a senior nutrition expert AI. Your task is to analyze a meal from an image or a text description.
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
        "assumptions": ["list of assumptions made, e.g., 'assumed 15ml of olive oil used'"],
        "clarifying_question": "string or null"
      }
    `

    let promptParts = [systemInstruction]
    if (textDescription) {
      promptParts.push(`Meal Description: ${textDescription}`)
    }
    if (mealType) {
      promptParts.push(`Meal Type: ${mealType}`)
    }

    let result;
    if (imageBase64 && mimeType) {
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
      result = await model.generateContent([...promptParts, imagePart])
    } else {
      result = await model.generateContent(promptParts)
    }

    const response = await result.response
    const text = response.text()
    const analysis = JSON.parse(text)

    // 3. Log Analysis Event
    await supabase.from('analysis_events').insert({
      user_id: user.id,
      model_name: 'gemini-2.0-flash',
      input_type: imageBase64 ? 'image' : 'text',
      status: analysis.analysis_confidence > 0.4 ? 'success' : 'low_confidence',
      created_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true, data: analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in analyze-meal function:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
