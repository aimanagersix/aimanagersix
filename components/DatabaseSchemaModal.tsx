
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
-- REPARAÇÃO MASTER v4.9 (PERSISTÊNCIA DE LICENÇAS E ACESSO SELF-SERVICE)
-- Resolve: Erro ao gravar licenças e bloqueio de cliques na Minha Área
-- ==================================================================================

-- 1. NORMALIZAÇÃO RIGOROSA DA TABELA 'license_assignments'
DO $$ 
BEGIN
  -- Normalizar equipmentId (Garante que o Postgres reconhece camelCase via aspas)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='equipment_id') THEN
    ALTER TABLE public.license_assignments RENAME COLUMN equipment_id TO "equipmentId";
  END IF;

  -- Normalizar softwareLicenseId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='software_license_id') THEN
    ALTER TABLE public.license_assignments RENAME COLUMN software_license_id TO "softwareLicenseId";
  END IF;

  -- Normalizar datas
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='assigned_date') THEN
    ALTER TABLE public.license_assignments RENAME COLUMN assigned_date TO "assignedDate";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='return_date') THEN
    ALTER TABLE public.license_assignments RENAME COLUMN return_date TO "returnDate";
  END IF;
END $$;

-- 2. REVISÃO DE POLÍTICAS RLS PARA GRAVAÇÃO
ALTER TABLE public.license_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow management of license assignments" ON public.license_assignments;
DROP POLICY IF EXISTS "Users can view assigned licenses" ON public.license_assignments;

-- Permitir INSERT/UPDATE/DELETE para Admins e Técnicos (ou quem tem permissão explícita)
CREATE POLICY "Enable license assignment management" 
ON public.license_assignments
FOR ALL 
TO authenticated 
USING (
    public.has_permission('licensing', 'edit') 
    OR public.has_permission('equipment', 'edit')
    OR (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico')
)
WITH CHECK (
    public.has_permission('licensing', 'edit') 
    OR public.has_permission('equipment', 'edit')
    OR (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico')
);

-- Permitir SELECT para o utilizador ver o que lhe está atribuído
CREATE POLICY "Users view own equipment licenses"
ON public.license_assignments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a 
        WHERE a."equipmentId" = public.license_assignments."equipmentId" 
        AND a."collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
        AND a."returnDate" IS NULL
    )
    OR public.has_permission('licensing', 'view')
);

-- 3. REFRESH CACHE
NOTIFY pgrst, 'reload schema';
`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-4 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> Reparação v4.9 (Licenças & RLS)
                    </button>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaExclamationTriangle /> Correção de Persistência</div>
                                <p>Este script resolve a falha na gravação de licenças e garante que o utilizador consiga ver os seus ativos na "Minha Área".</p>
                            </div>
                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-inner">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => handleCopy(scripts.setup, 'setup')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                                        {copied === 'setup' ? <FaCheck /> : <FaCopy />} Copiar SQL
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-green-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">{scripts.setup}</pre>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
