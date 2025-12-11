
import React, { useState } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaBirthdayCake, FaCommentDots, FaStethoscope, FaExclamationTriangle, FaSearch, FaTerminal } from 'react-icons/fa';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string) => void;
}

const checkFunctionScript = `-- DIAGNÓSTICO: VERIFICAR SE A FUNÇÃO EXISTE NA BD
-- Execute este script no SQL Editor. Se o resultado for "0 rows", a função NÃO foi criada corretamente.

SELECT 
    routine_name as "Nome",
    routine_type as "Tipo",
    security_type as "Segurança"
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'send_daily_birthday_emails';
`;

const manualExecScript = `-- TESTE MANUAL DIRETO (SQL)
-- Execute isto no SQL Editor para testar a lógica sem passar pela App/API.
-- Se der erro aqui, o problema está no script SQL da função (tabelas em falta, pg_net, etc).

SELECT public.send_daily_birthday_emails();
`;

const cacheCleanScript = `-- COMANDO DE LIMPEZA DE CACHE DO SUPABASE (POSTGREST)
-- Execute isto no SQL Editor para forçar a API a reconhecer as novas funções.

NOTIFY pgrst, 'reload config';
`;

const birthdaySqlScript = `-- ==================================================================================
-- SCRIPT DE ANIVERSÁRIOS (SOLUÇÃO DEFINITIVA v5.7 - SAFE MODE)
-- ==================================================================================

-- 1. LIMPEZA PRÉVIA
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails();
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails(date);
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails(text);

-- 2. TENTATIVA DE EXTENSÃO DE REDE (Necessária para enviar o email)
-- Se falhar, o script continua, mas o envio real falhará (o registo no chat funcionará)
DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA public; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. CRIAÇÃO DA FUNÇÃO (Lógica Principal)
CREATE OR REPLACE FUNCTION public.send_daily_birthday_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa como Admin
SET search_path = public
AS $$
DECLARE
    v_resend_key text;
    v_from_email text;
    v_subject text;
    v_body_tpl text;
    v_final_body text;
    v_chat_message text;
    v_general_channel_id uuid := '00000000-0000-0000-0000-000000000000';
    r_user record;
BEGIN
    -- Ler Configurações (Bloco seguro)
    BEGIN
        SELECT setting_value INTO v_resend_key FROM global_settings WHERE setting_key = 'resend_api_key';
        SELECT setting_value INTO v_from_email FROM global_settings WHERE setting_key = 'resend_from_email';
        SELECT setting_value INTO v_subject FROM global_settings WHERE setting_key = 'birthday_email_subject';
        SELECT setting_value INTO v_body_tpl FROM global_settings WHERE setting_key = 'birthday_email_body';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Tabela global_settings não encontrada ou erro de leitura.';
    END;

    IF v_subject IS NULL OR v_subject = '' THEN v_subject := 'Feliz Aniversário!'; END IF;
    IF v_body_tpl IS NULL OR v_body_tpl = '' THEN v_body_tpl := 'Parabéns {{nome}}! Desejamos-te um dia fantástico.'; END IF;

    -- Loop Aniversariantes
    FOR r_user IN
        SELECT "fullName", "email", "id"
        FROM collaborators
        WHERE status = 'Ativo'
        AND EXTRACT(MONTH FROM "dateOfBirth") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM "dateOfBirth") = EXTRACT(DAY FROM CURRENT_DATE)
    LOOP
        -- A. Enviar Email (Se pg_net existir e key estiver configurada)
        IF v_resend_key IS NOT NULL AND v_from_email IS NOT NULL AND length(v_resend_key) > 5 THEN
            v_final_body := replace(v_body_tpl, '{{nome}}', r_user."fullName");
            
            -- Bloco seguro para envio HTTP
            BEGIN
                PERFORM net.http_post(
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
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Falha ao enviar email via pg_net: %', SQLERRM;
            END;
        END IF;

        -- B. Enviar Mensagem Chat
        v_chat_message := '🎉 Parabéns ao colega **' || r_user."fullName" || '** que celebra hoje o seu aniversário! 🎂🎈';
        
        IF NOT EXISTS (SELECT 1 FROM messages WHERE "receiverId" = v_general_channel_id AND content = v_chat_message AND created_at::date = CURRENT_DATE) THEN
            INSERT INTO public.messages ("senderId", "receiverId", content, timestamp, read)
            VALUES (v_general_channel_id, v_general_channel_id, v_chat_message, now(), false);
        END IF;
    END LOOP;
END;
$$;

-- 4. PERMISSÕES (Crucial)
ALTER FUNCTION public.send_daily_birthday_emails() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO anon;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO service_role;

-- 5. AGENDAMENTO AUTOMÁTICO (Opcional - Em bloco separado para não falhar o resto)
DO $$
BEGIN
    -- Tenta ativar pg_cron
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    
    -- Se chegou aqui, tenta agendar
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('job-aniversarios-diario');
        -- Agenda para as 09:00 AM diariamente
        PERFORM cron.schedule('job-aniversarios-diario', '0 9 * * *', 'SELECT public.send_daily_birthday_emails()');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Agendamento automático (pg_cron) não disponível. O teste manual funcionará.';
END $$;

-- 6. REFRESH CACHE
NOTIFY pgrst, 'reload config';
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleCopy = (text: string, id: string) => {
        onCopy(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleRunTest = async () => {
        if(!confirm("Isto irá executar a verificação de aniversários AGORA. Se houver aniversariantes hoje, eles receberão o email/mensagem. Continuar?")) return;
        
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

                {/* Área de Diagnóstico e Resolução */}
                <div className="mt-8 border-t border-gray-700 pt-4">
                    <h4 className="text-white font-bold text-md mb-4 flex items-center gap-2">
                        <FaStethoscope className="text-yellow-400" /> Diagnóstico e Resolução
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                         
                         {/* Passo 0: Teste Manual Direto */}
                         <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                            <div className="flex justify-between items-center mb-1">
                                <h5 className="text-purple-300 font-bold text-xs flex items-center gap-2"><FaTerminal/> 0. Teste Manual Direto (SQL)</h5>
                            </div>
                            <p className="text-[10px] text-gray-400 mb-2">Execute isto no SQL Editor para testar a lógica sem passar pela App.</p>
                            <div className="relative">
                                <pre className="text-[10px] font-mono text-purple-200 bg-gray-900 p-2 rounded border border-gray-700 overflow-x-auto">{manualExecScript}</pre>
                                <button onClick={() => handleCopy(manualExecScript, 'manual_exec')} className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px]">
                                    {copiedCode === 'manual_exec' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                </button>
                            </div>
                        </div>

                        {/* Passo 1: Verificar se existe */}
                        <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                            <div className="flex justify-between items-center mb-1">
                                <h5 className="text-blue-300 font-bold text-xs flex items-center gap-2"><FaSearch/> 1. Verificar se a função existe na BD</h5>
                            </div>
                            <p className="text-[10px] text-gray-400 mb-2">Execute isto no SQL Editor. Se retornar 0 linhas, a função não foi criada.</p>
                            <div className="relative">
                                <pre className="text-[10px] font-mono text-blue-200 bg-gray-900 p-2 rounded border border-gray-700 overflow-x-auto">{checkFunctionScript}</pre>
                                <button onClick={() => handleCopy(checkFunctionScript, 'check_sql')} className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px]">
                                    {copiedCode === 'check_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                </button>
                            </div>
                        </div>

                         {/* Passo 2: Limpar Cache */}
                        <div className="bg-orange-900/20 p-3 rounded border border-orange-500/30">
                            <div className="flex justify-between items-center mb-1">
                                <h5 className="text-orange-300 font-bold text-xs flex items-center gap-2"><FaExclamationTriangle/> 2. Forçar atualização da API (Cache)</h5>
                            </div>
                            <p className="text-[10px] text-gray-400 mb-2">Se a função existe na BD mas dá erro na App, execute isto.</p>
                            <div className="relative">
                                <pre className="text-[10px] font-mono text-orange-200 bg-gray-900 p-2 rounded border border-gray-700 overflow-x-auto">{cacheCleanScript}</pre>
                                <button onClick={() => handleCopy(cacheCleanScript, 'cache_sql')} className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px]">
                                    {copiedCode === 'cache_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                </button>
                            </div>
                        </div>

                        {/* Passo 3: Reinstalar */}
                        <div className="bg-red-900/20 p-3 rounded border border-red-500/30">
                             <div className="flex justify-between items-center mb-1">
                                <h5 className="text-red-300 font-bold text-xs flex items-center gap-2"><FaDatabase/> 3. Instalação Completa v5.7 (Safe Mode)</h5>
                            </div>
                            <p className="text-[10px] text-gray-400 mb-2">Separa a criação da função do agendamento cron (mais seguro).</p>
                            <div className="relative">
                                <pre className="text-[10px] font-mono text-red-200 bg-gray-900 p-2 rounded border border-gray-700 overflow-x-auto max-h-32">{birthdaySqlScript}</pre>
                                <button onClick={() => handleCopy(birthdaySqlScript, 'install_sql')} className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px]">
                                    {copiedCode === 'install_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CronJobsTab;
