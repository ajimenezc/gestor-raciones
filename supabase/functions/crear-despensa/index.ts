import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ajimenezc.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { captchaToken, raciones, historico } = await req.json()

    // 1. Verificar que el token existe
    if (!captchaToken) {
      return new Response(
        JSON.stringify({ error: 'Token de CAPTCHA requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar CAPTCHA con Cloudflare Turnstile
    const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY')

    const formData = new FormData()
    formData.append('secret', TURNSTILE_SECRET!)
    formData.append('response', captchaToken)

    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    )

    const turnstileResult = await turnstileResponse.json()

    // Si el CAPTCHA falla → rechazar
    if (!turnstileResult.success) {
      console.error('Turnstile verification failed:', turnstileResult)
      return new Response(
        JSON.stringify({ error: 'Verificación CAPTCHA fallida. Por favor, intenta de nuevo.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. CAPTCHA válido → crear despensa en Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generar código único
    const codigo = generarCodigoFamiliar()

    const { data, error } = await supabaseClient
      .from('despensas')
      .insert({
        codigo: codigo,
        raciones: raciones || [],
        historico: historico || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Error al crear la despensa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ codigo, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generarCodigoFamiliar(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = 'DESPENSA-'
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return codigo
}
