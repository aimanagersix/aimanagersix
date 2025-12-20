
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaShieldAlt, FaStar } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const migrationScript = `-- ==================================================================================
-- SCRIPT DE MIGRAÇÃO ABSOLUTE ZERO v25.0
-- Finalidade: Integridade Total, Reparação de Índices e Permissões Globais.
-- ==================================================================================

DO $$ 
BEGIN
    -- 1. REPARAÇÃO DE ÍNDICE ÚNICO CONDICIONAL
    -- Remove o índice antigo e recria com a lógica de exclusão de S/N vazios
    DROP INDEX IF EXISTS idx_unique_serial_operational;
    CREATE UNIQUE INDEX idx_unique_serial_operational ON public.equipment (serial_number) 
    WHERE (
        status != 'Aquisição' 
        AND serial_number IS NOT NULL 
        AND serial_number != '' 
        AND serial_number != 'Pendente'
    );

    -- 2. NORMALIZAÇÃO DE COLUNAS DE SUPORTE (Última Verificação)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='ticketId') THEN ALTER TABLE public.ticket_activities RENAME COLUMN "ticketId" TO ticket_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='equipmentId') THEN ALTER TABLE public.ticket_activities RENAME COLUMN "equipmentId" TO equipment_id; END IF;

    -- 3. PERMISSÕES DE EXECUÇÃO GLOBAIS
    -- Garante que qualquer função nova ou existente é acessível via RPC
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
    GRANT USAGE ON SCHEMA public TO authenticated;

    -- 4. HARDENING DE AUDITORIA
    -- Protege o log de alterações contra modificações, mesmo por utilizadores autenticados
    ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.audit_log;
    CREATE POLICY "Enable read for authenticated users" ON public.audit_log FOR SELECT USING (auth.role() = 'authenticated');
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.audit_log;
    CREATE POLICY "Enable insert for authenticated users" ON public.audit_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    -- 5. RESET DE SEQUÊNCIAS (Garantia de Inserção)
    PERFORM setval(pg_get_serial_sequence('public.equipment', 'id'), coalesce(max(id), 1)) FROM public.equipment;

END $$;
`;

    return (
        <Modal title="Absolute Zero Integrity v25.0" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-sm text-amber-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><FaStar className="text-yellow-400" /> Sincronização de Encerramento v25</h3>
                    <p>Este script final repara os índices de unicidade e blinda as permissões de auditoria, garantindo que a base de dados está em estado imutável para produção.</p>
                </div>

                <div className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-[60vh]">
                    <div className="absolute top-2 right-2 z-10">
                        <button onClick={() => handleCopy(migrationScript, 'mig')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg hover:bg-brand-secondary transition-all">
                            {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar SQL v25
                        </button>
                    </div>
                    <pre className="p-4 text-[10px] font-mono text-amber-400 overflow-auto custom-scrollbar">{migrationScript}</pre>
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
