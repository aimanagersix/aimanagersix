
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner, FaBalanceScale } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v40.0 (NIS2 & Vector Search Engine)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - ATIVAÇÃO DE PGVECTOR E CAMPOS REGULATÓRIOS NIS2.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'os_security_patch' | 'harmo_patch' | 'final_sync_patch' | 'nis2_vector_patch' | 'live_diag'>('nis2_vector_patch');
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

    const nis2VectorPatch = `-- ⚖️ AIMANAGER - NIS2 & IA VECTOR SEARCH PATCH (v40.0)
-- Este patch garante que a pesquisa inteligente e o reporte regulatório funcionam a 100%.

-- 1. ATIVAR EXTENSÃO DE VETORES (Para Pesquisa Inteligente de Tickets)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. GARANTIR CAMPOS DE CONFORMIDADE NIS2 NA TABELA TICKETS
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS regulatory_status TEXT DEFAULT 'NotRequired';
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS regulatory_24h_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS regulatory_72h_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS requester_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS finish_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS resolution_summary TEXT;

-- 3. GARANTIR COLUNA DE EMBEDDING (Requer pgvector ativa no passo 1)
-- Se a coluna existir como 'USER-DEFINED', tentamos convertê-la para o tipo 'vector(768)'
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS embedding vector(768);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'A coluna embedding já existe ou requer atenção manual no tipo de dados.';
    END;
END $$;

-- 4. ÍNDICE PARA PESQUISA RÁPIDA DE IA (HNSW)
-- CREATE INDEX IF NOT EXISTS tickets_embedding_idx ON public.tickets USING hnsw (embedding vector_cosine_ops);

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

COMMIT;`;

    const finalSyncPatch = `-- 🛡️ AIMANAGER - PATCH DE SINCRONIZAÇÃO FINAL (v39.0)...`;
    const harmonizationPatch = `-- ⚖️ AIMANAGER - PATCH DE HARMONIZAÇÃO FINAL (v38.0)...`;
    const osSecurityPatch = `-- 🛡️ AIMANAGER - OS & SECURITY PATCH (v37.0)...`;
    const universalZeroScript = `-- SCRIPT UNIVERSAL ABSOLUTE ZERO...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('nis2_vector_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'nis2_vector_patch' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBalanceScale /> Patch NIS2 & IA (v40.0)</button>
                    <button onClick={() => setActiveTab('final_sync_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'final_sync_patch' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch v39.0</button>
                    <button onClick={() => setActiveTab('harmo_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'harmo_patch' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCheck /> Patch v38.0</button>
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'nis2_vector_patch' && (
                        <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-lg mb-2">
                            <h4 className="text-brand-secondary font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaBalanceScale /> PATCH v40.0: COMPLIANCE E INTELIGÊNCIA</h4>
                            <p className="text-[11px] text-gray-300">Este script ativa a capacidade de pesquisa por vetores (IA) e garante que os campos de prazos regulatórios (24h/72h) estão presentes para conformidade com a diretiva NIS2.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'nis2_vector_patch' ? nis2VectorPatch :
                                                 activeTab === 'final_sync_patch' ? finalSyncPatch :
                                                 activeTab === 'harmo_patch' ? harmonizationPatch :
                                                 activeTab === 'os_security_patch' ? osSecurityPatch :
                                                 universalZeroScript;
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">
                                {activeTab === 'nis2_vector_patch' ? nis2VectorPatch :
                                 activeTab === 'final_sync_patch' ? finalSyncPatch :
                                 activeTab === 'harmo_patch' ? harmonizationPatch : 
                                 activeTab === 'full' ? universalZeroScript : '-- Selecione --'}
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
