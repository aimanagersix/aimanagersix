import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock } from 'react-icons/fa';

/**
 * DB Manager UI - v31.0 (Holiday Types & dynamic absence)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: TIPOS DE AUSÊNCIA DINÂMICOS COM TABELA DE CONFIG.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'enterprise_patch' | 'rh_vacation_patch' | 'dynamic_sla_patch' | 'ai_bridge' | 'auth_helper'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const dynamicSlaPatch = `-- 🕒 AIMANAGER - DYNAMIC HOLIDAY TYPES PATCH (v31.0)

-- 1. CRIAR TABELA DE CONFIGURAÇÃO DE TIPOS DE AUSÊNCIA
CREATE TABLE IF NOT EXISTS public.config_holiday_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. INSERIR TIPOS PADRÃO
INSERT INTO public.config_holiday_types (name, color) 
VALUES 
    ('Holiday', '#F43F5E'),
    ('Vacation', '#EC4899'),
    ('Bridge', '#8B5CF6'),
    ('Other', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- 3. AJUSTAR RLS PARA A NOVA TABELA
ALTER TABLE public.config_holiday_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Holiday_Types_Read_Policy" ON public.config_holiday_types;
CREATE POLICY "Holiday_Types_Read_Policy" ON public.config_holiday_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Holiday_Types_Manage_Policy" ON public.config_holiday_types;
CREATE POLICY "Holiday_Types_Manage_Policy" ON public.config_holiday_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
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
                    <button onClick={() => setActiveTab('dynamic_sla_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'dynamic_sla_patch' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaClock /> Patch SLA & Tipos (v31.0)</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA</button>
                    <button onClick={() => setActiveTab('auth_helper')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'auth_helper' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaKey /> Gestão Auth</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'dynamic_sla_patch' && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-2">
                            <h4 className="text-yellow-400 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaClock /> PATCH v31.0: TIPOS DE AUSÊNCIA DINÂMICOS</h4>
                            <p className="text-[11px] text-gray-300">Este script habilita a criação de categorias personalizadas para ausências e feriados, permitindo adicionar novos tipos através da interface.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : 
                                                 activeTab === 'dynamic_sla_patch' ? dynamicSlaPatch : 
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
                                 activeTab === 'dynamic_sla_patch' ? dynamicSlaPatch : 
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
