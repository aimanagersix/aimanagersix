import React from 'react';
import { FaKey, FaSave, FaSlack, FaExternalLinkAlt } from 'react-icons/fa';

interface ConnectionsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
}

const ConnectionsTab: React.FC<ConnectionsTabProps> = ({ settings, onSettingsChange, onSave }) => {

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Slack Integration */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaSlack className="text-purple-400"/> Notificações Slack</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Configure um Webhook para receber alertas imediatos de incidentes críticos e novos pedidos de aprovação.
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Slack Webhook URL</label>
                        <input 
                            type="password" 
                            value={settings.slackWebhookUrl || ''} 
                            onChange={(e) => onSettingsChange('slackWebhookUrl', e.target.value)} 
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"
                            placeholder="https://hooks.slack.com/services/..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Crie uma "Incoming Webhook" na sua gestão de Apps do Slack e cole o URL aqui.
                        </p>
                    </div>
                </div>
            </div>

            {/* Supabase Connection */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaKey className="text-green-400"/> Conexão Supabase</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Credenciais de acesso à base de dados. Alterar com cuidado.
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Supabase URL</label>
                        <input type="text" value={settings.sbUrl} onChange={(e) => onSettingsChange('sbUrl', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"/>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Supabase Anon Key (Pública)</label>
                        <input type="password" value={settings.sbKey} onChange={(e) => onSettingsChange('sbKey', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"/>
                    </div>
                     <div className="border-t border-gray-700 pt-3 mt-3">
                        <label className="block text-xs text-orange-400 font-bold uppercase mb-1 flex items-center gap-1">
                            Supabase Service Role Key (Secreta) 
                            <span className="text-[10px] font-normal text-gray-500 ml-auto">Necessária para gestão de passwords</span>
                        </label>
                        <input 
                            type="password" 
                            value={settings.sbServiceKey} 
                            onChange={(e) => onSettingsChange('sbServiceKey', e.target.value)} 
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        />
                        <div className="text-xs text-gray-500 mt-2">
                            <p>Esta chave é necessária para que o Admin possa redefinir passwords de outros utilizadores.</p>
                            <p className="mt-1">
                                Pode encontrá-la no seu projeto Supabase em: 
                                <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline ml-1 inline-flex items-center">
                                    Project Settings &gt; API &gt; service_role (secret) <FaExternalLinkAlt className="ml-1 text-[10px]"/>
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resend Connection */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaKey className="text-red-400"/> Conexão Resend (Email)</h3>
                <p className="text-sm text-gray-400 mb-4">
                    API Key para o serviço de envio de emails (relatórios, notificações).
                </p>
                 <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Resend API Key</label>
                        <input type="password" value={settings.resendApiKey} onChange={(e) => onSettingsChange('resendApiKey', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"/>
                    </div>
                     <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Remetente do Email (From)</label>
                        <input type="email" value={settings.resendFromEmail} onChange={(e) => onSettingsChange('resendFromEmail', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono" placeholder="ex: noreply@seu-dominio.com"/>
                         <p className="text-xs text-gray-500 mt-1">Para testes, use o seu email de registo no Resend. Em produção, use um email de um domínio verificado.</p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
                <button onClick={onSave} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-secondary transition-colors flex items-center gap-2 shadow-lg">
                    <FaSave /> Guardar Ligações
                </button>
            </div>
        </div>
    );
};

export default ConnectionsTab;