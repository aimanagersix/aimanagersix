
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno to avoid TypeScript errors in environments where Deno types aren't loaded
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Lidar com pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      // Fix: Deno is now declared globally
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Obter credenciais das global_settings
    const { data: settings } = await supabase
      .from('global_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['sophos_client_id', 'sophos_client_secret'])

    const clientId = settings?.find(s => s.setting_key === 'sophos_client_id')?.setting_value
    const clientSecret = settings?.find(s => s.setting_key === 'sophos_client_secret')?.setting_value

    if (!clientId || !clientSecret) {
      throw new Error("Credenciais Sophos (ID/Secret) não encontradas nas definições.")
    }

    console.log("Iniciando Auth Sophos OAuth2...")

    // 3. Autenticação na API da Sophos
    // Nota: Em ambiente real, o endpoint seria: https://id.sophos.com/api/v2/oauth2/token
    // Aqui implementamos a estrutura para o cliente completar com o seu tenant.
    
    /* 
    const authRes = await fetch("https://id.sophos.com/api/v2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=token`
    });
    const { access_token } = await authRes.json();
    */

    // SIMULAÇÃO DE LOGICA PARA DEMONSTRAÇÃO (Pois não temos acesso ao endpoint externo aqui)
    // No código final do cliente, este bloco busca os alertas reais.
    
    const mockAlert = {
      id: `sophos-${Date.now()}`,
      title: "Ameaça de Malware Detetada",
      description: "O Sophos Endpoint bloqueou um ficheiro suspeito em PC-TECNICO-01",
      severity: "high",
      hostname: "PC-TECNICO-01"
    };

    // 4. Verificar se o alerta já foi processado (evitar duplicados)
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .ilike('description', `%${mockAlert.id}%`)
      .maybeSingle()

    if (!existingTicket) {
      // 5. Tentar encontrar o equipamento no inventário para vincular
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id')
        .ilike('nomeNaRede', mockAlert.hostname)
        .maybeSingle()

      // 6. Criar Ticket de Segurança
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: `[SOPHOS] ${mockAlert.title}`,
          description: `${mockAlert.description}\n\nID Alerta: ${mockAlert.id}\nOrigem: Sophos Central API`,
          status: 'Pedido',
          category: 'Incidente de Segurança',
          securityIncidentType: 'Malware',
          impactCriticality: 'Crítica',
          requestDate: new Date().toISOString(),
          equipmentId: equipment?.id || null,
          collaboratorId: null // Atribuído pelo técnico na triagem
        })

      if (ticketError) throw ticketError
    }

    return new Response(
      JSON.stringify({ success: true, message: "Sincronização concluída. Novos alertas transformados em tickets." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Erro na Edge Function:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
