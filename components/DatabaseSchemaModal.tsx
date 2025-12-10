
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling, FaCommentDots, FaHdd, FaMagic, FaTools, FaUnlock, FaShieldAlt, FaShoppingCart, FaUserLock, FaSearch } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'security' | 'repair' | 'rbac' | 'fix_procurement' | 'audit_db' | 'fix_types' | 'triggers' | 'playwright'>('security');
    
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
-- ==================================================================================
-- SCRIPT DE SEGURANÇA BÁSICA (HARDENING RLS) - v5.0 (LIMPEZA TOTAL DE CONFIGS)
-- Remove TODO o lixo (Ops Read, Aux Write, etc) das tabelas de configuração.
-- ==================================================================================
BEGIN;

-- 1. Função Helper de Admin (Garante que existe)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE current_role text;
BEGIN SELECT role INTO current_role FROM public.collaborators WHERE id = auth.uid(); RETURN current_role IN ('SuperAdmin', 'Admin'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Loop de "Vassourada" e Aplicação
DO $$
DECLARE 
    tables text[] := ARRAY[
        -- Hardware & Software Configs
        'brands', 'equipment_types', 'config_equipment_statuses', 'config_cpus', 'config_ram_sizes', 
        'config_storage_types', 'config_software_categories', 'config_software_products',
        'config_decommission_reasons', 'config_conservation_states',
        
        -- HR & Organization Configs
        'config_job_titles', 'contact_roles', 'contact_titles', 'config_collaborator_deactivation_reasons',
        'config_custom_roles', 'config_user_roles', 'config_accounting_categories', 'document_templates',
        
        -- Support & Compliance Configs
        'ticket_categories', 'security_incident_types', 'config_criticality_levels', 'config_cia_ratings', 
        'config_service_statuses', 'config_backup_types', 'config_training_types', 'config_resilience_test_types',
        'global_settings'
    ]; 
    tbl text;
    pol record;
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Garantir que a tabela existe antes de aplicar
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            
            -- 1. Ativar RLS
            EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- 2. "VASSOURADA": Iterar sobre pg_policies e apagar TUDO o que existe nesta tabela
            FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            END LOOP;

            -- 3. Criar Novas Políticas Limpas
            -- Leitura: Todos os utilizadores autenticados
            EXECUTE format('CREATE POLICY "Config_Read_All" ON public.%I FOR SELECT TO authenticated USING (true)', tbl);
            -- Escrita: Apenas Admins
            EXECUTE format('CREATE POLICY "Config_Write_Admin" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', tbl);
            
            -- 4. Grants Básicos
            EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
            EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload config';
COMMIT;
`;

    const rbacScript = `
-- ==================================================================================
-- SCRIPT DE SEGURANÇA AVANÇADA (RBAC) - v6.0 (LIMPEZA FINAL E DEFINITIVA)
-- Resolve o problema de múltiplas políticas conflituosas (Ops, Aux, RBAC duplicados).
-- ==================================================================================

-- 1. FUNÇÃO CENTRAL
CREATE OR REPLACE FUNCTION public.has_permission(requested_module text, requested_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role text;
    v_perm_json jsonb;
BEGIN
    SELECT role INTO v_user_role FROM public.collaborators WHERE id = auth.uid();
    IF v_user_role IN ('SuperAdmin', 'Admin') THEN RETURN true; END IF;
    SELECT permissions INTO v_perm_json FROM public.config_custom_roles WHERE name = v_user_role;
    IF v_perm_json IS NULL THEN RETURN false; END IF;
    IF COALESCE((v_perm_json -> requested_module ->> requested_action)::boolean, false) IS TRUE THEN RETURN true; END IF;
    RETURN false;
END;
$$;

-- 2. LIMPEZA PROFUNDA (GARBAGE COLLECTOR)
DO $$
DECLARE
    t text;
    pol record;
    -- Lista de TODAS as tabelas operacionais que tinham "lixo" no CSV
    tables text[] := ARRAY[
        'equipment', 'entidades', 'software_licenses', 'tickets', 'collaborators', 'procurement_requests',
        'assignments', 'license_assignments', 'instituicoes', 'suppliers', 'teams', 'team_members', 'resource_contacts',
        'ticket_activities', 'backup_executions', 'resilience_tests', 'security_training_records', 
        'vulnerabilities', 'policies', 'policy_acceptances', 'continuity_plans', 'calendar_events', 'messages', 'audit_logs',
        'ticket' -- Incluindo a tabela fantasma caso exista
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Garantir RLS Ativo
            EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- APAGAR TODAS AS POLÍTICAS EXISTENTES (Sem saber o nome)
            -- Isto remove "Ops Read", "Aux Write", "Public Read", "RBAC Old", TUDO.
            FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
            END LOOP;
            
            -- Grants de base
            EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
            EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
        END IF;
    END LOOP;
END $$;

-- 3. APLICAR AS NOVAS REGRAS (LIMPAS)

-- >>> EQUIPAMENTOS & ATRIBUIÇÕES
CREATE POLICY "RBAC_Read_Equip" ON public.equipment FOR SELECT TO authenticated USING (public.has_permission('equipment', 'view'));
CREATE POLICY "RBAC_Write_Equip" ON public.equipment FOR ALL TO authenticated USING (public.has_permission('equipment', 'edit')) WITH CHECK (public.has_permission('equipment', 'edit'));
CREATE POLICY "RBAC_Create_Equip" ON public.equipment FOR INSERT TO authenticated WITH CHECK (public.has_permission('equipment', 'create'));
CREATE POLICY "RBAC_Delete_Equip" ON public.equipment FOR DELETE TO authenticated USING (public.has_permission('equipment', 'delete'));

CREATE POLICY "RBAC_Read_Assign" ON public.assignments FOR SELECT TO authenticated USING (public.has_permission('equipment', 'view'));
CREATE POLICY "RBAC_Write_Assign" ON public.assignments FOR ALL TO authenticated USING (public.has_permission('equipment', 'edit')) WITH CHECK (public.has_permission('equipment', 'edit'));

-- >>> LICENCIAMENTO
CREATE POLICY "RBAC_Read_Lic" ON public.software_licenses FOR SELECT TO authenticated USING (public.has_permission('licensing', 'view'));
CREATE POLICY "RBAC_Write_Lic" ON public.software_licenses FOR ALL TO authenticated USING (public.has_permission('licensing', 'edit')) WITH CHECK (public.has_permission('licensing', 'edit'));
CREATE POLICY "RBAC_Read_LicAssign" ON public.license_assignments FOR SELECT TO authenticated USING (public.has_permission('licensing', 'view'));
CREATE POLICY "RBAC_Write_LicAssign" ON public.license_assignments FOR ALL TO authenticated USING (public.has_permission('licensing', 'edit')) WITH CHECK (public.has_permission('licensing', 'edit'));

-- >>> ORGANIZAÇÃO (Entidades, Instituições, Fornecedores, Equipas)
CREATE POLICY "RBAC_Read_Ent" ON public.entidades FOR SELECT TO authenticated USING (public.has_permission('organization', 'view'));
CREATE POLICY "RBAC_Write_Ent" ON public.entidades FOR ALL TO authenticated USING (public.has_permission('organization', 'edit')) WITH CHECK (public.has_permission('organization', 'edit'));

CREATE POLICY "RBAC_Read_Inst" ON public.instituicoes FOR SELECT TO authenticated USING (public.has_permission('organization', 'view'));
CREATE POLICY "RBAC_Write_Inst" ON public.instituicoes FOR ALL TO authenticated USING (public.has_permission('organization', 'edit')) WITH CHECK (public.has_permission('organization', 'edit'));

CREATE POLICY "RBAC_Read_Sup" ON public.suppliers FOR SELECT TO authenticated USING (public.has_permission('suppliers', 'view') OR public.has_permission('organization', 'view'));
CREATE POLICY "RBAC_Write_Sup" ON public.suppliers FOR ALL TO authenticated USING (public.has_permission('suppliers', 'edit')) WITH CHECK (public.has_permission('suppliers', 'edit'));

CREATE POLICY "RBAC_Read_Teams" ON public.teams FOR SELECT TO authenticated USING (public.has_permission('organization', 'view'));
CREATE POLICY "RBAC_Write_Teams" ON public.teams FOR ALL TO authenticated USING (public.has_permission('organization', 'edit')) WITH CHECK (public.has_permission('organization', 'edit'));
CREATE POLICY "RBAC_Access_TeamMembers" ON public.team_members FOR ALL TO authenticated USING (public.has_permission('organization', 'view')) WITH CHECK (public.has_permission('organization', 'edit'));

CREATE POLICY "RBAC_Access_Contacts" ON public.resource_contacts FOR ALL TO authenticated USING (true) WITH CHECK (public.has_permission('organization', 'edit') OR public.has_permission('suppliers', 'edit'));

-- >>> COLABORADORES
-- Nota: Todos autenticados podem LER colaboradores para preencher dropdowns, mas só admin/organization edita.
CREATE POLICY "RBAC_Read_Collabs" ON public.collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC_Write_Collabs" ON public.collaborators FOR ALL TO authenticated USING (public.has_permission('organization', 'edit') OR id = auth.uid()) WITH CHECK (public.has_permission('organization', 'edit') OR id = auth.uid());

-- >>> TICKETS (Híbrido)
CREATE POLICY "RBAC_Read_Tickets" ON public.tickets FOR SELECT TO authenticated
USING (public.has_permission('tickets', 'view') OR "collaboratorId" = auth.uid() OR "technicianId" = auth.uid());

CREATE POLICY "RBAC_Create_Tickets" ON public.tickets FOR INSERT TO authenticated
WITH CHECK (public.has_permission('tickets', 'create') OR "collaboratorId" = auth.uid());

CREATE POLICY "RBAC_Update_Tickets" ON public.tickets FOR UPDATE TO authenticated
USING (public.has_permission('tickets', 'edit') OR "technicianId" = auth.uid() OR "collaboratorId" = auth.uid())
WITH CHECK (public.has_permission('tickets', 'edit') OR "technicianId" = auth.uid() OR "collaboratorId" = auth.uid());

-- Actividades
CREATE POLICY "RBAC_Read_Activities" ON public.ticket_activities FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_activities."ticketId" AND (public.has_permission('tickets', 'view') OR t."collaboratorId" = auth.uid() OR t."technicianId" = auth.uid())));
CREATE POLICY "RBAC_Write_Activities" ON public.ticket_activities FOR INSERT TO authenticated WITH CHECK (true);

-- >>> COMPLIANCE & OUTROS
CREATE POLICY "RBAC_Compliance_Read" ON public.vulnerabilities FOR SELECT TO authenticated USING (public.has_permission('compliance_security', 'view'));
CREATE POLICY "RBAC_Compliance_Write" ON public.vulnerabilities FOR ALL TO authenticated USING (public.has_permission('compliance_security', 'edit')) WITH CHECK (public.has_permission('compliance_security', 'edit'));

CREATE POLICY "RBAC_Backup_Read" ON public.backup_executions FOR SELECT TO authenticated USING (public.has_permission('compliance_backups', 'view'));
CREATE POLICY "RBAC_Backup_Write" ON public.backup_executions FOR ALL TO authenticated USING (public.has_permission('compliance_backups', 'edit')) WITH CHECK (public.has_permission('compliance_backups', 'edit'));

-- >>> UTILITÁRIOS
-- Logs: Todos escrevem (insert-only), Admin lê.
CREATE POLICY "Audit_Insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Audit_Read_Admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- Chat: Sender, Receiver ou Canal Geral
CREATE POLICY "Chat_Access" ON public.messages FOR ALL TO authenticated
USING ("senderId" = auth.uid() OR "receiverId" = auth.uid() OR "receiverId" = '00000000-0000-0000-0000-000000000000')
WITH CHECK ("senderId" = auth.uid());

-- Calendário
CREATE POLICY "Calendar_Access" ON public.calendar_events FOR ALL TO authenticated
USING (created_by = auth.uid() OR is_private = false)
WITH CHECK (created_by = auth.uid());

-- 4. REFRESH
NOTIFY pgrst, 'reload config';
`;

    const auditScript = `
-- ==================================================================================
-- SCRIPT DE AUDITORIA E DIAGNÓSTICO (CONSULTA APENAS)
-- Execute este script para ver o que realmente existe na base de dados.
-- ==================================================================================

-- 1. LISTAR TODAS AS POLÍTICAS (RLS) ATIVAS
SELECT 
    schemaname as esquema,
    tablename as tabela,
    policyname as nome_politica,
    permissive as permissao,
    cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. LISTAR TODOS OS GATILHOS (TRIGGERS)
SELECT 
    event_object_table as tabela,
    trigger_name as nome_trigger,
    event_manipulation as evento,
    action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table;

-- 3. LISTAR TODAS AS FUNÇÕES (FUNCTIONS) NO SCHEMA PUBLIC
SELECT 
    routines.routine_name as nome_funcao,
    routines.data_type as tipo_retorno
FROM information_schema.routines
WHERE routines.specific_schema = 'public'
ORDER BY routines.routine_name;
`;

    const repairScript = `
-- ... (repair script content kept same) ...
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
DROP FUNCTION IF EXISTS public.send_daily_birthday_emails();

CREATE OR REPLACE FUNCTION public.send_daily_birthday_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    v_resend_key text;
    v_from_email text;
    v_subject text;
    v_body_tpl text;
    v_final_body text;
    v_chat_message text;
    v_general_channel_id uuid := '00000000-0000-0000-0000-000000000000';
    r_user record;
begin
    select setting_value into v_resend_key from global_settings where setting_key = 'resend_api_key';
    select setting_value into v_from_email from global_settings where setting_key = 'resend_from_email';
    select setting_value into v_subject from global_settings where setting_key = 'birthday_email_subject';
    select setting_value into v_body_tpl from global_settings where setting_key = 'birthday_email_body';
    
    if v_subject is null then v_subject := 'Feliz Aniversário!'; end if;
    if v_body_tpl is null then v_body_tpl := 'Parabéns {{nome}}! Desejamos-te um dia fantástico.'; end if;
    
    for r_user in 
        select "fullName", "email", "id" 
        from collaborators 
        where status = 'Ativo' 
        and extract(month from "dateOfBirth") = extract(month from current_date) 
        and extract(day from "dateOfBirth") = extract(day from current_date) 
    loop
        if v_resend_key is not null and v_from_email is not null and length(v_resend_key) > 5 then
            v_final_body := replace(v_body_tpl, '{{nome}}', r_user."fullName");
            perform net.http_post(
                url:='https://api.resend.com/emails',
                headers:=jsonb_build_object('Authorization', 'Bearer ' || v_resend_key, 'Content-Type', 'application/json'),
                body:=jsonb_build_object('from', v_from_email, 'to', r_user.email, 'subject', v_subject, 'html', '<div style="font-family: sans-serif; color: #333;"><h2>🎉 ' || v_subject || '</h2><p>' || v_final_body || '</p><hr/><small>Enviado automaticamente pelo AIManager.</small></div>')
            );
        end if;
        v_chat_message := '🎉 Parabéns ao colega **' || r_user."fullName" || '** que celebra hoje o seu aniversário! 🎂🎈';
        if not exists (select 1 from messages where "receiverId" = v_general_channel_id and content = v_chat_message and created_at::date = current_date) then
            INSERT INTO public.messages ("senderId", "receiverId", content, timestamp, read) 
            VALUES (v_general_channel_id, v_general_channel_id, v_chat_message, now(), false);
        end if;
    end loop;
end;
$$;
REVOKE ALL ON FUNCTION public.send_daily_birthday_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO anon;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_daily_birthday_emails() TO service_role;
NOTIFY pgrst, 'reload config';
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
                    {/* New RBAC Tab */}
                     <button 
                        onClick={() => setActiveTab('rbac')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'rbac' ? 'border-purple-500 text-white bg-purple-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaUserLock /> 4. Segurança RBAC (v6.0)
                    </button>
                    <button 
                        onClick={() => setActiveTab('audit_db')} 
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'audit_db' ? 'border-blue-500 text-white bg-blue-900/20 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaSearch /> 5. Auditoria DB
                    </button>
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
                                    <FaShieldAlt /> ENDURECIMENTO DE SEGURANÇA (RLS) - v5.0 (Configurações)
                                </div>
                                <p className="mb-2">
                                    Este script limpa todas as regras antigas nas <strong>tabelas de configuração</strong> (marcas, tipos, etc.) e aplica a regra "Leitura para todos, Escrita para Admin".
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
                                    <FaTools /> SCRIPT DE RESGATE V3.1 (Função Aniversários)
                                </div>
                                <p className="mb-2">
                                    <strong>Execute este script se ainda tiver erros com a função 'send_daily_birthday_emails'.</strong>
                                    <br/>
                                    Ele remove a função antiga, recria-a e reaplica todas as permissões necessárias para o utilizador autenticado.
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

                    {/* RBAC TAB */}
                    {activeTab === 'rbac' && (
                        <div className="space-y-4 animate-fade-in">
                             <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-lg text-sm text-purple-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaUserLock /> SCRIPT DE SEGURANÇA AVANÇADA (RBAC) - v6.0 (A Vassoura)
                                </div>
                                <p className="mb-2">
                                    <strong>Limpeza Definitiva:</strong> Este script usa o catálogo de sistema do Postgres para encontrar e apagar <strong>todas</strong> as políticas existentes nas tabelas operacionais, independentemente do nome (seja "Ops Read", "Public Access", etc.), antes de aplicar as novas regras RBAC.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-purple-300 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {rbacScript}
                                </pre>
                                <button onClick={() => handleCopy(rbacScript)} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"><FaCopy /></button>
                            </div>
                        </div>
                    )}

                    {/* AUDIT TAB */}
                    {activeTab === 'audit_db' && (
                        <div className="space-y-4 animate-fade-in">
                             <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaSearch /> AUDITORIA E DIAGNÓSTICO (CONSULTA)
                                </div>
                                <p className="mb-2">
                                    Este script <strong>NÃO altera nada</strong>. Ele apenas lista todas as Políticas, Triggers e Funções existentes na base de dados.
                                    <br/>
                                    Use-o no SQL Editor do Supabase para verificar se ainda existem regras antigas ("lixo") ou se a limpeza funcionou.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-blue-300 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {auditScript}
                                </pre>
                                <button onClick={() => handleCopy(auditScript)} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"><FaCopy /></button>
                            </div>
                        </div>
                    )}

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
