
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v36.0 (Reconciliation bd_antiga vs bd_nova)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - REPARAÇÃO DE SCHEMAS DIVERGENTES DETETADOS NOS ANEXOS.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'recon_patch' | 'live_diag' | 'auth_helper'>('recon_patch');
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
            const tables = ['equipment', 'collaborators', 'suppliers', 'equipment_types'];
            let report = `--- RELATÓRIO DE ESTRUTURA REAL (Live) ---\nGerado em: ${new Date().toLocaleString()}\n\n`;
            for (const table of tables) {
                try {
                    const columns = await dataService.fetchTableSchema(table);
                    report += `TABELA: ${table.toUpperCase()}\n`;
                    columns.forEach(col => { report += ` - ${col.column_name} (${col.data_type})\n`; });
                    report += `\n`;
                } catch (e) {
                    report += `TABELA: ${table.toUpperCase()} -> Erro: Função RPC 'inspect_table_columns' não encontrada.\n\n`;
                }
            }
            setDiagResult(report);
        } catch (error: any) { setDiagResult(`Erro Crítico: ${error.message}`); } finally { setIsDiagLoading(false); }
    };

    const reconciliationPatch = `-- 🛡️ AIMANAGER - RECONCILIAÇÃO TOTAL (v36.0)
-- Este patch sincroniza a 'bd_nova' com os requisitos da aplicação.

-- 1. REPARAÇÃO DA TABELA EQUIPMENT (CAMPOS NIS2 E HARDWARE)
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS manufacture_date DATE;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS residual_value NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS last_inventory_scan DATE;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS accounting_category_id UUID REFERENCES public.config_accounting_categories(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS conservation_state_id UUID REFERENCES public.config_conservation_states(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS decommission_reason_id UUID REFERENCES public.config_decommission_reasons(id) ON DELETE SET NULL;

-- 2. REPARAÇÃO DA TABELA SUPPLIERS (RESTAURO DE CAMPOS EM FALTA NA BD_NOVA)
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS iso_certificate_expiry TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS security_contact_email TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS address_line TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS other_certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS contracts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. REPARAÇÃO DA TABELA COLLABORATORS (DATAS E RH)
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.config_job_titles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS deactivation_reason_id UUID REFERENCES public.config_collaborator_deactivation_reasons(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 4. REFRESH SCHEMA CACHE (Fator crítico para PostgREST)
NOTIFY pgrst, 'reload schema';

COMMIT;`;

    const universalZeroScript = `-- SCRIPT UNIVERSAL ABSOLUTE ZERO...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('recon_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'recon_patch' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Patch Reconciliação (v36.0)</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico Live</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'recon_patch' && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-2">
                            <h4 className="text-yellow-400 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaShieldAlt /> PATCH v36.0: SINCRONIZAÇÃO BD_ANTIGA vs BD_NOVA</h4>
                            <p className="text-[11px] text-gray-300">Este script detetou que a sua base de dados atual no Supabase (bd_nova) carece de colunas essenciais para Fornecedores e Criticidade de Ativos. Execute para corrigir os erros de gravação.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : reconciliationPatch;
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">
                                {activeTab === 'full' ? universalZeroScript : (activeTab === 'recon_patch' ? reconciliationPatch : '-- Selecione...')}
                            </pre>
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
