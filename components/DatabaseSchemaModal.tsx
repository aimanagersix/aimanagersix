
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling, FaCommentDots, FaHdd, FaMagic, FaTools, FaUnlock, FaShieldAlt, FaShoppingCart } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'security' | 'repair' | 'fix_procurement' | 'update' | 'fix_types' | 'triggers' | 'playwright'>('security');
    
    // ... (rest of state logic same as before) ...
    const [testRequest, setTestRequest] = useState('');
    const [generatedTest, setGeneratedTest] = useState('');
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [testEmail, setTestEmail] = useState('josefsmoreira@outlook.com');
    const [testPassword, setTestPassword] = useState('QSQmZf62!');
    
    const [triggers, setTriggers] = useState<any[]>([]);
    const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);

    const aiConfigured = isAiConfigured();

    const hardeningScript = `
-- ... (hardening script content kept as is, skipping for brevity in this output but assumes included) ...
-- ==================================================================================
-- SCRIPT DE SEGURANÇA (HARDENING RLS) - v3.0
-- ==================================================================================
BEGIN;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE current_role text;
BEGIN SELECT role INTO current_role FROM public.collaborators WHERE id = auth.uid(); RETURN current_role IN ('SuperAdmin', 'Admin'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DO $$
DECLARE tables text[] := ARRAY['brands', 'equipment_types', 'config_equipment_statuses', 'config_cpus', 'config_ram_sizes', 'config_storage_types', 'config_job_titles', 'config_software_categories', 'config_software_products', 'ticket_categories', 'security_incident_types', 'config_accounting_categories', 'config_conservation_states', 'document_templates', 'contact_roles', 'contact_titles', 'global_settings', 'config_criticality_levels', 'config_cia_ratings', 'config_service_statuses', 'config_backup_types', 'config_training_types', 'config_resilience_test_types', 'config_decommission_reasons', 'config_collaborator_deactivation_reasons']; tbl text;
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow Read Authenticated" ON public.%I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow Write Admin" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow Read Authenticated" ON public.%I FOR SELECT TO authenticated USING (true)', tbl);
        EXECUTE format('CREATE POLICY "Allow Write Admin" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', tbl);
        EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
    END LOOP;
END $$;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Own Profile" ON public.collaborators;
DROP POLICY IF EXISTS "Admin Manage All" ON public.collaborators;
CREATE POLICY "Read Own Profile" ON public.collaborators FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin Manage All" ON public.collaborators FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
NOTIFY pgrst, 'reload config';
COMMIT;
`;

    const repairScript = `
-- ==================================================================================
-- REPARAÇÃO DE FUNÇÕES & PERMISSÕES (v2.5 - Sintaxe Corrigida)
-- ==================================================================================

-- 1. CORRIGIR SETTINGS (Permissões de Global Settings)
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Write Admin" ON public.global_settings;
DROP POLICY IF EXISTS "Settings Admin Access" ON public.global_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.global_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.global_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.global_settings;

CREATE POLICY "Settings Admin Access" ON public.global_settings FOR ALL TO authenticated
USING (exists (select 1 from public.collaborators where id = auth.uid() and role in ('SuperAdmin', 'Admin')))
WITH CHECK (exists (select 1 from public.collaborators where id = auth.uid() and role in ('SuperAdmin', 'Admin')));

CREATE POLICY "Settings Read All" ON public.global_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.global_settings (setting_key, setting_value)
VALUES ('birthday_email_subject', 'Feliz Aniversário!'), ('birthday_email_body', 'Parabéns {{nome}}! Desejamos-te um dia fantástico.')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. REPARAR FUNÇÃO DE ANIVERSÁRIOS (Correção "Function does not exist" + Sintaxe)
create extension if not exists pg_net;
create or replace function public.send_daily_birthday_emails()
returns void language plpgsql security definer set search_path = public as $$
declare
    v_resend_key text; v_from_email text; v_subject text; v_body_tpl text; v_final_body text; v_chat_message text; v_general_channel_id uuid := '00000000-0000-0000-0000-000000000000'; r_user record;
begin
    select setting_value into v_resend_key from global_settings where setting_key = 'resend_api_key';
    select setting_value into v_from_email from global_settings where setting_key = 'resend_from_email';
    select setting_value into v_subject from global_settings where setting_key = 'birthday_email_subject';
    select setting_value into v_body_tpl from global_settings where setting_key = 'birthday_email_body';
    if v_subject is null then v_subject := 'Feliz Aniversário!'; end if;
    if v_body_tpl is null then v_body_tpl := 'Parabéns {{nome}}! Desejamos-te um dia fantástico.'; end if;
    for r_user in select "fullName", "email", "id" from collaborators where status = 'Ativo' and extract(month from "dateOfBirth") = extract(month from current_date) and extract(day from "dateOfBirth") = extract(day from current_date) loop
        if v_resend_key is not null and v_from_email is not null and length(v_resend_key) > 5 then
            v_final_body := replace(v_body_tpl, '{{nome}}', r_user."fullName");
            perform net.http_post(url:='https://api.resend.com/emails', headers:=jsonb_build_object('Authorization', 'Bearer ' || v_resend_key, 'Content-Type', 'application/json'), body:=jsonb_build_object('from', v_from_email, 'to', r_user.email, 'subject', v_subject, 'html', '<div style="font-family: sans-serif; color: #333;"><h2>🎉 ' || v_subject || '</h2><p>' || v_final_body || '</p><hr/><small>Enviado automaticamente pelo AIManager.</small></div>'));
        end if;
        v_chat_message := '🎉 Parabéns ao colega **' || r_user."fullName" || '** que celebra hoje o seu aniversário! 🎂🎈';
        if not exists (select 1 from messages where "receiverId" = v_general_channel_id and content = v_chat_message and created_at::date = current_date) then
            INSERT INTO public.messages ("senderId", "receiverId", content, timestamp, read) VALUES (v_general_channel_id, v_general_channel_id, v_chat_message, now(), false);
        end if;
    end loop;
end;
$$;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO authenticated, service_role, postgres;

-- 3. REPARAR FUNÇÃO get_database_triggers
DROP FUNCTION IF EXISTS get_database_triggers();
CREATE OR REPLACE FUNCTION get_database_triggers() RETURNS TABLE (trigger_name text, event_manipulation text, event_object_table text, action_statement text)
LANGUAGE sql SECURITY DEFINER AS $$ SELECT t.trigger_name::text, t.event_manipulation::text, t.event_object_table::text, t.action_statement::text FROM information_schema.triggers t WHERE t.trigger_schema = 'public'; $$;
GRANT EXECUTE ON FUNCTION get_database_triggers TO authenticated, anon;

-- 4. REPARAR TABELA DE CARGOS (Job Titles)
CREATE TABLE IF NOT EXISTS public.config_job_titles (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ DEFAULT now());
ALTER TABLE public.config_job_titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Job Titles Read" ON public.config_job_titles;
DROP POLICY IF EXISTS "Job Titles Write" ON public.config_job_titles;
CREATE POLICY "Job Titles Read" ON public.config_job_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Job Titles Write" ON public.config_job_titles FOR ALL TO authenticated USING (exists (select 1 from public.collaborators where id = auth.uid() and role in ('SuperAdmin', 'Admin'))) WITH CHECK (exists (select 1 from public.collaborators where id = auth.uid() and role in ('SuperAdmin', 'Admin')));
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.config_job_titles(id);
`;

    const fixProcurementScript = `
-- ... (procurement fix script kept as is) ...
DROP TRIGGER IF EXISTS on_procurement_created ON public.procurement_requests;
DROP TRIGGER IF EXISTS tr_procurement_notification ON public.procurement_requests;
DROP FUNCTION IF EXISTS notify_procurement_creation();
DROP FUNCTION IF EXISTS process_procurement_logic();
CREATE TABLE IF NOT EXISTS public.procurement_requests (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, description TEXT, quantity INTEGER DEFAULT 1, estimated_cost NUMERIC, requester_id UUID REFERENCES public.collaborators(id), status TEXT DEFAULT 'Pendente', request_date DATE DEFAULT CURRENT_DATE, priority TEXT DEFAULT 'Normal', resource_type TEXT DEFAULT 'Hardware', specifications JSONB DEFAULT '{}'::jsonb, attachments JSONB DEFAULT '[]'::jsonb, brand_id UUID REFERENCES public.brands(id), equipment_type_id UUID REFERENCES public.equipment_types(id), software_category_id UUID REFERENCES public.config_software_categories(id), supplier_id UUID REFERENCES public.suppliers(id), approver_id UUID REFERENCES public.collaborators(id), approval_date DATE, order_date DATE, received_date DATE, order_reference TEXT, invoice_number TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE OR REPLACE FUNCTION process_procurement_logic() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE requester_name TEXT; requester_entidade_id UUID; ticket_description TEXT; admin_id UUID;
BEGIN
  SELECT "fullName", "entidadeId" INTO requester_name, requester_entidade_id FROM public.collaborators WHERE id = NEW.requester_id;
  IF requester_name IS NULL THEN requester_name := 'Utilizador Desconhecido'; END IF;
  ticket_description := 'Novo Pedido de Aquisição: ' || COALESCE(NEW.title, 'Sem Título') || '. Solicitado por: ' || requester_name || '. Custo Est.: ' || COALESCE(NEW.estimated_cost, 0)::text || ' EUR.';
  SELECT id INTO admin_id FROM public.collaborators WHERE role = 'SuperAdmin' LIMIT 1;
  INSERT INTO public.tickets (title, description, status, category, "entidadeId", "collaboratorId", "requestDate", "technicianId") VALUES ('Aprovação Necessária: ' || COALESCE(NEW.title, ''), ticket_description, 'Pedido', 'Pedido de Acesso', requester_entidade_id, NEW.requester_id, NOW(), admin_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Erro ao criar ticket automático para aquisição: %', SQLERRM; RETURN NEW; END; $$;
CREATE TRIGGER on_procurement_created AFTER INSERT ON public.procurement_requests FOR EACH ROW EXECUTE FUNCTION process_procurement_logic();
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Procurement Access" ON public.procurement_requests;
CREATE POLICY "Procurement Access" ON public.procurement_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.procurement_requests TO authenticated, anon;
`;

    const fixTypesScript = `
UPDATE equipment_types SET requires_cpu_info = true, requires_ram_size = true, requires_disk_info = true WHERE LOWER(name) LIKE '%desktop%' OR LOWER(name) LIKE '%laptop%' OR LOWER(name) LIKE '%portátil%' OR LOWER(name) LIKE '%server%';
`;

    const updateScript = `-- Script vazio.`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const loadTriggers = async () => {
        setIsLoadingTriggers(true);
        setTriggerError(null);
        try {
            const { data, error } = await dataService.fetchDatabaseTriggers();
            if (error) throw error;
            setTriggers(data || []);
        } catch (error: any) {
            setTriggerError(error.message || "Erro ao carregar triggers. Vá à aba 'Reparação' e execute o script.");
        } finally {
            setIsLoadingTriggers(false);
        }
    };

    const handleGenerateTest = async () => {
        if (!testRequest.trim()) return;
        setIsGeneratingTest(true);
        try {
            const code = await generatePlaywrightTest(testRequest, {email: testEmail, pass: testPassword});
            setGeneratedTest(code);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar teste.");
        } finally {
            setIsGeneratingTest(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'triggers') {
            loadTriggers();
        }
    }, [activeTab]);
    
    return (
        <Modal title="Configuração de Base de Dados & Ferramentas" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-700 mb-4 gap-2 flex-wrap bg-gray-900/50 p-2 rounded-t-lg">
                     <button 
                        onClick={() => setActiveTab('security')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'border-green-500 text-white bg-green-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaShieldAlt /> 1. Segurança (RLS)
                    </button>
                     <button 
                        onClick={() => setActiveTab('repair')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'repair' ? 'border-yellow-500 text-white bg-yellow-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaTools /> 2. Reparação Geral
                    </button>
                    {/* ... other tabs ... */}
                    <button 
                        onClick={() => setActiveTab('fix_procurement')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fix_procurement' ? 'border-red-500 text-white bg-red-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaShoppingCart /> 3. Corrigir Aquisições
                    </button>
                     <button 
                        onClick={() => setActiveTab('fix_types')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fix_types' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaMagic /> Ativar Campos
                    </button>
                     <button 
                        onClick={() => setActiveTab('triggers')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'triggers' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBolt /> Triggers
                    </button>
                    <button 
                        onClick={() => setActiveTab('playwright')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'playwright' ? 'border-pink-500 text-white bg-pink-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaRobot /> Testes E2E
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 p-1">
                    
                    {/* UNLOCK / SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaShieldAlt /> ENDURECIMENTO DE SEGURANÇA (RLS)
                                </div>
                                <p className="mb-2">
                                    Este script ativa o <strong>Row Level Security (RLS)</strong> em todas as tabelas de configuração.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {hardeningScript}
                                </pre>
                                <button onClick={() => handleCopy(hardeningScript)} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"><FaCopy /></button>
                            </div>
                        </div>
                    )}

                     {/* REPAIR TAB */}
                     {activeTab === 'repair' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg text-sm text-yellow-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaTools /> UPDATE V2.5 & REPARAÇÃO
                                </div>
                                <p className="mb-2">
                                    Use este script se estiver a ter erros de "RLS Policy Violation" ou "Function does not exist" ao testar aniversários.
                                    <br/>
                                    <strong>Inclui:</strong> Reparação da função 'send_daily_birthday_emails' e permissões GRANT EXECUTE.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-yellow-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {repairScript}
                                </pre>
                                <button onClick={() => handleCopy(repairScript)} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"><FaCopy /></button>
                            </div>
                        </div>
                    )}

                    {/* ... other tabs (fix_procurement, fix_types, triggers, playwright) kept same as before ... */}
                    {/* FIX PROCUREMENT TAB */}
                     {activeTab === 'fix_procurement' && (
                        <div className="space-y-4 animate-fade-in">
                             <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-red-300 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">{fixProcurementScript}</pre>
                                <button onClick={() => handleCopy(fixProcurementScript)} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"><FaCopy /></button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'fix_types' && (
                         <div className="space-y-4 animate-fade-in">
                             <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-purple-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">{fixTypesScript}</pre>
                                <button onClick={() => handleCopy(fixTypesScript)} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"><FaCopy /></button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'triggers' && (
                         <div className="space-y-4 animate-fade-in">
                            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaBolt className="text-yellow-500" /> Triggers</h3>
                                    <button onClick={loadTriggers} className="text-sm text-brand-secondary hover:underline flex items-center gap-1"><FaSync className={isLoadingTriggers ? "animate-spin" : ""} /> Atualizar</button>
                                </div>
                                {triggerError ? <div className="text-red-400 text-sm p-2 border border-red-500/30 rounded bg-red-900/20">{triggerError}</div> : (
                                    <div className="overflow-x-auto"><table className="w-full text-xs text-left text-gray-300"><thead className="bg-gray-800 text-gray-400 uppercase"><tr><th className="p-2">Trigger</th><th className="p-2">Evento</th><th className="p-2">Tabela</th></tr></thead><tbody>{triggers.length > 0 ? triggers.map((t: any, i: number) => (<tr key={i} className="border-b border-gray-800"><td className="p-2 font-bold text-white">{t.trigger_name}</td><td className="p-2">{t.event_manipulation}</td><td className="p-2">{t.event_object_table}</td></tr>)) : <tr><td colSpan={3} className="p-4 text-center">Nenhum trigger encontrado.</td></tr>}</tbody></table></div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'playwright' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Cenário</label>
                                    <textarea value={testRequest} onChange={e => setTestRequest(e.target.value)} rows={4} className="w-full bg-gray-800 p-2 rounded text-sm border border-gray-600" placeholder="Descreva o teste..."/>
                                    <button onClick={handleGenerateTest} disabled={isGeneratingTest || !aiConfigured} className="mt-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50">{isGeneratingTest ? <FaSpinner className="animate-spin"/> : <FaPlay />} Gerar Teste</button>
                                </div>
                                <div><label className="block text-sm text-gray-400 mb-1">Código</label><div className="relative h-64 md:h-auto"><textarea value={generatedTest} readOnly className="w-full h-full bg-gray-900 font-mono text-xs text-green-400 p-4 rounded border border-gray-700"/>{generatedTest && <button onClick={() => handleCopy(generatedTest)} className="absolute top-2 right-2 p-1 bg-gray-700 rounded hover:bg-gray-600"><FaCopy/></button>}</div></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto bg-gray-900/80 p-4 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors shadow-lg">Fechar Janela</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
