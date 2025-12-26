
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock } from 'react-icons/fa';

/**
 * DB Manager UI - v34.0 (Full Hardware & CIA Integration)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: REPARAÇÃO TOTAL DA TABELA EQUIPMENT (CAMPOS CIA + HARDWARE).
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'enterprise_patch' | 'rh_vacation_patch' | 'hardware_cia_patch' | 'ai_bridge' | 'auth_helper'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const hardwareCiaPatch = `-- 🛡️ AIMANAGER - HARDWARE & CIA INTEGRITY PATCH (v34.0)
-- Este patch resolve os erros de 'column not found' para Tríade CIA e Hardware.

-- 1. SINCRONIZAÇÃO DA TRÍADE CIA (Confidencialidade, Integridade, Disponibilidade)
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

COMMENT ON COLUMN public.equipment.confidentiality IS 'Nível de Confidencialidade (Tríade CIA - NIS2)';
COMMENT ON COLUMN public.equipment.integrity IS 'Nível de Integridade (Tríade CIA - NIS2)';
COMMENT ON COLUMN public.equipment.availability IS 'Nível de Disponibilidade (Tríade CIA - NIS2)';
`;

    const rhVacationPatch = `-- 🏖️ AIMANAGER - HR & VACATION PATCH (v28.0)...`;
    const universalZeroScript = `-- 🛡️ AIMANAGER - SCRIPT UNIVERSAL "ABSOLUTE ZERO" (v10.0)...`;
    const enterprisePatchScript = `-- 🚀 AIMANAGER - ENTERPRISE INTELLIGENCE PATCH (v27.0)...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('enterprise_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'enterprise_patch' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch Enterprise</button>
                    <button onClick={() => setActiveTab('rh_vacation_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'rh_vacation_patch' ? 'border-pink-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaUmbrellaBeach /> Patch RH & Férias</button>
                    <button onClick={() => setActiveTab('hardware_cia_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'hardware_cia_patch' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaClock /> Patch Integridade & CIA (v34.0)</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'hardware_cia_patch' && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-2">
                            <h4 className="text-yellow-400 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaShieldAlt /> PATCH v34.0: TRÍADE CIA & HARDWARE</h4>
                            <p className="text-[11px] text-gray-300">Este script resolve o erro de 'confidentiality' column not found e adiciona suporte completo a especificações de inventário.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : 
                                                 activeTab === 'hardware_cia_patch' ? hardwareCiaPatch : 
                                                 activeTab === 'rh_vacation_patch' ? rhVacationPatch : 
                                                 enterprisePatchScript;
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">
                                {activeTab === 'full' ? universalZeroScript : 
                                 activeTab === 'hardware_cia_patch' ? hardwareCiaPatch : 
                                 activeTab === 'rh_vacation_patch' ? rhVacationPatch : 
                                 (activeTab === 'enterprise_patch' ? enterprisePatchScript : '-- Selecione uma aba...')}
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
