
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v37.0 (OS & Security Synchronization)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - REPARAÇÃO DE COLUNAS TÉCNICAS (EMBEDDED_LICENSE, OS_VERSION, ETC).
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'recon_patch' | 'os_security_patch' | 'live_diag' | 'auth_helper'>('os_security_patch');
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

    const osSecurityPatch = `-- 🛡️ AIMANAGER - OS & SECURITY PATCH (v37.0)
-- Este patch resolve o erro 'embedded_license_key' e adiciona suporte a Agentes.

-- 1. ADIÇÃO DE COLUNAS DE SEGURANÇA E SISTEMA OPERATIVO
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS embedded_license_key TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS os_version TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS firmware_version TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS encryption_status TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS installation_location TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS expected_lifespan_years INTEGER DEFAULT 4;

-- 2. GARANTIR TRÍADE CIA E CRITICALITY (NIS2)
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS confidentiality TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS integrity TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Baixa';

-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.equipment.embedded_license_key IS 'Chave de licença embutida na BIOS (OEM)';
COMMENT ON COLUMN public.equipment.os_version IS 'Nome e versão do Sistema Operativo detetado pelo Agente';
COMMENT ON COLUMN public.equipment.installation_location IS 'Localização física detalhada (ex: Piso 2, Sala 4)';

-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

COMMIT;`;

    const reconciliationPatch = `-- 🛡️ AIMANAGER - RECONCILIAÇÃO TOTAL (v36.0)...`;
    const universalZeroScript = `-- SCRIPT UNIVERSAL ABSOLUTE ZERO...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('recon_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'recon_patch' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Patch Reconciliação (v36.0)</button>
                    <button onClick={() => setActiveTab('os_security_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'os_security_patch' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Patch Segurança & SO (v37.0)</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico Live</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'os_security_patch' && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-2">
                            <h4 className="text-yellow-400 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaShieldAlt /> PATCH v37.0: SUPORTE A AGENTES E SEGURANÇA</h4>
                            <p className="text-[11px] text-gray-300">Este script adiciona as colunas necessárias para gerir licenças OEM, versões de SO e localização física. Crucial para evitar o erro de cache de schema.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : 
                                                 activeTab === 'os_security_patch' ? osSecurityPatch :
                                                 reconciliationPatch;
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">
                                {activeTab === 'full' ? universalZeroScript : (activeTab === 'os_security_patch' ? osSecurityPatch : (activeTab === 'recon_patch' ? reconciliationPatch : '-- Selecione...'))}
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
