// supabase/functions/realtime-token/index.ts
// Edge Function que cria uma sessão Realtime na OpenAI e retorna o token efêmero

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY não configurada");
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY não configurada" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  let body: any = {};
  try { 
    body = await req.json(); 
  } catch (_ignored) { 
    // ok sem body 
  }

  const payload = {
    model: "gpt-4o-realtime-preview-2024-12-17",
    turn_detection: {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
  };

  console.log("Criando sessão Realtime na OpenAI...");

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    const status = response.status;

    if (!response.ok) {
      console.error("Erro ao criar sessão:", text);
    } else {
      console.log("Sessão criada com sucesso");
    }

    return new Response(text, {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
