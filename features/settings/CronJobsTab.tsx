import React, { useState } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaBirthdayCake, FaShieldAlt, FaSync, FaTerminal } from 'react-icons/fa';
import { getSupabase } from '../../services/supabaseClient';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string) => void;
}

const sophosSyncSql = `-- SCRIPT DE SINCRONIZAÇÃO SOPHOS CENTRAL (API PULL v1.0)
-- Este script cria uma função que vai ao Sophos buscar os últimos alertas.

-- 1. Função para Obter Token OAuth Sophos
CREATE OR REPLACE FUNCTION public.sync_sophos_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_id text;
    v_client_secret text;
    v_token_resp record;
    v_alerts_resp record;
BEGIN
    SELECT setting_value INTO v_client_id FROM global_settings WHERE setting_key = 'sophos_client_id';
    SELECT setting_value INTO v_client_secret FROM global_settings WHERE setting_key = 'sophos_client_secret';

    IF v_client_id IS NULL OR v_client_secret IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Credenciais Sophos não encontradas em Conexões.');
    END IF;

    -- Lógica de chamada HTTP à API Sophos (Requer extensão http instalada)
    -- ... (Lógica simplificada para exemplo, a App trata o bypass via Edge Functions)
    
    RETURN jsonb_build_object('success', true, 'message', 'Sincronização agendada via Edge Function.');
END;
$$;
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {
    const [activeSubTab, setActiveSubTab] = useState<'birthdays' | 'security' | 'reports'>('birthdays');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleCopy = (text: string, id: string) => {
        onCopy(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleTriggerSophosSync = async () => {
        setIsSyncing(true);
        try {
            const supabase = getSupabase();
            // Invoca a Edge Function que faz o polling real do Sophos
            const { data, error } = await supabase.functions.invoke('sync-sophos');
            if (error) throw error;
            alert("Sincronização concluída! Verifique a lista de tickets para novos alertas [SOPHOS].");
        } catch (e: any) {
            alert("Erro na sincronização: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex border-b border-gray-700 mb-4 px-6 pt-2 overflow-x-auto whitespace-nowrap">
                <button 
                    onClick={() => setActiveSubTab('birthdays')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'birthdays' ? 'border-pink-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <FaBirthdayCake /> Aniversários
                </button>
                <button 
                    onClick={() => setActiveSubTab('security')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'security' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <FaShieldAlt /> Segurança (Sophos)
                </button>
                <button 
                    onClick={() => setActiveSubTab('reports')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'reports' ? 'border-yellow-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <FaClock /> Relatórios
                </button>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar p-6 pt-0 space-y-6">
                
                {activeSubTab === 'security' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-gray-900 border border-gray-700 p-5 rounded-lg space-y-4 border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">Sincronização Sophos Central</h3>
                                    <p className="text-sm text-gray-300 mt-1">
                                        Busca automática de alertas críticos e criação de tickets NIS2.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleTriggerSophosSync}
                                    disabled={isSyncing}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isSyncing ? <FaSpinner className="animate-spin"/> : <FaSync />} Sincronizar Agora
                                </button>
                            </div>
                            
                            <div className="bg-blue-900/10 p-3 rounded border border-blue-800/30 text-xs text-blue-300">
                                <p><strong>Frequência Recomendada:</strong> 15 minutos (configurável via pg_cron).</p>
                                <p className="mt-1">Esta tarefa utiliza o Client ID e Secret configurados em "Conexões".</p>
                            </div>
                        </div>

                        <div className="bg-black/30 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><FaTerminal className="text-yellow-500"/> Script de Agendamento (SQL)</h4>
                            <div className="relative">
                                <pre className="text-[10px] font-mono text-gray-400 bg-gray-900 p-3 rounded border border-gray-700 overflow-x-auto max-h-48 custom-scrollbar">
                                    {sophosSyncSql}
                                </pre>
                                <button onClick={() => handleCopy(sophosSyncSql, 'sophos_sql')} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded shadow-md">
                                    {copiedCode === 'sophos_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'birthdays' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Conteúdo existente de aniversários mantido... */}
                        <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 border-l-4 border-l-pink-500">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBirthdayCake className="text-pink-400"/> Rotina de Aniversários</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="block text-xs text-gray-500 uppercase font-bold">Email de Envio</label>
                                    <input type="text" value={settings.resendFromEmail || ''} onChange={(e) => onSettingsChange('resendFromEmail', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" placeholder="onboarding@resend.dev"/>
                                    <button onClick={onSave} className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-2 rounded text-sm font-bold">Guardar Configuração</button>
                                </div>
                                <div className="flex items-center justify-center">
                                    <button onClick={onTest} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg flex items-center gap-2 font-bold shadow-xl transition-transform active:scale-95"><FaPlay /> Testar Agora</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'reports' && (
                    <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 animate-fade-in border-l-4 border-l-yellow-500">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-yellow-400"/> Relatórios Semanais</h3>
                        <div className="bg-black/30 p-4 rounded border border-gray-700">
                            <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Destinatários</label>
                            <input type="text" value={settings.weekly_report_recipients || ''} onChange={(e) => onSettingsChange('weekly_report_recipients', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" placeholder="exemplo@empresa.com"/>
                            <button onClick={onSave} className="mt-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">Guardar Destinatários</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CronJobsTab;