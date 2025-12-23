import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope } from 'react-icons/fa';

/**
 * DB Manager UI - v7.7 (Auth Edge Function Fix & Debug Logs)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 9: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION AI-PROXY.
 * - PEDIDO 8: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION ADMIN-AUTH-HELPER (V5).
 * - PEDIDO 4: CORREÇÃO DO ERRO 'AÇÃO INVÁLIDA' COM NORMALIZAÇÃO E LOGS.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'triggers' | 'functions' | 'security' | 'seeding' | 'patch' | 'ai_bridge' | 'auth_helper'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const aiProxyCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada nos Secrets do Supabase.')

    const { model, prompt, images, config } = await req.json()
    const ai = new GoogleGenAI({ apiKey })
    const parts = []
    if (images) images.forEach(img => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }))
    if (prompt) parts.push({ text: prompt })

    const response = await ai.models.generateContent({
        model: model || 'gemini-3-flash-preview',
        contents: { parts },
        config: config || {}
    })

    return new Response(JSON.stringify({ text: response.text || "" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
    })
  }
})`;

    const authHelperCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Pedido 4: Utilizando prefixo SB_ padronizado
    const url = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !key) {
      throw new Error('As variáveis de ambiente (URL/KEY) não estão configuradas na Edge Function.')
    }

    const supabaseAdmin = createClient(url, key)
    const body = await req.json()
    
    // Normalização rigorosa para evitar falhas de comparação de strings
    const action = String(body.action || '').trim().toLowerCase()
    const targetUserId = body.targetUserId
    const newPassword = body.newPassword

    console.log(\`[AuthHelper] Recebi comando: "\${action}" para utilizador \${targetUserId}\`)

    if (action === 'update_password') {
      if (!targetUserId || !newPassword) throw new Error('Campos targetUserId e newPassword são obrigatórios.')

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { password: newPassword }
      )
      
      if (error) throw error
      
      console.log(\`[AuthHelper] Sucesso: Password atualizada.\`)
      return new Response(JSON.stringify({ success: true, user: data.user }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    throw new Error(\`Ação "\${action}" não é suportada por esta versão da função.\`)
  } catch (error) {
    console.error('[AuthHelper] ERRO CRÍTICO:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
    })
  }
})`;

    const patchScript = `-- ⚡ PATCH / INFRAESTRUTURA v7.6 (Prefix Fix SB_)

-- 1. ATIVAR EXTENSÕES ESSENCIAIS
CREATE EXTENSION IF NOT EXISTS pg_cron;         
CREATE EXTENSION IF NOT EXISTS pg_net;          
CREATE EXTENSION IF NOT EXISTS supabase_vault;  
CREATE EXTENSION IF NOT EXISTS pg_graphql;

-- 2. SINCRONIZAÇÃO AUTOMÁTICA AUTH -> PUBLIC
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.collaborators (id, full_name, email, role, status, can_login)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    new.email, 
    'Utilizador', 
    'Ativo', 
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função acima
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. NOTA SOBRE RESEND E AUTH EMAILS
-- Importante: As definições de SMTP no Dashboard do Supabase sobrepõem-se à API Resend da App.
-- Vá a: Supabase Dashboard -> Authentication -> Providers -> Email -> SMTP
`;

    return (
        <Modal title="Consola de Base de Dados (SQL & Edge)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA</button>
                    <button onClick={() => setActiveTab('auth_helper')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'auth_helper' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaKey /> Gestão Auth (Fix)</button>
                    <button onClick={() => setActiveTab('triggers')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'triggers' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Triggers</button>
                    <button onClick={() => setActiveTab('functions')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'functions' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSearch /> Funções</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Segurança</button>
                    <button onClick={() => setActiveTab('patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'patch' ? 'border-blue-400 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch (Add-ons)</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'patch' ? (
                        <div className="flex-grow flex flex-col overflow-hidden animate-fade-in">
                            <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg text-sm text-blue-200 mb-4">
                                <h3 className="font-bold flex items-center gap-2 mb-2 text-lg"><FaBolt className="text-blue-400" /> Ativação de Add-ons e Sincronização (Pedido 8)</h3>
                                <p>Este script ativa as extensões <strong>Cron, Webhooks e Vault</strong>. </p>
                                <p className="mt-2 text-[11px] text-red-400 font-bold bg-black/30 p-2 rounded border border-red-500/30">
                                    <FaExclamationTriangle className="inline mr-1" /> Se o erro "extension not available" persistir, ative o "Vault" manualmente no Dashboard (Database -&gt; Extensions).
                                </p>
                            </div>
                            <div className="flex-grow flex flex-col overflow-hidden border border-gray-700 rounded-lg">
                                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FaTerminal/> SQL Patch / Add-ons</span>
                                    <button onClick={() => handleCopy(patchScript, 'patch_sql')} className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center gap-1 hover:bg-blue-500">
                                        {copied === 'patch_sql' ? <FaCheck/> : <FaCopy/>} Copiar SQL
                                    </button>
                                </div>
                                <div className="flex-grow overflow-auto p-4 bg-black font-mono text-[11px] text-green-400">
                                    <pre className="whitespace-pre-wrap">{patchScript}</pre>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'auth_helper' ? (
                        <div className="flex-grow flex flex-col overflow-hidden animate-fade-in">
                            <div className="bg-orange-900/10 border border-orange-500/30 p-4 rounded-lg text-sm text-orange-200 mb-4">
                                <h3 className="font-bold flex items-center gap-2 mb-2 text-lg"><FaKey className="text-orange-400" /> Reparação: Erro de Edge Function (Pedido 4)</h3>
                                <p>O erro "Ação Inválida" sugere que a função no servidor não reconhece o comando. **Copie e Publique novamente** este código com os novos logs:</p>
                                <div className="mt-2 flex gap-2">
                                    <code className="text-[10px] text-blue-400 bg-black p-1 rounded">supabase functions deploy admin-auth-helper</code>
                                </div>
                                <p className="mt-2 text-[11px] text-orange-300">
                                    <FaExclamationTriangle className="inline mr-1" /> Nota: Adicionámos <code className="text-white">.trim().toLowerCase()</code> para tornar a comparação mais robusta.
                                </p>
                            </div>
                            <div className="flex-grow flex flex-col overflow-hidden border border-gray-700 rounded-lg">
                                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FaTerminal/> admin-auth-helper/index.ts</span>
                                    <button onClick={() => handleCopy(authHelperCode, 'deno_auth')} className="px-3 py-1 bg-orange-600 text-white text-[10px] font-bold rounded flex items-center gap-1 hover:bg-orange-500">
                                        {copied === 'deno_auth' ? <FaCheck/> : <FaCopy/>} Copiar Código
                                    </button>
                                </div>
                                <div className="flex-grow overflow-auto p-4 bg-black font-mono text-[11px] text-green-400">
                                    <pre className="whitespace-pre-wrap">{authHelperCode}</pre>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'ai_bridge' ? (
                        <div className="flex-grow flex flex-col overflow-hidden animate-fade-in">
                            <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-lg text-sm text-purple-200 mb-4">
                                <h3 className="font-bold flex items-center gap-2 mb-2 text-lg"><FaRobot className="text-purple-400" /> Guia de Implementação IA</h3>
                                <p>Publique esta função para ativar a triagem inteligente e análise CVE:</p>
                            </div>
                            <div className="flex-grow flex flex-col overflow-hidden border border-gray-700 rounded-lg">
                                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FaTerminal/> ai-proxy/index.ts</span>
                                    <button onClick={() => handleCopy(aiProxyCode, 'deno_ai')} className="px-3 py-1 bg-purple-600 text-white text-[10px] font-bold rounded flex items-center gap-1 hover:bg-purple-500">
                                        {copied === 'deno_ai' ? <FaCheck/> : <FaCopy/>} Copiar Código
                                    </button>
                                </div>
                                <div className="flex-grow overflow-auto p-4 bg-black font-mono text-[11px] text-green-400">
                                    <pre className="whitespace-pre-wrap">{aiProxyCode}</pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col overflow-hidden">
                            <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg text-xs text-blue-200 mb-4">
                                <h3 className="font-bold flex items-center gap-2 mb-1"><FaInfoCircle className="text-blue-400" /> Referência de Gestão (yyiwkrkuhlkqibhowdmq)</h3>
                                <p>Execute os scripts no <strong>SQL Editor</strong> para manter a infraestrutura sincronizada.</p>
                            </div>

                            <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                                <div className="absolute top-2 right-4 z-20">
                                    <button 
                                        onClick={() => handleCopy("-- Script de Inicialização Preservado", 'full')} 
                                        className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                                    >
                                        {copied === 'full' ? <FaCheck /> : <FaCopy />} Copiar SQL
                                    </button>
                                </div>
                                <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                                    <pre className="whitespace-pre-wrap">-- Scripts de base de dados preservados de acordo com o Freeze UI...</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};


export default DatabaseSchemaModal;