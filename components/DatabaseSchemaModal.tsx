
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
-- REPARAÇÃO MASTER v6.0 (ISOLAMENTO DE DADOS & RLS)
-- Resolve: Utilizadores vendo equipamentos alheios e campos vazios na Minha Área.
-- ==================================================================================

-- 1. LIMPEZA DE POLÍTICAS ANTIGAS (EQUIPAMENTOS E LICENÇAS)
DROP POLICY IF EXISTS "equipment_isolation_policy" ON equipment;
DROP POLICY IF EXISTS "licenses_isolation_policy" ON software_licenses;
DROP POLICY IF EXISTS "instituicoes_read_policy" ON instituicoes;
DROP POLICY IF EXISTS "entidades_read_policy" ON entidades;

-- 2. POLÍTICA DE EQUIPAMENTOS (ISOLAMENTO REAL)
-- Regra: Admin vê tudo. User só vê se estiver atribuído a ele na tabela assignments.
CREATE POLICY "equipment_isolation_v6" ON public.equipment
FOR SELECT TO authenticated
USING (
  (SELECT role FROM collaborators WHERE email = auth.jwt()->>'email') IN ('SuperAdmin', 'Admin', 'Técnico')
  OR 
  id IN (
    SELECT "equipmentId" FROM assignments 
    WHERE ("collaboratorId" = (SELECT id FROM collaborators WHERE email = auth.jwt()->>'email'))
    AND "returnDate" IS NULL
  )
);

-- 3. POLÍTICA DE LICENÇAS (ISOLAMENTO REAL)
-- Regra: User só vê licenças que estão instaladas nos SEUS equipamentos.
CREATE POLICY "licenses_isolation_v6" ON public.software_licenses
FOR SELECT TO authenticated
USING (
  (SELECT role FROM collaborators WHERE email = auth.jwt()->>'email') IN ('SuperAdmin', 'Admin', 'Técnico')
  OR 
  id IN (
    SELECT "softwareLicenseId" FROM license_assignments
    WHERE "equipmentId" IN (
       SELECT "equipmentId" FROM assignments 
       WHERE ("collaboratorId" = (SELECT id FROM collaborators WHERE email = auth.jwt()->>'email'))
       AND "returnDate" IS NULL
    )
    AND "returnDate" IS NULL
  )
);

-- 4. PERMISSÃO DE LEITURA DE ORG (Para resolver nomes na Minha Área)
-- Permite que qualquer utilizador autenticado leia os nomes das instituições e entidades 
-- para que a UI consiga "traduzir" IDs em Nomes.
CREATE POLICY "org_read_v6" ON public.instituicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "entidades_read_v6" ON public.entidades FOR SELECT TO authenticated USING (true);

-- 5. GARANTIR CHAVES DE CONFIGURAÇÃO PARA SOPHOS
INSERT INTO public.global_settings (setting_key, setting_value)
VALUES 
  ('sophos_client_id', ''),
  ('sophos_client_secret', '')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. REFRESH SCHEMA
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-4 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> Reparação v6.0 (Isolamento RLS)
                    </button>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaShieldAlt /> Segurança de Dados Ativada</div>
                                <p>Este script impõe o isolamento de dados no PostgreSQL. Após a execução, os utilizadores com permissões limitadas deixarão de ver equipamentos que não lhes pertencem, mesmo que tentem aceder via API.</p>
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
