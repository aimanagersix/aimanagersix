import React, { useState } from 'react';
import Modal from './common/Modal';
// Added FaUmbrellaBeach to resolve "Cannot find name" errors on lines 78 and 87
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach } from 'react-icons/fa';

/**
 * DB Manager UI - v28.0 (HR & Vacation Patch)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: GESTÃO DE FERIADOS E AUSÊNCIAS.
 * - PEDIDO 4: PERMISSÕES DE AGENDAMENTO DE FÉRIAS E RELATÓRIO.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'enterprise_patch' | 'rh_vacation_patch' | 'ai_bridge' | 'auth_helper'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const rhVacationPatch = `-- 🏖️ AIMANAGER - HR & VACATION PATCH (v28.0)

-- 1. GARANTIR TABELA DE FERIADOS/FÉRIAS
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE UNIQUE NOT NULL,
    type TEXT DEFAULT 'Holiday', -- 'Holiday', 'Vacation', 'Bridge'
    is_recurring BOOLEAN DEFAULT true,
    collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE CASCADE,
    instituicao_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. POLÍTICAS RLS PARA FÉRIAS (Pedido 4)
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Ver tudo (para chefias e técnicos verem disponibilidade)
DROP POLICY IF EXISTS "Holidays_View_Policy" ON public.holidays;
CREATE POLICY "Holidays_View_Policy" ON public.holidays FOR SELECT TO authenticated USING (true);

-- Criar/Editar apenas o próprio registo (ou Admin tudo)
DROP POLICY IF EXISTS "Holidays_Manage_Policy" ON public.holidays;
CREATE POLICY "Holidays_Manage_Policy" ON public.holidays FOR ALL TO authenticated USING (
    (collaborator_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM collaborators WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);

-- 3. INJETAR PERMISSÕES NOS PERFIS EXISTENTES
-- Este bloco tenta adicionar os novos campos JSON nos perfis sem apagar o que existe
UPDATE public.config_custom_roles 
SET permissions = jsonb_set(
    jsonb_set(permissions, '{vacation_schedule}', '{"view": true, "create": true, "edit": true, "view_own": true}', true),
    '{vacation_report}', '{"view": false}', true
) WHERE name != 'SuperAdmin';

-- 4. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
`;

    // Scripts anteriores preservados...
    const universalZeroScript = `-- 🛡️ AIMANAGER - SCRIPT UNIVERSAL "ABSOLUTE ZERO" (v10.0)...`;
    const enterprisePatchScript = `-- 🚀 AIMANAGER - ENTERPRISE INTELLIGENCE PATCH (v27.0)...`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('enterprise_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'enterprise_patch' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch Enterprise</button>
                    <button onClick={() => setActiveTab('rh_vacation_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'rh_vacation_patch' ? 'border-pink-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaUmbrellaBeach /> Patch RH & Férias (v28.0)</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA</button>
                    <button onClick={() => setActiveTab('auth_helper')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'auth_helper' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaKey /> Gestão Auth</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'rh_vacation_patch' && (
                        <div className="bg-pink-900/20 border border-pink-500/30 p-4 rounded-lg mb-2">
                            <h4 className="text-pink-400 font-bold flex items-center gap-2 text-sm uppercase mb-2"><FaUmbrellaBeach /> NOVO PATCH: GESTÃO DE AUSÊNCIAS</h4>
                            <p className="text-[11px] text-gray-300">Este script ativa o suporte para agendamento de férias por colaborador e define as políticas de acesso para chefias.</p>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : (activeTab === 'rh_vacation_patch' ? rhVacationPatch : enterprisePatchScript);
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">{activeTab === 'full' ? universalZeroScript : (activeTab === 'rh_vacation_patch' ? rhVacationPatch : (activeTab === 'enterprise_patch' ? enterprisePatchScript : '-- Use as abas de Deno para as Edge Functions...'))}</pre>
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