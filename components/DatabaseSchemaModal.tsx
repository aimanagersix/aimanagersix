
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
-- Este script apaga dados transacionais/lixo mas PRESERVA as configurações e estrutura.
-- AVISO: Execute isto no SQL Editor do Supabase se quiser "recomeçar" a operação.

-- 1. Limpar Suporte (Tickets e Atividades)
TRUNCATE public.ticket_activities RESTART IDENTITY CASCADE;
TRUNCATE public.tickets RESTART IDENTITY CASCADE;
TRUNCATE public.messages RESTART IDENTITY CASCADE;

-- 2. Limpar Histórico de Ativos (Atribuições)
TRUNCATE public.license_assignments RESTART IDENTITY CASCADE;
TRUNCATE public.assignments RESTART IDENTITY CASCADE;

-- 3. Limpar Compliance e Auditoria
TRUNCATE public.audit_log RESTART IDENTITY CASCADE;
TRUNCATE public.backup_executions RESTART IDENTITY CASCADE;
TRUNCATE public.resilience_tests RESTART IDENTITY CASCADE;
TRUNCATE public.vulnerabilities RESTART IDENTITY CASCADE;

-- NOTA: Fornecedores, Colaboradores, Marcas, Tipos e Perfis de Acesso NÃO são apagados.
`;

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
        <Modal title="Manutenção e Schema da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('migration')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'migration' ? 'border-brand-primary text-white bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-white'}`}>Migração de Colunas</button>
                    <button onClick={() => setActiveTab('cleanup')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'cleanup' ? 'border-red-500 text-white bg-red-900/10' : 'border-transparent text-gray-500 hover:text-white'}`}>Limpeza de "Lixo" (Reset)</button>
                    <button onClick={() => setActiveTab('inspect')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'inspect' ? 'border-brand-primary text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>Inspeção</button>
                </div>

                {activeTab === 'migration' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-sm text-amber-200">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><FaExclamationTriangle className="text-amber-400" /> Correção de Schema v33.0</h3>
                            <p>Este script normaliza os nomes das colunas de CamelCase para SnakeCase (ex: requestDate &rarr; request_date) para garantir integridade absoluta com o código atual.</p>
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
                            <p>Utilize o script abaixo para <strong>apagar todos os tickets, históricos e logs</strong>. Isto é útil para limpar dados de teste ou inconsistentes. <strong>As suas Marcas, Tipos de Equipamento e Colaboradores serão preservados.</strong></p>
                        </div>
                        <div className="relative bg-gray-900 border border-red-500/30 rounded-lg h-[35vh]">
                            <button onClick={() => handleCopy(cleanupScript, 'clean')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow-lg">
                                {copied === 'clean' ? <FaCheck /> : <FaCopy />} Copiar Script de Limpeza
                            </button>
                            <pre className="p-4 text-[10px] font-mono text-red-400 overflow-auto h-full custom-scrollbar">{cleanupScript}</pre>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">Nota: Copie o código acima e execute-o no SQL Editor do seu dashboard Supabase.</p>
                    </div>
                )}

                {activeTab === 'inspect' && (
                    <div className="animate-fade-in p-10 text-center text-gray-500 italic">
                        Funcionalidade de inspeção de tabelas em tempo real em desenvolvimento.
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
