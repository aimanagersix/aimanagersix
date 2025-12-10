
import React, { useState, useEffect } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaCog, FaBirthdayCake, FaCommentDots } from 'react-icons/fa';
import * as dataService from '../../services/dataService';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string) => void;
}

const birthdaySqlScript = `-- ==================================================================================
-- SOLUÇÃO SQL-ONLY PARA ANIVERSÁRIOS + CHAT (Copie e cole TUDO no SQL Editor)
-- Envia Email via Resend e Mensagem para o Canal Geral.
-- ==================================================================================

-- 1. Ativar Extensões necessárias
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2. Criar a Função de Envio na Base de Dados
create or replace function public.send_daily_birthday_emails()
returns void
language plpgsql
security definer
as $$
declare
    v_resend_key text;
    v_from_email text;
    v_subject text;
    v_body_tpl text;
    v_final_body text;
    v_chat_message text;
    v_general_channel_id uuid := '00000000-0000-0000-0000-000000000000'; -- ID do Canal Geral
    r_user record;
begin
    -- A. Obter Configurações
    select setting_value into v_resend_key from global_settings where setting_key = 'resend_api_key';
    select setting_value into v_from_email from global_settings where setting_key = 'resend_from_email';
    select setting_value into v_subject from global_settings where setting_key = 'birthday_email_subject';
    select setting_value into v_body_tpl from global_settings where setting_key = 'birthday_email_body';

    -- Defaults
    if v_subject is null then v_subject := 'Feliz Aniversário!'; end if;
    if v_body_tpl is null then v_body_tpl := 'Parabéns {{nome}}! Desejamos-te um dia fantástico.'; end if;

    -- B. Loop pelos aniversariantes do dia
    for r_user in
        select "fullName", "email", "id"
        from collaborators
        where status = 'Ativo'
        and extract(month from "dateOfBirth") = extract(month from current_date)
        and extract(day from "dateOfBirth") = extract(day from current_date)
    loop
        -- 1. Enviar Email (Se API Key existir)
        if v_resend_key is not null and v_from_email is not null then
            v_final_body := replace(v_body_tpl, '{{nome}}', r_user."fullName");
            
            perform net.http_post(
                url:='https://api.resend.com/emails',
                headers:=jsonb_build_object(
                    'Authorization', 'Bearer ' || v_resend_key,
                    'Content-Type', 'application/json'
                ),
                body:=jsonb_build_object(
                    'from', v_from_email,
                    'to', r_user.email,
                    'subject', v_subject,
                    'html', '<div style="font-family: sans-serif; color: #333;"><h2>🎉 ' || v_subject || '</h2><p>' || v_final_body || '</p><hr/><small>Enviado automaticamente pelo AIManager.</small></div>'
                )
            );
        end if;

        -- 2. Enviar Mensagem para o Chat Geral
        v_chat_message := '🎉 Parabéns ao colega **' || r_user."fullName" || '** que celebra hoje o seu aniversário! 🎂🎈';
        
        INSERT INTO public.messages ("senderId", "receiverId", content, timestamp, read)
        VALUES (
            v_general_channel_id, -- Enviado pelo "Sistema/Geral"
            v_general_channel_id, -- Para o Canal Geral
            v_chat_message,
            now(),
            false
        );
        
        raise notice 'Processado aniversário para: %', r_user."fullName";
    end loop;
end;
$$;

-- 3. Agendar a execução (Todos os dias às 09:00 da manhã)
select cron.schedule(
    'job-aniversarios-diario',
    '0 9 * * *',
    $$select public.send_daily_birthday_emails()$$
);
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {
    const [copiedCode, setCopiedCode] = useState<'cron_fn' | 'cron_sql' | 'bday_sql' | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleCopy = (text: string, type: 'cron_fn' | 'cron_sql' | 'bday_sql') => {
        onCopy(text);
        setCopiedCode(type);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleRunTest = async () => {
        if(!confirm("Isto irá executar a verificação de aniversários AGORA. Se houver aniversariantes hoje, eles receberão o email e a mensagem no chat novamente. Continuar?")) return;
        
        setIsTesting(true);
        try {
            await onTest();
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2 custom-scrollbar animate-fade-in p-6">
            
            {/* Secção de Relatórios Semanais */}
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 opacity-70">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-gray-400"/> Relatórios Semanais (Avançado)</h3>
                <p className="text-xs text-gray-500">Requer configuração de Edge Functions via CLI.</p>
                <div className="bg-black/30 p-4 rounded border border-gray-700 relative hidden">
                     <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaEnvelope className="text-yellow-400"/> Configuração de Destinatários</h4>
                    <div className="flex gap-2">
                        <input type="text" value={settings.weekly_report_recipients} onChange={(e) => onSettingsChange('weekly_report_recipients', e.target.value)} className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="admin@empresa.com" />
                        <button onClick={onSave} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><FaSave /> Guardar</button>
                    </div>
                </div>
            </div>

            {/* Nova Secção: Parabéns Automáticos */}
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 border-l-4 border-l-pink-500">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBirthdayCake className="text-pink-400"/> Parabéns Automáticos</h3>
                    <button 
                        onClick={handleRunTest} 
                        disabled={isTesting}
                        className="text-xs bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isTesting ? <FaSpinner className="animate-spin"/> : <FaPlay />} Executar Teste Agora
                    </button>
                </div>
                
                <p className="text-sm text-gray-300">
                    Envia emails via Resend e publica uma mensagem no <strong>Chat Geral</strong> quando um colaborador faz anos.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 rounded border border-gray-700">
                        <h4 className="text-white font-bold mb-3 text-sm flex items-center gap-2"><FaEnvelope/> Configuração Email</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Assunto</label>
                                <input 
                                    type="text" 
                                    value={settings.birthday_email_subject} 
                                    onChange={(e) => onSettingsChange('birthday_email_subject', e.target.value)} 
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" 
                                    placeholder="Feliz Aniversário!" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Mensagem (Template)</label>
                                <textarea 
                                    value={settings.birthday_email_body} 
                                    onChange={(e) => onSettingsChange('birthday_email_body', e.target.value)} 
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" 
                                    placeholder="Olá {{nome}}, desejamos-lhe um dia fantástico!" 
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Variável disponível: <code>{'{{nome}'}</code></p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-black/30 p-4 rounded border border-gray-700 flex flex-col justify-center items-center text-center">
                         <FaCommentDots className="text-4xl text-blue-400 mb-2"/>
                         <h4 className="text-white font-bold text-sm mb-2">Mensagem no Chat Geral</h4>
                         <p className="text-xs text-gray-400">
                             Será enviada automaticamente uma mensagem para o canal <strong>"Geral"</strong> visível a todos:
                         </p>
                         <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-left w-full border border-gray-600">
                             🎉 Parabéns ao colega <strong>[Nome]</strong> que celebra hoje o seu aniversário! 🎂🎈
                         </div>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button onClick={onSave} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2"><FaSave /> Guardar Texto do Email</button>
                </div>

                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaDatabase/> Script de Instalação (SQL) - Atualizado</h4>
                    <p className="text-xs text-gray-400 mb-2">
                        Se alterou a lógica (ex: adicionar chat), <strong>copie e execute novamente</strong> este script no Supabase SQL Editor.
                    </p>
                    <div className="relative">
                        <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-60 custom-scrollbar border border-gray-700">
                            {birthdaySqlScript}
                        </pre>
                        <button onClick={() => handleCopy(birthdaySqlScript, 'bday_sql')} className="absolute top-2 right-2 p-2 bg-gray-700 rounded hover:bg-gray-600 text-white border border-gray-600 shadow-lg flex items-center gap-2">
                            {copiedCode === 'bday_sql' ? <><FaCheck className="text-green-400"/> Copiado</> : <><FaCopy /> Copiar SQL</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CronJobsTab;
