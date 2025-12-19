
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
-- REPARAÇÃO MASTER v5.1 (SOPHOS INTEGRATION & TICKETS)
-- Resolve: Falha na sincronização Sophos e estrutura de chaves
-- ==================================================================================

-- 1. GARANTIR CHAVES DE CONFIGURAÇÃO PARA SOPHOS
INSERT INTO public.global_settings (setting_key, setting_value)
VALUES 
  ('sophos_client_id', ''),
  ('sophos_client_secret', '')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. CORREÇÃO DA TABELA TICKETS (Garantir que ID é UUID gerado automaticamente)
DO $$ 
BEGIN
  -- Verificar se o ID tem valor padrão gen_random_uuid()
  ALTER TABLE public.tickets ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Coluna id já possui padrão ou não pode ser alterada.';
END $$;

-- 3. PERMISSÕES PARA EDGE FUNCTIONS (Execução RPC se necessário)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
`
    };

    return (
        <Modal title="Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('setup')} className={`px-4 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'setup' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaTerminal /> Reparação v5.1 (Sophos & Config)
                    </button>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'setup' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-4">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaExclamationTriangle /> Integração de Sistemas</div>
                                <p>Este script prepara a base de dados para receber as credenciais da API Sophos e garante que a criação automática de tickets funcione sem erros de ID.</p>
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
