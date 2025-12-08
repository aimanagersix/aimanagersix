
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling, FaCommentDots, FaHdd, FaMagic, FaTools, FaUnlock, FaShieldAlt, FaShoppingCart } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'unlock' | 'repair' | 'fix_procurement' | 'update' | 'fix_types' | 'triggers' | 'playwright'>('unlock');
    
    // Playwright AI State
    const [testRequest, setTestRequest] = useState('');
    const [generatedTest, setGeneratedTest] = useState('');
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [testEmail, setTestEmail] = useState('josefsmoreira@outlook.com');
    const [testPassword, setTestPassword] = useState('QSQmZf62!');
    
    // Triggers State
    const [triggers, setTriggers] = useState<any[]>([]);
    const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);

    const aiConfigured = isAiConfigured();

    const unlockScript = `
-- ==================================================================================
-- SCRIPT DE DESBLOQUEIO TOTAL (RLS FIX) - v2.2
-- Execute isto para garantir que todas as tabelas de configuração aparecem na app.
-- ==================================================================================

BEGIN;

-- 1. Tabelas de Hardware e Cargos
ALTER TABLE IF EXISTS public.config_cpus DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_ram_sizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_storage_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_job_titles DISABLE ROW LEVEL SECURITY;

-- 2. Tabelas de Software e Tickets (REFORÇADO)
ALTER TABLE IF EXISTS public.config_software_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_software_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_incident_types DISABLE ROW LEVEL SECURITY;

-- 3. Outras Tabelas de Configuração
ALTER TABLE IF EXISTS public.config_accounting_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_conservation_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_templates DISABLE ROW LEVEL SECURITY;

-- 4. Garantir permissões de leitura/escrita para todos os utilizadores autenticados
GRANT ALL ON public.config_cpus TO authenticated, anon;
GRANT ALL ON public.config_ram_sizes TO authenticated, anon;
GRANT ALL ON public.config_storage_types TO authenticated, anon;
GRANT ALL ON public.config_job_titles TO authenticated, anon;
GRANT ALL ON public.config_software_categories TO authenticated, anon;
GRANT ALL ON public.config_software_products TO authenticated, anon;
GRANT ALL ON public.ticket_categories TO authenticated, anon;
GRANT ALL ON public.security_incident_types TO authenticated, anon;
GRANT ALL ON public.config_accounting_categories TO authenticated, anon;
GRANT ALL ON public.config_conservation_states TO authenticated, anon;
GRANT ALL ON public.document_templates TO authenticated, anon;

-- 5. Forçar atualização de cache do PostgREST
NOTIFY pgrst, 'reload config';

COMMIT;
`;

    const repairScript = `
-- ==================================================================================
-- REPARAÇÃO DE FUNÇÕES DE SISTEMA
-- Corrige o erro "column reference trigger_name is ambiguous" e recria funções.
-- ==================================================================================

-- 1. Apagar função antiga (necessário para mudar tipo de retorno)
DROP FUNCTION IF EXISTS get_database_triggers();

-- 2. Recriar função corrigida
CREATE OR REPLACE FUNCTION get_database_triggers()
RETURNS TABLE (
    trigger_name text,
    event_manipulation text,
    event_object_table text,
    action_statement text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        t.trigger_name::text,
        t.event_manipulation::text,
        t.event_object_table::text,
        t.action_statement::text
    FROM 
        information_schema.triggers t
    WHERE 
        t.trigger_schema = 'public';
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION get_database_triggers TO authenticated, anon;

-- 4. Criar Tabela de Cargos (se não existir) - v2.1
CREATE TABLE IF NOT EXISTS public.config_job_titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar coluna aos colaboradores
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.config_job_titles(id);
`;

    const fixProcurementScript = `
-- ==================================================================================
-- CORREÇÃO DE AQUISIÇÕES (ERRO FORMAT)
-- Remove triggers problemáticos que causam o erro "unrecognized format() type specifier"
-- ==================================================================================

-- 1. Remover triggers conhecidos por causar erros de formatação
DROP TRIGGER IF EXISTS on_procurement_created ON public.procurement_requests;
DROP TRIGGER IF EXISTS tr_procurement_notification ON public.procurement_requests;
DROP FUNCTION IF EXISTS notify_procurement_creation();
DROP FUNCTION IF EXISTS process_procurement_logic();

-- 2. Garantir que a tabela existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.procurement_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    estimated_cost NUMERIC,
    requester_id UUID REFERENCES public.collaborators(id),
    status TEXT DEFAULT 'Pendente',
    request_date DATE DEFAULT CURRENT_DATE,
    priority TEXT DEFAULT 'Normal',
    resource_type TEXT DEFAULT 'Hardware',
    specifications JSONB DEFAULT '{}'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    brand_id UUID REFERENCES public.brands(id),
    equipment_type_id UUID REFERENCES public.equipment_types(id),
    software_category_id UUID REFERENCES public.config_software_categories(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    approver_id UUID REFERENCES public.collaborators(id),
    approval_date DATE,
    order_date DATE,
    received_date DATE,
    order_reference TEXT,
    invoice_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Corrigir permissões (RLS)
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Procurement Access" ON public.procurement_requests;
CREATE POLICY "Procurement Access" ON public.procurement_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.procurement_requests TO authenticated, anon;

-- 4. Notificar sucesso
DO $$
BEGIN
  RAISE NOTICE 'Módulo de Aquisições Reparado. Triggers removidos.';
END $$;
`;

    const fixTypesScript = `
UPDATE equipment_types 
SET 
    requires_cpu_info = true, 
    requires_ram_size = true, 
    requires_disk_info = true
WHERE 
    LOWER(name) LIKE '%desktop%' OR 
    LOWER(name) LIKE '%laptop%' OR 
    LOWER(name) LIKE '%portátil%' OR
    LOWER(name) LIKE '%server%';
`;

    const updateScript = `
-- Script de instalação completa (v2.0)
-- Use apenas se estiver a instalar a BD de raiz.
-- Consulte o repositório para o schema completo.
`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const loadTriggers = async () => {
        setIsLoadingTriggers(true);
        setTriggerError(null);
        try {
            const { data, error } = await dataService.fetchDatabaseTriggers();
            if (error) throw error;
            setTriggers(data || []);
        } catch (error: any) {
            setTriggerError(error.message || "Erro ao carregar triggers. Vá à aba 'Reparação' e execute o script.");
        } finally {
            setIsLoadingTriggers(false);
        }
    };

    const handleGenerateTest = async () => {
        if (!testRequest.trim()) return;
        setIsGeneratingTest(true);
        try {
            const code = await generatePlaywrightTest(testRequest, {email: testEmail, pass: testPassword});
            setGeneratedTest(code);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar teste.");
        } finally {
            setIsGeneratingTest(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'triggers') {
            loadTriggers();
        }
    }, [activeTab]);
    
    return (
        <Modal title="Configuração de Base de Dados & Ferramentas" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-700 mb-4 gap-2 flex-wrap bg-gray-900/50 p-2 rounded-t-lg">
                     <button 
                        onClick={() => setActiveTab('unlock')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'unlock' ? 'border-green-500 text-white bg-green-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaUnlock /> 1. Desbloquear (RLS)
                    </button>
                     <button 
                        onClick={() => setActiveTab('repair')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'repair' ? 'border-yellow-500 text-white bg-yellow-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaTools /> 2. Reparação Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('fix_procurement')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fix_procurement' ? 'border-red-500 text-white bg-red-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaShoppingCart /> 3. Corrigir Aquisições
                    </button>
                     <button 
                        onClick={() => setActiveTab('fix_types')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fix_types' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaMagic /> Ativar Campos
                    </button>
                     <button 
                        onClick={() => setActiveTab('triggers')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'triggers' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBolt /> Triggers
                    </button>
                    <button 
                        onClick={() => setActiveTab('playwright')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'playwright' ? 'border-pink-500 text-white bg-pink-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaRobot /> Testes E2E
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 p-1">
                    
                    {/* UNLOCK TAB */}
                    {activeTab === 'unlock' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaUnlock /> CORREÇÃO DE VISIBILIDADE (RLS)
                                </div>
                                <p className="mb-2">
                                    Se as <strong>Categorias de Tickets</strong>, Tipos de Incidente ou Cargos aparecem vazios, execute este script para corrigir as permissões.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {unlockScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(unlockScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}

                     {/* REPAIR TAB */}
                     {activeTab === 'repair' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg text-sm text-yellow-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaTools /> UPDATE V2.1 & REPARAÇÃO
                                </div>
                                <p className="mb-2">
                                    Use este script para: 
                                    1. Corrigir erro de triggers.
                                    2. Criar tabela de Cargos (config_job_titles) e adicionar coluna aos colaboradores.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-yellow-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {repairScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(repairScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FIX PROCUREMENT TAB */}
                     {activeTab === 'fix_procurement' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaShoppingCart /> CORREÇÃO DE ERRO DE AQUISIÇÃO (FORMAT)
                                </div>
                                <p className="mb-2">
                                    Se recebe o erro <code>unrecognized format() type specifier "n"</code> ao gravar um pedido, é porque existe um trigger corrompido na base de dados.
                                </p>
                                <p className="mb-2">
                                    <strong>Solução:</strong> Copie este script e execute-o no Supabase (SQL Editor) para remover os triggers problemáticos e corrigir a tabela.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-red-300 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {fixProcurementScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(fixProcurementScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FIX TYPES TAB */}
                    {activeTab === 'fix_types' && (
                         <div className="space-y-4 animate-fade-in">
                            <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-lg text-sm text-purple-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaMagic /> ATIVAR CAMPOS EM TIPOS EXISTENTES
                                </div>
                                <p className="mb-2">
                                    Este script atualiza automaticamente os tipos de equipamento (Laptop, Desktop, Server) para pedir os dados de CPU, RAM e Disco.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-purple-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {fixTypesScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(fixTypesScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}
                    
                     {/* UPDATE TAB */}
                    {activeTab === 'update' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-2">
                                <p>Use este script apenas se estiver a instalar a base de dados de raiz.</p>
                            </div>
                             <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {updateScript}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* TRIGGERS TAB */}
                    {activeTab === 'triggers' && (
                         <div className="space-y-4 animate-fade-in">
                            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FaBolt className="text-yellow-500" /> Triggers de Automação
                                    </h3>
                                    <button onClick={loadTriggers} className="text-sm text-brand-secondary hover:underline flex items-center gap-1">
                                        <FaSync className={isLoadingTriggers ? "animate-spin" : ""} /> Atualizar
                                    </button>
                                </div>
                                {triggerError ? (
                                    <div className="text-red-400 text-sm p-2 border border-red-500/30 rounded bg-red-900/20">
                                        <p className="font-bold flex items-center gap-2"><FaExclamationTriangle/> Erro ao carregar triggers:</p>
                                        <p className="mt-1">{triggerError}</p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            <strong>Solução:</strong> Vá à aba "2. Reparação" neste modal, copie o script e execute-o no Supabase.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left text-gray-300">
                                            <thead className="bg-gray-800 text-gray-400 uppercase">
                                                <tr>
                                                    <th className="p-2">Trigger</th>
                                                    <th className="p-2">Evento</th>
                                                    <th className="p-2">Tabela</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {triggers.length > 0 ? triggers.map((t: any, i: number) => (
                                                    <tr key={i} className="border-b border-gray-800">
                                                        <td className="p-2 font-bold text-white">{t.trigger_name}</td>
                                                        <td className="p-2">{t.event_manipulation}</td>
                                                        <td className="p-2">{t.event_object_table}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={3} className="p-4 text-center">Nenhum trigger encontrado.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* PLAYWRIGHT TAB */}
                    {activeTab === 'playwright' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-pink-900/20 border border-pink-500/50 p-4 rounded-lg text-sm text-pink-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg"><FaRobot /> Gerador de Testes E2E (IA)</div>
                                <p>Descreva um cenário de teste e a IA irá gerar o código Playwright (TypeScript) para automatizar o teste na aplicação.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Credenciais de Teste (Login)</label>
                                    <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="w-full bg-gray-800 mb-2 p-2 rounded text-sm" placeholder="Email"/>
                                    <input type="text" value={testPassword} onChange={e => setTestPassword(e.target.value)} className="w-full bg-gray-800 p-2 rounded text-sm" placeholder="Password"/>
                                    
                                    <label className="block text-sm text-gray-400 mt-4 mb-1">Cenário de Teste</label>
                                    <textarea 
                                        value={testRequest} 
                                        onChange={e => setTestRequest(e.target.value)} 
                                        rows={4} 
                                        className="w-full bg-gray-800 p-2 rounded text-sm border border-gray-600"
                                        placeholder="Ex: Fazer login, ir a Inventário, criar um equipamento 'Laptop Dell' e verificar se aparece na lista."
                                    />
                                    <button 
                                        onClick={handleGenerateTest} 
                                        disabled={isGeneratingTest || !aiConfigured}
                                        className="mt-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGeneratingTest ? <FaSpinner className="animate-spin"/> : <FaPlay />} Gerar Teste
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Código Gerado</label>
                                    <div className="relative h-64 md:h-auto">
                                        <textarea 
                                            value={generatedTest} 
                                            readOnly 
                                            className="w-full h-full bg-gray-900 font-mono text-xs text-green-400 p-4 rounded border border-gray-700"
                                        />
                                        {generatedTest && (
                                            <button onClick={() => handleCopy(generatedTest)} className="absolute top-2 right-2 p-1 bg-gray-700 rounded hover:bg-gray-600"><FaCopy/></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto bg-gray-900/80 p-4 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors shadow-lg">
                        Fechar Janela
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
