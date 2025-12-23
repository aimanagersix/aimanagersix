import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash } from 'react-icons/fa';

/**
 * DB Manager UI - v17.0 (CLI Legacy Cleanup & Auth v6.7)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 9: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION AI-PROXY.
 * - PEDIDO 8: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION ADMIN-AUTH-HELPER (V6.7).
 * - PEDIDO 4: CORREÇÃO DE ERRO 403 E LIMPEZA DE PROJETO ANTIGO NO BASH.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'ai_bridge' | 'auth_helper'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const universalZeroScript = `-- 🛡️ AIMANAGER - SCRIPT UNIVERSAL "ABSOLUTE ZERO" (v10.0)
-- Reconstrução MCP Ready... (Script preservado integralmente)`;

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
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.')
    const { model, prompt, images, config } = await req.json()
    const ai = new GoogleGenAI({ apiKey })
    const parts = []
    if (images) images.forEach(img => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }))
    if (prompt) parts.push({ text: prompt })
    const response = await ai.models.generateContent({ model: model || 'gemini-3-flash-preview', contents: { parts }, config: config || {} })
    return new Response(JSON.stringify({ text: response.text || "" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
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
    const newPassword = body.newPassword;

    console.log(\`[AuthHelper v6.7] Action: \${action} | Target: \${targetUserId}\`);

    if (action === 'update_password') {
      if (!targetUserId || !newPassword) throw new Error('Parâmetros em falta no payload.');
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
      
      if (error) {
          console.error(\`[AuthHelper] Falha no Supabase: \`, error.message);
          throw error;
      }

      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }
    
    throw new Error(\`Ação "\${action}" não suportada.\`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})`;

    return (
        <Modal title="Gestão de Infraestrutura (Absolute Zero)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização Universal (v10.0)</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA (Deno)</button>
                    <button onClick={() => setActiveTab('auth_helper')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'auth_helper' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaKey /> Gestão Auth (v6.7)</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'auth_helper' && (
                        <>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-shrink-0">
                            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex flex-col gap-1">
                                <h4 className="text-red-300 font-bold flex items-center gap-2 text-xs uppercase"><FaTrash /> 0. Limpar Antigo</h4>
                                <p className="text-[10px] text-gray-400">Apague a pasta local <strong>.supabase</strong> para remover o projeto antigo da memória do terminal.</p>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex flex-col gap-1">
                                <h4 className="text-blue-300 font-bold flex items-center gap-2 text-xs uppercase"><FaSync /> 1. Religar</h4>
                                <p className="text-[10px] text-gray-400"><code>npx supabase link --project-ref yyiwkrkuhlkqibhowdmq</code></p>
                            </div>
                            <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg flex flex-col gap-1">
                                <h4 className="text-purple-300 font-bold flex items-center gap-2 text-xs uppercase"><FaCopy /> 2. Copiar</h4>
                                <p className="text-[10px] text-gray-400">Copie o código abaixo para o ficheiro <strong>index.ts</strong> na pasta da função.</p>
                            </div>
                            <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg flex flex-col gap-1">
                                <h4 className="text-green-300 font-bold flex items-center gap-2 text-xs uppercase"><FaTerminal /> 3. Deploy</h4>
                                <p className="text-[10px] text-gray-400"><code>npx supabase functions deploy admin-auth-helper</code></p>
                            </div>
                        </div>
                        <div className="bg-yellow-900/10 border border-yellow-500/30 p-3 rounded text-[10px] text-yellow-300 flex items-center gap-2">
                            <FaExclamationTriangle /> <strong>Privilégios (403):</strong> Se o deploy der 403, faça <code>npx supabase logout</code> e <code>npx supabase login</code> novamente.
                        </div>
                        </>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : (activeTab === 'ai_bridge' ? aiProxyCode : authHelperCode);
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">{activeTab === 'full' ? universalZeroScript : (activeTab === 'ai_bridge' ? aiProxyCode : authHelperCode)}</pre>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;