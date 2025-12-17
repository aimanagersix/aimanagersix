import React, { useState, useEffect } from 'react';
import { FaNetworkWired, FaPlay, FaSpinner, FaTicketAlt, FaShieldAlt, FaCheck, FaCopy, FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';

interface WebhooksTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSimulate: () => void;
    onCreateSimulatedTicket?: () => void;
}

const WebhooksTab: React.FC<WebhooksTabProps> = ({ settings, onSettingsChange, onSimulate, onCreateSimulatedTicket }) => {
    const [copied, setCopied] = useState(false);
    
    // Constrói o URL dinamicamente baseado nas configurações do Supabase
    const supabaseUrl = settings.sbUrl || 'https://sua-instancia.supabase.co';
    const realWebhookUrl = `${supabaseUrl}/functions/v1/ingest-sophos-alert`;

    const handleCopy = () => {
        navigator.clipboard.writeText(realWebhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const setSophosExample = () => {
        const sophosJson = {
            alert_type: "Event::Endpoint::Threat::Detected",
            severity: "high",
            endpoint_id: "e44d32-4122-4a33",
            endpoint_type: "computer",
            customer_id: "c11b-9922",
            when: new Date().toISOString(),
            description: "Malware 'Troj/Agent-AUW' detetado em 'C:\\Users\\Finance\\Downloads\\fatura_pendente.exe'",
            full_name: "PC-FINANCEIRO-01",
            location: "Lisboa Office"
        };
        onSettingsChange('webhookJson', JSON.stringify(sophosJson, null, 2));
    };

    return (
        <div className="animate-fade-in p-6 flex flex-col h-full space-y-6">
            {/* Bloco de Instrução Sophos */}
            <div className="bg-blue-900/20 border border-blue-500/50 p-5 rounded-xl text-sm text-blue-200 shadow-lg">
                <div className="flex items-center gap-3 font-bold mb-3 text-lg text-white">
                    <FaShieldAlt className="text-blue-400" /> 
                    Configuração Sophos Central (SIEM)
                </div>
                <p className="mb-4">
                    Para receber alertas em tempo real, configure o seu Sophos Central seguindo estes passos:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2 text-blue-100/80">
                    <li>Aceda ao <a href="https://central.sophos.com" target="_blank" rel="noreferrer" className="underline hover:text-white inline-flex items-center gap-1">Sophos Central <FaExternalLinkAlt className="text-[10px]"/></a>.</li>
                    <li>Vá a <strong>Settings</strong> &gt; <strong>SIEM Integration</strong>.</li>
                    <li>Ative o token e selecione o formato <strong>JSON</strong>.</li>
                    <li>No campo de URL de destino, utilize o endereço abaixo.</li>
                </ol>
            </div>

            {/* URL do Webhook */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <label className="block text-xs text-gray-500 uppercase font-bold mb-2 tracking-widest">URL de Ingestão Dedicado</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={realWebhookUrl} 
                        readOnly 
                        className="flex-grow bg-black/40 border border-gray-600 text-brand-secondary rounded-md p-3 text-sm font-mono focus:ring-1 focus:ring-brand-secondary outline-none"
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
                    <FaInfoCircle /> Este URL é privado e comunica diretamente com a sua Edge Function no Supabase.
                </p>
            </div>

            <div className="mt-4 border-t border-gray-700 pt-6 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <FaNetworkWired className="text-gray-400"/> Simulador de Alertas
                    </h3>
                    <button 
                        type="button" 
                        onClick={setSophosExample}
                        className="text-xs bg-gray-800 text-gray-300 border border-gray-600 px-3 py-1.5 rounded hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                        <FaShieldAlt className="text-blue-400"/> Carregar Exemplo Sophos
                    </button>
                </div>
                
                <div className="relative group">
                    <textarea 
                        value={settings.webhookJson}
                        onChange={(e) => onSettingsChange('webhookJson', e.target.value)}
                        rows={8}
                        className="w-full bg-gray-950 p-4 rounded-lg text-xs font-mono text-yellow-300 border border-gray-700 focus:border-brand-secondary outline-none custom-scrollbar shadow-inner"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-1 rounded">JSON Payload</span>
                    </div>
                </div>
                
                <div className="mt-4 flex gap-3">
                    <button 
                        onClick={onSimulate}
                        disabled={settings.isSimulating}
                        className="bg-brand-primary text-white px-8 py-3 rounded-lg hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50 shadow-xl font-bold transition-transform active:scale-95"
                    >
                        {settings.isSimulating ? <FaSpinner className="animate-spin"/> : <FaPlay />}
                        Testar Lógica IA
                    </button>
                </div>

                {settings.simulatedTicket && (
                    <div className="mt-6 p-6 bg-gray-800 border border-brand-secondary/40 rounded-xl animate-fade-in shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full -mr-12 -mt-12"></div>
                        
                        <div className="flex justify-between items-start mb-5 relative z-10">
                            <h4 className="text-white font-bold text-lg flex items-center gap-2">
                                <FaTicketAlt className="text-brand-secondary"/> Proposta de Ticket IA:
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${settings.simulatedTicket.severity === 'Crítica' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-600 text-white'}`}>
                                Prioridade: {settings.simulatedTicket.severity}
                            </span>
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                                <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Título Gerado</p>
                                <p className="text-white font-bold text-md">{settings.simulatedTicket.title}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                                    <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Ativo Relacionado</p>
                                    <p className="text-brand-secondary font-mono text-sm">{settings.simulatedTicket.affectedAsset || 'Desconhecido'}</p>
                                </div>
                                <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                                    <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Classificação NIS2</p>
                                    <p className="text-white text-sm">{settings.simulatedTicket.incidentType}</p>
                                </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-lg border border-gray-700">
                                <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Análise Técnica (IA)</p>
                                <p className="text-gray-300 text-sm italic leading-relaxed">{settings.simulatedTicket.description}</p>
                            </div>
                            
                            {onCreateSimulatedTicket && (
                                <button 
                                    onClick={onCreateSimulatedTicket}
                                    className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 transition-all hover:scale-[1.01] shadow-lg shadow-green-900/20"
                                >
                                    <FaCheck className="text-xl" /> CRIAR TICKET REAL DE INCIDENTE
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