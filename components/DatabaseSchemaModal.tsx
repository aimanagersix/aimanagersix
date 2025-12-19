
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
-- REPARAÇÃO MASTER DE POLÍTICAS E COLUNAS (v4.7 - FAIL-SAFE)
-- Resolve: ERROR 42703 (column does not exist) e bloqueio de SuperAdmin
-- ==================================================================================

-- 1. DESATIVAR RLS TEMPORARIAMENTE PARA MANUTENÇÃO DE ESTRUTURA
ALTER TABLE IF EXISTS public.policy_acceptances DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active policies" ON public.policies;
DROP POLICY IF EXISTS "Users can insert their own acceptance" ON public.policy_acceptances;
DROP POLICY IF EXISTS "Users can view their own acceptance" ON public.policy_acceptances;

-- 2. NORMALIZAÇÃO DA COLUNA 'collaboratorId' (Case Sensitive)
-- Este bloco verifica se a coluna existe com outros nomes e renomeia, ou cria se não existir.
DO $$ 
BEGIN
  -- Se existe 'collaborator_id', renomeia para 'collaboratorId'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='policy_acceptances' AND column_name='collaborator_id') THEN
    ALTER TABLE public.policy_acceptances RENAME COLUMN collaborator_id TO "collaboratorId";
  
  -- Se não existe nem 'collaborator_id' nem 'collaboratorId', cria a coluna
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='policy_acceptances' AND column_name='collaboratorId') THEN
    ALTER TABLE public.policy_acceptances ADD COLUMN "collaboratorId" UUID REFERENCES public.collaborators(id);
  END IF;
END $$;

-- 3. GARANTIR QUE A TABELA 'policies' É ACESSÍVEL PARA LEITURA NO LOGIN
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active policies" ON public.policies
FOR SELECT TO authenticated USING (is_active = true);

-- 4. RE-ATIVAR E CONFIGURAR RLS PARA ACEITAÇÕES
ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;

-- Política de Inserção: O utilizador só pode inserir a sua própria aceitação
CREATE POLICY "Users can insert their own acceptance" ON public.policy_acceptances
FOR INSERT TO authenticated 
WITH CHECK (
    "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
);

-- Política de Leitura: Ver as próprias aceitações ou todas se for Admin
CREATE POLICY "Users can view their own acceptance" ON public.policy_acceptances
FOR SELECT TO authenticated 
USING (
    "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
    OR (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin')
);

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> 1. Reparação Master v4.7 (Fail-Safe)
                    </button>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4 flex-shrink-0">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaExclamationTriangle /> Correção de Acesso Crítico</div>
                                <p>Execute este script no SQL Editor do Supabase para corrigir o erro de coluna e permitir a aceitação de políticas por todos os utilizadores.</p>
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
