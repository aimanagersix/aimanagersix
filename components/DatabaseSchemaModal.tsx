
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling, FaCommentDots, FaHdd } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'update' | 'cleanup' | 'seed' | 'triggers' | 'storage' | 'playwright_ai' | 'chat_repair'>('update');
    
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

    // Seed State
    const [isSeeding, setIsSeeding] = useState(false);

    const aiConfigured = isAiConfigured();

    const updateScript = `
-- ==================================================================================
-- SCRIPT DE CORREÇÃO DE ESTRUTURA E SEGURANÇA v4.1 (Full Update)
-- ==================================================================================

-- 1. EXTENSÕES E FUNÇÕES BÁSICAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net"; 
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. NOVAS TABELAS DE CONFIGURAÇÃO (LEGAL & HARDWARE)
CREATE TABLE IF NOT EXISTS public.config_accounting_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE, 
    color text
);

CREATE TABLE IF NOT EXISTS public.config_conservation_states (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE, 
    color text
);

CREATE TABLE IF NOT EXISTS public.config_cpus (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE 
);

CREATE TABLE IF NOT EXISTS public.config_ram_sizes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE 
);

CREATE TABLE IF NOT EXISTS public.config_storage_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE 
);

-- 3. ESTRUTURA DE TABELAS (ATUALIZAÇÕES)
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS accounting_category_id uuid REFERENCES public.config_accounting_categories(id);
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS conservation_state_id uuid REFERENCES public.config_conservation_states(id);
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS residual_value numeric;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS last_inventory_scan date;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS is_loan boolean DEFAULT false;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS parent_equipment_id uuid REFERENCES public.equipment(id);

-- Adicionar coluna user_email se não existir em audit_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_email') THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_email text;
    END IF;
END $$;

-- 4. SEED DE DADOS LEGAIS & HARDWARE
INSERT INTO public.config_conservation_states (name, color) VALUES
('Novo', '#10B981'), ('Bom', '#3B82F6'), ('Razoável', '#F59E0B'), ('Mau', '#EF4444'), ('Obsoleto/Sucata', '#6B7280')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.config_accounting_categories (name) VALUES
('30102 - Equipamento Básico'), ('30103 - Software Informático'), ('30104 - Equipamento Administrativo')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.config_cpus (name) VALUES 
('Intel Core i3'), ('Intel Core i5'), ('Intel Core i7'), ('Intel Core i9'),
('AMD Ryzen 3'), ('AMD Ryzen 5'), ('AMD Ryzen 7'), ('Apple M1'), ('Apple M2'), ('Apple M3')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.config_ram_sizes (name) VALUES 
('4 GB'), ('8 GB'), ('16 GB'), ('32 GB'), ('64 GB')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.config_storage_types (name) VALUES 
('256GB SSD'), ('512GB SSD'), ('1TB SSD'), ('500GB HDD'), ('1TB HDD')
ON CONFLICT (name) DO NOTHING;

-- 5. FUNÇÕES DE PERMISSÕES
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.collaborators WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_tech() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.collaborators WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Técnico'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_database_triggers()
RETURNS TABLE (table_name text, trigger_name text, events text, timing text, definition text) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, information_schema
AS $$
BEGIN
    RETURN QUERY SELECT event_object_table::text, trigger_name::text, event_manipulation::text, action_timing::text, action_statement::text
    FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY event_object_table, trigger_name;
END;
$$;
GRANT EXECUTE ON FUNCTION get_database_triggers() TO authenticated;

-- ==========================================
-- 6. RLS - POLÍTICAS DE SEGURANÇA
-- ==========================================

-- Habilitar RLS para novas tabelas
DO $$ 
DECLARE t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_name IN ('config_accounting_categories', 'config_conservation_states', 'config_cpus', 'config_ram_sizes', 'config_storage_types')
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Config Read %I" ON %I;', t, t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Config Write %I" ON %I;', t, t); EXCEPTION WHEN OTHERS THEN NULL; END;
        EXECUTE format('CREATE POLICY "Config Read %I" ON %I FOR SELECT TO authenticated USING (true);', t, t);
        EXECUTE format('CREATE POLICY "Config Write %I" ON %I FOR ALL TO authenticated USING (is_admin_or_tech());', t, t);
    END LOOP;
END $$;

-- CRÍTICO: FORÇAR RECARREGAMENTO DA CACHE DO POSTGREST
NOTIFY pgrst, 'reload config';
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
            setTriggerError(error.message || "Erro ao carregar triggers.");
        } finally {
            setIsLoadingTriggers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'triggers') {
            loadTriggers();
        }
    }, [activeTab]);

    const handleGenerateTest = async () => {
        if (!testRequest) return;
        setIsGeneratingTest(true);
        try {
            const code = await generatePlaywrightTest(testRequest, { email: testEmail, pass: testPassword });
            setGeneratedTest(code);
        } catch (error) {
            console.error(error);
            setGeneratedTest("// Erro ao gerar teste.");
        } finally {
            setIsGeneratingTest(false);
        }
    };
    
    const handleSeed = async () => {
        alert("Execute o script SQL na aba 'Atualizar BD' para inserir os dados iniciais.");
    };

    return (
        <Modal title="Configuração de Base de Dados & Ferramentas" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-700 mb-4 gap-2 flex-wrap bg-gray-900/50 p-2 rounded-t-lg">
                     <button 
                        onClick={() => setActiveTab('update')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'update' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaDatabase /> Atualizar BD (Schema)
                    </button>
                     <button 
                        onClick={() => setActiveTab('storage')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'storage' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaHdd /> Configurar Storage
                    </button>
                    <button 
                        onClick={() => setActiveTab('triggers')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'triggers' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBolt /> Triggers Ativos
                    </button>
                     <button 
                        onClick={() => setActiveTab('playwright_ai')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'playwright_ai' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaRobot /> Testes E2E (AI)
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 p-1">
                    {/* UPDATE TAB */}
                    {activeTab === 'update' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaExclamationTriangle /> SCRIPT DE ATUALIZAÇÃO GLOBAL
                                </div>
                                <p className="mb-2">
                                    Este script contém todas as estruturas de tabelas, RLS e dados de configuração necessários. Execute-o no <strong>SQL Editor do Supabase</strong> para garantir que a base de dados está sincronizada com a aplicação.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {updateScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(updateScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}
                    
                     {/* STORAGE TAB */}
                    {activeTab === 'storage' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <h3 className="font-bold text-white mb-2">Configuração de Armazenamento (Buckets)</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Crie um bucket chamado <strong>'avatars'</strong> no menu Storage do Supabase e defina-o como "Public".
                                    Isto é necessário para fotos de perfil e anexos.
                                </p>
                                <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-300 border border-gray-600">
                                    -- SQL para criar bucket (se a extensão pg_net estiver ativa) ou faça manualmente no dashboard<br/>
                                    insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
                                </div>
                            </div>
                        </div>
                    )}

                     {/* PLAYWRIGHT AI TAB */}
                    {activeTab === 'playwright_ai' && (
                        <div className="space-y-4 animate-fade-in p-1">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-bold text-white">Descreva o Teste E2E</label>
                                    <textarea 
                                        className="w-full h-32 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                                        placeholder="Ex: Fazer login, ir ao menu de ativos, clicar em adicionar equipamento, preencher o serial number..."
                                        value={testRequest}
                                        onChange={(e) => setTestRequest(e.target.value)}
                                    ></textarea>
                                    
                                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                        <p className="text-xs text-gray-400 mb-2 font-bold uppercase">Credenciais de Teste (para o script)</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white" placeholder="Email Teste" />
                                            <input type="text" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white" placeholder="Password Teste" />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleGenerateTest}
                                        disabled={isGeneratingTest || !aiConfigured}
                                        className="bg-purple-600 hover:bg-purple-500 text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isGeneratingTest ? <FaSpinner className="animate-spin" /> : <FaRobot />}
                                        Gerar Código Playwright
                                    </button>
                                </div>
                                <div className="relative flex flex-col">
                                    <label className="text-sm font-bold text-white mb-1">Código Gerado</label>
                                    <div className="relative flex-grow">
                                        <textarea 
                                            readOnly
                                            className="w-full h-full min-h-[300px] bg-gray-900 border border-gray-700 rounded p-3 text-xs font-mono text-green-400"
                                            value={generatedTest}
                                        ></textarea>
                                        <button 
                                            onClick={() => handleCopy(generatedTest)}
                                            className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-white border border-gray-600"
                                        >
                                            {copied ? <FaCheck /> : <FaCopy />}
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                    
                    {/* TRIGGERS TAB */}
                    {activeTab === 'triggers' && (
                        <div className="space-y-4 animate-fade-in">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white">Triggers de Base de Dados</h3>
                                <button onClick={loadTriggers} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                                    {isLoadingTriggers ? <FaSpinner className="animate-spin"/> : <FaSync />} Atualizar
                                </button>
                             </div>
                             
                             {triggerError && (
                                 <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-200 text-sm">
                                     {triggerError}
                                     <p className="mt-1 text-xs text-gray-400">Dica: Execute o script da aba "Atualizar BD" para criar a função 'get_database_triggers'.</p>
                                 </div>
                             )}

                             <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="bg-gray-800 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-2">Tabela</th>
                                            <th className="px-4 py-2">Trigger</th>
                                            <th className="px-4 py-2">Eventos</th>
                                            <th className="px-4 py-2">Timing</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {triggers.length > 0 ? triggers.map((t: any, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/50">
                                                <td className="px-4 py-2 font-bold text-white">{t.table_name}</td>
                                                <td className="px-4 py-2 font-mono text-xs">{t.trigger_name}</td>
                                                <td className="px-4 py-2 text-xs">
                                                    {t.events.map((e:any) => <span key={e} className="bg-blue-900/50 text-blue-200 px-1 rounded mr-1">{e}</span>)}
                                                </td>
                                                <td className="px-4 py-2 text-xs">{t.action_timing}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-gray-500">Nenhum trigger encontrado ou função não disponível.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
