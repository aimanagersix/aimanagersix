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
      throw new Error('Chaves de ambiente (URL/SERVICE_KEY) ausentes no servidor Deno.');
    }

    const supabaseAdmin = createClient(url, key)
    const rawBody = await req.text();
    let body = {};
    try { body = JSON.parse(rawBody); } catch (e) { throw new Error("Body JSON inválido."); }
    
    const action = String(body.action || '').trim().toLowerCase();
    const targetUserId = String(body.targetUserId || '').trim();
    const newPassword = body.newPassword || body.password; // Suporte para ambos os nomes
    const email = body.email;

    console.log(`[AuthHelper v6.10] Action: ${action} | Target: ${targetUserId || email}`);

    // AÇÃO 1: Atualizar Password
    if (action === 'update_password') {
      if (!targetUserId || !newPassword) throw new Error('Parâmetros em falta no payload.');
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // AÇÃO 2: Criar Utilizador (Provisionamento Manual)
    if (action === 'create_user') {
      if (!email || !newPassword) throw new Error('Email e Password são obrigatórios para provisionamento.');
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: newPassword, // FIX: Corrigido de "password: password" (que estava indefinido) para newPassword
          email_confirm: true
      })
      
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, user: data.user }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }
    
    throw new Error(`Ação "${action}" não suportada.`)
  } catch (error) {
    console.error("[AuthHelper] Erro capturado:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})