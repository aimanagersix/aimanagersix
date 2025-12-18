
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
    
    const [policies, setPolicies] = useState<DbPolicy[]>([]);
    const [triggers, setTriggers] = useState<DbTrigger[]>([]);
    const [functions, setFunctions] = useState<DbFunction[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataError, setDataError] = useState('');

    const [previewCode, setPreviewCode] = useState<{title: string, code: string} | null>(null);

    const [aiInput, setAiInput] = useState('');
    const [aiOutput, setAiOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiMode, setAiMode] = useState<'sql' | 'e2e'>('sql');

    useEffect(() => {
        const loadMetadata = async () => {
            setIsLoadingData(true);
            setDataError('');
            try {
                if (activeTab === 'policies') {
                    const data = await dataService.fetchDbPolicies();
                    setPolicies(data);
                } else if (activeTab === 'triggers') {
                    const data = await dataService.fetchDbTriggers();
                    setTriggers(data);
                } else if (activeTab === 'functions') {
                    const data = await dataService.fetchDbFunctions();
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
-- 1. REPARAÇÃO DE AUDITORIA E PERMISSÕES (v3.2)
-- Execute este script para corrigir a visualização dos Logs de Auditoria.
-- ==================================================================================

-- A. Garantir existência da tabela audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "timestamp" timestamp with time zone DEFAULT now(),
    user_email text,
    action text,
    resource_type text,
    resource_id text,
    details text
);

-- B. Limpar políticas antigas da auditoria
DROP POLICY IF EXISTS "Admins read audit" ON public.audit_log;
DROP POLICY IF EXISTS "System write audit" ON public.audit_log;
DROP POLICY IF EXISTS "Auth read all audit" ON public.audit_log;

-- C. Novas Políticas de Auditoria (Visível para todos autenticados)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read audit" ON public.audit_log 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "System insert audit" ON public.audit_log 
FOR INSERT TO authenticated WITH CHECK (true);

-- D. Funções de Inspeção (Obrigatórias)
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

GRANT EXECUTE ON FUNCTION get_db_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_db_triggers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_db_functions() TO authenticated;

NOTIFY pgrst, 'reload schema';
`,
        seed: `
-- SEED DATA... (Inalterado)
`
    };

    return (
        <Modal title="Configuração e Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> 1. Instalação & Auditoria
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-1"></div>
                    <button onClick={() => setActiveTab('triggers')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'triggers' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaBolt /> Triggers
                    </button>
                    <button onClick={() => setActiveTab('functions')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'functions' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaCogs /> Funções
                    </button>
                    <button onClick={() => setActiveTab('policies')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'policies' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaShieldAlt /> Políticas (RLS)
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-1"></div>
                    <button onClick={() => setActiveTab('ai')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaRobot /> AI Help
                    </button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-4 flex-shrink-0">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaDatabase /> Reparação dos Logs de Auditoria</div>
                                <p>Este script resolve o problema dos logs não aparecerem. Ele limpa políticas conflitantes e garante acesso de leitura à tabela de auditoria para administradores.</p>
                            </div>
                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-inner">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => handleCopy(scripts.setup, 'setup')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg transition-transform active:scale-95">
                                        {copied === 'setup' ? <FaCheck /> : <FaCopy />} {copied === 'setup' ? 'Copiado!' : 'Copiar Script'}
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-green-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">{scripts.setup}</pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'triggers' && (
                        <div className="h-full overflow-auto custom-scrollbar border border-gray-700 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-800 text-gray-400 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="p-3">Tabela</th>
                                        <th className="p-3">Nome Trigger</th>
                                        <th className="p-3">Evento</th>
                                        <th className="p-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                    {triggers.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-gray-800">
                                            <td className="p-3 font-bold text-white">{t.table_name}</td>
                                            <td className="p-3 text-orange-300">{t.trigger_name}</td>
                                            <td className="p-3 text-xs">{t.event_manipulation}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => setPreviewCode({title: `Trigger: ${t.trigger_name}`, code: t.action_statement})} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white ml-auto">Ver</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'policies' && (
                        <div className="h-full overflow-auto custom-scrollbar border border-gray-700 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-800 text-gray-400 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="p-3">Tabela</th>
                                        <th className="p-3">Nome Política</th>
                                        <th className="p-3">Cmd</th>
                                        <th className="p-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                    {policies.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-gray-800">
                                            <td className="p-3 font-bold text-white">{p.tablename}</td>
                                            <td className="p-3 text-green-300">{p.policyname}</td>
                                            <td className="p-3 text-xs font-bold uppercase">{p.cmd}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => setPreviewCode({title: `RLS: ${p.policyname}`, code: `USING: ${p.qual}\nCHECK: ${p.with_check}`})} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white ml-auto">Ver</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {activeTab === 'ai' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex gap-4 border-b border-gray-700 pb-2">
                                <label className={`flex items-center gap-2 cursor-pointer text-sm ${aiMode === 'sql' ? 'text-brand-secondary font-bold' : 'text-gray-400'}`}>
                                    <input type="radio" checked={aiMode === 'sql'} onChange={() => setAiMode('sql')} className="hidden"/> <FaDatabase/> Assistente SQL
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer text-sm ${aiMode === 'e2e' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                                    <input type="radio" checked={aiMode === 'e2e'} onChange={() => setAiMode('e2e')} className="hidden"/> <FaPlay/> Gerador de Testes
                                </label>
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder="Descreva o que deseja gerar..."
                                    className="flex-grow bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                />
                                <button onClick={handleGenerate} disabled={isGenerating || !aiInput.trim()} className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-secondary disabled:opacity-50 flex items-center gap-2">
                                    {isGenerating ? <FaSpinner className="animate-spin"/> : <FaMagic />} Gerar
                                </button>
                            </div>

                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-inner">
                                {aiOutput && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <button onClick={() => handleCopy(aiOutput, 'ai')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded">
                                            {copied === 'ai' ? <FaCheck /> : <FaCopy />}
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

            {previewCode && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-surface-dark w-full max-w-3xl rounded-lg shadow-2xl border border-gray-600 flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><FaCode/> {previewCode.title}</h3>
                            <button onClick={() => setPreviewCode(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-grow overflow-auto p-4 bg-gray-900">
                            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{previewCode.code}</pre>
                        </div>
                        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
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
