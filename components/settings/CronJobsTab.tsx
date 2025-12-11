
import React, { useState, useEffect } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaCog, FaBirthdayCake, FaCommentDots, FaStethoscope, FaSync } from 'react-icons/fa';
import * as dataService from '../../services/dataService';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string) => void;
}

const cacheCleanScript = `-- COMANDO DE LIMPEZA DE CACHE DO SUPABASE (POSTGREST)
-- Execute isto se receber o erro 42883 (Função não existe) apesar de a ter criado.

BEGIN;

-- 1. Forçar a API a reler a estrutura da base de dados
NOTIFY pgrst, 'reload config';

-- 2. Verificar se a função existe (O resultado deve aparecer em baixo no SQL Editor)
SELECT 
    routine_name as "Nome da Função",
    routine_type as "Tipo",
    security_type as "Segurança"
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'send_daily_birthday_emails';

COMMIT;
`;

const birthdaySqlScript = `-- ==================================================================================
-- SCRIPT DE ANIVERSÁRIOS (SOLUÇÃO DEFINITIVA v5.2 - CACHE & PERMISSÕES)
-- ==================================================================================

BEGIN;

-- 1. Garantir Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. LIMPEZA AGRESSIVA (Remove qualquer variação antiga da função)
-- Isto resolve o erro "função não existe" se houver conflito de argumentos
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails();
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails(date);
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails(text);

-- 3. CRIAR A FUNÇÃO (Versão Limpa)
CREATE OR REPLACE FUNCTION public.send_daily_birthday_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa como SuperAdmin para ignorar RLS
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
    -- Ler Configurações
    SELECT setting_value INTO v_resend_key FROM global_settings WHERE setting_key = 'resend_api_key';
    SELECT setting_value INTO v_from_email FROM global_settings WHERE setting_key = 'resend_from_email';
    SELECT setting_value INTO v_subject FROM global_settings WHERE setting_key = 'birthday_email_subject';
    SELECT setting_value INTO v_body_tpl FROM global_settings WHERE setting_key = 'birthday_email_body';

    IF v_subject IS NULL THEN v_subject := 'Feliz Aniversário!'; END IF;
    IF v_body_tpl IS NULL THEN v_body_tpl := 'Parabéns {{nome}}! Desejamos-te um dia fantástico.'; END IF;

    -- Loop Aniversariantes
    FOR r_user IN
        SELECT "fullName", "email", "id"
        FROM collaborators
        WHERE status = 'Ativo'
        AND EXTRACT(MONTH FROM "dateOfBirth") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM "dateOfBirth") = EXTRACT(DAY FROM CURRENT_DATE)
    LOOP
        -- A. Enviar Email
        IF v_resend_key IS NOT NULL AND v_from_email IS NOT NULL AND length(v_resend_key) > 5 THEN
            v_final_body := replace(v_body_tpl, '{{nome}}', r_user."fullName");
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

-- 4. REFRESH DE PERMISSÕES (Crucial para a API ver a função)
REVOKE ALL ON FUNCTION public.send_daily_birthday_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO anon;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO service_role;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO postgres;

-- 5. RECARREGAR CACHE DA API (O Segredo)
-- Isto força o PostgREST a reconhecer a nova função imediatamente
NOTIFY pgrst, 'reload config';

-- 6. AGENDAR CRON (Se aplicável)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('job-aniversarios-diario'); -- Limpar antigo
        PERFORM cron.schedule('job-aniversarios-diario', '0 9 * * *', 'SELECT public.send_daily_birthday_emails()');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: pg_cron não disponível, mas a função manual funcionará.';
END $$;

COMMIT;
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {
    const [copiedCode, setCopiedCode] = useState<'cron_fn' | 'cron_sql' | 'bday_sql' | 'cache_sql' | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleCopy = (text: string, type: 'cron_fn' | 'cron_sql' | 'bday_sql' | 'cache_sql') => {
        onCopy(text);
        setCopiedCode(type);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleRunTest = async () => {
        if(!confirm("Isto irá executar a verificação de aniversários AGORA. Se houver aniversariantes hoje, eles receberão o email. Continuar?")) return;
        
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

                {/* Área de Diagnóstico e Limpeza */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2"><FaStethoscope className="text-blue-400"/> Limpar Cache API (Diagnóstico)</h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                            Use este script apenas para forçar a API a "ver" a função, sem recriar tudo.
                        </p>
                        <div className="relative">
                            <pre className="text-xs font-mono text-blue-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar border border-gray-700">
                                {cacheCleanScript}
                            </pre>
                            <button onClick={() => handleCopy(cacheCleanScript, 'cache_sql')} className="absolute top-2 right-2 p-2 bg-gray-700 rounded hover:bg-gray-600 text-white border border-gray-600 shadow-lg flex items-center gap-2">
                                {copiedCode === 'cache_sql' ? <><FaCheck className="text-green-400"/> Copiado</> : <><FaCopy /> Copiar</>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2"><FaDatabase/> Instalação Completa v5.2</h4>
                            <span className="text-[10px] text-red-300 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/30">Nuclear Fix</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                            Apaga e recria a função + limpa a cache. Use se a função não existir.
                        </p>
                        <div className="relative">
                            <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar border border-gray-700">
                                {birthdaySqlScript}
                            </pre>
                            <button onClick={() => handleCopy(birthdaySqlScript, 'bday_sql')} className="absolute top-2 right-2 p-2 bg-gray-700 rounded hover:bg-gray-600 text-white border border-gray-600 shadow-lg flex items-center gap-2">
                                {copiedCode === 'bday_sql' ? <><FaCheck className="text-green-400"/> Copiado</> : <><FaCopy /> Copiar</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CronJobsTab;
