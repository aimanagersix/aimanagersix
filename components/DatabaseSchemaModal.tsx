
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaTerminal, FaShieldAlt, FaTable, FaCode, FaRobot, FaMagic, FaPlay, FaBolt, FaCogs, FaSpinner } from 'react-icons/fa';
import { generateSqlHelper, generatePlaywrightTest } from '../services/geminiService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

type TabType = 'init' | 'updates' | 'triggers' | 'functions' | 'policies' | 'ai_sql' | 'ai_e2e';

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('init');
    const [copied, setCopied] = useState(false);
    
    // AI States
    const [aiInput, setAiInput] = useState('');
    const [aiOutput, setAiOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerate = async () => {
        if (!aiInput.trim()) return;
        setIsGenerating(true);
        setAiOutput('');
        try {
            let result = '';
            if (activeTab === 'ai_sql') {
                result = await generateSqlHelper(aiInput);
            } else if (activeTab === 'ai_e2e') {
                // Mock credentials context for the prompt
                result = await generatePlaywrightTest(aiInput, { email: 'admin@exemplo.com', pass: '******' });
            }
            // Clean markdown blocks if present
            result = result.replace(/```sql/g, '').replace(/```typescript/g, '').replace(/```/g, '');
            setAiOutput(result);
        } catch (error) {
            setAiOutput("-- Erro ao gerar resposta. Verifique a configuração da API Gemini.");
        } finally {
            setIsGenerating(false);
        }
    };

    const scripts = {
        init: `
-- ==================================================================================
-- 1. CONFIGURAÇÃO INICIAL (TABELAS BASE)
-- Use isto apenas se estiver a configurar o projeto do zero.
-- ==================================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabelas Principais
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Utilizador',
    status TEXT DEFAULT 'Ativo',
    "canLogin" BOOLEAN DEFAULT false,
    "entidadeId" UUID, -- FK adicionada depois ou aqui se a tabela existir
    "instituicaoId" UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "serialNumber" TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Stock',
    "brandId" UUID,
    "typeId" UUID,
    "acquisitionCost" NUMERIC,
    "purchaseDate" DATE,
    "creationDate" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "modifiedDate" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pedido',
    priority TEXT DEFAULT 'Normal',
    "collaboratorId" UUID REFERENCES public.collaborators(id),
    "equipmentId" UUID REFERENCES public.equipment(id),
    "requestDate" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurações Globais
CREATE TABLE IF NOT EXISTS public.global_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT
);
`,
        updates: `
-- ==================================================================================
-- 2. ATUALIZAÇÕES & NOVOS CAMPOS
-- Execute para garantir que tem as funcionalidades mais recentes (IP, Monitor, etc).
-- ==================================================================================

-- A. Campos de Rede (IP) e Requisitos nos Tipos
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
ALTER TABLE public.config_job_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Jobs" ON public.config_job_titles FOR SELECT USING (true);
CREATE POLICY "Write Jobs" ON public.config_job_titles FOR ALL USING (
    exists (select 1 from public.collaborators where email = auth.jwt() ->> 'email' and role IN ('Admin', 'SuperAdmin'))
);

-- C. Referência de Cargo e Dados Pessoais
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.config_job_titles(id);
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;

-- D. Campos em falta nos Tickets (Fornecedores Externos)
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id);
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS requester_supplier_id UUID REFERENCES public.suppliers(id);

-- E. Flag de Segurança nas Categorias (v3.2)
ALTER TABLE IF EXISTS public.ticket_categories ADD COLUMN IF NOT EXISTS is_security BOOLEAN DEFAULT false;

-- F. Flag de Backup nos Tipos de Equipamento
-- IMPORTANTE: Usamos aspas para forçar o nome CamelCase "requiresBackupTest" se necessário
ALTER TABLE IF EXISTS public.equipment_types ADD COLUMN IF NOT EXISTS "requiresBackupTest" BOOLEAN DEFAULT false;
`,
        triggers: `
-- ==================================================================================
-- 3. TRIGGERS & AUTOMAÇÃO
-- Automatismos de base de dados (Ex: atualizar datas, logs automáticos).
-- ==================================================================================

-- Função Genérica para atualizar 'modifiedDate'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."modifiedDate" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para Equipamentos
DROP TRIGGER IF EXISTS update_equipment_modtime ON public.equipment;
CREATE TRIGGER update_equipment_modtime
BEFORE UPDATE ON public.equipment
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Auditoria Automática (Exemplo Simples)
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, user_email, action, resource_type, resource_id, details)
    VALUES (
        auth.uid(), 
        auth.jwt() ->> 'email', 
        TG_OP, 
        TG_TABLE_NAME, 
        NEW.id::text, 
        'Alteração automática via Trigger'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`,
        functions: `
-- ==================================================================================
-- 4. FUNÇÕES DO SISTEMA (RPC)
-- Funções chamadas pela aplicação para lógica complexa ou crons.
-- ==================================================================================

-- Função para Logs de Auditoria Seguros
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

-- Função para Verificar Aniversários (Usada pelo CronJob)
-- Nota: A versão completa com envio de email está na aba "Configurações > Tarefas Agendadas".
CREATE OR REPLACE FUNCTION public.get_birthdays_today()
RETURNS TABLE(full_name text, email text) 
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT "fullName", email 
  FROM collaborators 
  WHERE "dateOfBirth" IS NOT NULL 
  AND EXTRACT(MONTH FROM "dateOfBirth") = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM "dateOfBirth") = EXTRACT(DAY FROM CURRENT_DATE)
  AND status = 'Ativo';
$$;
`,
        policies: `
-- ==================================================================================
-- 5. REPARAÇÃO TOTAL DE SEGURANÇA (RLS v6.2 - Bugfix UUIDs)
-- Correção: Remove o comando GRANT ON SEQUENCE que causava erro.
-- Adiciona permissões explícitas para tabelas auxiliares (CIBE, Conservação)
-- para evitar que apareçam UUIDs em vez de nomes.
-- ==================================================================================

-- A. Limpeza Profunda de Políticas (Equipment & Types)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop para apagar todas as policies da tabela equipment
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'equipment') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.equipment';
    END LOOP;
    
    -- Loop para apagar todas as policies da tabela equipment_types
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'equipment_types') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.equipment_types';
    END LOOP;
END $$;

-- B. Aplicar Novas Políticas Permissivas

-- 1. Tabela de EQUIPAMENTOS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Leitura: Todos os utilizadores autenticados
CREATE POLICY "Authenticated Read All" ON public.equipment 
FOR SELECT USING (auth.role() = 'authenticated');

-- Escrita: Todos os utilizadores autenticados (Para evitar bloqueios na UI)
CREATE POLICY "Authenticated Write All" ON public.equipment 
FOR ALL USING (auth.role() = 'authenticated');

-- 2. Tabela de TIPOS DE EQUIPAMENTO
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated Read Types" ON public.equipment_types 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated Write Types" ON public.equipment_types 
FOR ALL USING (auth.role() = 'authenticated');

-- 3. Tabela de COLABORADORES
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Read" ON public.collaborators;
DROP POLICY IF EXISTS "Authenticated Write" ON public.collaborators;

CREATE POLICY "Authenticated Read Collabs" ON public.collaborators 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated Write Collabs" ON public.collaborators 
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Garantir Grant de Acesso Básico
GRANT ALL ON TABLE public.equipment TO authenticated;
GRANT ALL ON TABLE public.equipment_types TO authenticated;
GRANT ALL ON TABLE public.collaborators TO authenticated;
-- NOTA: Sequence grant removido pois equipment_types usa UUID

-- 5. Configurações Globais
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.global_settings;
CREATE POLICY "Allow read access for all users" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Allow write access for all users" ON public.global_settings FOR ALL USING (auth.role() = 'authenticated');

-- 6. Tabelas Auxiliares de Configuração (CORREÇÃO DE UUIDs)
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'config_accounting_categories', 
        'config_conservation_states', 
        'config_cpus', 
        'config_ram_sizes', 
        'config_storage_types', 
        'config_software_categories', 
        'config_software_products', 
        'config_decommission_reasons', 
        'config_collaborator_deactivation_reasons', 
        'contact_roles', 
        'contact_titles', 
        'brands'
    ] LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Read %I" ON public.%I', tbl, tbl);
        -- Permite leitura a todos os autenticados para que os dropdowns e nomes funcionem
        EXECUTE format('CREATE POLICY "Public Read %I" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')', tbl, tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Auth Write %I" ON public.%I', tbl, tbl);
        -- Permite escrita a todos os autenticados (para facilitar gestão, pode restringir a admin se preferir)
        EXECUTE format('CREATE POLICY "Auth Write %I" ON public.%I FOR ALL USING (auth.role() = ''authenticated'')', tbl, tbl);
        
        -- Garante permissões de SQL
        EXECUTE format('GRANT ALL ON TABLE public.%I TO authenticated', tbl);
    END LOOP;
END $$;
`
    };

    const renderScriptTab = (key: keyof typeof scripts, description: string) => (
        <div className="flex flex-col h-full">
            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-4 flex-shrink-0">
                <div className="flex items-center gap-2 font-bold mb-2">
                    <FaDatabase /> Sobre esta secção:
                </div>
                <p>{description}</p>
            </div>
            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
                <div className="absolute top-2 right-2 z-10">
                    <button 
                        onClick={() => handleCopy(scripts[key])}
                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded transition-colors shadow-lg"
                    >
                        {copied ? <FaCheck /> : <FaCopy />} 
                        {copied ? 'Copiado!' : 'Copiar Script'}
                    </button>
                </div>
                <pre className="p-4 text-xs font-mono text-green-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">
                    {scripts[key]}
                </pre>
            </div>
        </div>
    );

    const renderAiTab = (type: 'sql' | 'e2e') => (
        <div className="flex flex-col h-full space-y-4">
             <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-lg text-sm text-purple-200 flex-shrink-0">
                <div className="flex items-center gap-2 font-bold mb-2">
                    {type === 'sql' ? <FaDatabase /> : <FaRobot />} 
                    {type === 'sql' ? 'Assistente SQL (Gemini)' : 'Gerador de Testes E2E (Playwright)'}
                </div>
                <p>
                    {type === 'sql' 
                        ? 'Descreva em linguagem natural o que pretende fazer na base de dados (ex: "Criar uma tabela para registar visitas"). A IA irá gerar o código SQL PostgreSQL correto.'
                        : 'Descreva o cenário de teste (ex: "Login com sucesso e verificar dashboard"). A IA irá gerar o código TypeScript para o Playwright.'}
                </p>
            </div>

            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={type === 'sql' ? "Ex: Selecionar todos os equipamentos da marca Dell..." : "Ex: Criar um novo ticket e validar se aparece na lista..."}
                    className="flex-grow bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !aiInput.trim()}
                    className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-secondary disabled:opacity-50 flex items-center gap-2"
                >
                    {isGenerating ? <FaSpinner className="animate-spin"/> : <FaMagic />} Gerar
                </button>
            </div>

            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
                {aiOutput && (
                    <div className="absolute top-2 right-2 z-10">
                         <button 
                            onClick={() => handleCopy(aiOutput)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded transition-colors"
                        >
                            {copied ? <FaCheck /> : <FaCopy />} Copiar
                        </button>
                    </div>
                )}
                <pre className="p-4 text-xs font-mono text-blue-300 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">
                    {aiOutput || "// O código gerado aparecerá aqui..."}
                </pre>
            </div>
        </div>
    );

    return (
        <Modal title="Configuração e Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                
                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('init')} 
                        className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'init' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <FaTable /> Config. Inicial
                    </button>
                    <button 
                        onClick={() => setActiveTab('updates')} 
                        className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'updates' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <FaTerminal /> Atualizações (Campos)
                    </button>
                    <button 
                        onClick={() => setActiveTab('triggers')} 
                        className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'triggers' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <FaBolt /> Triggers
                    </button>
                    <button 
                        onClick={() => setActiveTab('functions')} 
                        className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'functions' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <FaCogs /> Funções (RPC)
                    </button>
                    <button 
                        onClick={() => setActiveTab('policies')} 
                        className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'policies' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <FaShieldAlt /> Políticas (RLS)
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-2"></div>
                    <button 
                        onClick={() => setActiveTab('ai_sql')} 
                        className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'ai_sql' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <FaMagic /> Gerar SQL (IA)
                    </button>
                    <button 
                        onClick={() => setActiveTab('ai_e2e')} 
                        className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'ai_e2e' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <FaPlay /> Testes E2E (IA)
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-hidden">
                    {activeTab === 'init' && renderScriptTab('init', "Use este script para criar as tabelas base do sistema (Equipamentos, Colaboradores, Tickets, etc.). Execute apenas se a base de dados estiver vazia.")}
                    {activeTab === 'updates' && renderScriptTab('updates', "Use este script para aplicar atualizações incrementais e adicionar campos novos (como a coluna 'Requer Backup' em falta).")}
                    {activeTab === 'triggers' && renderScriptTab('triggers', "Configura automatismos da base de dados, como atualização automática de datas de modificação e registo de logs de auditoria.")}
                    {activeTab === 'functions' && renderScriptTab('functions', "Funções de servidor (RPC) usadas pela aplicação para lógica complexa, como a verificação diária de aniversários ou cálculos de dashboard.")}
                    {activeTab === 'policies' && renderScriptTab('policies', "IMPORTANTE: Script v6.2 - Este script corrige o erro da sequência e força a aplicação das permissões nas tabelas de configuração.")}
                    
                    {activeTab === 'ai_sql' && renderAiTab('sql')}
                    {activeTab === 'ai_e2e' && renderAiTab('e2e')}
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
