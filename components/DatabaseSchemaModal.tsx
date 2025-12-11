
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling, FaCommentDots, FaHdd, FaMagic, FaTools, FaUnlock, FaShieldAlt, FaShoppingCart, FaUserLock, FaSearch, FaRecycle, FaCrown, FaCode } from 'react-icons/fa';
import { generatePlaywrightTest, generateSqlHelper, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);
    const [triggers, setTriggers] = useState<any[]>([]);
    const [sqlRequest, setSqlRequest] = useState('');
    const [isGeneratingSql, setIsGeneratingSql] = useState(false);
    const [generatedSql, setGeneratedSql] = useState('');
    const [testRequest, setTestRequest] = useState('');
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [testEmail, setTestEmail] = useState(''); 
    const [testPassword, setTestPassword] = useState('');
    const [generatedTest, setGeneratedTest] = useState('');
    const [activeTab, setActiveTab] = useState('setup');
    const [copied, setCopied] = useState('');

    const aiConfigured = isAiConfigured();

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    // --- SCRIPTS ---

    const setupGenesisScript = `
-- ==================================================================================
-- SCRIPT GENESIS: ESTRUTURA INICIAL DA BASE DE DADOS (AIManager v5.5)
-- Execute este script apenas para criar uma nova base de dados do zero ou reparar tabelas em falta.
-- ==================================================================================
BEGIN;

-- 1. Tabelas de Configuração (Enums/Lookups)
CREATE TABLE IF NOT EXISTS public.global_settings (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, setting_key TEXT UNIQUE NOT NULL, setting_value TEXT, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.brands (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT UNIQUE NOT NULL, risk_level TEXT DEFAULT 'Baixa', is_iso27001_certified BOOLEAN DEFAULT false, security_contact_email TEXT);
CREATE TABLE IF NOT EXISTS public.equipment_types (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT UNIQUE NOT NULL, requires_location BOOLEAN DEFAULT false, is_maintenance BOOLEAN DEFAULT false);
CREATE TABLE IF NOT EXISTS public.config_software_categories (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT UNIQUE NOT NULL);

-- 2. Organização
CREATE TABLE IF NOT EXISTS public.instituicoes (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, codigo TEXT, email TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS public.entidades (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, instituicaoId UUID REFERENCES public.instituicoes(id), name TEXT NOT NULL, codigo TEXT, status TEXT DEFAULT 'Ativo');
CREATE TABLE IF NOT EXISTS public.suppliers (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, nif TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS public.teams (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS public.resource_contacts (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, resource_type TEXT NOT NULL, resource_id UUID NOT NULL, name TEXT, email TEXT, phone TEXT, role TEXT, is_active BOOLEAN DEFAULT true);

-- 3. Core: Colaboradores
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'Utilizador',
    status TEXT DEFAULT 'Ativo',
    "entidadeId" UUID REFERENCES public.entidades(id),
    "canLogin" BOOLEAN DEFAULT false
);

-- 4. Core: Equipamentos
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "serialNumber" TEXT,
    "brandId" UUID REFERENCES public.brands(id),
    "typeId" UUID REFERENCES public.equipment_types(id),
    description TEXT,
    status TEXT DEFAULT 'Stock',
    "creationDate" TIMESTAMPTZ DEFAULT now()
);

-- 5. Core: Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pedido',
    "entidadeId" UUID REFERENCES public.entidades(id),
    "collaboratorId" UUID REFERENCES public.collaborators(id),
    "requestDate" TIMESTAMPTZ DEFAULT now(),
    "supplier_id" UUID REFERENCES public.suppliers(id),
    "requester_supplier_id" UUID REFERENCES public.suppliers(id)
);

-- 6. Core: Atribuições
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "equipmentId" UUID REFERENCES public.equipment(id),
    "collaboratorId" UUID REFERENCES public.collaborators(id),
    "entidadeId" UUID REFERENCES public.entidades(id),
    "assignedDate" DATE DEFAULT CURRENT_DATE,
    "returnDate" DATE
);

COMMIT;
-- FIM DO GENESIS
`;

    const policiesScript = `
-- ==================================================================================
-- SCRIPT DE SEGURANÇA (RLS & RBAC) - SUPERADMIN OMNI v8.0
-- 1. Limpa políticas antigas.
-- 2. Define a regra de ouro: SuperAdmin/Admin pode tudo.
-- 3. Define regras específicas para utilizadores normais.
-- ==================================================================================
BEGIN;

-- A. Função Auxiliar de Verificação
CREATE OR REPLACE FUNCTION public.is_admin_check() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    RETURN EXISTS (SELECT 1 FROM public.collaborators WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin'));
END;
$$;

-- B. Loop para aplicar a Regra Mestra a TODAS as tabelas
DO $$
DECLARE t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "SuperAdmin_Omni_Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "SuperAdmin_Omni_Access" ON public.%I FOR ALL TO authenticated USING (public.is_admin_check()) WITH CHECK (public.is_admin_check())', t);
        EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END LOOP;
END $$;

-- C. Regras de Leitura Básica para Utilizadores Normais (Exemplo)
-- Permite que todos leiam configurações para que as dropdowns funcionem
CREATE POLICY "Public_Read_Config" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public_Read_Types" ON public.equipment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public_Read_Suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);

-- Adicione aqui outras políticas específicas se necessário...

NOTIFY pgrst, 'reload config';
COMMIT;
`;

    const functionsScript = `
-- ==================================================================================
-- SCRIPT DE FUNÇÕES E TRIGGERS (LÓGICA DE BACKEND)
-- Instala a extensão HTTP para emails e cria os gatilhos de automação.
-- ==================================================================================
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA public;

-- 1. Função de Envio de Email (Resend)
CREATE OR REPLACE FUNCTION public.send_email_via_resend(to_email text, subject text, html_body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_resend_key text; v_from_email text;
BEGIN
    SELECT setting_value INTO v_resend_key FROM global_settings WHERE setting_key = 'resend_api_key';
    SELECT setting_value INTO v_from_email FROM global_settings WHERE setting_key = 'resend_from_email';
    IF v_resend_key IS NOT NULL THEN
        PERFORM http((
            'POST', 'https://api.resend.com/emails', 
            ARRAY[http_header('Authorization', 'Bearer ' || v_resend_key), http_header('Content-Type', 'application/json')], 
            'application/json', 
            jsonb_build_object('from', v_from_email, 'to', to_email, 'subject', subject, 'html', html_body)::text
        ));
    END IF;
END;
$$;

-- 2. Trigger: Atualizar 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$
DECLARE t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public' LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_modtime ON public.%I', t);
        EXECUTE format('CREATE TRIGGER update_modtime BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE update_modified_column()', t);
    END LOOP;
END $$;
`;

    const maintenanceScript = `
-- ==================================================================================
-- SCRIPT DE MANUTENÇÃO E LIMPEZA
-- Use isto para corrigir tipos de dados ou limpar registos órfãos.
-- ==================================================================================

-- 1. Corrigir definições de Tipos de Equipamento (Ex: Portáteis exigem CPU/RAM)
UPDATE equipment_types SET 
    requires_cpu_info = true, 
    requires_ram_size = true, 
    requires_disk_info = true 
WHERE LOWER(name) LIKE '%desktop%' OR LOWER(name) LIKE '%laptop%' OR LOWER(name) LIKE '%portátil%';

-- 2. Garantir que a tabela de Aquisições tem permissões (Fix comum)
ALTER TABLE IF EXISTS public.procurement_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Procurement_Access" ON public.procurement_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Adicionar Colunas de Fornecedor aos Tickets se faltarem
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id);
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS requester_supplier_id UUID REFERENCES public.suppliers(id);
`;

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

    const handleGenerateSql = async () => {
        if (!sqlRequest.trim()) return;
        setIsGeneratingSql(true);
        try {
            const sql = await generateSqlHelper(sqlRequest);
            setGeneratedSql(sql);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar SQL.");
        } finally {
            setIsGeneratingSql(false);
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
        if (activeTab === 'functions') { // Carregar triggers na aba de funções/triggers
            loadTriggers();
        }
    }, [activeTab]);
    
    return (
        <Modal title="Configuração Avançada de Base de Dados" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-700 mb-4 gap-1 flex-wrap bg-gray-900/50 p-2 rounded-t-lg">
                     <button 
                        onClick={() => setActiveTab('setup')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'setup' ? 'border-blue-500 text-white bg-blue-900/40 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaDatabase /> 1. Setup Inicial
                    </button>
                     <button 
                        onClick={() => setActiveTab('policies')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'policies' ? 'border-red-500 text-white bg-red-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaShieldAlt /> 2. Políticas (RLS)
                    </button>
                     <button 
                        onClick={() => setActiveTab('functions')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'functions' ? 'border-yellow-500 text-white bg-yellow-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBolt /> 3. Funções & Triggers
                    </button>
                    <button 
                        onClick={() => setActiveTab('maintenance')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'maintenance' ? 'border-orange-500 text-white bg-orange-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaTools /> Manutenção
                    </button>
                    <button 
                        onClick={() => setActiveTab('sql_ai')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sql_ai' ? 'border-purple-500 text-white bg-purple-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaMagic /> SQL com IA
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

                     {/* SETUP TAB */}
                     {activeTab === 'setup' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaDatabase /> Script Genesis (Estrutura)
                                </div>
                                <p className="mb-2">
                                    Este script cria a estrutura inicial da base de dados (tabelas e relações).
                                    <br/>
                                    <strong>Nota de Segurança:</strong> É seguro partilhar este script publicamente, pois ele define apenas a <em>arquitetura</em> (Schema) e não contém dados sensíveis ou chaves de API. O "segredo" está nos dados e nas variáveis de ambiente (.env), não aqui.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-blue-300 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {setupGenesisScript}
                                </pre>
                                <button onClick={() => handleCopy(setupGenesisScript, 'genesis')} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg flex items-center gap-2">
                                    {copied === 'genesis' ? <FaCheck className="text-green-400"/> : <FaCopy />} Copiar
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* POLICIES TAB */}
                    {activeTab === 'policies' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaShieldAlt /> Políticas de Segurança (RLS)
                                </div>
                                <p className="mb-2">
                                    <strong>O que são?</strong> As RLS (Row Level Security) são as "regras do jogo". Definem quem pode ver ou editar cada linha de cada tabela.
                                    <br/>
                                    Se tiver erros de "permission denied" ou "violation of policy", execute o script abaixo. Ele reinicia todas as regras e dá poder total aos Administradores (Script Omni).
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-red-300 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {policiesScript}
                                </pre>
                                <button onClick={() => handleCopy(policiesScript, 'policies')} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg flex items-center gap-2">
                                    {copied === 'policies' ? <FaCheck className="text-green-400"/> : <FaCopy />} Copiar Correção
                                </button>
                            </div>
                        </div>
                    )}

                     {/* FUNCTIONS TAB */}
                     {activeTab === 'functions' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg text-sm text-yellow-200">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaBolt /> Funções e Gatilhos (Triggers)
                                </div>
                                <p className="mb-2">
                                    <strong>Funções (RPC):</strong> Scripts que correm no servidor (ex: enviar email de parabéns).
                                    <br/>
                                    <strong>Triggers:</strong> Automações que disparam quando algo muda (ex: atualizar a data 'modified_at' quando se edita um equipamento).
                                </p>
                            </div>
                            
                            {/* Triggers Table */}
                             <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-bold text-white">Gatilhos Ativos na Base de Dados</h3>
                                    <button onClick={loadTriggers} className="text-sm text-brand-secondary hover:underline flex items-center gap-1"><FaSync className={isLoadingTriggers ? "animate-spin" : ""} /> Atualizar Lista</button>
                                </div>
                                {triggerError ? <div className="text-red-400 text-sm p-2 border border-red-500/30 rounded bg-red-900/20">{triggerError}</div> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left text-gray-300">
                                            <thead className="bg-gray-800 text-gray-400 uppercase">
                                                <tr>
                                                    <th className="p-2">Nome do Trigger</th>
                                                    <th className="p-2">Evento</th>
                                                    <th className="p-2">Tabela</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {triggers.length > 0 ? triggers.map((t: any, i: number) => (
                                                    <tr key={i} className="border-b border-gray-800">
                                                        <td className="p-2 font-bold text-white">{t.trigger_name}</td>
                                                        <td className="p-2">{t.event_manipulation}</td>
                                                        <td className="p-2 text-brand-secondary">{t.event_object_table}</td>
                                                    </tr>
                                                )) : <tr><td colSpan={3} className="p-4 text-center">Nenhum trigger encontrado.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Script */}
                            <div className="relative">
                                <div className="text-xs text-gray-400 mb-1 ml-1">Script de Instalação de Funções Base:</div>
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-yellow-400 overflow-auto max-h-[300px] custom-scrollbar border border-gray-700">
                                    {functionsScript}
                                </pre>
                                <button onClick={() => handleCopy(functionsScript, 'funcs')} className="absolute top-8 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg flex items-center gap-2">
                                    {copied === 'funcs' ? <FaCheck className="text-green-400"/> : <FaCopy />} Copiar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MAINTENANCE TAB */}
                    {activeTab === 'maintenance' && (
                        <div className="space-y-4 animate-fade-in">
                             <div className="bg-orange-900/20 border border-orange-500/50 p-4 rounded-lg text-sm text-orange-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaTools /> Scripts de Reparação e Limpeza
                                </div>
                                <p className="mb-2">
                                    Coleção de scripts úteis para corrigir problemas comuns (ex: tipos de equipamento sem campos obrigatórios, permissões de aquisições bloqueadas).
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-orange-300 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {maintenanceScript}
                                </pre>
                                <button onClick={() => handleCopy(maintenanceScript, 'maint')} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg flex items-center gap-2">
                                    {copied === 'maint' ? <FaCheck className="text-green-400"/> : <FaCopy />} Copiar
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* SQL AI TAB */}
                    {activeTab === 'sql_ai' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-lg text-sm text-purple-200">
                                    <div className="flex items-center gap-2 font-bold mb-2 text-lg"><FaMagic /> Assistente SQL (Gemini)</div>
                                    <p>Descreva o que quer fazer na base de dados e a IA gera o código SQL para si.</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Pedido em Linguagem Natural</label>
                                    <div className="flex gap-2">
                                        <textarea value={sqlRequest} onChange={e => setSqlRequest(e.target.value)} rows={3} className="w-full bg-gray-800 p-2 rounded text-sm border border-gray-600" placeholder="Ex: Cria uma tabela para registar visitas de fornecedores com data, nome e motivo..."/>
                                        <button onClick={handleGenerateSql} disabled={isGeneratingSql || !aiConfigured} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded flex flex-col items-center justify-center gap-1 disabled:opacity-50 min-w-[100px]">
                                            {isGeneratingSql ? <FaSpinner className="animate-spin text-xl"/> : <FaMagic className="text-xl"/>}
                                            <span className="text-xs">Gerar SQL</span>
                                        </button>
                                    </div>
                                </div>
                                {generatedSql && (
                                    <div className="relative">
                                        <label className="block text-sm text-gray-400 mb-1">SQL Gerado</label>
                                        <textarea value={generatedSql} readOnly className="w-full h-64 bg-gray-900 font-mono text-xs text-green-400 p-4 rounded border border-gray-700"/>
                                        <button onClick={() => handleCopy(generatedSql, 'sql_ai')} className="absolute top-8 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600">
                                            {copied === 'sql_ai' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PLAYWRIGHT TAB */}
                    {activeTab === 'playwright' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Cenário de Teste</label>
                                    <textarea value={testRequest} onChange={e => setTestRequest(e.target.value)} rows={4} className="w-full bg-gray-800 p-2 rounded text-sm border border-gray-600" placeholder="Descreva o teste (ex: Login com sucesso e criar um ticket)..."/>
                                    <button onClick={handleGenerateTest} disabled={isGeneratingTest || !aiConfigured} className="mt-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50">{isGeneratingTest ? <FaSpinner className="animate-spin"/> : <FaPlay />} Gerar Teste</button>
                                </div>
                                <div><label className="block text-sm text-gray-400 mb-1">Código Playwright (TypeScript)</label><div className="relative h-64 md:h-auto"><textarea value={generatedTest} readOnly className="w-full h-full bg-gray-900 font-mono text-xs text-green-400 p-4 rounded border border-gray-700"/>{generatedTest && <button onClick={() => handleCopy(generatedTest, 'e2e')} className="absolute top-2 right-2 p-1 bg-gray-700 rounded hover:bg-gray-600"><FaCopy/></button>}</div></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto bg-gray-900/80 p-4 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors shadow-lg">Fechar Janela</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
