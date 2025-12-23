import React, { useState, useEffect } from 'react';
import { FaKey, FaSave, FaCheckCircle, FaTimesCircle, FaEdit, FaShieldAlt, FaRobot, FaExternalLinkAlt, FaSync, FaFlask } from 'react-icons/fa';
import { getAiConfigurationType } from '../../services/geminiService';
import { getSupabase } from '../../services/supabaseClient';

interface ConnectionsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
}

const StatusBadge = ({ configured, testing, label }: { configured: boolean, testing?: boolean, label?: string }) => {
    if (testing) return <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/30 animate-pulse"><FaSync className="animate-spin" /> A TESTAR...</span>;
    return configured ? (
        <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/30"><FaCheckCircle /> {label || 'CONFIGURADO'}</span>
    ) : (
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/30"><FaTimesCircle /> {label || 'NÃO DETETADO'}</span>
    );
};

const ConnectionCard = ({ 
    title, 
    icon, 
    status, 
    description, 
    children 
}: { 
    title: string, 
    icon: React.ReactNode, 
    status: React.ReactNode, 
    description: string,
    children?: React.ReactNode 
}) => (
    <div className="bg-gray-900/50 border border-gray-700 p-5 rounded-xl shadow-inner group hover:border-gray-600 transition-all">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-lg text-gray-400 group-hover:text-white transition-colors">{icon}</div>
                <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h3>
                    <p className="text-[10px] text-gray-500">{description}</p>
                </div>
            </div>
            {status}
        </div>
        <div className="mt-4 space-y-3">
            {children}
        </div>
    </div>
);

const ConnectionsTab: React.FC<ConnectionsTabProps> = ({ settings, onSettingsChange, onSave }) => {
    const aiConfigType = getAiConfigurationType();
    const [isAiTesting, setIsAiTesting] = useState(false);
    const [aiConnectionStatus, setAiConnectionStatus] = useState<'idle' | 'success' | 'error'>(aiConfigType === 'direct' ? 'success' : 'idle');

    const testAiConnection = async () => {
        setIsAiTesting(true);
        try {
            const supabase = getSupabase();
            // Tenta invocar a função para ver se a GEMINI_API_KEY nos Secrets funciona
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { prompt: "Responda apenas 'OK' se estiveres a ler a chave secreta corretamente." }
            });
            
            if (error) throw error;
            setAiConnectionStatus('success');
        } catch (e) {
            console.error(e);
            setAiConnectionStatus('error');
            alert("Erro: A função 'ai-proxy' não respondeu. Verifique se configurou o Secret 'GEMINI_API_KEY' no Dashboard do Supabase.");
        } finally {
            setIsAiTesting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* BLOC: GEMINI AI */}
                <ConnectionCard 
                    title="Inteligência Artificial (Gemini)" 
                    icon={<FaRobot size={20}/>} 
                    status={<StatusBadge configured={aiConnectionStatus === 'success'} testing={isAiTesting} label={aiConfigType === 'direct' ? 'MODO LOCAL' : 'MODO PONTE'} />}
                    description="Cérebro da aplicação para triagem, análise de vulnerabilidades e automação."
                >
                    <div className="bg-black/30 p-3 rounded border border-gray-800 text-xs text-gray-400">
                        <p className="mb-2">Status da Autorização: <span className="text-brand-secondary font-bold">yyiwkrkuhlkqibhowdmq</span></p>
                        <button 
                            onClick={testAiConnection}
                            disabled={isAiTesting}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded border border-purple-500/30 transition-all font-bold"
                        >
                            <FaFlask /> Testar Ponte de IA (MCP)
                        </button>
                    </div>
                </ConnectionCard>

                {/* BLOC: SOPHOS EDR */}
                <ConnectionCard 
                    title="Sophos Central (Sync)" 
                    icon={<FaShieldAlt size={20}/>} 
                    status={<StatusBadge configured={!!(settings.sophos_client_id && settings.sophos_client_secret)} />}
                    description="Integração para puxar alertas de segurança e isolar máquinas."
                >
                    <div className="grid grid-cols-1 gap-2">
                        <input 
                            type="password" 
                            placeholder="Client ID" 
                            value={settings.sophos_client_id || ''} 
                            onChange={(e) => onSettingsChange('sophos_client_id', e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none"
                        />
                        <input 
                            type="password" 
                            placeholder="Client Secret" 
                            value={settings.sophos_client_secret || ''} 
                            onChange={(e) => onSettingsChange('sophos_client_secret', e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none"
                        />
                    </div>
                </ConnectionCard>

                {/* BLOC: INFRAESTRUTURA */}
                <div className="lg:col-span-2">
                    <ConnectionCard 
                        title="Infraestrutura Supabase" 
                        icon={<FaKey size={20}/>} 
                        status={<StatusBadge configured={!!(settings.sbUrl && settings.sbKey)} />}
                        description="Ligação central à base de dados e armazenamento de ficheiros."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Project URL</label>
                                <input 
                                    type="text" 
                                    value={settings.sbUrl || ''} 
                                    onChange={(e) => onSettingsChange('sbUrl', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Anon Public Key</label>
                                <input 
                                    type="password" 
                                    value={settings.sbKey || ''} 
                                    onChange={(e) => onSettingsChange('sbKey', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs outline-none"
                                />
                            </div>
                        </div>
                    </ConnectionCard>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t border-gray-800 pt-6">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                    Obter Chave Gemini Grátis <FaExternalLinkAlt size={10}/>
                </a>
                <button onClick={onSave} className="bg-brand-primary text-white px-8 py-2 rounded-lg hover:bg-brand-secondary transition-all flex items-center gap-2 font-bold shadow-lg">
                    <FaSave /> Guardar Configurações
                </button>
            </div>
        </div>
    );
};

export default ConnectionsTab;