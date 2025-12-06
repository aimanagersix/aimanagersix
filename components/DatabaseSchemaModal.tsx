
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling, FaCommentDots, FaHdd, FaMagic, FaTools, FaUnlock, FaShieldAlt } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'unlock' | 'repair' | 'update' | 'fix_types' | 'triggers'>('unlock');
    
    // Playwright AI State
    const [testRequest, setTestRequest] = useState('');
    const [generatedTest, setGeneratedTest] = useState('');
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [testEmail, setTestEmail] = useState('josefsmoreira@outlook.com');
    const [testPassword, setTestPassword] = useState('QSQmZf62!');
    
    // Triggers State
    const [triggers, setTriggers] = useState<any[]>([]);
    const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);

    const aiConfigured = isAiConfigured();

    const unlockScript = `
-- ==================================================================================
-- SCRIPT DE DESBLOQUEIO TOTAL E REPARAÇÃO DE RLS
-- Executar este script garante que todas as tabelas de configuração são visíveis.
-- ==================================================================================

BEGIN;

-- 1. Tabelas de Hardware
ALTER TABLE IF EXISTS public.config_cpus DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_ram_sizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_storage_types DISABLE ROW LEVEL SECURITY;

-- 2. Tabelas de Software
ALTER TABLE IF EXISTS public.config_software_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_software_products DISABLE ROW LEVEL SECURITY;

-- 3. Outras Tabelas de Configuração
ALTER TABLE IF EXISTS public.config_accounting_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config_conservation_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_templates DISABLE ROW LEVEL SECURITY;

-- 4. Garantir permissões de CRUD para 'authenticated' e 'anon'
GRANT ALL ON public.config_cpus TO authenticated, anon;
GRANT ALL ON public.config_ram_sizes TO authenticated, anon;
GRANT ALL ON public.config_storage_types TO authenticated, anon;
GRANT ALL ON public.config_software_categories TO authenticated, anon;
GRANT ALL ON public.config_software_products TO authenticated, anon;
GRANT ALL ON public.config_accounting_categories TO authenticated, anon;
GRANT ALL ON public.config_conservation_states TO authenticated, anon;
GRANT ALL ON public.document_templates TO authenticated, anon;

-- 5. Re-inserir dados padrão se faltarem (Hardware)
INSERT INTO public.config_cpus (name) VALUES ('Intel Core i5'), ('Intel Core i7'), ('AMD Ryzen 5') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.config_ram_sizes (name) VALUES ('8 GB'), ('16 GB'), ('32 GB') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.config_storage_types (name) VALUES ('256GB SSD'), ('512GB SSD') ON CONFLICT (name) DO NOTHING;

-- 6. Forçar atualização de cache do PostgREST
NOTIFY pgrst, 'reload config';

COMMIT;
`;

    const repairScript = `
-- (Script de Reparação mantido - Use a aba Desbloquear primeiro)
`;

    const fixTypesScript = `
UPDATE equipment_types 
SET 
    requires_cpu_info = true, 
    requires_ram_size = true, 
    requires_disk_info = true
WHERE 
    LOWER(name) LIKE '%desktop%' OR 
    LOWER(name) LIKE '%laptop%' OR 
    LOWER(name) LIKE '%portátil%' OR
    LOWER(name) LIKE '%server%';
`;

    const updateScript = `
-- Script de instalação completa
`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const loadTriggers = async () => {
        setIsLoadingTriggers(true);
        setTriggerError(null);
        try {
            const { data, error } = await dataService.fetchDatabaseTriggers();
            if (error) throw error;
            setTriggers(data || []);
        } catch (error: any) {
            setTriggerError(error.message || "Erro ao carregar triggers.");
        } finally {
            setIsLoadingTriggers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'triggers') {
            loadTriggers();
        }
    }, [activeTab]);
    
    return (
        <Modal title="Configuração de Base de Dados & Ferramentas" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-700 mb-4 gap-2 flex-wrap bg-gray-900/50 p-2 rounded-t-lg">
                     <button 
                        onClick={() => setActiveTab('unlock')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'unlock' ? 'border-green-500 text-white bg-green-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaUnlock /> 1. Desbloquear Dados
                    </button>
                     <button 
                        onClick={() => setActiveTab('fix_types')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fix_types' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaMagic /> 2. Ativar Campos
                    </button>
                    <button 
                        onClick={() => setActiveTab('update')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'update' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaDatabase /> Script Inicial
                    </button>
                     <button 
                        onClick={() => setActiveTab('triggers')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'triggers' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBolt /> Triggers
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 p-1">
                    
                    {/* UNLOCK TAB */}
                    {activeTab === 'unlock' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaUnlock /> CORREÇÃO DEFINITIVA DE VISIBILIDADE
                                </div>
                                <p className="mb-2">
                                    Se os dados existem na BD mas não aparecem, é o RLS (Segurança) a bloquear.
                                    <br/>
                                    <strong>Execute este script para DESATIVAR o RLS nas tabelas de configuração</strong> (CPUs, RAM, Discos, Software).
                                    Isto garante que a aplicação consegue ler os dados imediatamente.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {unlockScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(unlockScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FIX TYPES TAB */}
                    {activeTab === 'fix_types' && (
                         <div className="space-y-4 animate-fade-in">
                            <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-lg text-sm text-purple-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaMagic /> ATIVAR CAMPOS EM TIPOS EXISTENTES
                                </div>
                                <p className="mb-2">
                                    Este script atualiza automaticamente os tipos de equipamento (Laptop, Desktop, Server) para pedir os dados de CPU, RAM e Disco.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {fixTypesScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(fixTypesScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}
                    
                     {/* UPDATE TAB (Original) */}
                    {activeTab === 'update' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-2">
                                <p>Use este script apenas se estiver a instalar a base de dados de raiz.</p>
                            </div>
                             <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {updateScript}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* TRIGGERS TAB */}
                    {activeTab === 'triggers' && (
                         <div className="space-y-4 animate-fade-in">
                            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FaBolt className="text-yellow-500" /> Triggers de Automação
                                    </h3>
                                    <button onClick={loadTriggers} className="text-sm text-brand-secondary hover:underline flex items-center gap-1">
                                        <FaSync className={isLoadingTriggers ? "animate-spin" : ""} /> Atualizar
                                    </button>
                                </div>
                                {triggerError ? (
                                    <div className="text-red-400 text-sm p-2 border border-red-500/30 rounded bg-red-900/20">
                                        {triggerError}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left text-gray-300">
                                            <thead className="bg-gray-800 text-gray-400 uppercase">
                                                <tr>
                                                    <th className="p-2">Trigger</th>
                                                    <th className="p-2">Evento</th>
                                                    <th className="p-2">Tabela</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {triggers.length > 0 ? triggers.map((t: any, i: number) => (
                                                    <tr key={i} className="border-b border-gray-800">
                                                        <td className="p-2 font-bold text-white">{t.trigger_name}</td>
                                                        <td className="p-2">{t.event_manipulation}</td>
                                                        <td className="p-2">{t.event_object_table}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={3} className="p-4 text-center">Nenhum trigger encontrado.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto bg-gray-900/80 p-4 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors shadow-lg">
                        Fechar Janela
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
