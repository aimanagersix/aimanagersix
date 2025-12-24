import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Fix: Add Deno declaration for Edge Functions to resolve "Cannot find name 'Deno'" error
declare const Deno: any;

// Headers para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-customer-info',
}

serve(async (req) => {
  // 1. Lidar com Preflight do Browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Carregar Credenciais do Ambiente
    // Usamos o prefixo SB_ padronizado na App ou o padrão do Supabase
    const url = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !key) {
      throw new Error('Configuração de servidor incompleta (URL/KEY Secrets ausentes).');
    }

    // 3. Inicializar Supabase com privilégios de Administrador
    const supabaseAdmin = createClient(url, key)
    
    // 4. Captura robusta do JSON (Fix para erro de Stream)
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === "") {
        throw new Error("O servidor recebeu um corpo de pedido vazio.");
    }

    let body;
    try {
        body = JSON.parse(bodyText);
    } catch (e) {
        console.error("[AuthHelper] Erro ao processar JSON bruto:", bodyText);
        throw new Error("O conteúdo enviado não é um JSON válido.");
    }
    
    // Normalização de inputs
    const action = String(body.action || '').trim().toLowerCase();
    const targetUserId = String(body.targetUserId || '').trim();
    const newPassword = body.newPassword || body.password;
    const email = body.email;

    console.log(`[AuthHelper v6.13] Action: ${action} | User: ${targetUserId || email}`);

    // AÇÃO A: ATUALIZAR PASSWORD
    if (action === 'update_password') {
      if (!targetUserId || !newPassword) {
          throw new Error('Parâmetros targetUserId ou newPassword ausentes no pedido.');
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { password: newPassword }
      )
      
      if (error) {
          // Diferenciar erro de "Não Encontrado" para o Frontend
          if (error.message.includes('not found')) {
              return new Response(JSON.stringify({ error: `Utilizador ${targetUserId} não existe no sistema de login.` }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 404 
              });
          }
          throw error;
      }

      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }

    // AÇÃO B: CRIAR UTILIZADOR (PROVISIONAMENTO)
    if (action === 'create_user') {
      if (!email || !newPassword) {
          throw new Error('Email e Password são obrigatórios para criar nova conta.');
      }
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: newPassword,
          email_confirm: true
      })
      
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, user: data.user }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }
    
    throw new Error(`Ação "${action}" não é suportada por esta versão do serviço.`);

  } catch (error) {
    console.error("[AuthHelper] ERRO CRÍTICO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})