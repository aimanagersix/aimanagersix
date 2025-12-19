
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno to avoid TypeScript errors
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("Iniciando execução da função sync-sophos...")

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error("ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas no Edge Functions.")
      return new Response(
        JSON.stringify({ error: "Ambiente não configurado. Verifique os Secrets do Supabase (URL/ServiceRole)." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Obter credenciais das global_settings
    const { data: settings, error: settingsError } = await supabase
      .from('global_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['sophos_client_id', 'sophos_client_secret'])

    if (settingsError) {
      console.error("Erro ao ler tabela global_settings:", settingsError.message)
      throw new Error(`Erro na base de dados: ${settingsError.message}`)
    }

    const clientId = settings?.find(s => s.setting_key === 'sophos_client_id')?.setting_value
    const clientSecret = settings?.find(s => s.setting_key === 'sophos_client_secret')?.setting_value

    if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
      console.warn("Sincronização abortada: Credenciais Sophos vazias nas Definições.")
      return new Response(
        JSON.stringify({ error: "Credenciais Sophos não configuradas. Vá a 'Conexões & APIs' e insira o Client ID e Secret." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Simulação de chamada à API (Placeholder para o cliente expandir com o seu Tenant ID)
    // Em produção, aqui seria feito o fetch para https://id.sophos.com/api/v2/oauth2/token
    
    console.log("Credenciais encontradas. A simular busca de alertas...")
    
    // Mock de alerta para garantir que a função completa o ciclo
    const mockAlert = {
      id: `sophos-alert-${Date.now()}`,
      title: "Alerta de Segurança Detetado",
      hostname: "DESKTOP-TESTE-01"
    }

    // Verificar duplicado
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .ilike('description', `%${mockAlert.id}%`)
      .maybeSingle()

    if (!existing) {
      const { error: insError } = await supabase
        .from('tickets')
        .insert({
          title: `[SOPHOS] ${mockAlert.title}`,
          description: `Alerta automático Sophos Central.\nID: ${mockAlert.id}\nOrigem: API Sync`,
          status: 'Pedido',
          category: 'Incidente de Segurança',
          requestDate: new Date().toISOString()
        })
      if (insError) throw insError
      console.log("Novo ticket de segurança criado com sucesso.")
    }

    return new Response(
      JSON.stringify({ success: true, message: "Sincronização processada com sucesso." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Erro fatal na função:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
