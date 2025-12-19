
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaTerminal, FaShieldAlt, FaTable, FaCode, FaRobot, FaMagic, FaPlay, FaBolt, FaCogs, FaSpinner, FaSeedling, FaEye, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
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
-- REPARAÇÃO MASTER v6.4 (FULL QUOTED CAMELCASE)
-- Resolve: ERROR 42703 (returnDate / return_date) em schemas sensíveis.
-- ==================================================================================

-- 1. LIMPEZA TOTAL DE POLÍTICAS ANTERIORES
DROP POLICY IF EXISTS "equipment_isolation_policy" ON public.equipment;
DROP POLICY IF EXISTS "equipment_isolation_v6" ON public.equipment;
DROP POLICY IF EXISTS "equipment_isolation_v6_1" ON public.equipment;
DROP POLICY IF EXISTS "equipment_isolation_v6_2" ON public.equipment;
DROP POLICY IF EXISTS "equipment_isolation_v6_3" ON public.equipment;
DROP POLICY IF EXISTS "licenses_isolation_policy" ON public.software_licenses;
DROP POLICY IF EXISTS "licenses_isolation_v6" ON public.software_licenses;
DROP POLICY IF EXISTS "licenses_isolation_v6_1" ON public.software_licenses;
DROP POLICY IF EXISTS "licenses_isolation_v6_2" ON public.software_licenses;
DROP POLICY IF EXISTS "licenses_isolation_v6_3" ON public.software_licenses;
DROP POLICY IF EXISTS "org_read_v6" ON public.instituicoes;
DROP POLICY IF EXISTS "org_read_v6_1" ON public.instituicoes;
DROP POLICY IF EXISTS "org_read_v6_2" ON public.instituicoes;
DROP POLICY IF EXISTS "org_read_v6_3" ON public.instituicoes;
DROP POLICY IF EXISTS "entidades_read_v6" ON public.entidades;
DROP POLICY IF EXISTS "entidades_read_v6_1" ON public.entidades;
DROP POLICY IF EXISTS "entidades_read_v6_2" ON public.entidades;
DROP POLICY IF EXISTS "entidades_read_v6_3" ON public.entidades;
DROP POLICY IF EXISTS "collab_read_v6" ON public.collaborators;
DROP POLICY IF EXISTS "collab_read_v6_1" ON public.collaborators;
DROP POLICY IF EXISTS "collab_read_v6_2" ON public.collaborators;
DROP POLICY IF EXISTS "collab_read_v6_3" ON public.collaborators;

-- 2. POLÍTICA DE EQUIPAMENTOS (NOMES DE COLUNA CITADOS)
CREATE POLICY "equipment_isolation_v6_4" ON public.equipment
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('SuperAdmin', 'Admin', 'Técnico')
  OR 
  id IN (
    SELECT "equipmentId" FROM public.assignments 
    WHERE ("collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email'))
    AND "returnDate" IS NULL
  )
);

-- 3. POLÍTICA DE LICENÇAS (NOMES DE COLUNA CITADOS)
CREATE POLICY "licenses_isolation_v6_4" ON public.software_licenses
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('SuperAdmin', 'Admin', 'Técnico')
  OR 
  id IN (
    SELECT "softwareLicenseId" FROM public.license_assignments
    WHERE "equipmentId" IN (
       SELECT "equipmentId" FROM public.assignments 
       WHERE ("collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email'))
       AND "returnDate" IS NULL
    )
    AND "returnDate" IS NULL
  )
);

-- 4. PERMISSÃO DE LEITURA PARA TRADUÇÃO DE NOMES
CREATE POLICY "org_read_v6_4" ON public.instituicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "entidades_read_v6_4" ON public.entidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "collab_read_v6_4" ON public.collaborators FOR SELECT TO authenticated USING (true);

-- 5. ASSEGURAR RLS ATIVO
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-4 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> Reparação v6.4 (Full Quoted)
                    </button>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaShieldAlt /> Reparação de Schema Concluída</div>
                                <p>Este script utiliza <code>"returnDate"</code> (com aspas) para resolver o erro 42703. Copie e execute no editor SQL do Supabase para restaurar o acesso aos dados.</p>
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
