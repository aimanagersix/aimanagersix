
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaSearch, FaBroom, FaHistory } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'migration' | 'cleanup' | 'inspect'>('migration');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const cleanupScript = `-- SCRIPT DE LIMPEZA OPERACIONAL (CLEANUP v1.0)
-- Este script apaga dados transacionais mas PRESERVA as configurações e estrutura.

TRUNCATE public.ticket_activities RESTART IDENTITY CASCADE;
TRUNCATE public.tickets RESTART IDENTITY CASCADE;
TRUNCATE public.messages RESTART IDENTITY CASCADE;
TRUNCATE public.license_assignments RESTART IDENTITY CASCADE;
TRUNCATE public.assignments RESTART IDENTITY CASCADE;
TRUNCATE public.audit_log RESTART IDENTITY CASCADE;
TRUNCATE public.backup_executions RESTART IDENTITY CASCADE;
TRUNCATE public.resilience_tests RESTART IDENTITY CASCADE;
TRUNCATE public.vulnerabilities RESTART IDENTITY CASCADE;
`;

    const migrationScript = `DO $$ 
BEGIN
    -- 1. [Tabela: tickets] Normalização
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='softwareLicenseId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='software_license_id') THEN 
        ALTER TABLE public.tickets RENAME COLUMN "softwareLicenseId" TO software_license_id; 
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='software_license_id') THEN
        ALTER TABLE public.tickets ADD COLUMN software_license_id UUID REFERENCES public.software_licenses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='instituicao_id') THEN
        ALTER TABLE public.tickets ADD COLUMN instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;
    END IF;

    -- 2. [Tabela: license_assignments] Normalização CRÍTICA para Pedido 3
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='equipmentId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='equipment_id') THEN 
        ALTER TABLE public.license_assignments RENAME COLUMN "equipmentId" TO equipment_id; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='softwareLicenseId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='software_license_id') THEN 
        ALTER TABLE public.license_assignments RENAME COLUMN "softwareLicenseId" TO software_license_id; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='assignedDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='assigned_date') THEN 
        ALTER TABLE public.license_assignments RENAME COLUMN "assignedDate" TO assigned_date; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='returnDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='license_assignments' AND column_name='return_date') THEN 
        ALTER TABLE public.license_assignments RENAME COLUMN "returnDate" TO return_date; 
    END IF;

    -- 3. POLÍTICAS DE SEGURANÇA (RLS) - Correção Pedido 2 (Visibilidade)
    -- Permitir que utilizadores vejam os equipamentos que lhes estão atribuídos
    DROP POLICY IF EXISTS "Users can view own assignments" ON public.assignments;
    CREATE POLICY "Users can view own assignments" ON public.assignments
    FOR SELECT TO authenticated
    USING (collaborator_id = auth.uid());

    -- Permitir leitura de equipamentos se o utilizador for o detentor (via assignments)
    DROP POLICY IF EXISTS "Users can view assigned equipment" ON public.equipment;
    CREATE POLICY "Users can view assigned equipment" ON public.equipment
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT equipment_id FROM public.assignments 
            WHERE collaborator_id = auth.uid() AND return_date IS NULL
        )
    );

    -- Garantir permissões básicas de leitura em tabelas auxiliares para todos
    GRANT SELECT ON public.software_licenses TO authenticated;
    GRANT SELECT ON public.license_assignments TO authenticated;
    GRANT SELECT ON public.assignments TO authenticated;
    GRANT SELECT ON public.equipment TO authenticated;

END $$;`;

    return (
        <Modal title="Manutenção e Schema da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('migration')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'migration' ? 'border-brand-primary text-white bg-gray-800/50' : 'border-transparent text-gray-400 hover:text-white'}`}>Migração de Colunas</button>
                    <button onClick={() => setActiveTab('cleanup')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'cleanup' ? 'border-red-500 text-white bg-red-900/10' : 'border-transparent text-gray-400 hover:text-white'}`}>Limpeza de "Lixo" (Reset)</button>
                    <button onClick={() => setActiveTab('inspect')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'inspect' ? 'border-brand-primary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Inspeção</button>
                </div>

                {activeTab === 'migration' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-sm text-amber-200">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><FaExclamationTriangle className="text-amber-400" /> Correção de Schema v35.0</h3>
                            <p>Este script normaliza as tabelas de <strong>atribuição de licenças</strong> e garante que utilizadores comuns consigam <strong>visualizar os seus ativos</strong> nos modais de suporte.</p>
                        </div>
                        <div className="relative bg-gray-900 border border-gray-700 rounded-lg h-[35vh]">
                            <button onClick={() => handleCopy(migrationScript, 'mig')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                                {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar Script SQL
                            </button>
                            <pre className="p-4 text-[10px] font-mono text-blue-400 overflow-auto h-full custom-scrollbar">{migrationScript}</pre>
                        </div>
                    </div>
                )}

                {activeTab === 'cleanup' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg text-sm text-red-200">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><FaBroom className="text-red-400" /> Ferramenta de Limpeza Operacional</h3>
                            <p>Utilize o script abaixo para <strong>apagar todos os tickets, históricos e logs</strong>.</p>
                        </div>
                        <div className="relative bg-gray-900 border border-red-500/30 rounded-lg h-[35vh]">
                            <button onClick={() => handleCopy(cleanupScript, 'clean')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow-lg">
                                {copied === 'clean' ? <FaCheck /> : <FaCopy />} Copiar Script de Limpeza
                            </button>
                            <pre className="p-4 text-[10px] font-mono text-red-400 overflow-auto h-full custom-scrollbar">{cleanupScript}</pre>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fechar Janela</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
