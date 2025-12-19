
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log("Sophos Advanced Alert Received:", payload)

    // Parser Avançado de Texto do Sophos
    const raw = payload.description || payload.text || "";
    const extract = (regex: RegExp) => {
        const match = raw.match(regex);
        return match ? match[1].trim() : null;
    };

    const hostname = extract(/Where it happened:\s*([^\n\r]+)/i) || payload.full_name || payload.hostname || "Desconhecido";
    const path = extract(/Path:\s*([^\n\r]+)/i) || "N/A";
    const detection = extract(/What was detected:\s*([^\n\r]+)/i) || payload.alert_type || "Ameaça Detetada";
    const user = extract(/User associated with device:\s*([^\n\r]+)/i) || "N/A";
    const severityRaw = extract(/How severe it is:\s*([^\n\r]+)/i) || payload.severity || "Medium";
    
    const severity = (severityRaw.toLowerCase().includes('high') || severityRaw.toLowerCase().includes('critical')) ? 'Crítica' : 'Alta';

    const { data: equip } = await supabase
      .from('equipment')
      .select('id, description')
      .or(`nomeNaRede.ilike.${hostname},serialNumber.ilike.${hostname}`)
      .maybeSingle()

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: `[SOPHOS] ${detection} em ${hostname}`,
        description: `--- INCIDENTE DETETADO PELO SOPHOS ---
MÁQUINA: ${hostname}
UTILIZADOR: ${user}
DETEÇÃO: ${detection}
CAMINHO: ${path}
SEVERIDADE ORIGINAL: ${severityRaw}

AÇÃO SOPHOS: ${extract(/What Sophos has done so far:\s*([^\n\r]+)/i) || 'Tentativa de limpeza.'}
RECOMENDAÇÃO: ${extract(/What you need to do:\s*([^\n\r]+)/i) || 'Verificar manualmente.'}`,
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
