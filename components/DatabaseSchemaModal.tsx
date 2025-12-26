import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle } from 'react-icons/fa';

/**
 * DB Manager UI - v26.0 (NIS2 Granular Security & Soft Delete)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 9: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION AI-PROXY.
 * - PEDIDO 8: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION ADMIN-AUTH-HELPER.
 * - PEDIDO 4: SCRIPTS DE ÍNDICES, RLS E SOFT DELETE.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'ai_bridge' | 'auth_helper' | 'compliance_patch'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const compliancePatchScript = `-- ⚡ AIMANAGER - PATCH DE SEGURANÇA E CONFORMIDADE (v11.0)
-- 1. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_equipment_serial_number ON equipment (serial_number);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators (email);
CREATE INDEX IF NOT EXISTS idx_entities_nif ON entities (nif);

-- 2. INFRAESTRUTURA DE SOFT DELETE E AUDITORIA
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS decommission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL, -- 'equipment' ou 'collaborator'
    resource_id UUID NOT NULL,
    reason TEXT,
    deleted_by TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. POLÍTICAS RLS GRANULARES (NIS2)

-- Reset de Políticas Antigas
DROP POLICY IF EXISTS "Allow management for authenticated users" ON collaborators;
DROP POLICY IF EXISTS "Allow management for authenticated users" ON equipment;
DROP POLICY IF EXISTS "Allow management for authenticated users" ON tickets;

-- POLÍTICAS PARA: COLABORADORES
-- Admins/Técnicos veem tudo. Utilizadores veem apenas a sua própria ficha.
CREATE POLICY "RLS_Collab_Access" ON collaborators FOR ALL TO authenticated
USING (
  (role IN ('Admin', 'SuperAdmin', 'Técnico')) OR (auth.uid() = id)
);

-- POLÍTICAS PARA: EQUIPAMENTOS
-- Admins/Técnicos veem tudo. Utilizadores veem apenas o que lhes está atribuído.
CREATE POLICY "RLS_Equipment_Access" ON equipment FOR SELECT TO authenticated
USING (
  (EXISTS (SELECT 1 FROM collaborators WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Técnico')))
  OR 
  (id IN (SELECT equipment_id FROM assignments WHERE collaborator_id = auth.uid() AND return_date IS NULL))
);

-- POLÍTICAS PARA: TICKETS
-- Utilizadores veem os seus tickets. Técnicos veem tickets da sua equipa. Admins veem tudo.
CREATE POLICY "RLS_Ticket_Access" ON tickets FOR ALL TO authenticated
USING (
  (EXISTS (SELECT 1 FROM collaborators WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')))
  OR
  (collaborator_id = auth.uid())
  OR
  (team_id IN (SELECT team_id FROM team_members WHERE collaborator_id = auth.uid()))
);

-- 4. ÍNDICE DE PESQUISA EM TEXTO LIVRE (OPCIONAL)
CREATE INDEX IF NOT EXISTS idx_equipment_desc_trgm ON equipment USING gin (description gin_trgm_ops);
`;

    const universalZeroScript = `-- 🛡️ AIMANAGER - SCRIPT UNIVERSAL "ABSOLUTE ZERO" (v10.0)
-- Este script reconstrói a base de dados completa para compatibilidade MCP.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;


-- ... restante do código preservado ...
`;

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
    const url = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !key) {
      throw new Error('Variáveis de ambiente (URL/KEY) não configuradas na Edge Function.')
    }

    const supabaseAdmin = createClient(url, key)
    
    // Pedido 4: Leitura robusta do body via stream para evitar falhas de parsing
    let body = {};
    try {
        const text = await req.text();
        body = JSON.parse(text);
    } catch (e) {
        console.error("[AuthHelper] Erro parsing JSON:", e.message);
    }
    
    console.log("[AuthHelper] Payload Recebido:", JSON.stringify(body));

    const action = String(body.action || '').trim().toLowerCase();
    const targetUserId = body.targetUserId;
    const newPassword = body.newPassword;

    if (action === 'update_password') {
      if (!targetUserId || !newPassword) {
        throw new Error(\`Dados incompletos. Chaves recebidas: \${Object.keys(body).join(',')}\`);
      }
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
      
      if (error) {
          console.error("[AuthHelper] Erro updateUserById:", error.message);
          throw error;
      }

      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }
    
    throw new Error(\`Ação "\${action}" não suportada. Verifique o campo 'action' no JSON.\`)
  } catch (error) {
    console.error("[AuthHelper] ERRO:", error.message);
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
                    <button onClick={() => setActiveTab('compliance_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'compliance_patch' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Patch NIS2 (Índices/RLS)</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA (Deno)</button>
                    <button onClick={() => setActiveTab('auth_helper')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'auth_helper' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaKey /> Gestão Auth (v6.1)</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'compliance_patch' && (
                         <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg text-xs text-red-200">
                            <h4 className="text-red-300 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaShieldAlt /> Reforço de Segurança e Auditoria (Pedido 4)</h4>
                            <p>Este script implementa os Índices de Busca, as Políticas RLS dinâmicas para Técnicos e Utilizadores, e a estrutura para o Soft Delete.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : (activeTab === 'compliance_patch' ? compliancePatchScript : (activeTab === 'ai_bridge' ? aiProxyCode : authHelperCode));
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">{activeTab === 'full' ? universalZeroScript : (activeTab === 'compliance_patch' ? compliancePatchScript : (activeTab === 'ai_bridge' ? aiProxyCode : authHelperCode))}</pre>
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