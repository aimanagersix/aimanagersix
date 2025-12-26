
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner, FaBalanceScale } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v38.0 (Final Harmonization)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - RESTAURO DE CAMPOS NIS2 E CONTRATOS IDENTIFICADOS NA COMPARAÇÃO.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'recon_patch' | 'os_security_patch' | 'harmo_patch' | 'live_diag'>('harmo_patch');
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

    const harmonizationPatch = `-- ⚖️ AIMANAGER - PATCH DE HARMONIZAÇÃO FINAL (v38.0)
-- Este patch restaura os campos de conformidade NIS2 e Contratos detetados na bd_antiga.

-- 1. RESTAURO DE CONFORMIDADE NIS2 NA TABELA TICKETS
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS finish_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS resolution_summary TEXT;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS regulatory_status TEXT DEFAULT 'NotRequired';
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS regulatory_24h_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS regulatory_72h_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS requester_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- 2. RESTAURO DE GESTÃO DOCUMENTAL NA TABELA SUPPLIERS
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS address_line TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS contracts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS other_certifications JSONB DEFAULT '[]'::jsonb;

-- 3. AJUSTES DE RH NA TABELA COLLABORATORS
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS "allowedModules" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

COMMIT;`;

    const osSecurityPatch = `-- 🛡️ AIMANAGER - OS & SECURITY PATCH (v37.0)...`;
    const reconciliationPatch = `-- 🛡️ AIMANAGER - RECONCILIAÇÃO TOTAL (v36.0)...`;
    const universalZeroScript = `-- SCRIPT UNIVERSAL ABSOLUTE ZERO...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('harmo_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'harmo_patch' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBalanceScale /> Patch Harmonização (v38.0)</button>
                    <button onClick={() => setActiveTab('os_security_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'os_security_patch' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Patch Segurança (v37.0)</button>
                    <button onClick={() => setActiveTab('recon_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'recon_patch' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Patch v36.0</button>
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico Live</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'harmo_patch' && (
                        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg mb-2">
                            <h4 className="text-green-400 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaBalanceScale /> PATCH v38.0: RESTAURO DE CAMPOS COMPLIANCE</h4>
                            <p className="text-[11px] text-gray-300">Este script detetou divergências entre a base de dados antiga e a nova. Ele restaura os prazos de notificação 24h/72h e a gestão de contratos de fornecedores.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'harmo_patch' ? harmonizationPatch :
                                                 activeTab === 'os_security_patch' ? osSecurityPatch :
                                                 activeTab === 'full' ? universalZeroScript : reconciliationPatch;
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">
                                {activeTab === 'harmo_patch' ? harmonizationPatch : 
                                 activeTab === 'os_security_patch' ? osSecurityPatch :
                                 activeTab === 'full' ? universalZeroScript : reconciliationPatch}
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
