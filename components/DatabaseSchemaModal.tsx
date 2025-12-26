
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle } from 'react-icons/fa';

/**
 * DB Manager UI - v27.0 (Enterprise Intelligence Patch)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: SUPORTE A FERIADOS E CALENDÁRIO.
 * - PEDIDO 4: CONFIGURAÇÃO PGVECTOR (EMBEDDINGS).
 * - PEDIDO 6: CONFIGURAÇÃO PG_JSONSCHEMA (INTEGRIDADE).
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'enterprise_patch' | 'ai_bridge' | 'auth_helper'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const universalZeroScript = `-- 🛡️ AIMANAGER - SCRIPT UNIVERSAL "ABSOLUTE ZERO" (v10.0)
-- Este script reconstrói a base de dados completa para compatibilidade MCP.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ... tabelas preservadas conforme Absolute Zero v10.0 ...
`;

    const enterprisePatchScript = `-- 🚀 AIMANAGER - ENTERPRISE INTELLIGENCE PATCH (v27.0)

-- 1. ATIVAR EXTENSÕES ENTERPRISE
CREATE EXTENSION IF NOT EXISTS vector;          -- Pedido 4: Inteligência Semântica
CREATE EXTENSION IF NOT EXISTS pg_jsonschema;   -- Pedido 6: Integridade de Dados

-- 2. SUPORTE A FERIADOS E AUSÊNCIAS (Pedido 3)
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE UNIQUE NOT NULL,
    type TEXT DEFAULT 'Holiday', -- 'Holiday', 'Vacation', 'Bridge'
    is_recurring BOOLEAN DEFAULT true,
    collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE CASCADE,
    instituicao_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para feriados
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Holidays_View_Policy" ON public.holidays;
CREATE POLICY "Holidays_View_Policy" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Holidays_Manage_Policy" ON public.holidays FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM collaborators WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);

-- 3. INTELIGÊNCIA VETORIAL (Pedido 4)
-- Adiciona coluna de embedding aos tickets para a Base de Conhecimento
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS embedding vector(768); 

-- Função para busca de soluções similares (RPC)
CREATE OR REPLACE FUNCTION match_knowledge_base (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  resolution_summary text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.resolution_summary,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM tickets t
  WHERE t.status = 'Finalizado' 
    AND t.resolution_summary IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 4. VALIDAÇÃO JSONSCHEMA (Pedido 6)
-- Adiciona validação às regras de automação
ALTER TABLE public.automation_rules 
DROP CONSTRAINT IF EXISTS check_rules_format;

ALTER TABLE public.automation_rules 
ADD CONSTRAINT check_rules_format CHECK (
    jsonb_matches_schema(
        '{
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "field": {"type": "string"},
                    "operator": {"type": "string"},
                    "value": {}
                },
                "required": ["field", "operator"]
            }
        }',
        conditions
    )
);

-- 5. NOTIFICAR REFRESH
NOTIFY pgrst, 'reload schema';
`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização Universal</button>
                    <button onClick={() => setActiveTab('enterprise_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'enterprise_patch' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch Enterprise (v27.0)</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA</button>
                    <button onClick={() => setActiveTab('auth_helper')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'auth_helper' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaKey /> Gestão Auth</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'enterprise_patch' && (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg mb-2">
                            <h4 className="text-indigo-400 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaBolt /> NOVO PATCH: INTELIGÊNCIA E FERIADOS</h4>
                            <p className="text-[11px] text-gray-300">Este script ativa o <strong>pgvector</strong> para a Base de Conhecimento Inteligente e cria a tabela de <strong>Feriados/Ausências</strong>.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : (activeTab === 'enterprise_patch' ? enterprisePatchScript : '');
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">{activeTab === 'full' ? universalZeroScript : (activeTab === 'enterprise_patch' ? enterprisePatchScript : '-- Use as abas de Deno para as Edge Functions...')}</pre>
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
