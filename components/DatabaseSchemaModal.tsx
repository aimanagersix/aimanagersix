
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

    const handleGenerate = async () => {
        if (!aiInput.trim()) return;
        setIsGenerating(true);
        setAiOutput('');
        try {
            let result = await generateSqlHelper(aiInput);
            result = result.replace(/```sql/g, '').replace(/```/g, '');
            setAiOutput(result);
        } catch (error: any) {
            setAiOutput(`-- Erro ao gerar SQL.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const scripts = {
        setup: `
-- ==================================================================================
-- REPARAÇÃO TOTAL DE SEGURANÇA (v4.5 - THE MASTER FIX)
-- 1. Resolve erro "cannot drop function because other objects depend on it"
-- 2. Garante que Utilizadores vêem os seus equipamentos na "Minha Área"
-- ==================================================================================

-- A. LIMPEZA RADICAL DE DEPENDÊNCIAS
-- O CASCADE remove todas as políticas que usam a função automaticamente.
DROP FUNCTION IF EXISTS public.has_permission(text, text) CASCADE;

-- B. RE-CRIAÇÃO DA FUNÇÃO DE PERMISSÃO (RBAC)
CREATE OR REPLACE FUNCTION public.has_permission(p_module text, p_action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role_name text;
    v_perms jsonb;
BEGIN
    -- 1. Obter o papel do utilizador pelo email do JWT
    SELECT role INTO v_role_name FROM public.collaborators WHERE email = auth.jwt()->>'email';
    
    -- 2. SuperAdmin tem sempre acesso total (bypass)
    IF v_role_name = 'SuperAdmin' THEN RETURN true; END IF;

    -- 3. Obter o JSON de permissões
    SELECT permissions INTO v_perms FROM public.config_custom_roles WHERE name = v_role_name;

    -- 4. Retornar permissão (Default FALSE se nulo)
    RETURN COALESCE((v_perms->p_module->>p_action)::boolean, false);
END; $$;

-- C. REAPLICAÇÃO DE POLÍTICAS RLS (Após o CASCADE)

-- 1. EQUIPAMENTOS (Crucial para a Minha Área)
-- Vejo se tenho 'view' global OU se o item está atribuído a mim.
CREATE POLICY "Unified equipment select" ON public.equipment
FOR SELECT TO authenticated 
USING (
    public.has_permission('equipment', 'view') 
    OR EXISTS (
        SELECT 1 FROM public.assignments 
        WHERE "equipmentId" = public.equipment.id 
        AND "returnDate" IS NULL 
        AND "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
    )
);

-- 2. TICKETS
CREATE POLICY "Unified tickets select" ON public.tickets
FOR SELECT TO authenticated 
USING (
    public.has_permission('tickets', 'view')
    OR "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
);

-- 3. FORMAÇÕES
CREATE POLICY "Unified trainings select" ON public.security_trainings
FOR SELECT TO authenticated 
USING (
    public.has_permission('compliance_training', 'view')
    OR collaborator_id = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
);

-- 4. ATRIBUIÇÕES (Necessário para a lógica de ver o meu equipamento)
CREATE POLICY "Unified assignments select" ON public.assignments
FOR SELECT TO authenticated USING (true); -- Leitura aberta, o filtro final é feito no Equipamento

-- 5. TABELAS DE CONFIGURAÇÃO (Sempre legíveis para autenticados)
ALTER TABLE public.config_custom_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read config" ON public.config_custom_roles;
CREATE POLICY "Read config" ON public.config_custom_roles FOR SELECT TO authenticated USING (true);

-- D. RECARREGAR
NOTIFY pgrst, 'reload schema';
`,
        seed: `-- SEED DATA...`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-3 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> 1. Reparação Master v4.5 (CASCADE)
                    </button>
                    {/* ... outros botões se necessário ... */}
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4 flex-shrink-0">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaExclamationTriangle /> Reparação Crítica</div>
                                <p>Este script utiliza <strong>CASCADE</strong> para forçar a atualização da segurança, resolvendo o erro de dependências. Execute e recarregue a página.</p>
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
