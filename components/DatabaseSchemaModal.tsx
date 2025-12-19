
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
/* Added FaCheckCircle to imports */
import { FaDatabase, FaCheck, FaCopy, FaTerminal, FaShieldAlt, FaTable, FaCode, FaRobot, FaMagic, FaPlay, FaBolt, FaCogs, FaSpinner, FaSeedling, FaEye, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
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
-- REPARAÇÃO MASTER v5.0 (FINAL FIX: DATA ISOLATION & LICENSES)
-- Resolve: Utilizador a ver equipamentos de outros e licenças invisíveis
-- ==================================================================================

-- 1. NORMALIZAÇÃO FINAL DE COLUNAS (Garante compatibilidade total com JS camelCase)
DO $$ 
BEGIN
  -- Tabela assignments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='equipment_id') THEN
    ALTER TABLE public.assignments RENAME COLUMN equipment_id TO "equipmentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='collaborator_id') THEN
    ALTER TABLE public.assignments RENAME COLUMN collaborator_id TO "collaboratorId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='entidade_id') THEN
    ALTER TABLE public.assignments RENAME COLUMN entidade_id TO "entidadeId";
  END IF;

  -- Tabela license_assignments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='equipment_id') THEN
    ALTER TABLE public.license_assignments RENAME COLUMN equipment_id TO "equipmentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='software_license_id') THEN
    ALTER TABLE public.license_assignments RENAME COLUMN software_license_id TO "softwareLicenseId";
  END IF;
END $$;

-- 2. REFORÇO DE RLS PARA LICENÇAS (Permite ver se o equipamento for dele)
ALTER TABLE public.license_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable license assignment management" ON public.license_assignments;
DROP POLICY IF EXISTS "Users view own equipment licenses" ON public.license_assignments;

CREATE POLICY "Admin/Tech manage all licenses" 
ON public.license_assignments FOR ALL TO authenticated 
USING ( public.has_permission('licensing', 'edit') OR (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico') );

CREATE POLICY "Users view licenses of their assets"
ON public.license_assignments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a 
        WHERE a."equipmentId" = public.license_assignments."equipmentId" 
        AND a."collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
        AND a."returnDate" IS NULL
    )
);

-- 3. REFORÇO DE RLS PARA EQUIPAMENTOS (Garante que view_own funciona na base)
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view assigned equipment" ON public.equipment;

CREATE POLICY "Users view assigned equipment"
ON public.equipment FOR SELECT TO authenticated
USING (
    public.has_permission('equipment', 'view') 
    OR EXISTS (
        SELECT 1 FROM public.assignments a 
        WHERE a."equipmentId" = public.equipment.id 
        AND a."collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email')
        AND a."returnDate" IS NULL
    )
);

NOTIFY pgrst, 'reload schema';
`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-4 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> Reparação v5.0 (Isolamento & Licenças)
                    </button>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-4">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaCheckCircle /> Correção de Visibilidade</div>
                                <p>Este script garante que os utilizadores limitados apenas vejam os seus próprios ativos e consigam visualizar as respetivas licenças de software.</p>
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
