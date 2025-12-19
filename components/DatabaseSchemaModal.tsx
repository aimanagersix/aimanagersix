
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaSearch, FaExclamationTriangle, FaBolt, FaShieldAlt } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

type TabType = 'diagnostic' | 'repair';

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('repair');
    const [copied, setCopied] = useState<string | null>(null);
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const scripts = {
        diagnostic: `
-- 1. LISTAR COLUNAS REAIS (PARA VERIFICAÇÃO)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('assignments', 'license_assignments', 'tickets', 'messages', 'collaborators')
ORDER BY table_name, column_name;`,

        repair: `-- ==================================================================================
-- SCRIPT DE REPARAÇÃO DEFINITIVA v8.0 (Baseado em Diagnóstico Real)
-- Objetivo: Corrigir RLS e Colunas usando nomes exatos com Case-Sensitivity
-- ==================================================================================

-- 1. GARANTIR QUE AS COLUNAS EXISTEM (COM OS NOMES DETETADOS NO CSV)
-- Usamos aspas duplas para respeitar o CamelCase no PostgreSQL

DO $$ 
BEGIN
    -- Tabela Assignments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='returnDate') THEN
        ALTER TABLE "assignments" ADD COLUMN "returnDate" DATE;
    END IF;

    -- Tabela License Assignments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='returnDate') THEN
        ALTER TABLE "license_assignments" ADD COLUMN "returnDate" DATE;
    END IF;
END $$;

-- 2. LIMPEZA DE POLÍTICAS ANTIGAS (PARA EVITAR CONFLITOS)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "assignments";
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "license_assignments";
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "messages";
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "tickets";

-- 3. RECRIAR POLÍTICAS RLS COM NOMES DE COLUNAS CORRETOS (Aspas Duplas)

-- ASSIGNMENTS
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON "assignments" 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LICENSE ASSIGNMENTS
ALTER TABLE "license_assignments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON "license_assignments" 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TICKETS
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON "tickets" 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MESSAGES (Crucial para o Chat)
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON "messages" 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COLLABORATORS
ALTER TABLE "collaborators" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON "collaborators" 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. GRANT DE PERMISSÕES PARA O ROLE ANON/AUTHENTICATED
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
`
    };

    return (
        <Modal title="Gestão de Estrutura de Dados" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('repair')} className={`px-4 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'repair' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaBolt /> Script de Reparação v8.0
                    </button>
                    <button onClick={() => setActiveTab('diagnostic')} className={`px-4 py-2 text-xs font-medium rounded flex items-center gap-2 transition-colors ${activeTab === 'diagnostic' ? 'bg-gray-800 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        <FaSearch /> Verificador de Colunas
                    </button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'repair' ? (
                        <div className="flex flex-col h-full">
                            <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg text-sm text-yellow-200 mb-4">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaExclamationTriangle /> Reparação Final (Respeita CamelCase)</div>
                                <p>Este script utiliza <code>"aspas duplas"</code> para as colunas detetadas no seu diagnóstico. Isso impede o erro 42703 (coluna não existe) no PostgreSQL.</p>
                            </div>
                            <div className="relative flex-grow bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-inner">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => handleCopy(scripts.repair, 'rep')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg hover:bg-brand-secondary">
                                        {copied === 'rep' ? <FaCheck /> : <FaCopy />} Copiar SQL de Reparação
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-green-400 overflow-auto flex-grow custom-scrollbar whitespace-pre-wrap">{scripts.repair}</pre>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-full">
                                <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Script de Consulta de Schema</span>
                                    <button onClick={() => handleCopy(scripts.diagnostic, 'diag')} className="p-1.5 bg-gray-700 text-white rounded hover:bg-gray-600">
                                        {copied === 'diag' ? <FaCheck /> : <FaCopy />}
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-blue-400 overflow-auto flex-grow">{scripts.diagnostic}</pre>
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
