
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

    const [aiInput, setAiInput] = useState('');
    const [aiOutput, setAiOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

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
                setDataError("Erro ao carregar metadados.");
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

    const scripts = {
        setup: `
-- ==================================================================================
-- REPARAÇÃO TOTAL DE SEGURANÇA E POLÍTICAS (v4.6 - UNIFIED COLUMNS)
-- Resolve erro de "collaborator_id" e garante visibilidade das Políticas no Login
-- ==================================================================================

-- 1. LIMPEZA DE FUNÇÃO RBAC
DROP FUNCTION IF EXISTS public.has_permission(text, text) CASCADE;

-- 2. RE-CRIAÇÃO DA FUNÇÃO RBAC (Suporta Admin Bypass)
CREATE OR REPLACE FUNCTION public.has_permission(p_module text, p_action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role_name text;
    v_perms jsonb;
BEGIN
    SELECT role INTO v_role_name FROM public.collaborators WHERE email = auth.jwt()->>'email';
    IF v_role_name = 'SuperAdmin' THEN RETURN true; END IF;
    SELECT permissions INTO v_perms FROM public.config_custom_roles WHERE name = v_role_name;
    RETURN COALESCE((v_perms->p_module->>p_action)::boolean, false);
END; $$;

-- 3. GARANTIR COLUNA 'collaboratorId' NA TABELA DE ACEITAÇÕES
-- Se a sua tabela tem 'collaborator_id', este script renomeia-a para manter consistência
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='policy_acceptances' AND column_name='collaborator_id') THEN
    ALTER TABLE public.policy_acceptances RENAME COLUMN collaborator_id TO "collaboratorId";
  END IF;
END $$;

-- 4. POLÍTICA DE LEITURA PARA 'policies'
-- Obrigatório: Todos os autenticados devem conseguir LER as políticas para as aceitar
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active policies" ON public.policies;
CREATE POLICY "Anyone can read active policies" ON public.policies
FOR SELECT TO authenticated USING (is_active = true);

-- 5. POLÍTICA DE INSERÇÃO PARA 'policy_acceptances'
ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own acceptance" ON public.policy_acceptances;
CREATE POLICY "Users can insert their own acceptance" ON public.policy_acceptances
FOR INSERT TO authenticated 
WITH CHECK (
    "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
);

-- 6. POLÍTICA DE LEITURA PARA 'policy_acceptances'
DROP POLICY IF EXISTS "Users can view their own acceptance" ON public.policy_acceptances;
CREATE POLICY "Users can view their own acceptance" ON public.policy_acceptances
FOR SELECT TO authenticated 
USING (
    public.has_permission('compliance_policies', 'view')
    OR "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
);

-- 7. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> 1. Reparação Master v4.6 (Colunas & RLS)
                    </button>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4 flex-shrink-0">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaExclamationTriangle /> Correção de Acesso</div>
                                <p>Este script resolve o erro de gravação de políticas e garante que utilizadores limitados as conseguem ler no ecrã de entrada.</p>
                            </div>
                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-inner">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => handleCopy(scripts.setup, 'setup')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg transition-transform active:scale-95">
                                        {copied === 'setup' ? <FaCheck /> : <FaCopy />} Copiar Script
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-green-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">{scripts.setup}</pre>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-700 mt-4 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
