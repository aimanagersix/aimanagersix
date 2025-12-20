
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'migration' | 'inspect'>('migration');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const migrationScript = `DO $$ 
BEGIN
    -- 1. [Tabela: tickets]
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='requestDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='request_date') THEN ALTER TABLE public.tickets RENAME COLUMN "requestDate" TO request_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='finishDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='finish_date') THEN ALTER TABLE public.tickets RENAME COLUMN "finishDate" TO finish_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='collaboratorId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='collaborator_id') THEN ALTER TABLE public.tickets RENAME COLUMN "collaboratorId" TO collaborator_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='technicianId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='technician_id') THEN ALTER TABLE public.tickets RENAME COLUMN "technicianId" TO technician_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='entidadeId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='entidade_id') THEN ALTER TABLE public.tickets RENAME COLUMN "entidadeId" TO entidade_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='teamId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='team_id') THEN ALTER TABLE public.tickets RENAME COLUMN "teamId" TO team_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='equipmentId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='equipment_id') THEN ALTER TABLE public.tickets RENAME COLUMN "equipmentId" TO equipment_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='securityIncidentType') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='security_incident_type') THEN ALTER TABLE public.tickets RENAME COLUMN "securityIncidentType" TO security_incident_type; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='impactCriticality') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='impact_criticality') THEN ALTER TABLE public.tickets RENAME COLUMN "impactCriticality" TO impact_criticality; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='resolutionSummary') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='resolution_summary') THEN ALTER TABLE public.tickets RENAME COLUMN "resolutionSummary" TO resolution_summary; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='requesterSupplierId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='requester_supplier_id') THEN ALTER TABLE public.tickets RENAME COLUMN "requesterSupplierId" TO requester_supplier_id; END IF;

    -- 2. [Tabela: ticket_activities]
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='ticketId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='ticket_id') THEN ALTER TABLE public.ticket_activities RENAME COLUMN "ticketId" TO ticket_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='technicianId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='technician_id') THEN ALTER TABLE public.ticket_activities RENAME COLUMN "technicianId" TO technician_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='equipmentId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_activities' AND column_name='equipment_id') THEN ALTER TABLE public.ticket_activities RENAME COLUMN "equipmentId" TO equipment_id; END IF;

    -- 3. [Tabela: calendar_events]
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='startDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='start_date') THEN ALTER TABLE public.calendar_events RENAME COLUMN "startDate" TO start_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='endDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='end_date') THEN ALTER TABLE public.calendar_events RENAME COLUMN "endDate" TO end_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='isAllDay') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='is_all_day') THEN ALTER TABLE public.calendar_events RENAME COLUMN "isAllDay" TO is_all_day; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='isPrivate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='is_private') THEN ALTER TABLE public.calendar_events RENAME COLUMN "isPrivate" TO is_private; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='teamId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='team_id') THEN ALTER TABLE public.calendar_events RENAME COLUMN "teamId" TO team_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='reminderMinutes') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='reminder_minutes') THEN ALTER TABLE public.calendar_events RENAME COLUMN "reminderMinutes" TO reminder_minutes; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='createdBy') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='created_by') THEN ALTER TABLE public.calendar_events RENAME COLUMN "createdBy" TO created_by; END IF;

    -- 4. Garantir permissões de leitura
    GRANT SELECT ON public.tickets TO authenticated;
    GRANT SELECT ON public.ticket_activities TO authenticated;
    GRANT SELECT ON public.calendar_events TO authenticated;

END $$;`;

    return (
        <Modal title="Database Integrity Tools v33.0" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-sm text-amber-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><FaExclamationTriangle className="text-amber-400" /> Script v33.0 (Fixed Syntax)</h3>
                    <p>O script abaixo migra as tabelas de <strong>Tickets</strong> e <strong>Calendário</strong> de camelCase para snake_case. Corrigido erro de sintaxe da versão anterior.</p>
                </div>

                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('migration')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'migration' ? 'border-brand-primary text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>Migração de Schema</button>
                    <button onClick={() => setActiveTab('inspect')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'inspect' ? 'border-brand-primary text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>Inspeção (Diagnóstico)</button>
                </div>

                {activeTab === 'migration' ? (
                    <div className="relative bg-gray-900 border border-gray-700 rounded-lg h-[45vh]">
                        <button onClick={() => handleCopy(migrationScript, 'mig')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                            {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar Script SQL
                        </button>
                        <pre className="p-4 text-[10px] font-mono text-blue-400 overflow-auto h-full custom-scrollbar">{migrationScript}</pre>
                    </div>
                ) : (
                    <pre className="p-4 text-[10px] font-mono text-amber-400 overflow-auto h-full custom-scrollbar">Aguardando execução do script de migração.</pre>
                )}

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
