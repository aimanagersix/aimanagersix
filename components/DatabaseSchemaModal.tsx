
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner, FaBalanceScale } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v41.0 (Automation & Attachments Fix)
 * -----------------------------------------------------------------------------
 * - CORREÇÃO: Adição da coluna 'attachments' em tickets.
 * - AUTOMAÇÃO: SQL Procedure para renovação ISO 27001 30 dias antes.
 * - AGENDAMENTO: pg_cron setup.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'automation_patch' | 'live_diag'>('automation_patch');
    const [diagResult, setDiagResult] = useState<string>('');
    const [isDiagLoading, setIsDiagLoading] = useState(false);
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const runLiveDiagnosis = async () => {
        setIsDiagLoading(true);
        setDiagResult('A consultar metadados do Supabase...');
        try {
            const tables = ['equipment', 'collaborators', 'suppliers', 'tickets'];
            let report = `--- RELATÓRIO DE ESTRUTURA REAL (Live) ---\nGerado em: ${new Date().toLocaleString()}\n\n`;
            for (const table of tables) {
                try {
                    const columns = await dataService.fetchTableSchema(table);
                    report += `TABELA: ${table.toUpperCase()}\n`;
                    columns.forEach(col => { report += ` - ${col.column_name} (${col.data_type})\n`; });
                    report += `\n`;
                } catch (e) {
                    report += `TABELA: ${table.toUpperCase()} -> Erro: RPC não encontrada.\n\n`;
                }
            }
            setDiagResult(report);
        } catch (error: any) { setDiagResult(`Erro Crítico: ${error.message}`); } finally { setIsDiagLoading(false); }
    };

    const automationPatch = `-- 🤖 AIMANAGER - AUTOMATION & FIX PATCH (v41.0)
-- Este script corrige a coluna de anexos e ativa a criação proativa de tickets.

-- 1. CORREÇÃO DE SCHEMA (Anexos em Tickets)
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- 2. FUNÇÃO DE VERIFICAÇÃO DIÁRIA (Renovação ISO 27001)
CREATE OR REPLACE FUNCTION public.proc_auto_generate_iso_tickets()
RETURNS void AS $$
DECLARE
    v_triagem_id uuid;
BEGIN
    -- Obter ID da equipa de triagem
    SELECT id INTO v_triagem_id FROM public.teams WHERE name = 'Triagem' LIMIT 1;

    INSERT INTO public.tickets (title, description, status, category, impact_criticality, request_date, team_id)
    SELECT 
        '[RENOVAÇÃO AUTOMÁTICA] Certificado ISO 27001: ' || s.name,
        'O certificado ISO 27001 do fornecedor ' || s.name || ' expira em ' || s.iso_certificate_expiry || '. Iniciar processo de conformidade NIS2.',
        'Pedido',
        'Manutenção',
        'Baixa',
        NOW(),
        v_triagem_id
    FROM public.suppliers s
    WHERE s.is_iso27001_certified = true 
      AND s.iso_certificate_expiry IS NOT NULL
      AND s.iso_certificate_expiry <= (CURRENT_DATE + INTERVAL '30 days')
      AND s.iso_certificate_expiry > CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1 FROM public.tickets t 
          WHERE t.title = ('[RENOVAÇÃO AUTOMÁTICA] Certificado ISO 27001: ' || s.name)
            AND t.status != 'Finalizado'
            AND t.status != 'Cancelado'
      );
END;
$$ LANGUAGE plpgsql;

-- 3. ATIVAÇÃO DO AGENDAMENTO (Requer pg_cron ativa no Supabase)
-- Nota: Execute isto apenas se tiver a extensão pg_cron ativa.
-- SELECT cron.schedule('auto-iso-tickets', '0 0 * * *', 'SELECT public.proc_auto_generate_iso_tickets()');

NOTIFY pgrst, 'reload schema';
COMMIT;`;

    const universalZeroScript = `-- SCRIPT UNIVERSAL...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('automation_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'automation_patch' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch Automação (v41.0)</button>
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'automation_patch' && (
                        <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-lg mb-2">
                            <h4 className="text-brand-secondary font-bold flex items-center gap-2 text-sm uppercase mb-1"><FaRobot /> PATCH v41.0: AUTOMAÇÃO MÃOS-LIVRES</h4>
                            <p className="text-[11px] text-gray-300">Corrige erro de anexos e cria rotina diária no servidor para renovação de certificados ISO.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => handleCopy(activeTab === 'automation_patch' ? automationPatch : universalZeroScript, activeTab)} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">{activeTab === 'automation_patch' ? automationPatch : universalZeroScript}</pre>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
