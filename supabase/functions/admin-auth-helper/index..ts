import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log("[AuthHelper v6.6] Inicializando no Projeto:", url);

    if (!url || !key) {
      throw new Error('Chaves de ambiente ausentes no servidor Deno.');
    }

    const supabaseAdmin = createClient(url, key)
    const text = await req.text();
    let body = {};
    try { body = JSON.parse(text); } catch (e) { throw new Error("Body JSON inválido."); }
    
    const action = String(body.action || '').trim().toLowerCase();
    const targetUserId = String(body.targetUserId || '').trim();
    const newPassword = body.newPassword;

    if (action === 'update_password') {
      if (!targetUserId || !newPassword) throw new Error('Parâmetros targetUserId ou newPassword ausentes.');
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
      
      if (error) {
          console.error(`[AuthHelper] Erro no Projeto ${url}:`, error.message);
          throw error;
      }

      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }
    
    throw new Error(`Ação "${action}" não suportada.`)
  } catch (error) {
    console.error("[AuthHelper] CATCH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})