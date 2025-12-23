import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"

// Fix: Add Deno declaration for Edge Functions to resolve "Cannot find name 'Deno'" error
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the API Key from Secrets (Set via: supabase secrets set GEMINI_API_KEY=...)
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in Supabase secrets.')
    }

    // 2. Parse the request from the React App
    const { model, prompt, images, config } = await req.json()

    // 3. Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey })

    // 4. Construct content parts
    const parts = []

    // Add Images if present
    if (images && Array.isArray(images)) {
        images.forEach((img: any) => {
            parts.push({
                inlineData: {
                    data: img.data,
                    mimeType: img.mimeType,
                },
            })
        })
    }

    // Add Text Prompt
    if (prompt) {
        parts.push({ text: prompt })
    }

    // 5. Call Google Gemini API
    // Fix: Updated fallback model to 'gemini-3-flash-preview' per guidelines for basic text/vision tasks
    const response = await ai.models.generateContent({
        model: model || 'gemini-3-flash-preview',
        contents: { parts },
        config: config || {}
    })

    // 6. Return the text result to the client
    const responseText = response.text ? response.text.trim() : ""

    return new Response(
      JSON.stringify({ text: responseText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error("AI Proxy Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
