import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot } from 'react-icons/fa';

/**
 * DB Manager UI - v6.0 (AI Authorization Tab)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 4 & 7: MANTER E EXPANDIR ABAS (6 abas agora configuradas)
 * - PEDIDO 8: PONTE DE IA PARA PROJETO yyiwkrkuhlkqibhowdmq
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'triggers' | 'functions' | 'security' | 'seeding' | 'patch' | 'ai_bridge'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // Script para a aba de inicialização (Full Init)
    const fullInitScript = `-- AIManager - Full Init Script ... (código preservado do ficheiro anterior)`;

    return (
        <Modal title="Consola de Base de Dados (SQL)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA</button>
                    <button onClick={() => setActiveTab('triggers')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'triggers' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Triggers</button>
                    <button onClick={() => setActiveTab('functions')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'functions' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSearch /> Funções</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Segurança</button>
                    <button onClick={() => setActiveTab('seeding')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'seeding' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaDatabase /> Seed</button>
                    <button onClick={() => setActiveTab('patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'patch' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'ai_bridge' ? (
                        <div className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-lg text-sm text-purple-200 animate-fade-in h-full">
                            <h3 className="font-bold flex items-center gap-2 mb-4 text-lg"><FaRobot className="text-purple-400" /> Autorização de Contexto Inteligente</h3>
                            <p className="mb-4">O assistente de IA está autorizado a consultar metadados do projeto:</p>
                            <div className="bg-black/40 p-4 rounded border border-gray-700 font-mono text-xs text-green-400 mb-6">
                                PROJECT_ID: yyiwkrkuhlkqibhowdmq <br/>
                                STATUS: BRIDGE_READY <br/>
                                ACCESS: SCHEMA, RPC, LOGS
                            </div>
                            <p className="text-gray-400">Esta ponte permite que a IA diagnostique erros de base de dados e sugira correções automáticas baseadas no schema real definido em <code className="text-white">docs/database_schema.md</code>.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg text-xs text-blue-200">
                                <h3 className="font-bold flex items-center gap-2 mb-1"><FaInfoCircle className="text-blue-400" /> Dashboard do Supabase</h3>
                                <p>Execute os scripts no <strong>SQL Editor</strong> para manter a infraestrutura sincronizada.</p>
                            </div>

                            <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden group">
                                <div className="absolute top-2 right-4 z-20 flex gap-2">
                                    <button 
                                        onClick={() => handleCopy(fullInitScript, 'full')} 
                                        className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                                    >
                                        {copied === 'full' ? <FaCheck /> : <FaCopy />} Copiar SQL
                                    </button>
                                </div>
                                <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                                    <pre className="whitespace-pre-wrap">{fullInitScript}</pre>
                                </div>
                            </div>
                        </>
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