import React from 'react';
/* Added FaCheck to the imports from react-icons/fa */
import { FaNetworkWired, FaPlay, FaSpinner, FaTicketAlt, FaShieldAlt, FaCheck } from 'react-icons/fa';

interface WebhooksTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSimulate: () => void;
    onCreateSimulatedTicket?: () => void;
}

const WebhooksTab: React.FC<WebhooksTabProps> = ({ settings, onSettingsChange, onSimulate, onCreateSimulatedTicket }) => {
    
    const setSophosExample = () => {
        const sophosJson = {
            alert_type: "Event::Endpoint::Threat::Detected",
            severity: "high",
            endpoint_id: "e44d32...",
            endpoint_type: "computer",
            customer_id: "c11b...",
            when: new Date().toISOString(),
            description: "Malware 'Troj/Agent-AUW' detected in 'C:\\Users\\Finance\\Downloads\\invoice_proc.exe'",
            full_name: "PC-FINANCEIRO-01",
            location: "Lisboa Office"
        };
        onSettingsChange('webhookJson', JSON.stringify(sophosJson, null, 2));
    };

    return (
        <div className="animate-fade-in p-6 flex flex-col h-full">
            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-6">
                <div className="flex items-center gap-2 font-bold mb-2"><FaNetworkWired /> Webhooks de Ingestão (SIEM / EDR)</div>
                <p>
                    Configure o Sophos Central (SIEM Integration) para enviar alertas para o URL abaixo. 
                    O AIManager utilizará IA para processar o alerta e criar um Ticket de Segurança automaticamente.
                </p>
            </div>

            <div className="mb-6">
                <label className="block text-xs text-gray-500 uppercase mb-1">Webhook URL Dedicado</label>
                <div className="flex gap-2">
                    <input type="text" value={settings.webhookUrl || 'https://sua-url-supabase.co/functions/v1/ingest-alert'} readOnly className="flex-grow bg-gray-800 border border-gray-600 text-gray-400 rounded-md p-2 text-sm font-mono"/>
                </div>
            </div>

            <div className="mt-4 border-t border-gray-700 pt-6 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">Simulador de Payload</h3>
                    <button 
                        type="button" 
                        onClick={setSophosExample}
                        className="text-xs bg-blue-900/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-800/50 flex items-center gap-2"
                    >
                        <FaShieldAlt /> Carregar Exemplo Sophos
                    </button>
                </div>
                <textarea 
                    value={settings.webhookJson}
                    onChange={(e) => onSettingsChange('webhookJson', e.target.value)}
                    rows={10}
                    className="w-full bg-gray-900 p-3 rounded text-xs font-mono text-yellow-300 border border-gray-600 focus:border-brand-secondary outline-none custom-scrollbar"
                />
                
                <div className="mt-4 flex gap-3">
                    <button 
                        onClick={onSimulate}
                        disabled={settings.isSimulating}
                        className="bg-brand-primary text-white px-6 py-2 rounded hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50 shadow-lg font-bold"
                    >
                        {settings.isSimulating ? <FaSpinner className="animate-spin"/> : <FaPlay />}
                        Testar Processamento IA
                    </button>
                </div>

                {settings.simulatedTicket && (
                    <div className="mt-6 p-5 bg-gray-800 border border-brand-secondary/50 rounded-xl animate-fade-in shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-white font-bold flex items-center gap-2">
                                <FaTicketAlt className="text-brand-secondary"/> Resultado da Análise IA:
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${settings.simulatedTicket.severity === 'Crítica' ? 'bg-red-600' : 'bg-orange-600'}`}>
                                {settings.simulatedTicket.severity}
                            </span>
                        </div>
                        <div className="text-sm space-y-3">
                            <div className="bg-black/30 p-3 rounded border border-gray-700">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Título Sugerido</p>
                                <p className="text-white font-medium">{settings.simulatedTicket.title}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-black/30 p-3 rounded border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Ativo Identificado</p>
                                    <p className="text-brand-secondary font-mono">{settings.simulatedTicket.affectedAsset || 'Não detetado'}</p>
                                </div>
                                <div className="bg-black/30 p-3 rounded border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Tipo de Ameaça</p>
                                    <p className="text-white">{settings.simulatedTicket.incidentType}</p>
                                </div>
                            </div>
                            <div className="bg-black/30 p-3 rounded border border-gray-700">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Resumo da IA</p>
                                <p className="text-gray-300 italic">{settings.simulatedTicket.description}</p>
                            </div>
                            
                            {onCreateSimulatedTicket && (
                                <button 
                                    onClick={onCreateSimulatedTicket}
                                    className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                                >
                                    <FaCheck /> Confirmar e Criar Ticket Real de Segurança
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