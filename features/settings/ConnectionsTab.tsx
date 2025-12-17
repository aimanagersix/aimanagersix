
import React, { useState } from 'react';
import { FaKey, FaSave, FaSlack, FaCheckCircle, FaTimesCircle, FaEdit, FaTimes, FaShieldAlt } from 'react-icons/fa';

interface ConnectionsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
}

const SecretStatusItem = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    description 
}: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    placeholder?: string,
    description?: string 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newValue, setNewValue] = useState('');
    
    // Consideramos configurado se houver qualquer valor preenchido
    const isConfigured = typeof value === 'string' && value.trim().length > 0;

    const handleSaveLocal = () => {
        if (newValue.trim()) {
            onChange(newValue);
        }
        setIsEditing(false);
        setNewValue('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewValue('');
    };

    return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600 mb-3">
            <div className="flex justify-between items-start mb-1">
                <label className="block text-xs text-gray-400 uppercase font-bold">{label}</label>
                <div className="flex items-center gap-2">
                    {isConfigured ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/30">
                            <FaCheckCircle /> Configurado
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/30">
                            <FaTimesCircle /> Não Configurado
                        </span>
                    )}
                </div>
            </div>
            
            {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}

            {isEditing ? (
                <div className="animate-fade-in mt-2">
                    <input 
                        type="password" 
                        value={newValue} 
                        onChange={(e) => setNewValue(e.target.value)} 
                        className="w-full bg-gray-900 border border-brand-secondary text-white rounded-md p-2 text-sm font-mono mb-2 focus:ring-1 focus:ring-brand-secondary outline-none"
                        placeholder={placeholder || "Insira o valor..."}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <button onClick={handleCancel} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700">
                            <FaTimes /> Cancelar
                        </button>
                        <button onClick={handleSaveLocal} className="text-xs bg-brand-primary text-white px-3 py-1 rounded hover:bg-brand-secondary flex items-center gap-1">
                            <FaSave /> Definir Novo Valor
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="mt-1 text-xs text-brand-secondary hover:text-white flex items-center gap-1 transition-colors"
                >
                    <FaEdit /> {isConfigured ? 'Alterar' : 'Configurar'}
                </button>
            )}
        </div>
    );
};

const ConnectionsTab: React.FC<ConnectionsTabProps> = ({ settings, onSettingsChange, onSave }) => {

    return (
        <div className="space-y-6 animate-fade-in p-6">
            
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-sm text-blue-200 mb-6">
                <p>
                    <strong>Segurança de Credenciais:</strong> As chaves são armazenadas na tabela de configurações globais. O estado indica apenas a presença de uma configuração ativa.
                </p>
            </div>

            {/* Sophos Central Integration */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FaShieldAlt className="text-blue-400"/> Sophos Central (Security Link)</h3>
                <p className="text-xs text-gray-500 mb-4">Credenciais para correlação automática de incidentes e criação de tickets NIS2.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SecretStatusItem 
                        label="Sophos Client ID"
                        value={settings.sophos_client_id}
                        onChange={(val) => onSettingsChange('sophos_client_id', val)}
                        placeholder="Ex: d45c..."
                    />
                    <SecretStatusItem 
                        label="Sophos Client Secret"
                        value={settings.sophos_client_secret}
                        onChange={(val) => onSettingsChange('sophos_client_secret', val)}
                        placeholder="****************"
                    />
                </div>
            </div>

            {/* Slack Integration */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FaSlack className="text-purple-400"/> Notificações Slack</h3>
                
                <SecretStatusItem 
                    label="Slack Webhook URL"
                    value={settings.slackWebhookUrl}
                    onChange={(val) => onSettingsChange('slackWebhookUrl', val)}
                    placeholder="https://hooks.slack.com/services/..."
                    description="Permite receber alertas de incidentes críticos num canal do Slack."
                />
            </div>

            {/* Supabase Connection */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FaKey className="text-green-400"/> Conexão Base de Dados (Supabase)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SecretStatusItem 
                        label="Supabase URL"
                        value={settings.sbUrl}
                        onChange={(val) => onSettingsChange('sbUrl', val)}
                        placeholder="https://exemplo.supabase.co"
                    />
                    <SecretStatusItem 
                        label="Anon Key (Pública)"
                        value={settings.sbKey}
                        onChange={(val) => onSettingsChange('sbKey', val)}
                    />
                </div>
            </div>

            {/* Resend Connection */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FaKey className="text-red-400"/> Serviço de Email (Resend)</h3>
                
                <SecretStatusItem 
                    label="Resend API Key"
                    value={settings.resendApiKey}
                    onChange={(val) => onSettingsChange('resendApiKey', val)}
                    description="Usada para enviar relatórios automáticos e notificações."
                />
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
                <button onClick={onSave} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-secondary transition-colors flex items-center gap-2 shadow-lg">
                    <FaSave /> Guardar Configurações
                </button>
            </div>
        </div>
    );
};

export default ConnectionsTab;
