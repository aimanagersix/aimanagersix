import React, { useState } from 'react';
import { FaNetworkWired, FaPlay, FaSpinner, FaTicketAlt, FaShieldAlt, FaCheck, FaCopy, FaInfoCircle, FaExternalLinkAlt, FaKey, FaSync } from 'react-icons/fa';

interface WebhooksTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSimulate: () => void;
    onCreateSimulatedTicket?: () => void;
}

const WebhooksTab: React.FC<WebhooksTabProps> = ({ settings, onSettingsChange, onSimulate, onCreateSimulatedTicket }) => {
    const [copied, setCopied] = useState(false);
    
    const supabaseUrl = settings.sbUrl || 'https://sua-instancia.supabase.co';
    const genericWebhookUrl = `${supabaseUrl}/functions/v1/ingest-external-alert`;

    const handleCopy = () => {
        navigator.clipboard.writeText(genericWebhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const setSophosExample = () => {
        const sophosJson = {
            alert_type: "Event::Endpoint::Threat::Detected",
            severity: "high",
            description: "Malware detetado via API Polling",
            full_name: "PC-TECNICO-01",
            location: "Sede"
        };
        onSettingsChange('webhookJson', JSON.stringify(sophosJson, null, 2));
    };

    return (
        <div className="animate-fade-in p-6 flex flex-col h-full space-y-6">
            {/* Bloco de Instrução Corrigido para Sophos */}
            <div className="bg-blue-900/20 border border-blue-500/50 p-5 rounded-xl text-sm text-blue-200 shadow-lg">
                <div className="flex items-center gap-3 font-bold mb-3 text-lg text-white">
                    <FaShieldAlt className="text-blue-400" /> 
                    Integração Sophos Central (API Pull)
                </div>
                <p className="mb-4">
                    O Sophos Central não envia dados para URLs. Para integrar, deve criar credenciais de leitura:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2 text-blue-100/80 font-medium">
                    <li>Aceda ao <a href="https://central.sophos.com" target="_blank" rel="noreferrer" className="underline hover:text-white inline-flex items-center gap-1">Sophos Central <FaExternalLinkAlt className="text-[10px]"/></a>.</li>
                    <li>Vá a <strong>Global Settings</strong> &gt; <strong>API Management</strong>.</li>
                    <li>Clique em <strong>Add Service Principal</strong>, dê um nome e selecione a role <strong>"ReadOnly"</strong>.</li>
                    <li>Copie o <strong>Client ID</strong> e o <strong>Client Secret</strong>.</li>
                    <li>Cole estas chaves na aba <strong>"Conexões & APIs"</strong> desta aplicação.</li>
                    <li>Ative a tarefa agendada na aba <strong>"Tarefas Agendadas"</strong> para buscar alertas automaticamente.</li>
                </ol>
            </div>

            {/* URL para Outros Sistemas */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <label className="block text-xs text-gray-500 uppercase font-bold mb-2 tracking-widest">Webhook para Outros Sistemas (Generic Push)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={genericWebhookUrl} 
                        readOnly 
                        className="flex-grow bg-black/40 border border-gray-600 text-brand-secondary rounded-md p-3 text-sm font-mono outline-none"
                    />
                    <button 
                        onClick={handleCopy}
                        className={`px-6 rounded-md font-bold transition-all flex items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-brand-primary text-white hover:bg-brand-secondary'}`}
                    >
                        {copied ? <FaCheck /> : <FaCopy />}
                        {copied ? 'Copiado' : 'Copiar URL'}
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                    <FaInfoCircle /> Use este URL apenas para sistemas que suportam "Webhook Push" (ex: Grafana, Zabbix, Azure).
                </p>
            </div>

            <div className="mt-4 border-t border-gray-700 pt-6 flex-grow flex flex-col">
                <h3 className="font-bold text-white flex items-center gap-2 text-lg mb-3">
                    <FaNetworkWired className="text-gray-400"/> Simulador de Processamento IA
                </h3>
                
                <div className="relative group mb-4">
                    <textarea 
                        value={settings.webhookJson}
                        onChange={(e) => onSettingsChange('webhookJson', e.target.value)}
                        rows={6}
                        className="w-full bg-gray-950 p-4 rounded-lg text-xs font-mono text-yellow-300 border border-gray-700 focus:border-brand-secondary outline-none custom-scrollbar shadow-inner"
                    />
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={onSimulate}
                        disabled={settings.isSimulating}
                        className="bg-brand-primary text-white px-8 py-3 rounded-lg hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50 shadow-xl font-bold transition-transform active:scale-95"
                    >
                        {settings.isSimulating ? <FaSpinner className="animate-spin"/> : <FaPlay />}
                        Testar Lógica de Triagem IA
                    </button>
                    <button 
                        type="button" 
                        onClick={setSophosExample}
                        className="text-xs bg-gray-800 text-gray-300 border border-gray-600 px-4 rounded hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                        <FaShieldAlt className="text-blue-400"/> Carregar Exemplo Sophos
                    </button>
                </div>

                {settings.simulatedTicket && (
                    <div className="mt-6 p-6 bg-gray-800 border border-brand-secondary/40 rounded-xl animate-fade-in shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-5 relative z-10">
                            <h4 className="text-white font-bold text-lg flex items-center gap-2">
                                <FaTicketAlt className="text-brand-secondary"/> Proposta de Ticket via API:
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${settings.simulatedTicket.severity === 'Crítica' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-600 text-white'}`}>
                                Prioridade: {settings.simulatedTicket.severity}
                            </span>
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                                <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Título do Incidente</p>
                                <p className="text-white font-bold text-md">{settings.simulatedTicket.title}</p>
                            </div>
                            <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                                <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Análise Técnica (IA)</p>
                                <p className="text-gray-300 text-sm italic">{settings.simulatedTicket.description}</p>
                            </div>
                            {onCreateSimulatedTicket && (
                                <button 
                                    onClick={onCreateSimulatedTicket}
                                    className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 transition-all shadow-lg"
                                >
                                    <FaCheck className="text-xl" /> CRIAR TICKET DE SEGURANÇA AGORA
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebhooksTab;