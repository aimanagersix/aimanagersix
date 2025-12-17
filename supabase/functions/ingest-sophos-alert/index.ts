import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno environment
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Receber o Alerta do Sophos
    const payload = await req.json()
    console.log("Sophos Alert Received:", payload)

    // 2. Extrair dados básicos
    const hostname = payload.full_name || payload.hostname || payload.endpoint_id || "Desconhecido";
    const alertType = payload.alert_type || "Ameaça Detetada";
    const description = payload.description || "Sem detalhes adicionais fornecidos pelo Sophos.";
    const severity = payload.severity === 'high' || payload.severity === 'critical' ? 'Crítica' : 'Alta';

    // 3. Tentar encontrar o ID do equipamento no inventário
    const { data: equip } = await supabase
      .from('equipment')
      .select('id, description')
      .or(`nomeNaRede.ilike.${hostname},serialNumber.ilike.${hostname},description.ilike.${hostname}`)
      .single()

    // 4. Criar o Ticket de Segurança
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: `[SOPHOS] ${alertType} em ${hostname}`,
        description: `INCIDENTE AUTOMÁTICO\n\nDetalhes do Sophos: ${description}\n\nAtivo Detetado: ${hostname}`,
        status: 'Pedido',
        category: 'Incidente de Segurança',
        securityIncidentType: 'Malware',
        impactCriticality: severity,
        requestDate: new Date().toISOString(),
        equipmentId: equip?.id
      })
      .select()
      .single()

    if (ticketError) throw ticketError

    // 5. Opcional: Notificar Slack (se configurado na BD)
    // Pode adicionar aqui um fetch para o Slack Webhook

    return new Response(
      JSON.stringify({ success: true, ticketId: ticket.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})