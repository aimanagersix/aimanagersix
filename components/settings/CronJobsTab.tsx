
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

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get recipients from global_settings
    const { data: setting, error: settingError } = await supabaseClient
      .from('global_settings')
      .select('setting_value')
      .eq('setting_key', 'weekly_report_recipients')
      .single();

    if (settingError || !setting?.setting_value) {
      throw new Error("Recipients not configured.");
    }
    const recipients = setting.setting_value.split(',').map(e => e.trim());

    // 2. Fetch data for the report
    const { data: equipment, error: eqError } = await supabaseClient
      .from('equipment')
      .select('status, purchaseDate')
      .in('status', ['Stock', 'Operacional']);

    if (eqError) throw eqError;

    // 3. Build HTML report
    const total = equipment?.length || 0;
    const stock = equipment?.filter(e => e.status === 'Stock').length || 0;
    
    const htmlBody = \`
      <h1>Relatório Semanal de Ativos</h1>
      <p>Data: \${new Date().toLocaleDateString()}</p>
      <ul>
        <li><strong>Total de Ativos (Operacionais + Stock):</strong> \${total}</li>
        <li><strong>Em Stock:</strong> \${stock}</li>
      </ul>
    \`;
    
    // 4. Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
    if(!resendKey || !fromEmail) throw new Error("Resend config missing in env.");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${resendKey}\`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: "AIManager - Relatório Semanal de Ativos",
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(JSON.stringify(errorBody));
    }

    return new Response("Report sent successfully", { status: 200 });
  } catch (error) {
    return new Response(\`Error: \${error.message}\`, { status: 500 });
  }
});
`;

const birthdayFunctionCode = `import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Obter configurações de template
    const { data: settings } = await supabaseClient
      .from('global_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['birthday_email_subject', 'birthday_email_body']);

    const subject = settings?.find(s => s.setting_key === 'birthday_email_subject')?.setting_value || "Feliz Aniversário!";
    const bodyTemplate = settings?.find(s => s.setting_key === 'birthday_email_body')?.setting_value || "Parabéns!";

    // 2. Encontrar aniversariantes de hoje
    const today = new Date();
    const month = today.getMonth() + 1; // JS months are 0-indexed
    const day = today.getDate();

    // Nota: Como o Supabase não tem uma função fácil de SQL via JS client para extrair data, 
    // a melhor prática é usar uma RPC ou filtrar no código se a base não for gigante.
    // Aqui usamos filtro SQL direto se possível, ou RPC 'get_birthdays'.
    // Vamos assumir que buscamos os ativos e filtramos no código para simplificar sem migrations extra.
    
    const { data: collaborators, error: collabError } = await supabaseClient
      .from('collaborators')
      .select('fullName, email, "dateOfBirth"')
      .eq('status', 'Ativo')
      .not('"dateOfBirth"', 'is', null);

    if (collabError) throw collabError;

    const birthdays = collaborators.filter(c => {
        if (!c.dateOfBirth) return false;
        const dob = new Date(c.dateOfBirth);
        return dob.getMonth() + 1 === month && dob.getDate() === day;
    });

    if (birthdays.length === 0) {
        return new Response("No birthdays today.", { status: 200 });
    }

    // 3. Enviar emails
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
    if(!resendKey || !fromEmail) throw new Error("Resend config missing.");

    const results = [];

    for (const person of birthdays) {
        const emailBody = bodyTemplate.replace('{{nome}}', person.fullName);
        const html = \`<div style="font-family: sans-serif; color: #333;">
            <h2>🎉 \${subject}</h2>
            <p>\${emailBody}</p>
            <hr/>
            <small>Enviado automaticamente pelo AIManager.</small>
        </div>\`;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: \`Bearer \${resendKey}\`,
            },
            body: JSON.stringify({
                from: fromEmail,
                to: person.email,
                subject: subject,
                html: html,
            }),
        });
        results.push(res.status);
    }

    return new Response(\`Sent \${results.length} birthday emails.\`, { status: 200 });
  } catch (error) {
    return new Response(\`Error: \${error.message}\`, { status: 500 });
  }
});
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {
    const [copiedCode, setCopiedCode] = useState<'cron_fn' | 'cron_sql' | 'bday_fn' | 'bday_sql' | null>(null);

    const handleCopy = (text: string, type: 'cron_fn' | 'cron_sql' | 'bday_fn' | 'bday_sql') => {
        onCopy(text);
        setCopiedCode(type);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const cronSqlCode = `
-- Agendar a execução todas as Segundas-feiras às 08:00
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

-- Para cancelar:
-- SELECT cron.unschedule('weekly-asset-report');
`;

    const birthdaySqlCode = `
-- Agendar a verificação de aniversários todos os dias às 09:00
SELECT cron.schedule(
    'daily-birthday-check',
    '0 9 * * *',
    $$
    SELECT net.http_post(
        url:='${settings.birthdayFunctionUrl || 'YOUR_SUPABASE_URL/functions/v1/send-birthday-emails'}',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
    )
    $$
);
`;

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2 custom-scrollbar animate-fade-in p-6">
            
            {/* Secção de Relatórios Semanais (Existente) */}
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-yellow-400"/> Relatórios Semanais Automáticos</h3>
                
                <div className="space-y-4">
                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaEnvelope className="text-yellow-400"/> Configuração de Destinatários</h4>
                        <div className="flex gap-2">
                            <input type="text" value={settings.weekly_report_recipients} onChange={(e) => onSettingsChange('weekly_report_recipients', e.target.value)} className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="admin@empresa.com, gestor@empresa.com" />
                            <button onClick={onSave} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><FaSave /> Guardar</button>
                        </div>
                    </div>
                    
                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaDatabase className="text-blue-400"/> Código da Função (`weekly-report`)</h4>
                        <div className="relative">
                            <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar">
                                {cronFunctionCode}
                            </pre>
                            <button onClick={() => handleCopy(cronFunctionCode, 'cron_fn')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                {copiedCode === 'cron_fn' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaCog className="text-gray-400"/> Agendar (SQL)</h4>
                        <div className="relative">
                            <pre className="text-xs font-mono text-orange-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar">
                                {cronSqlCode}
                            </pre>
                            <button onClick={() => handleCopy(cronSqlCode, 'cron_sql')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                     {copiedCode === 'cron_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nova Secção: Parabéns Automáticos */}
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBirthdayCake className="text-pink-400"/> Parabéns Automáticos</h3>
                
                <div className="bg-black/30 p-4 rounded border border-gray-700">
                    <h4 className="text-white font-bold mb-3 text-sm">Modelo de Email</h4>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm">1. Código da Função (`send-birthday-emails`)</h4>
                        <div className="relative">
                            <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar">
                                {birthdayFunctionCode}
                            </pre>
                            <button onClick={() => handleCopy(birthdayFunctionCode, 'bday_fn')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                {copiedCode === 'bday_fn' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm">2. Agendar Diariamente (SQL)</h4>
                        <div className="relative">
                            <pre className="text-xs font-mono text-orange-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar">
                                {birthdaySqlCode}
                            </pre>
                            <button onClick={() => handleCopy(birthdaySqlCode, 'bday_sql')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                {copiedCode === 'bday_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CronJobsTab;
