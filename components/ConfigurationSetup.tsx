import React, { useState } from 'react';
import { FaKey, FaLink, FaSave, FaDatabase } from './common/Icons';
import DatabaseSchemaModal from './DatabaseSchemaModal';

// FIX: Define props interface to accept the onConfigured callback.
interface ConfigurationSetupProps {
    onConfigured: () => void;
}

const ConfigurationSetup: React.FC<ConfigurationSetupProps> = ({ onConfigured }) => {
    const [keys, setKeys] = useState({
        supabaseUrl: '',
        supabaseAnonKey: '',
        apiKey: '',
    });
    const [errors, setErrors] = useState({
        supabaseUrl: '',
        supabaseAnonKey: '',
        apiKey: '',
    });
    const [showSqlModal, setShowSqlModal] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setKeys(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = { supabaseUrl: '', supabaseAnonKey: '', apiKey: '' };
        let isValid = true;
        if (!keys.supabaseUrl.trim()) {
            newErrors.supabaseUrl = 'A URL do Supabase é obrigatória.';
            isValid = false;
        } else if (!keys.supabaseUrl.startsWith('https://')) {
             newErrors.supabaseUrl = 'A URL deve começar com https://';
             isValid = false;
        }
        if (!keys.supabaseAnonKey.trim()) {
            newErrors.supabaseAnonKey = 'A Chave Pública (Anon) do Supabase é obrigatória.';
            isValid = false;
        }
        if (!keys.apiKey.trim()) {
            newErrors.apiKey = 'A Chave da API Gemini é obrigatória.';
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        localStorage.setItem('SUPABASE_URL', keys.supabaseUrl);
        localStorage.setItem('SUPABASE_ANON_KEY', keys.supabaseAnonKey);
        localStorage.setItem('API_KEY', keys.apiKey);
        
        // FIX: Call the onConfigured callback instead of reloading the page for a smoother user experience.
        onConfigured();
    };
    
    return (
        <div className="min-h-screen bg-background-dark flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="font-bold text-4xl text-white">
                        AI<span className="text-brand-secondary">Manager</span>
                    </h1>
                    <p className="text-on-surface-dark-secondary mt-2">Gestão Inteligente de Equipamentos</p>
                </div>
                <div className="bg-surface-dark shadow-2xl rounded-xl px-8 pt-6 pb-8 mb-4">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-white">Bem-vindo!</h2>
                        <p className="text-on-surface-dark-secondary mt-2 text-sm">
                            Antes de começar, precisamos de configurar a ligação aos serviços. As suas chaves serão guardadas localmente no seu navegador para uso futuro.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="supabaseUrl" className="block text-on-surface-dark-secondary text-sm font-bold mb-2">Supabase URL</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaLink className="h-5 w-5 text-gray-400" /></div>
                                <input
                                    type="text"
                                    name="supabaseUrl"
                                    id="supabaseUrl"
                                    value={keys.supabaseUrl}
                                    onChange={handleChange}
                                    placeholder="https://exemplo.supabase.co"
                                    className={`bg-gray-700 border ${errors.supabaseUrl ? 'border-red-500' : 'border-gray-600'} focus:ring-brand-secondary focus:border-brand-secondary shadow appearance-none rounded w-full py-3 pl-10 pr-3 text-on-surface-dark leading-tight focus:outline-none focus:shadow-outline`}
                                />
                            </div>
                             {errors.supabaseUrl && <p className="text-red-400 text-xs italic mt-2">{errors.supabaseUrl}</p>}
                        </div>
                        <div>
                            <label htmlFor="supabaseAnonKey" className="block text-on-surface-dark-secondary text-sm font-bold mb-2">Supabase Anon Key</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaKey className="h-5 w-5 text-gray-400" /></div>
                                <input
                                    type="password"
                                    name="supabaseAnonKey"
                                    id="supabaseAnonKey"
                                    value={keys.supabaseAnonKey}
                                    onChange={handleChange}
                                    placeholder="Chave pública do Supabase"
                                    className={`bg-gray-700 border ${errors.supabaseAnonKey ? 'border-red-500' : 'border-gray-600'} focus:ring-brand-secondary focus:border-brand-secondary shadow appearance-none rounded w-full py-3 pl-10 pr-3 text-on-surface-dark leading-tight focus:outline-none focus:shadow-outline`}
                                />
                            </div>
                            {errors.supabaseAnonKey && <p className="text-red-400 text-xs italic mt-2">{errors.supabaseAnonKey}</p>}
                        </div>
                        <div>
                            <label htmlFor="apiKey" className="block text-on-surface-dark-secondary text-sm font-bold mb-2">Gemini API Key</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaKey className="h-5 w-5 text-gray-400" /></div>
                                <input
                                    type="password"
                                    name="apiKey"
                                    id="apiKey"
                                    value={keys.apiKey}
                                    onChange={handleChange}
                                    placeholder="Chave da API do Google AI Studio"
                                    className={`bg-gray-700 border ${errors.apiKey ? 'border-red-500' : 'border-gray-600'} focus:ring-brand-secondary focus:border-brand-secondary shadow appearance-none rounded w-full py-3 pl-10 pr-3 text-on-surface-dark leading-tight focus:outline-none focus:shadow-outline`}
                                />
                            </div>
                            {errors.apiKey && <p className="text-red-400 text-xs italic mt-2">{errors.apiKey}</p>}
                        </div>
                        
                        <div className="flex flex-col gap-3 mt-6">
                             <button
                                onClick={handleSave}
                                className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300"
                            >
                                <FaSave />
                                Guardar e Iniciar
                            </button>
                            <button
                                onClick={() => setShowSqlModal(true)}
                                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-on-surface-dark text-sm font-medium py-2 px-4 rounded-lg focus:outline-none transition-colors duration-300"
                            >
                                <FaDatabase className="text-brand-secondary" />
                                Ver SQL de Configuração
                            </button>
                        </div>

                    </div>
                </div>
                <p className="text-center text-gray-500 text-xs">
                    &copy;{new Date().getFullYear()} AIManager. Todos os direitos reservados.
                </p>
            </div>
            {showSqlModal && <DatabaseSchemaModal onClose={() => setShowSqlModal(false)} />}
        </div>
    );
};

export default ConfigurationSetup;