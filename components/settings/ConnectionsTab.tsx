import React from 'react';
import { FaKey, FaSave } from 'react-icons/fa';

interface ConnectionsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
}

const ConnectionsTab: React.FC<ConnectionsTabProps> = ({ settings, onSettingsChange, onSave }) => {

    return (
        <div className="space-y-6 animate-fade-in">
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
                        <label className="block text-xs text-gray-500 uppercase mb-1">Supabase Anon Key</label>
                        <input type="password" value={settings.sbKey} onChange={(e) => onSettingsChange('sbKey', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"/>
                    </div>
                     <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Service Role Key (Opcional)</label>
                        <input type="password" value={settings.sbServiceKey} onChange={(e) => onSettingsChange('sbServiceKey', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"/>
                        <p className="text-xs text-gray-500 mt-1">Necessária para automações avançadas como a criação de utilizadores de login.</p>
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