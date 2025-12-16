
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaTerminal, FaShieldAlt, FaTable, FaCode, FaRobot, FaMagic, FaPlay, FaBolt, FaCogs, FaSpinner, FaSeedling, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import { generateSqlHelper, generatePlaywrightTest } from '../services/geminiService';
import * as dataService from '../services/dataService';
import { DbPolicy, DbTrigger, DbFunction } from '../types';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

type TabType = 'setup' | 'triggers' | 'functions' | 'policies' | 'seed' | 'ai';

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('setup');
    const [copied, setCopied] = useState<string | null>(null);
    
    // Dynamic Data States
    const [policies, setPolicies] = useState<DbPolicy[]>([]);
    const [triggers, setTriggers] = useState<DbTrigger[]>([]);
    const [functions, setFunctions] = useState<DbFunction[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataError, setDataError] = useState('');

    // Modal de Visualização de Código
    const [previewCode, setPreviewCode] = useState<{title: string, code: string} | null>(null);

    // AI States
    const [aiInput, setAiInput] = useState('');
    const [aiOutput, setAiOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiMode, setAiMode] = useState<'sql' | 'e2e'>('sql');

    // Load Data on Tab Change
    useEffect(() => {
        const loadMetadata = async () => {
            setIsLoadingData(true);
            setDataError('');
            try {
                if (activeTab === 'policies') {
                    const data = await dataService.fetchDbPolicies();
                    if (data.length === 0) setDataError("Nenhuma política encontrada ou a função 'get_db_policies' não está instalada.");
                    setPolicies(data);
                } else if (activeTab === 'triggers') {
                    const data = await dataService.fetchDbTriggers();
                    if (data.length === 0) setDataError("Nenhum trigger encontrado ou a função 'get_db_triggers' não está instalada.");
                    setTriggers(data);
                } else if (activeTab === 'functions') {
                    const data = await dataService.fetchDbFunctions();
                    if (data.length === 0) setDataError("Nenhuma função encontrada ou a função 'get_db_functions' não está instalada.");
                    setFunctions(data);
                }
            } catch (e: any) {
                setDataError("Erro ao carregar dados. Verifique se executou o script '1. Instalação & Ferramentas'.");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (['policies', 'triggers', 'functions'].includes(activeTab)) {
            loadMetadata();
        }
    }, [activeTab]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleGenerate = async () => {
        if (!aiInput.trim()) return;
        setIsGenerating(true);
        setAiOutput('');
        try {
            let result = '';
            if (aiMode === 'sql') {
                result = await generateSqlHelper(aiInput);
            } else {
                result = await generatePlaywrightTest(aiInput, { email: 'admin@exemplo.com', pass: '******' });
            }
            result = result.replace(/```sql/g, '').replace(/```typescript/g, '').replace(/```/g, '');
            setAiOutput(result);
        } catch (error: any) {
            console.error("AI Error:", error);
            setAiOutput(`-- Erro ao gerar resposta.\n-- Detalhes: ${error.message || 'Verifique a chave da API Gemini.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const scripts = {
        setup: `
-- ==================================================================================
-- 1. CONFIGURAÇÃO INICIAL E FERRAMENTAS DE INSPEÇÃO
-- Execute este script PRIMEIRO para criar tabelas e permitir que a App leia a estrutura.
-- ==================================================================================

-- A. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- B. Funções RPC para Inspeção
CREATE OR REPLACE FUNCTION get_db_policies()
RETURNS TABLE (tablename text, policyname text, cmd text, roles text[], qual text, with_check text) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT p.tablename::text, p.policyname::text, p.cmd::text, p.roles::text[], p.qual::text, p.with_check::text
  FROM pg_policies p WHERE p.schemaname = 'public';
END; $$;

CREATE OR REPLACE FUNCTION get_db_triggers()
RETURNS TABLE (table_name text, trigger_name text, event_manipulation text, action_statement text, action_timing text) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT event_object_table::text, t.trigger_name::text, t.event_manipulation::text, t.action_statement::text, t.action_timing::text
  FROM information_schema.triggers t WHERE event_object_schema = 'public';
END; $$;

CREATE OR REPLACE FUNCTION get_db_functions()
RETURNS TABLE (routine_name text, data_type text, external_language text, definition text) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT r.routine_name::text, r.data_type::text, r.external_language::text, pg_get_functiondef(p.oid)::text
  FROM information_schema.routines r JOIN pg_proc p ON p.proname = r.routine_name
  WHERE r.routine_schema = 'public' AND r.routine_type = 'FUNCTION';
END; $$;

-- Dar permissão de execução
GRANT EXECUTE ON FUNCTION get_db_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_db_triggers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_db_functions() TO authenticated;

-- C. Tabela de Automação (Workflows)
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas RLS para Automação (Leitura para todos, escrita para Admins via app logic)
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.automation_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write access for authenticated users" ON public.automation_rules FOR ALL TO authenticated USING (true);

-- D. Campos em Falta (Updates)
ALTER TABLE IF EXISTS public.equipment_types ADD COLUMN IF NOT EXISTS "requiresBackupTest" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.ticket_categories ADD COLUMN IF NOT EXISTS is_security BOOLEAN DEFAULT false;
`,
        seed: `
-- ==================================================================================
-- SEED DATA (DADOS DE TESTE)
-- ==================================================================================
DO $$
DECLARE
    i INT;
    v_inst_id UUID;
BEGIN
    -- Seleciona ou cria instituição dummy
    SELECT id INTO v_inst_id FROM public.instituicoes LIMIT 1;
    IF v_inst_id IS NULL THEN
        INSERT INTO public.instituicoes (name, codigo, email, telefone) VALUES ('Inst. Teste', 'TEST', 'test@test.com', '123') RETURNING id INTO v_inst_id;
    END IF;

    -- Criar 50 Colaboradores
    FOR i IN 1..50 LOOP
        INSERT INTO public.collaborators ("fullName", email, role, status, "canLogin", "numeroMecanografico", "instituicaoId")
        VALUES ('User Teste ' || i, 'user.'||i||'@teste.local', 'Utilizador', 'Ativo', false, 'MEC-'||i, v_inst_id)
        ON CONFLICT (email) DO NOTHING;
    END LOOP;
END $$;
`
    };

    const renderEmptyState = (msg: string) => (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-900/30 rounded-lg border border-gray-700">
            <FaExclamationTriangle className="text-3xl mb-3 opacity-50"/>
            <p className="text-sm">{msg}</p>
            {msg.includes("não está instalada") && (
                <button onClick={() => setActiveTab('setup')} className="mt-4 text-brand-secondary hover:underline text-xs">
                    Ir para Aba de Instalação
                </button>
            )}
        </div>
    );

    return (
        <Modal title="Configuração e Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                
                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> 1. Instalação & Ferramentas
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-1"></div>
                    <button onClick={() => setActiveTab('triggers')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'triggers' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaBolt /> Triggers (Ativos)
                    </button>
                    <button onClick={() => setActiveTab('functions')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'functions' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaCogs /> Funções (RPC)
                    </button>
                    <button onClick={() => setActiveTab('policies')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'policies' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaShieldAlt /> Políticas (RLS)
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-1"></div>
                    <button onClick={() => setActiveTab('seed')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'seed' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaSeedling /> Seeding
                    </button>
                    <button onClick={() => setActiveTab('ai')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaRobot /> AI & Testes
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-hidden flex flex-col">
                    
                    {/* 1. SETUP TAB */}
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-4 flex-shrink-0">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaDatabase /> Configuração Inicial & Ferramentas</div>
                                <p>Este script instala as tabelas base e as <strong>funções de inspeção</strong> necessárias para ver os Triggers, Funções e Políticas nas outras abas.</p>
                                <p className="mt-1 font-bold">Copie e execute no SQL Editor do Supabase se for a primeira vez.</p>
                            </div>
                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => handleCopy(scripts.setup, 'setup')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                                        {copied === 'setup' ? <FaCheck /> : <FaCopy />} {copied === 'setup' ? 'Copiado!' : 'Copiar Script'}
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-green-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">{scripts.setup}</pre>
                            </div>
                        </div>
                    )}

                    {/* 2. TRIGGERS TAB */}
                    {activeTab === 'triggers' && (
                        <div className="h-full flex flex-col">
                            {isLoadingData ? <div className="text-center p-10"><FaSpinner className="animate-spin text-2xl mx-auto"/> Carregando Triggers...</div> : 
                             dataError ? renderEmptyState(dataError) : (
                                <div className="overflow-auto custom-scrollbar border border-gray-700 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-800 text-gray-400 uppercase text-xs sticky top-0">
                                            <tr>
                                                <th className="p-3">Tabela</th>
                                                <th className="p-3">Nome Trigger</th>
                                                <th className="p-3">Evento</th>
                                                <th className="p-3">Timing</th>
                                                <th className="p-3 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                            {triggers.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800">
                                                    <td className="p-3 font-bold text-white">{t.table_name}</td>
                                                    <td className="p-3 text-orange-300">{t.trigger_name}</td>
                                                    <td className="p-3 text-xs">{t.event_manipulation}</td>
                                                    <td className="p-3 text-xs">{t.action_timing}</td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => setPreviewCode({title: `Trigger: ${t.trigger_name}`, code: t.action_statement})} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white flex items-center gap-1 ml-auto">
                                                            <FaEye/> Ver Código
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. FUNCTIONS TAB */}
                    {activeTab === 'functions' && (
                        <div className="h-full flex flex-col">
                             {isLoadingData ? <div className="text-center p-10"><FaSpinner className="animate-spin text-2xl mx-auto"/> Carregando Funções...</div> : 
                             dataError ? renderEmptyState(dataError) : (
                                <div className="overflow-auto custom-scrollbar border border-gray-700 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-800 text-gray-400 uppercase text-xs sticky top-0">
                                            <tr>
                                                <th className="p-3">Nome Função</th>
                                                <th className="p-3">Retorno</th>
                                                <th className="p-3">Linguagem</th>
                                                <th className="p-3 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                            {functions.map((f, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800">
                                                    <td className="p-3 font-bold text-blue-300">{f.routine_name}</td>
                                                    <td className="p-3 text-xs">{f.data_type}</td>
                                                    <td className="p-3 text-xs">{f.external_language}</td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => setPreviewCode({title: `Função: ${f.routine_name}`, code: f.definition})} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white flex items-center gap-1 ml-auto">
                                                            <FaCode/> Ver Código
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             )}
                        </div>
                    )}

                    {/* 4. POLICIES TAB */}
                    {activeTab === 'policies' && (
                        <div className="h-full flex flex-col">
                             {isLoadingData ? <div className="text-center p-10"><FaSpinner className="animate-spin text-2xl mx-auto"/> Carregando Políticas...</div> : 
                             dataError ? renderEmptyState(dataError) : (
                                <div className="overflow-auto custom-scrollbar border border-gray-700 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-800 text-gray-400 uppercase text-xs sticky top-0">
                                            <tr>
                                                <th className="p-3">Tabela</th>
                                                <th className="p-3">Nome Política</th>
                                                <th className="p-3">Comando</th>
                                                <th className="p-3">Roles</th>
                                                <th className="p-3 text-right">Definição</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                            {policies.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800">
                                                    <td className="p-3 font-bold text-white">{p.tablename}</td>
                                                    <td className="p-3 text-green-300">{p.policyname}</td>
                                                    <td className="p-3 text-xs font-bold uppercase">{p.cmd}</td>
                                                    <td className="p-3 text-xs">{p.roles.join(', ')}</td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => setPreviewCode({title: `RLS: ${p.policyname}`, code: `USING: ${p.qual}\nCHECK: ${p.with_check}`})} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white flex items-center gap-1 ml-auto">
                                                            <FaShieldAlt/> Ver Lógica
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             )}
                        </div>
                    )}

                    {/* 5. SEED TAB */}
                    {activeTab === 'seed' && (
                         <div className="flex flex-col h-full">
                            <div className="bg-gray-800 p-4 rounded-lg mb-4 text-sm text-gray-300 border border-gray-700">
                                <p>Gera 50 colaboradores de teste para popular a base de dados.</p>
                            </div>
                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => handleCopy(scripts.seed, 'seed')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded">
                                        {copied === 'seed' ? <FaCheck /> : <FaCopy />} Copiar
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-gray-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">{scripts.seed}</pre>
                            </div>
                        </div>
                    )}

                    {/* 6. AI TAB */}
                    {activeTab === 'ai' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex gap-4 border-b border-gray-700 pb-2">
                                <label className={`flex items-center gap-2 cursor-pointer text-sm ${aiMode === 'sql' ? 'text-brand-secondary font-bold' : 'text-gray-400'}`}>
                                    <input type="radio" checked={aiMode === 'sql'} onChange={() => setAiMode('sql')} className="hidden"/> <FaDatabase/> Assistente SQL
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer text-sm ${aiMode === 'e2e' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                                    <input type="radio" checked={aiMode === 'e2e'} onChange={() => setAiMode('e2e')} className="hidden"/> <FaPlay/> Gerador de Testes E2E
                                </label>
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder={aiMode === 'sql' ? "Ex: Criar uma tabela de auditoria..." : "Ex: Teste de login com sucesso..."}
                                    className="flex-grow bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                />
                                <button onClick={handleGenerate} disabled={isGenerating || !aiInput.trim()} className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-secondary disabled:opacity-50 flex items-center gap-2">
                                    {isGenerating ? <FaSpinner className="animate-spin"/> : <FaMagic />} Gerar
                                </button>
                            </div>

                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
                                {aiOutput && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <button onClick={() => handleCopy(aiOutput, 'ai')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded">
                                            {copied === 'ai' ? <FaCheck /> : <FaCopy />} Copiar
                                        </button>
                                    </div>
                                )}
                                <pre className="p-4 text-xs font-mono text-blue-300 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">
                                    {aiOutput || "// O código gerado aparecerá aqui..."}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-4 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>

            {/* Code Preview Modal */}
            {previewCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-surface-dark w-full max-w-3xl rounded-lg shadow-2xl border border-gray-600 flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><FaCode/> {previewCode.title}</h3>
                            <button onClick={() => setPreviewCode(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-grow overflow-auto p-4 bg-gray-900">
                            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{previewCode.code}</pre>
                        </div>
                        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                             <p className="text-xs text-gray-500 mr-auto self-center">Copie para editar no separador "AI & Testes" ou SQL Editor.</p>
                             <button onClick={() => handleCopy(previewCode.code, 'preview')} className="bg-brand-primary text-white px-3 py-1.5 rounded text-xs flex items-center gap-2">
                                {copied === 'preview' ? <FaCheck/> : <FaCopy/>} Copiar
                             </button>
                             <button onClick={() => setPreviewCode(null)} className="bg-gray-600 text-white px-3 py-1.5 rounded text-xs">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default DatabaseSchemaModal;
