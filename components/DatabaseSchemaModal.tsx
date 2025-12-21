
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
TRUNCATE public.ticket_activities RESTART IDENTITY CASCADE;
TRUNCATE public.tickets RESTART IDENTITY CASCADE;
TRUNCATE public.messages RESTART IDENTITY CASCADE;
TRUNCATE public.license_assignments RESTART IDENTITY CASCADE;
TRUNCATE public.assignments RESTART IDENTITY CASCADE;
TRUNCATE public.audit_log RESTART IDENTITY CASCADE;
`;

    const migrationScript = `DO $$ 
BEGIN
    -- 1. [Tabela: tickets] Normalização
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='instituicao_id') THEN
        ALTER TABLE public.tickets ADD COLUMN instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL;
    END IF;

    -- 2. [Garantia de Dados] Equipa de Triagem
    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Triagem') THEN
        INSERT INTO public.teams (id, name, description, is_active)
        VALUES (gen_random_uuid(), 'Triagem', 'Equipa responsável pela classificação e encaminhamento inicial de pedidos.', true);
    END IF;

    -- 3. POLÍTICAS DE SEGURANÇA (RLS) - Correção Pedido 2 (Visibilidade de Licenças)
    -- Garantir que todos os utilizadores autenticados podem ver as atribuições de licenças
    DROP POLICY IF EXISTS "Authenticated users can view license assignments" ON public.license_assignments;
    CREATE POLICY "Authenticated users can view license assignments" ON public.license_assignments
    FOR SELECT TO authenticated
    USING (true);

    DROP POLICY IF EXISTS "Admins can manage license assignments" ON public.license_assignments;
    CREATE POLICY "Admins can manage license assignments" ON public.license_assignments
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

    -- Garantir permissões básicas de leitura
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_assignments TO authenticated;
    GRANT SELECT ON public.software_licenses TO authenticated;
    GRANT SELECT ON public.assignments TO authenticated;
    GRANT SELECT ON public.equipment TO authenticated;
    GRANT SELECT, INSERT ON public.messages TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
    GRANT SELECT, INSERT ON public.ticket_activities TO authenticated;

END $$;`;

    return (
        <Modal title="Manutenção e Schema da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('migration')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'migration' ? 'border-brand-primary text-white bg-gray-800/50' : 'border-transparent text-gray-400 hover:text-white'}`}>Migração de Colunas</button>
                    <button onClick={() => setActiveTab('cleanup')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'cleanup' ? 'border-red-500 text-white bg-red-900/10' : 'border-transparent text-gray-400 hover:text-white'}`}>Limpeza de "Lixo" (Reset)</button>
                </div>

                {activeTab === 'migration' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-sm text-amber-200">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><FaExclamationTriangle className="text-amber-400" /> Correção de Schema v38.0</h3>
                            <p>Este script garante a existência da equipa de <strong>Triagem</strong> e permissões de leitura de <strong>licenças</strong> para todos.</p>
                        </div>
                        <div className="relative bg-gray-900 border border-gray-700 rounded-lg h-[35vh]">
                            <button onClick={() => handleCopy(migrationScript, 'mig')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                                {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar Script SQL
                            </button>
                            <pre className="p-4 text-[10px] font-mono text-blue-400 overflow-auto h-full custom-scrollbar">{migrationScript}</pre>
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
