
import React, { useState } from 'react';
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaBirthdayCake, FaCommentDots, FaStethoscope, FaExclamationTriangle, FaSearch, FaTerminal, FaPaperPlane } from 'react-icons/fa';
import { getSupabase } from '../../services/supabaseClient';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string) => void;
}

const checkFunctionScript = `-- DIAGNÓSTICO: VERIFICAR SE AS FUNÇÕES EXISTEM
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name IN ('send_daily_birthday_emails', 'test_resend_email');
`;

const manualExecScript = `-- TESTE MANUAL DIRETO DA ROTINA (SQL)
SELECT public.send_daily_birthday_emails();
`;

const birthdaySqlScript = `-- ==================================================================================
-- SCRIPT DE ANIVERSÁRIOS & DIAGNÓSTICO (VERSÃO v5.10 - EMAIL TESTER)
-- Inclui: Correção Timestamp + Nova função de teste de email isolado
-- ==================================================================================

-- 1. LIMPEZA PRÉVIA
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails();
DROP FUNCTION IF EXISTS public.test_resend_email(text);

-- 2. TENTATIVA DE EXTENSÃO DE REDE
DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA public; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. FUNÇÃO PRINCIPAL (ROTINA DIÁRIA)
CREATE OR REPLACE FUNCTION public.send_daily_birthday_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    v_status int;
    v_resp text;
BEGIN
    -- Ler Configurações
    BEGIN
        SELECT setting_value INTO v_resend_key FROM global_settings WHERE setting_key = 'resend_api_key';
        SELECT setting_value INTO v_from_email FROM global_settings WHERE setting_key = 'resend_from_email';
        SELECT setting_value INTO v_subject FROM global_settings WHERE setting_key = 'birthday_email_subject';
        SELECT setting_value INTO v_body_tpl FROM global_settings WHERE setting_key = 'birthday_email_body';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Tabela global_settings não encontrada.';
    END;

    IF v_subject IS NULL OR v_subject = '' THEN v_subject := 'Feliz Aniversário!'; END IF;
    IF v_body_tpl IS NULL OR v_body_tpl = '' THEN v_body_tpl := 'Parabéns {{nome}}! Desejamos-te um dia fantástico.'; END IF;

    -- Loop Aniversariantes
    FOR r_user IN
        SELECT "fullName", "email", "id"
        FROM collaborators
        WHERE status = 'Ativo'
        AND "dateOfBirth" IS NOT NULL
        AND EXTRACT(MONTH FROM "dateOfBirth"::date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM "dateOfBirth"::date) = EXTRACT(DAY FROM CURRENT_DATE)
    LOOP
        -- A. Enviar Email
        IF v_resend_key IS NOT NULL AND v_from_email IS NOT NULL AND length(v_resend_key) > 5 THEN
            v_final_body := replace(v_body_tpl, '{{nome}}', r_user."fullName");
            
            BEGIN
                SELECT status, content::text INTO v_status, v_resp FROM net.http_post(
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
                
                -- Log de erro se falhar (aparecerá nos logs do Postgres/Supabase)
                IF v_status >= 400 THEN
                    RAISE WARNING 'Erro Resend (%): %', v_status, v_resp;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Falha crítica ao chamar net.http_post: %', SQLERRM;
            END;
        END IF;

        -- B. Enviar Mensagem Chat
        v_chat_message := '🎉 Parabéns ao colega **' || r_user."fullName" || '** que celebra hoje o seu aniversário! 🎂🎈';
        
        IF NOT EXISTS (SELECT 1 FROM messages WHERE "receiverId" = v_general_channel_id AND content = v_chat_message AND "timestamp"::date = CURRENT_DATE) THEN
            INSERT INTO public.messages ("senderId", "receiverId", content, "timestamp", read)
            VALUES (v_general_channel_id, v_general_channel_id, v_chat_message, now(), false);
        END IF;
    END LOOP;
END;
$$;

-- 4. NOVA FUNÇÃO DE TESTE ISOLADO (DIAGNÓSTICO)
CREATE OR REPLACE FUNCTION public.test_resend_email(target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resend_key text;
    v_from_email text;
    v_status int;
    v_resp text;
BEGIN
    SELECT setting_value INTO v_resend_key FROM global_settings WHERE setting_key = 'resend_api_key';
    SELECT setting_value INTO v_from_email FROM global_settings WHERE setting_key = 'resend_from_email';

    IF v_resend_key IS NULL OR length(v_resend_key) < 5 THEN
        RETURN jsonb_build_object('success', false, 'message', 'API Key do Resend não configurada ou inválida.');
    END IF;
    
    IF v_from_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Email de Envio (From) não configurado.');
    END IF;

    SELECT status, content::text INTO v_status, v_resp FROM net.http_post(
        url:='https://api.resend.com/emails',
        headers:=jsonb_build_object(
            'Authorization', 'Bearer ' || v_resend_key,
            'Content-Type', 'application/json'
        ),
        body:=jsonb_build_object(
            'from', v_from_email,
            'to', target_email,
            'subject', 'Teste de Conexão AIManager',
            'html', '<strong>Sucesso!</strong> O sistema de emails está configurado corretamente.'
        )
    );

    IF v_status >= 200 AND v_status < 300 THEN
        RETURN jsonb_build_object('success', true, 'status', v_status, 'response', v_resp);
    ELSE
        RETURN jsonb_build_object('success', false, 'status', v_status, 'response', v_resp);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 5. PERMISSÕES
ALTER FUNCTION public.send_daily_birthday_emails() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO service_role;

GRANT EXECUTE ON FUNCTION public.test_resend_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_resend_email(text) TO service_role;

-- 6. AGENDAMENTO (pg_cron)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('job-aniversarios-diario');
        PERFORM cron.schedule('job-aniversarios-diario', '0 9 * * *', 'SELECT public.send_daily_birthday_emails()');
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

NOTIFY pgrst, 'reload config';
`;

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {
    const [activeSubTab, setActiveSubTab] = useState<'birthdays' | 'reports'>('birthdays');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testEmailAddress, setTestEmailAddress] = useState('');
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

    const handleCopy = (text: string, id: string) => {
        onCopy(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleRunRoutineTest = async () => {
        if(!confirm("Isto irá executar a verificação de aniversários AGORA. Se houver aniversariantes hoje, a mensagem no chat será publicada. Continuar?")) return;
        
        setIsTesting(true);
        try {
            await onTest();
        } finally {
            setIsTesting(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmailAddress || !testEmailAddress.includes('@')) {
            alert("Por favor insira um email válido.");
            return;
        }

        setIsSendingTestEmail(true);
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase.rpc('test_resend_email', { target_email: testEmailAddress });

            if (error) {
                console.error("RPC Error:", error);
                if (error.code === '42883') {
                     alert("A função de teste não existe. Por favor execute o Script de Instalação v5.10 abaixo no SQL Editor.");
                } else {
                     alert(`Erro ao invocar teste: ${error.message}`);
                }
                return;
            }

            if (data && data.success) {
                alert(`Sucesso! Email enviado. Verifique a caixa de entrada de ${testEmailAddress}.`);
            } else {
                alert(`O Resend recusou o envio.\nStatus: ${data?.status}\nErro: ${data?.response || data?.message}`);
            }

        } catch (e: any) {
            console.error(e);
            alert("Erro inesperado: " + e.message);
        } finally {
            setIsSendingTestEmail(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Sub-tabs Navigation */}
            <div className="flex border-b border-gray-700 mb-4 px-6 pt-2">
                <button 
                    onClick={() => setActiveSubTab('birthdays')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'birthdays' ? 'border-pink-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <FaBirthdayCake /> Parabéns Automáticos
                </button>
                <button 
                    onClick={() => setActiveSubTab('reports')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'reports' ? 'border-yellow-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    <FaClock /> Relatórios Semanais
                </button>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar p-6 pt-0 space-y-6">
                
                {/* --- TAB: WEEKLY REPORTS --- */}
                {activeSubTab === 'reports' && (
                    <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 animate-fade-in">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-yellow-400"/> Configuração de Relatórios</h3>
                        <p className="text-sm text-gray-400">
                            Configure o envio automático de relatórios semanais com o resumo de tickets e equipamentos.
                            <br/><span className="text-xs italic opacity-70">Nota: Requer configuração de Edge Functions ou pg_cron avançado.</span>
                        </p>
                        
                        <div className="bg-black/30 p-4 rounded border border-gray-700">
                             <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaEnvelope/> Destinatários do Relatório</h4>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={settings.weekly_report_recipients} 
                                    onChange={(e) => onSettingsChange('weekly_report_recipients', e.target.value)} 
                                    className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" 
                                    placeholder="admin@empresa.com, gestor@empresa.com" 
                                />
                                <button onClick={onSave} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><FaSave /> Guardar</button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Separe múltiplos emails com vírgulas.</p>
                        </div>
                    </div>
                )}

                {/* --- TAB: BIRTHDAYS --- */}
                {activeSubTab === 'birthdays' && (
                    <div className="space-y-6 animate-fade-in">
                         {/* Main Config */}
                        <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4 border-l-4 border-l-pink-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBirthdayCake className="text-pink-400"/> Mensagens de Aniversário</h3>
                                    <p className="text-sm text-gray-300 mt-1">
                                        Envia emails via Resend e publica uma mensagem no <strong>Chat Geral</strong> quando um colaborador faz anos.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleRunRoutineTest} 
                                    disabled={isTesting}
                                    className="text-xs bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isTesting ? <FaSpinner className="animate-spin"/> : <FaPlay />} Executar Rotina (Todos)
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-black/30 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold mb-3 text-sm flex items-center gap-2"><FaEnvelope/> Template do Email</h4>
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
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Mensagem (HTML Suportado)</label>
                                            <textarea 
                                                value={settings.birthday_email_body} 
                                                onChange={(e) => onSettingsChange('birthday_email_body', e.target.value)} 
                                                rows={3}
                                                className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" 
                                                placeholder="Parabéns {{nome}}! Desejamos-te um dia fantástico." 
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1">Variável disponível: <code>{'{{nome}'}</code></p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-black/30 p-4 rounded border border-gray-700 flex flex-col">
                                     <h4 className="text-white font-bold mb-3 text-sm flex items-center gap-2"><FaStethoscope className="text-blue-400"/> Testar Conexão Resend</h4>
                                     <p className="text-xs text-gray-400 mb-3">
                                         Envie um email de teste para validar se a Chave API e o Domínio estão corretos.
                                     </p>
                                     <div className="flex gap-2">
                                         <input 
                                            type="email" 
                                            value={testEmailAddress}
                                            onChange={(e) => setTestEmailAddress(e.target.value)}
                                            placeholder="seu.email@exemplo.com"
                                            className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                                         />
                                         <button 
                                            onClick={handleSendTestEmail}
                                            disabled={isSendingTestEmail}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2 disabled:opacity-50"
                                         >
                                            {isSendingTestEmail ? <FaSpinner className="animate-spin"/> : <FaPaperPlane />} Testar
                                         </button>
                                     </div>
                                     <div className="mt-auto pt-2 text-right">
                                         <button onClick={onSave} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2 ml-auto"><FaSave /> Guardar Configuração</button>
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Área de Instalação e Scripts */}
                        <div className="border-t border-gray-700 pt-4">
                            <h4 className="text-white font-bold text-md mb-4 flex items-center gap-2">
                                <FaDatabase className="text-yellow-400" /> Scripts de Instalação (SQL)
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {/* Passo 1: Verificar se existe */}
                                <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                                    <div className="flex justify-between items-center mb-1">
                                        <h5 className="text-blue-300 font-bold text-xs flex items-center gap-2"><FaSearch/> 1. Verificar Estado</h5>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mb-2">Execute isto no SQL Editor para ver se as funções já existem.</p>
                                    <div className="relative">
                                        <pre className="text-[10px] font-mono text-blue-200 bg-gray-900 p-2 rounded border border-gray-700 overflow-x-auto">{checkFunctionScript}</pre>
                                        <button onClick={() => handleCopy(checkFunctionScript, 'check_sql')} className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px]">
                                            {copiedCode === 'check_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                        </button>
                                    </div>
                                </div>

                                {/* Passo 2: Reinstalar */}
                                <div className="bg-red-900/20 p-3 rounded border border-red-500/30">
                                     <div className="flex justify-between items-center mb-1">
                                        <h5 className="text-red-300 font-bold text-xs flex items-center gap-2"><FaTerminal/> 2. Instalação Completa v5.10 (Update)</h5>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mb-2">
                                        Use este script para atualizar a função de aniversários (correção de tipos) e <strong>instalar a ferramenta de teste de email</strong>.
                                    </p>
                                    <div className="relative">
                                        <pre className="text-[10px] font-mono text-red-200 bg-gray-900 p-2 rounded border border-gray-700 overflow-x-auto max-h-48 custom-scrollbar">{birthdaySqlScript}</pre>
                                        <button onClick={() => handleCopy(birthdaySqlScript, 'install_sql')} className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px]">
                                            {copiedCode === 'install_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CronJobsTab;
