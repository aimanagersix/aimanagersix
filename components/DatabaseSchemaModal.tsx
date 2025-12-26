import React, { useState } from 'react';
import Modal from './common/Modal';
// Fix: Added FaSpinner to imports from react-icons/fa
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v35.0 (Live Diagnostics Integration)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: REPARAÇÃO TOTAL DA TABELA EQUIPMENT (CRITICALITY + HARDWARE).
 * - NOVA FUNCIONALIDADE: DIAGNÓSTICO LIVE.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'enterprise_patch' | 'rh_vacation_patch' | 'hardware_cia_patch' | 'live_diag' | 'auth_helper'>('full');
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
                    columns.forEach(col => {
                        report += ` - ${col.column_name} (${col.data_type})\n`;
                    });
                    report += `\n`;
                } catch (e) {
                    report += `TABELA: ${table.toUpperCase()} -> Erro: Função RPC 'inspect_table_columns' não encontrada ou erro de permissão.\n\n`;
                }
            }
            setDiagResult(report);
        } catch (error: any) {
            setDiagResult(`Erro Crítico no Diagnóstico: ${error.message}`);
        } finally {
            setIsDiagLoading(false);
        }
    };

    const rpcInspectionSql = `-- 🔍 SCRIPT DE INSPEÇÃO (Passo 1: Criar Olhos na BD)
-- Execute este script no SQL Editor do Supabase para me permitir "ver" as tabelas.

CREATE OR REPLACE FUNCTION public.inspect_table_columns(t_name text)
RETURNS TABLE (column_name text, data_type text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.column_name::text, c.data_type::text
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
    AND c.table_name = t_name;
END;
$$;

-- Garantir acesso ao anon/authenticated para o diagnóstico
GRANT EXECUTE ON FUNCTION public.inspect_table_columns(text) TO anon, authenticated;
`;

    const hardwareCiaPatch = `-- 🛡️ AIMANAGER - HARDWARE & CIA INTEGRITY PATCH (v34.0)
-- Este patch resolve os erros de 'column not found' para Tríade CIA e Hardware.

-- 1. SINCRONIZAÇÃO DA TRÍADE CIA (Confidencialidade, Integridade, Disponibilidade)
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS confidentiality TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS integrity TEXT DEFAULT 'Baixa';
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Baixa';

-- 2. SINCRONIZAÇÃO DE ESPECIFICAÇÕES TÉCNICAS (Hardware & Rede)
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS bluetooth_address TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS wwan_address TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS usb_thunderbolt_address TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS ram_size TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS disk_info TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS cpu_info TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS monitor_info TEXT;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS manufacture_date DATE;

-- 3. SINCRONIZAÇÃO DE PATRIMÓNIO E FINANCEIRO
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS residual_value NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS accounting_category_id UUID REFERENCES public.config_accounting_categories(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS conservation_state_id UUID REFERENCES public.config_conservation_states(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.equipment ADD COLUMN IF NOT EXISTS decommission_reason_id UUID REFERENCES public.config_decommission_reasons(id) ON DELETE SET NULL;

-- 4. REFRESH SCHEMA CACHE (Crítico para detetar colunas novas)
NOTIFY pgrst, 'reload schema';
`;

    const universalZeroScript = `-- 🛡️ AIMANAGER - SCRIPT UNIVERSAL "ABSOLUTE ZERO" (v10.0)...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('hardware_cia_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'hardware_cia_patch' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaClock /> Patch v34.0</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico Live</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'live_diag' ? (
                        <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                            <div className="bg-green-900/10 border border-green-500/30 p-4 rounded-lg">
                                <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2 uppercase text-sm"><FaStethoscope /> Ponte de Diagnóstico</h4>
                                <p className="text-xs text-gray-300">Siga estes passos para que eu possa "ver" o seu Supabase:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div className="bg-black/30 p-3 rounded border border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Passo 1: Criar Função RPC</p>
                                        <button onClick={() => handleCopy(rpcInspectionSql, 'rpc_sql')} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center gap-2">
                                            {copied === 'rpc_sql' ? <FaCheck /> : <FaCopy />} Copiar SQL de Inspeção
                                        </button>
                                        <p className="text-[9px] text-gray-500 mt-2">Execute no SQL Editor do Supabase antes do diagnóstico.</p>
                                    </div>
                                    <div className="bg-black/30 p-3 rounded border border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Passo 2: Ler Metadados</p>
                                        <button onClick={runLiveDiagnosis} disabled={isDiagLoading} className="w-full py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded text-xs flex items-center justify-center gap-2 font-bold shadow-lg">
                                            {isDiagLoading ? <FaSpinner className="animate-spin" /> : <FaSync />} Correr Diagnóstico
                                        </button>
                                        <p className="text-[9px] text-gray-500 mt-2">Isto lerá a estrutura real das suas tabelas.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-grow bg-black rounded border border-gray-700 relative overflow-hidden">
                                {diagResult && (
                                    <button onClick={() => handleCopy(diagResult, 'diag_report')} className="absolute top-2 right-4 z-20 px-3 py-1.5 bg-green-600 text-white rounded text-[10px] font-bold shadow-lg flex items-center gap-2">
                                        {copied === 'diag_report' ? <FaCheck /> : <FaCopy />} Copiar Relatório para o Chat
                                    </button>
                                )}
                                <pre className="p-4 font-mono text-xs text-green-400 h-full overflow-auto custom-scrollbar">
                                    {diagResult || '-- Aguardando diagnóstico...'}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                            <div className="absolute top-2 right-4 z-20">
                                <button 
                                    onClick={() => {
                                        const code = activeTab === 'full' ? universalZeroScript : hardwareCiaPatch;
                                        handleCopy(code, activeTab);
                                    }} 
                                    className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                                >
                                    {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                                </button>
                            </div>
                            <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                                <pre className="whitespace-pre-wrap">
                                    {activeTab === 'full' ? universalZeroScript : hardwareCiaPatch}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;