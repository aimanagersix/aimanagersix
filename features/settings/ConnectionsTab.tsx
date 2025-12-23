import React, { useState, useEffect, useMemo } from 'react';
import { FaKey, FaSave, FaCheckCircle, FaTimesCircle, FaEdit, FaShieldAlt, FaRobot, FaExternalLinkAlt, FaSync, FaFlask, FaSlack, FaEnvelope, FaInfoCircle, FaDatabase, FaUsers, FaBoxOpen } from 'react-icons/fa';
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
    <div className="bg-gray-900/50 border border-gray-700 p-5 rounded-xl shadow-inner group hover:border-gray-600 transition-all flex flex-col h-full">
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
        <div className="mt-4 space-y-3 flex-grow">
            {children}
        </div>
    </div>
);

const ConnectionsTab: React.FC<ConnectionsTabProps> = ({ settings, onSettingsChange, onSave }) => {
    const aiConfigType = getAiConfigurationType();
    const [isAiTesting, setIsAiTesting] = useState(false);
    const [isDbTesting, setIsDbTesting] = useState(false);
    const [aiConnectionStatus, setAiConnectionStatus] = useState<'idle' | 'success' | 'error'>(aiConfigType === 'direct' ? 'success' : 'idle');
    const [dbConnectionStatus, setDbConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    
    // Stats Reais da Base de Dados (Pedido 9)
    const [dbStats, setDbStats] = useState({
        collaborators: null as number | null,
        equipment: null as number | null
    });

    const testAiConnection = async () => {
        setIsAiTesting(true);
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { prompt: "Responda apenas 'OK' se estiveres a ler a chave secreta corretamente." }
            });
            
            if (error) {
                if (error.message?.includes('404') || error.message?.includes('Failed to fetch')) {
                    throw new Error("A função 'ai-proxy' não foi encontrada ou não está publicada no Supabase.");
                }
                throw error;
            }
            setAiConnectionStatus('success');
            alert("Sucesso! A Ponte de IA está a ler a GEMINI_API_KEY corretamente.");
        } catch (e: any) {
            console.error(e);
            setAiConnectionStatus('error');
            alert(`Erro de Conetividade:\n${e.message}\n\nDICA: Se a CLI falhar, configure a chave manualmente no Dashboard do Supabase em 'Settings -> Edge Functions -> Secrets'.`);
        } finally {
            setIsAiTesting(false);
        }
    };

    const fetchLiveStats = async () => {
        setIsDbTesting(true);
        try {
            const supabase = getSupabase();
            
            // Pedido 9: Consulta absoluta sem filtros para bater com o Dashboard do Supabase
            const [resCollabs, resEquip] = await Promise.all([
                supabase.from('collaborators').select('id', { count: 'exact', head: true }),
                supabase.from('equipment').select('id', { count: 'exact', head: true })
            ]);
            
            if (resCollabs.error) throw resCollabs.error;
            
            setDbConnectionStatus('success');
            setDbStats({
                collaborators: resCollabs.count,
                equipment: resEquip.count
            });
            
            alert(`Sincronização Live:\n\n- Registos totais em 'collaborators': ${resCollabs.count}\n- Registos totais em 'equipment': ${resEquip.count}\n\nO sistema está agora a ler o estado real da sua base de dados.`);
        } catch (e: any) {
            console.error(e);
            setDbConnectionStatus('error');
            alert(`Erro de Base de Dados:\n${e.message}`);
        } finally {
            setIsDbTesting(false);
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
                    description="Cérebro da aplicação para triagem e automação (Edge Function)."
                >
                    <div className="bg-black/30 p-3 rounded border border-gray-800 text-xs text-gray-400">
                        <p className="mb-2">Configuração Manual (Sem CLI):</p>
                        <ol className="list-decimal list-inside space-y-1 mb-3 text-[11px]">
                            <li>Aceda ao <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-brand-secondary underline">Dashboard Supabase</a>.</li>
                            <li>Vá a <strong>Settings</strong> &gt; <strong>Edge Functions</strong>.</li>
                            <li>Adicione o Secret: <code className="text-purple-400 font-bold">GEMINI_API_KEY</code></li>
                        </ol>
                        <button 
                            onClick={testAiConnection}
                            disabled={isAiTesting}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded border border-purple-500/30 transition-all font-bold"
                        >
                            <FaFlask /> Testar Ponte de IA
                        </button>
                    </div>
                </ConnectionCard>

                {/* BLOC: INFRAESTRUTURA SUPABASE (Expandido para Diagnóstico Direto e Stats) */}
                <ConnectionCard 
                    title="Infraestrutura Supabase" 
                    icon={<FaKey size={20}/>} 
                    status={<StatusBadge configured={dbConnectionStatus === 'success'} testing={isDbTesting} label="PRODUÇÃO ATIVA" />}
                    description="Base de dados PostgreSQL e Autenticação (Projeto: yyiwkrkuhlkqibhowdmq)."
                >
                    <div className="bg-black/30 p-3 rounded border border-gray-800 text-xs text-gray-400 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col bg-gray-900/50 p-2 rounded border border-gray-700">
                                <span className="flex items-center gap-2 text-[9px] uppercase font-bold text-gray-500 mb-1"><FaUsers className="text-brand-secondary"/> Colaboradores (Live)</span>
                                <span className="font-mono text-white font-bold text-lg">{dbStats.collaborators !== null ? dbStats.collaborators : '---'}</span>
                            </div>
                            <div className="flex flex-col bg-gray-900/50 p-2 rounded border border-gray-700">
                                <span className="flex items-center gap-2 text-[9px] uppercase font-bold text-gray-500 mb-1"><FaBoxOpen className="text-orange-400"/> Equipamentos (Live)</span>
                                <span className="font-mono text-white font-bold text-lg">{dbStats.equipment !== null ? dbStats.equipment : '---'}</span>
                            </div>
                        </div>
                        <button 
                            onClick={fetchLiveStats}
                            disabled={isDbTesting}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 transition-all font-bold"
                        >
                            <FaDatabase /> Consultar Estatísticas Reais
                        </button>
                    </div>
                </ConnectionCard>

                {/* BLOC: SOPHOS EDR */}
                <ConnectionCard 
                    title="Sophos Central (Sync)" 
                    icon={<FaShieldAlt size={20}/>} 
                    status={<StatusBadge configured={!!(settings.sophos_client_id && settings.sophos_client_secret)} />}
                    description="Integração para alertas de segurança e isolamento de endpoints."
                >
                    <div className="grid grid-cols-1 gap-2">
                        <input 
                            type="password" 
                            placeholder="Client ID" 
                            value={settings.sophos_client_id || ''} 
                            onChange={(e) => onSettingsChange('sophos_client_id', e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none font-mono"
                        />
                        <input 
                            type="password" 
                            placeholder="Client Secret" 
                            value={settings.sophos_client_secret || ''} 
                            onChange={(e) => onSettingsChange('sophos_client_secret', e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none font-mono"
                        />
                    </div>
                </ConnectionCard>

                {/* BLOC: SLACK WEBHOOKS */}
                <ConnectionCard 
                    title="Slack (Webhooks)" 
                    icon={<FaSlack size={20}/>} 
                    status={<StatusBadge configured={!!settings.slackWebhookUrl} />}
                    description="Envio de alertas de segurança para canais específicos."
                >
                    <input 
                        type="text" 
                        placeholder="Webhook URL (https://hooks.slack.com/...)" 
                        value={settings.slackWebhookUrl || ''} 
                        onChange={(e) => onSettingsChange('slackWebhookUrl', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none font-mono"
                    />
                </ConnectionCard>

                {/* BLOC: RESEND EMAIL */}
                <div className="lg:col-span-2">
                    <ConnectionCard 
                        title="Resend (E-mail API)" 
                        icon={<FaEnvelope size={20}/>} 
                        status={<StatusBadge configured={!!(settings.resendApiKey && settings.resendFromEmail)} />}
                        description="Envio de e-mails automáticos (Aniversários, Relatórios)."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="password" 
                                placeholder="Resend API Key (re_...)" 
                                value={settings.resendApiKey || ''} 
                                onChange={(e) => onSettingsChange('resendApiKey', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none font-mono"
                            />
                            <input 
                                type="text" 
                                placeholder="E-mail do Remetente (ex: it@empresa.pt)" 
                                value={settings.resendFromEmail || ''} 
                                onChange={(e) => onSettingsChange('resendFromEmail', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none"
                            />
                        </div>
                    </ConnectionCard>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t border-gray-800 pt-6">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                    Obter Chave Gemini Grátis <FaExternalLinkAlt size={10}/>
                </a>
                <button onClick={onSave} className="bg-brand-primary text-white px-8 py-2 rounded-lg hover:bg-brand-secondary transition-all flex items-center gap-2 font-bold shadow-lg">
                    <FaSave /> Guardar Configurações Ativas
                </button>
            </div>
        </div>
    );
};

export default ConnectionsTab;