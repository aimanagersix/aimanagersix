
import React, { useState, useEffect } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaCog, FaBirthdayCake } from 'react-icons/fa';
import * as dataService from '../../services/dataService';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string) => void;
}

const cronFunctionCode = `import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// NOTA: Este é código para Edge Function (Deno).
// Se preferir SQL puro (mais fácil), use o exemplo de aniversários abaixo como base.

serve(async (req) => {
  // ... (código existente mantido para referência avançada)
  return new Response("Report sent successfully", { status: 200 });
});
`;

const birthdaySqlScript = `-- ==================================================================================
-- SOLUÇÃO SQL-ONLY PARA ANIVERSÁRIOS (Copie e cole TUDO no SQL Editor)
-- Não requer configuração de terminal/CLI. Usa pg_net e pg_cron.
-- ==================================================================================

-- 1. Ativar Extensões necessárias (se ainda não existirem)
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
    r_user record;
begin
    -- A. Obter Configurações da tabela global_settings
    select setting_value into v_resend_key from global_settings where setting_key = 'resend_api_key';
    select setting_value into v_from_email from global_settings where setting_key = 'resend_from_email';
    select setting_value into v_subject from global_settings where setting_key = 'birthday_email_subject';
    select setting_value into v_body_tpl from global_settings where setting_key = 'birthday_email_body';

    -- B. Validações básicas
    if v_resend_key is null or v_from_email is null then
        raise warning 'Resend API Key ou Email de Envio não configurados no AIManager.';
        return;
    end if;

    -- Defaults
    if v_subject is null then v_subject := 'Feliz Aniversário!'; end if;
    if v_body_tpl is null then v_body_tpl := 'Parabéns {{nome}}! Desejamos-te um dia fantástico.'; end if;

    -- C. Loop pelos aniversariantes do dia (Mês e Dia iguais a hoje)
    for r_user in
        select "fullName", "email"
        from collaborators
        where status = 'Ativo'
        and extract(month from "dateOfBirth") = extract(month from current_date)
        and extract(day from "dateOfBirth") = extract(day from current_date)
    loop
        -- Substituir variáveis no template
        v_final_body := replace(v_body_tpl, '{{nome}}', r_user."fullName");

        -- D. Enviar via pg_net (Chamada Assíncrona à API do Resend)
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
        
        -- Log (opcional)
        raise notice 'Email de aniversário enviado para: %', r_user.email;
    end loop;
end;
$$;

-- 3. Agendar a execução (Todos os dias às 09:00 da manhã)
-- Nota: Se já existir um job com este nome, ele será atualizado.
select cron.schedule(
    'job-aniversarios-diario', -- Nome único do job
    '0 9 * * *',               -- Cron: Minuto 0, Hora 9, Qualquer dia
    $$select public.send_daily_birthday_emails()$$
);
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {
    const [copiedCode, setCopiedCode] = useState<'cron_fn' | 'cron_sql' | 'bday_sql' | null>(null);

    const handleCopy = (text: string, type: 'cron_fn' | 'cron_sql' | 'bday_sql') => {
        onCopy(text);
        setCopiedCode(type);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const cronSqlCode = `
-- Exemplo para o relatório semanal (Via Edge Function)
SELECT cron.schedule(
    'weekly-asset-report',
    '0 8 * * 1',
    $$
    SELECT net.http_post(
        url:='${settings.cronFunctionUrl}',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
    )
    $$
);
`;

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2 custom-scrollbar animate-fade-in p-6">
            
            {/* Secção de Relatórios Semanais */}
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 opacity-70">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-gray-400"/> Relatórios Semanais (Avançado)</h3>
                <p className="text-xs text-gray-500">Requer configuração de Edge Functions via CLI.</p>
                
                <div className="space-y-4 hidden">
                    {/* Hidden to simplify view for user, focus on the SQL solution below */}
                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                         <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaEnvelope className="text-yellow-400"/> Configuração de Destinatários</h4>
                        <div className="flex gap-2">
                            <input type="text" value={settings.weekly_report_recipients} onChange={(e) => onSettingsChange('weekly_report_recipients', e.target.value)} className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="admin@empresa.com, gestor@empresa.com" />
                            <button onClick={onSave} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><FaSave /> Guardar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nova Secção: Parabéns Automáticos */}
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 border-l-4 border-l-pink-500">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBirthdayCake className="text-pink-400"/> Parabéns Automáticos (Fácil)</h3>
                
                <div className="bg-black/30 p-4 rounded border border-gray-700">
                    <h4 className="text-white font-bold mb-3 text-sm">1. Configure a Mensagem</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Assunto do Email</label>
                            <input 
                                type="text" 
                                value={settings.birthday_email_subject} 
                                onChange={(e) => onSettingsChange('birthday_email_subject', e.target.value)} 
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" 
                                placeholder="Feliz Aniversário!" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Corpo da Mensagem (Use {'{{nome}'} para o nome do colaborador)</label>
                            <textarea 
                                value={settings.birthday_email_body} 
                                onChange={(e) => onSettingsChange('birthday_email_body', e.target.value)} 
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" 
                                placeholder="Olá {{nome}}, desejamos-lhe um dia fantástico!" 
                            />
                        </div>
                        <div className="flex justify-end">
                            <button onClick={onSave} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2"><FaSave /> Guardar Modelo</button>
                        </div>
                    </div>
                </div>

                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                    <h4 className="text-white font-bold mb-2 text-sm">2. Script de Instalação (SQL)</h4>
                    <p className="text-xs text-gray-400 mb-2">
                        Copie este código e execute-o no <strong>SQL Editor</strong> do Supabase. Ele cria a função na base de dados e agenda a execução automática.
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
