import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declaração do Deno para evitar erros de linting no ambiente Supabase
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-customer-info',
}

serve(async (req) => {
  // Lidar com o pedido OPTIONS (Preflight) do browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !key) {
      throw new Error('Chaves de ambiente SB_URL ou SB_SERVICE_ROLE_KEY ausentes nos Secrets do Supabase.');
    }

    const supabaseAdmin = createClient(url, key)
    
    // Processamento robusto do corpo JSON para evitar erro de Stream ou carateres invisíveis
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === '') {
        throw new Error("O corpo do pedido está vazio.");
    }
    
    let body;
    try {
        body = JSON.parse(bodyText);
    } catch (e) {
        console.error("[AuthHelper] Erro ao processar JSON bruto:", bodyText);
        throw new Error("O conteúdo enviado não é um JSON válido: " + e.message);
    }
    
    const action = String(body.action || '').trim().toLowerCase();
    const targetUserId = String(body.targetUserId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.newPassword || body.password;

    console.log(`[AuthHelper v6.16] Ação: ${action} | Alvo: ${targetUserId || email}`);

    // AÇÃO: ATUALIZAR PASSWORD
    if (action === 'update_password') {
      if (!targetUserId || !password) throw new Error('Parâmetros targetUserId ou password em falta.');
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password })
      if (error) {
          console.error(`[AuthHelper] Erro no Reset: ${error.message}`);
          throw error;
      }
      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }

    // AÇÃO: CRIAR OU OBTER UTILIZADOR (PROVISIONAMENTO ESTRITO)
    // Usada pelo orgService.addCollaborator para garantir consistência de IDs
    if (action === 'create_user') {
      if (!email || !password) throw new Error('Email e Password são obrigatórios para provisionamento.');
      
      console.log(`[AuthHelper] Provisionando conta para: ${email}`);
      
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true
      })
      
      if (createError) {
          // Se já existe, recuperamos o ID para devolver ao frontend e manter a sincronia
          if (createError.message.includes('already registered') || createError.status === 422) {
              console.log(`[AuthHelper] Utilizador ${email} já existe. Recuperando ID...`);
              const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
              if (listError) throw listError;
              
              const existingUser = listData.users.find(u => u.email?.toLowerCase() === email);
              if (!existingUser) throw new Error("Erro ao recuperar utilizador existente após conflito.");
              
              return new Response(JSON.stringify({ success: true, user: existingUser, was_existing: true }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 200 
              });
          }
          console.error(`[AuthHelper] Falha ao criar no Auth: ${createError.message}`);
          throw createError;
      }

      console.log(`[AuthHelper] Sucesso! Conta criada ID: ${createData.user.id}`);
      return new Response(JSON.stringify({ success: true, user: createData.user, was_existing: false }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }
    
    throw new Error(`Ação "${action}" não suportada por esta versão da Edge Function.`)
  } catch (error: any) {
    console.error("[AuthHelper] ERRO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})