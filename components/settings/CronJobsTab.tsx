import React, { useState, useEffect } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaCog } from 'react-icons/fa';
import * as dataService from '../../services/dataService';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
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

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave }) => {
    const [isTestingCron, setIsTestingCron] = useState(false);
    const [copiedCode, setCopiedCode] = useState<'cron_fn' | 'cron_sql' | null>(null);

    const handleCopy = (text: string, type: 'cron_fn' | 'cron_sql') => {
        navigator.clipboard.writeText(text);
        setCopiedCode(type);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar animate-fade-in p-6">
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-yellow-400"/> Guia de Configuração: Relatórios Automáticos</h3>
                
                <div className="space-y-4">
                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaEnvelope className="text-yellow-400"/> Passo 1: Criar a Edge Function (`weekly-report`)</h4>
                        <p className="text-xs text-gray-400 mb-2">
                            Crie uma nova função <code>weekly-report</code> e cole o seguinte código no ficheiro <code>index.ts</code> da função. Não se esqueça de definir as variáveis de ambiente (env) no Supabase.
                        </p>
                        <div className="relative">
                            <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-64 custom-scrollbar">
                                {cronFunctionCode}
                            </pre>
                            <button onClick={() => handleCopy(cronFunctionCode, 'cron_fn')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                {copiedCode === 'cron_fn' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaDatabase className="text-blue-400"/> Passo 2: Agendar a Tarefa (SQL)</h4>
                        <p className="text-xs text-gray-400 mb-2">
                            Execute este comando no SQL Editor do seu projeto Supabase para agendar a tarefa. Substitua <code>[SERVICE_ROLE_KEY]</code> pela sua chave.
                        </p>
                        <div className="relative">
                            <pre className="text-xs font-mono text-orange-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar">
                                {settings.cronSqlCode}
                            </pre>
                            <button onClick={() => handleCopy(settings.cronSqlCode, 'cron_sql')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                     {copiedCode === 'cron_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaCog className="text-gray-400"/> Passo 3: Configuração & Teste</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Emails Destinatários (separados por vírgula)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.reportRecipients} onChange={(e) => onSettingsChange('reportRecipients', e.target.value)} className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="admin@empresa.com, gestor@empresa.com" />
                                    <button onClick={onSave} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><FaSave /> Guardar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CronJobsTab;
