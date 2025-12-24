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

    if (!url || !key) {
      throw new Error('Chaves de ambiente (SB_URL ou SB_SERVICE_ROLE_KEY) ausentes nos Secrets do Supabase.');
    }

    const supabaseAdmin = createClient(url, key)
    const rawBody = await req.text();
    let body = {};
    try { body = JSON.parse(rawBody); } catch (e) { throw new Error("Body JSON inválido."); }
    
    const action = String(body.action || '').trim().toLowerCase();
    const targetUserId = String(body.targetUserId || '').trim();
    const newPassword = body.newPassword || body.password;
    const email = body.email;

    console.log(`[AuthHelper v6.11] Ação: ${action} | Alvo: ${targetUserId || email}`);

    if (action === 'update_password') {
      if (!targetUserId || !newPassword) throw new Error('targetUserId ou newPassword em falta.');
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
      if (error) {
          console.error(`[AuthHelper] Erro no Reset: ${error.message}`);
          throw error;
      }
      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (action === 'create_user') {
      if (!email || !newPassword) throw new Error('Email e Password obrigatórios.');
      
      console.log(`[AuthHelper] Tentando criar conta para: ${email}`);
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: newPassword,
          email_confirm: true
      })
      
      if (error) {
          console.error(`[AuthHelper] Falha ao criar no Auth: ${error.message}`);
          throw error;
      }

      console.log(`[AuthHelper] Sucesso! Conta criada ID: ${data.user.id}`);
      return new Response(JSON.stringify({ success: true, user: data.user }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }
    
    throw new Error(`Ação "${action}" não suportada.`)
  } catch (error) {
    console.error("[AuthHelper] ERRO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})