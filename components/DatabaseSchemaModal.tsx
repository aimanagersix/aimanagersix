
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner, FaBalanceScale } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v39.0 (Schema Cache & OS Security Fix)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - REPARAÇÃO DO ERRO 'embedded_license_key' VIA RELOAD SCHEMA.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'recon_patch' | 'os_security_patch' | 'harmo_patch' | 'final_sync_patch' | 'live_diag'>('final_sync_patch');
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

    const finalSyncPatch = `-- 🛡️ AIMANAGER - PATCH DE SINCRONIZAÇÃO FINAL (v39.0)
-- Este patch garante colunas de SO/Segurança e força o refresh do cache do Supabase.

-- 1. GARANTIR COLUNAS TÉCNICAS NA TABELA EQUIPMENT (CASO NÃO EXISTAM)
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS embedded_license_key TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS os_version TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS firmware_version TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS encryption_status TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS installation_location TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS expected_lifespan_years INTEGER DEFAULT 4;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS last_inventory_scan DATE;

-- 2. GARANTIR TRÍADE CIA E CRITICALITY (NIS2)
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS confidentiality TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS integrity TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Baixa';

-- 3. FORÇAR ATUALIZAÇÃO DO CACHE DO SCHEMA (RESOLVE ERRO 'Could not find column...')
-- Este comando notifica o PostgREST para recarregar as definições das tabelas.
NOTIFY pgrst, 'reload schema';

COMMIT;
-- FIM DO PATCH v39.0`;

    const harmonizationPatch = `-- ⚖️ AIMANAGER - PATCH DE HARMONIZAÇÃO FINAL (v38.0)...`;
    const osSecurityPatch = `-- 🛡️ AIMANAGER - OS & SECURITY PATCH (v37.0)...`;
    const reconciliationPatch = `-- 🛡️ AIMANAGER - RECONCILIAÇÃO TOTAL (v36.0)...`;
    const universalZeroScript = `-- SCRIPT UNIVERSAL ABSOLUTE ZERO...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('final_sync_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'final_sync_patch' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch Sincronização Final (v39.0)</button>
                    <button onClick={() => setActiveTab('harmo_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'harmo_patch' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBalanceScale /> Patch v38.0</button>
                    <button onClick={() => setActiveTab('os_security_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'os_security_patch' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Patch v37.0</button>
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico Live</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'final_sync_patch' && (
                        <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-lg mb-2">
                            <h4 className="text-brand-secondary font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaBolt /> PATCH v39.0: REPARAÇÃO DE CACHE E SEGURANÇA</h4>
                            <p className="text-[11px] text-gray-300">Este script resolve o erro de "Column not found in schema cache". Ele garante que a base de dados física e o mapa interno do Supabase estão sincronizados com as colunas de licença e SO.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'final_sync_patch' ? finalSyncPatch :
                                                 activeTab === 'harmo_patch' ? harmonizationPatch :
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
                                {activeTab === 'final_sync_patch' ? finalSyncPatch :
                                 activeTab === 'harmo_patch' ? harmonizationPatch : 
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
