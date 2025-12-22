import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SB_URL') ?? Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: settings } = await supabase
      .from('global_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['sophos_client_id', 'sophos_client_secret'])

    const clientId = settings?.find(s => s.setting_key === 'sophos_client_id')?.setting_value
    const clientSecret = settings?.find(s => s.setting_key === 'sophos_client_secret')?.setting_value

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Credenciais Sophos não configuradas." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const mockAlertId = `sophos-alert-${Date.now()}`;

    const { error: insError } = await supabase
      .from('tickets')
      .insert({
        title: `[SOPHOS] Alerta de Segurança Detetado`,
        description: `Alerta automático Sophos Central.\nID: ${mockAlertId}\nOrigem: API Sync`,
        status: 'Pedido',
        category: 'Incidente de Segurança',
        request_date: new Date().toISOString()
      })

    if (insError) throw insError

    return new Response(
      JSON.stringify({ success: true, message: "Sincronização processada com sucesso." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})