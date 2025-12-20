
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaRocket } from 'react-icons/fa';

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
-- SCRIPT DE MIGRAÇÃO DIAMOND INTEGRITY v21.0
-- Foco: Performance de Escala, Indexação e Guardiões de Integridade.
-- ==================================================================================

DO $$ 
BEGIN
    -- 1. ÍNDICES DE PERFORMANCE (Aceleração de Pesquisas)
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_equipment_serial') THEN CREATE INDEX idx_equipment_serial ON public.equipment (serial_number); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_equipment_status') THEN CREATE INDEX idx_equipment_status ON public.equipment (status); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_collaborators_email') THEN CREATE INDEX idx_collaborators_email ON public.collaborators (email); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_collaborators_full_name') THEN CREATE INDEX idx_collaborators_full_name ON public.collaborators (full_name); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tickets_request_date') THEN CREATE INDEX idx_tickets_request_date ON public.tickets (request_date); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_tickets_status') THEN CREATE INDEX idx_tickets_status ON public.tickets (status); END IF;

    -- 2. GUARDIAIS DE INTEGRIDADE (Constraints)
    -- Garantir que email é sempre lowercase para evitar duplicados por case-sensitivity
    ALTER TABLE public.collaborators DROP CONSTRAINT IF EXISTS collaborators_email_check;
    ALTER TABLE public.collaborators ADD CONSTRAINT collaborators_email_check CHECK (email = LOWER(email));

    -- 3. AUTO-UPDATE DE MODIFIED_DATE (Trigger Automático)
    CREATE OR REPLACE FUNCTION public.set_modified_date()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.modified_date = NOW();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_equipment_modified') THEN
        CREATE TRIGGER tr_equipment_modified BEFORE UPDATE ON public.equipment
        FOR EACH ROW EXECUTE FUNCTION public.set_modified_date();
    END IF;

    -- 4. LIMPEZA DE CONFIGURAÇÕES OBSOLETAS
    DELETE FROM public.global_settings WHERE setting_key = 'old_unused_key';

    -- 5. PERMISSÕES GLOBAIS DE AUDITORIA
    GRANT INSERT ON public.audit_log TO authenticated;
    GRANT SELECT ON public.audit_log TO authenticated;

END $$;
`;

    return (
        <Modal title="Diamond Integrity v21.0" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><FaRocket className="text-yellow-400" /> Otimização de Performance Diamond</h3>
                    <p>Este script final aplica índices de alta velocidade e triggers de sistema. Essencial para ambientes com grande volume de dados e auditoria rigorosa NIS2.</p>
                </div>

                <div className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-[60vh]">
                    <div className="absolute top-2 right-2 z-10">
                        <button onClick={() => handleCopy(migrationScript, 'mig')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg hover:bg-brand-secondary transition-all">
                            {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar SQL v21
                        </button>
                    </div>
                    <pre className="p-4 text-[10px] font-mono text-green-400 overflow-auto custom-scrollbar">{migrationScript}</pre>
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
