
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaTerminal, FaShieldAlt, FaTable, FaCode } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'structure' | 'updates' | 'rls'>('updates');
    const [copied, setCopied] = useState(false);

    const scripts = {
        updates: `
-- ==================================================================================
-- 1. ATUALIZAÇÕES DE ESTRUTURA (NOVOS CAMPOS)
-- Execute este bloco para garantir que tem as funcionalidades mais recentes (IP, Monitor, Cargos)
-- ==================================================================================

-- A. Campos de Rede (IP) e Hardware
ALTER TABLE IF EXISTS public.equipment_types ADD COLUMN IF NOT EXISTS requires_ip BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS monitor_info TEXT;

-- B. Tabela de Cargos / Funções (Job Titles)
CREATE TABLE IF NOT EXISTS public.config_job_titles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Referência de Cargo na Tabela de Colaboradores
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.config_job_titles(id);
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;

-- D. Campos em falta nos Tickets (Fornecedores)
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id);
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS requester_supplier_id UUID REFERENCES public.suppliers(id);
`,
        structure: `
-- ==================================================================================
-- 2. TABELAS DE CONFIGURAÇÃO (INIT)
-- Use isto se estiver a configurar a base de dados do zero ou se faltarem tabelas.
-- ==================================================================================

-- Configurações Globais
CREATE TABLE IF NOT EXISTS public.global_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT
);

-- Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    user_email TEXT,
    action TEXT,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Função Helper para Logs
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_details text,
  p_resource_id text default null
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, user_email, action, resource_type, resource_id, details)
  VALUES (auth.uid(), auth.jwt() ->> 'email', p_action, p_resource_type, p_resource_id, p_details);
END;
$$;
`,
        rls: `
-- ==================================================================================
-- 3. PERMISSÕES DE SEGURANÇA (RLS & POLICIES)
-- Execute isto se tiver erros de "Permission Denied" ou "RLS".
-- ==================================================================================

-- Habilitar RLS nas tabelas novas
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Allow read access for all users" ON public.global_settings;
DROP POLICY IF EXISTS "Allow all access for admins" ON public.global_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.config_job_titles;
DROP POLICY IF EXISTS "Enable write access for admins" ON public.config_job_titles;

-- Recriar Políticas: Leitura para todos, Escrita para Admins
CREATE POLICY "Allow read access for all users" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Allow all access for admins" ON public.global_settings FOR ALL USING (
  exists (select 1 from public.collaborators where email = auth.jwt() ->> 'email' and role IN ('Admin', 'SuperAdmin'))
);

CREATE POLICY "Enable read access for all users" ON public.config_job_titles FOR SELECT USING (true);
CREATE POLICY "Enable write access for admins" ON public.config_job_titles FOR ALL USING (
  exists (select 1 from public.collaborators where email = auth.jwt() ->> 'email' and role IN ('Admin', 'SuperAdmin'))
);

-- Auditoria: Apenas inserção pelo sistema/função, leitura para admins
CREATE POLICY "Audit Log Insert" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Audit Log View Admin" ON public.audit_logs FOR SELECT USING (
  exists (select 1 from public.collaborators where email = auth.jwt() ->> 'email' and role IN ('Admin', 'SuperAdmin'))
);
`
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const activeScript = scripts[activeTab];

    return (
        <Modal title="Configuração e Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[75vh]">
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2 font-bold mb-2">
                        <FaDatabase /> Instruções
                    </div>
                    <p>
                        Se notar que faltam campos (ex: IP, Monitor) ou erros de permissão, copie o script da aba correspondente e execute-o no <strong>SQL Editor</strong> do painel do Supabase.
                    </p>
                </div>

                <div className="flex border-b border-gray-700 mb-0 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('updates')} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'updates' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaTerminal /> Atualizações & Campos Novos
                    </button>
                    <button 
                        onClick={() => setActiveTab('rls')} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'rls' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaShieldAlt /> Permissões (RLS)
                    </button>
                    <button 
                        onClick={() => setActiveTab('structure')} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'structure' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaTable /> Estrutura Base
                    </button>
                </div>

                <div className="relative flex-grow bg-gray-900 border border-gray-700 border-t-0 rounded-b-lg overflow-hidden flex flex-col">
                    <div className="absolute top-2 right-2 z-10">
                        <button 
                            onClick={() => handleCopy(activeScript)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded transition-colors shadow-lg"
                        >
                            {copied ? <FaCheck /> : <FaCopy />} 
                            {copied ? 'Copiado!' : 'Copiar Script'}
                        </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-green-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">
                        {activeScript}
                    </pre>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-4 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
