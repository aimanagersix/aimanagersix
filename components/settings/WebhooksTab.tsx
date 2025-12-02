import React from 'react';
import { FaNetworkWired, FaPlay, FaSpinner, FaTicketAlt } from 'react-icons/fa';

interface WebhooksTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSimulate: () => void;
    onCreateSimulatedTicket?: () => void;
}

const WebhooksTab: React.FC<WebhooksTabProps> = ({ settings, onSettingsChange, onSimulate, onCreateSimulatedTicket }) => {
    
    return (
        <div className="animate-fade-in p-6 h-full flex flex-col">
            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-6">
                <div className="flex items-center gap-2 font-bold mb-2"><FaNetworkWired /> Webhooks de Ingestão</div>
                <p>
                    Utilize o URL abaixo para integrar com sistemas externos (SIEM, EDR, RMM). Envie um POST com um JSON de alerta para criar automaticamente um ticket de segurança.
                </p>
            </div>

            <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Webhook URL</label>
                <input type="text" value={settings.webhookUrl} readOnly className="w-full bg-gray-800 border border-gray-600 text-gray-400 rounded-md p-2 text-sm font-mono"/>
            </div>

            <div className="mt-6 border-t border-gray-700 pt-6 flex-grow flex flex-col">
                <h3 className="font-bold text-white mb-2">Simulador de Alerta (JSON)</h3>
                <textarea 
                    value={settings.webhookJson}
                    onChange={(e) => onSettingsChange('webhookJson', e.target.value)}
                    rows={8}
                    className="w-full bg-gray-900 p-2 rounded text-xs font-mono text-yellow-300 border border-gray-600"
                />
                <button 
                    onClick={onSimulate}
                    disabled={settings.isSimulating}
                    className="mt-2 bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                >
                    {settings.isSimulating ? <FaSpinner className="animate-spin"/> : <FaPlay />}
                    Simular e Analisar com IA
                </button>

                {settings.simulatedTicket && (
                    <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded animate-fade-in flex-grow">
                        <h4 className="text-white font-bold mb-2">Ticket Simulado:</h4>
                        <div className="text-sm space-y-2">
                            <p><strong className="text-gray-400">Título:</strong> {settings.simulatedTicket.title}</p>
                            <p><strong className="text-gray-400">Severidade:</strong> <span className="text-red-400">{settings.simulatedTicket.severity}</span></p>
                            <p><strong className="text-gray-400">Descrição:</strong> {settings.simulatedTicket.description}</p>
                            <p><strong className="text-gray-400">Ativo Afetado:</strong> <span className="font-mono">{settings.simulatedTicket.affectedAsset}</span></p>
                             <p><strong className="text-gray-400">Tipo de Incidente:</strong> {settings.simulatedTicket.incidentType}</p>
                            {onCreateSimulatedTicket && (
                                <button 
                                    onClick={onCreateSimulatedTicket}
                                    className="mt-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1 text-xs rounded flex items-center gap-2"
                                >
                                    <FaTicketAlt/> Criar Ticket Real
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