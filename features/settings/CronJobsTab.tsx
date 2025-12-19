
import React, { useState } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaBirthdayCake, FaShieldAlt, FaSync, FaTerminal, FaBullhorn, FaInfoCircle, FaExternalLinkAlt, FaCode } from 'react-icons/fa';
import { getSupabase } from '../../services/supabaseClient';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string) => void;
    onSyncSophos: () => Promise<void>;
    isSyncingSophos: boolean;
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
BEGIN
    SELECT setting_value INTO v_client_id FROM global_settings WHERE setting_key = 'sophos_client_id';
    SELECT setting_value INTO v_client_secret FROM global_settings WHERE setting_key = 'sophos_client_secret';

    IF v_client_id IS NULL OR v_client_secret IS NULL OR v_client_id = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Credenciais Sophos não configuradas.');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Sincronização agendada via Edge Function.');
END;
$$;
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy, onSyncSophos, isSyncingSophos }) => {
    const [activeSubTab, setActiveSubTab] = useState<'birthdays' | 'security' | 'reports'>('birthdays');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        onCopy(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
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
                                        Esta funcionalidade requer que a **Edge Function** esteja publicada no seu Supabase.
                                    </p>
                                </div>
                                <button 
                                    onClick={onSyncSophos}
                                    disabled={isSyncingSophos}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isSyncingSophos ? <FaSpinner className="animate-spin"/> : <FaSync />} Executar Sincronização
                                </button>
                            </div>
                        </div>

                        {/* Painel de Ajuda CLI */}
                        <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg">
                            <h4 className="text-blue-300 font-bold text-sm mb-3 flex items-center gap-2">
                                <FaTerminal /> Como publicar a função (CLI)
                            </h4>
                            <div className="space-y-3 text-xs text-gray-400">
                                <p>Execute estes comandos no terminal do seu computador para ativar a sincronização:</p>
                                <div className="space-y-2">
                                    <div className="bg-black/40 p-2 rounded flex justify-between items-center group">
                                        <code className="text-blue-200">supabase functions deploy sync-sophos</code>
                                        <button onClick={() => handleCopy('supabase functions deploy sync-sophos', 'cmd_deploy')} className="opacity-0 group-hover:opacity-100 text-blue-400"><FaCopy/></button>
                                    </div>
                                    <div className="bg-black/40 p-2 rounded flex justify-between items-center group">
                                        <code className="text-blue-200">supabase secrets set GEMINI_API_KEY=sua_chave</code>
                                        <button onClick={() => handleCopy('supabase secrets set GEMINI_API_KEY=', 'cmd_sec')} className="opacity-0 group-hover:opacity-100 text-blue-400"><FaCopy/></button>
                                    </div>
                                </div>
                                <p className="flex items-center gap-2 mt-2"><FaInfoCircle/> Após o deploy, o botão "Executar" acima deixará de dar erro.</p>
                            </div>
                        </div>

                        <div className="bg-black/30 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><FaCode className="text-yellow-500"/> Estrutura SQL Auxiliar</h4>
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
                        <div className="bg-gray-900 border border-gray-700 p-5 rounded-lg space-y-4 border-l-4 border-l-pink-500">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBirthdayCake className="text-pink-400"/> Rotina de Aniversários</h3>
                                <button onClick={onTest} className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded flex items-center gap-2 font-bold shadow-lg transition-transform active:scale-95"><FaPlay /> Testar Agora</button>
                            </div>
                            
                            <p className="text-sm text-gray-400">Configure as mensagens enviadas automaticamente para o <strong>Canal Geral</strong> e <strong>Email</strong> quando um colaborador faz anos.</p>

                            <div className="grid grid-cols-1 gap-6 bg-black/20 p-5 rounded-xl border border-gray-800">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase font-bold mb-2 tracking-widest">Email de Envio (SMTP/Resend)</label>
                                        <input type="text" value={settings.resendFromEmail || ''} onChange={(e) => onSettingsChange('resendFromEmail', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-3 text-sm focus:border-pink-500 outline-none" placeholder="ex: parabens@empresa.com"/>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase font-bold mb-2 tracking-widest">Assunto da Mensagem</label>
                                        <input type="text" value={settings.birthday_email_subject || ''} onChange={(e) => onSettingsChange('birthday_email_subject', e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-3 text-sm focus:border-pink-500 outline-none" placeholder="Ex: Muitos Parabéns! 🎂"/>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase font-bold mb-2 tracking-widest">Corpo da Mensagem (Suporta HTML)</label>
                                        <textarea value={settings.birthday_email_body || ''} onChange={(e) => onSettingsChange('birthday_email_body', e.target.value)} rows={5} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-3 text-sm font-mono focus:border-pink-500 outline-none custom-scrollbar" placeholder="Olá {{nome}}, a equipa deseja-te um feliz aniversário!"/>
                                        <p className="text-[10px] text-gray-500 mt-2 italic flex items-center gap-1"><FaBullhorn className="text-pink-500"/> Use <strong>{'{{nome}}'}</strong> para inserir o nome do colaborador automaticamente.</p>
                                    </div>

                                    <button onClick={onSave} className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-3 rounded-lg text-sm font-bold shadow-xl flex items-center justify-center gap-2"><FaSave /> Guardar Configuração de Texto</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'reports' && (
                    <div className="bg-gray-900 border border-gray-700 p-5 rounded-lg space-y-4 animate-fade-in border-l-4 border-l-yellow-500">
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
