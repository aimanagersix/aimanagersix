
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'update' | 'cleanup' | 'triggers' | 'playwright_ai'>('update');
    
    // Playwright AI State
    const [testRequest, setTestRequest] = useState('');
    const [generatedTest, setGeneratedTest] = useState('');
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [testEmail, setTestEmail] = useState('josefsmoreira@outlook.com');
    const [testPassword, setTestPassword] = useState('QSQmZf62!');
    
    // Triggers State
    const [triggers, setTriggers] = useState<any[]>([]);
    const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);

    const aiConfigured = isAiConfigured();

    const updateScript = `
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE PARA ATUALIZAR A BASE DE DADOS

-- ==========================================
-- 1. EXTENSÕES E FUNÇÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net"; -- Necessário para Slack Webhooks

-- Função auxiliar para obter o role do utilizador atual
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
BEGIN
  RETURN (SELECT role FROM public.collaborators WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é Admin ou SuperAdmin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role IN ('Admin', 'SuperAdmin') FROM public.collaborators WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é Admin ou Técnico
CREATE OR REPLACE FUNCTION is_admin_or_tech()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role IN ('Admin', 'SuperAdmin', 'Técnico') FROM public.collaborators WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOVA FUNÇÃO: Obter Triggers (Para o Dashboard)
CREATE OR REPLACE FUNCTION get_database_triggers()
RETURNS TABLE (
    table_name text,
    trigger_name text,
    events text,
    timing text,
    definition text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_object_table::text,
        trigger_name::text,
        event_manipulation::text,
        action_timing::text,
        action_statement::text
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. STORAGE (IMAGENS DE PERFIL)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    -- Allow public read
    BEGIN CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' ); EXCEPTION WHEN OTHERS THEN NULL; END;
    -- Allow authenticated upload
    BEGIN CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' ); EXCEPTION WHEN OTHERS THEN NULL; END;
    -- Allow owner update/delete
    BEGIN CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner ); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' AND auth.uid() = owner ); EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- ==========================================
-- 3. CRIAÇÃO DE TABELAS
-- ==========================================

-- Tabelas de Configuração
CREATE TABLE IF NOT EXISTS config_equipment_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE, color text);
CREATE TABLE IF NOT EXISTS config_criticality_levels (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_cia_ratings (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_service_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_backup_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_training_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_resilience_test_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_software_categories (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_decommission_reasons (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_collaborator_deactivation_reasons (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE, created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS config_software_products (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    category_id uuid REFERENCES config_software_categories(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_roles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS contact_titles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS config_custom_roles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_system boolean DEFAULT false,
    requires_mfa boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_contacts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_type text NOT NULL,
    resource_id uuid NOT NULL,
    title text,
    name text NOT NULL,
    role text,
    email text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key text NOT NULL UNIQUE,
    setting_value text,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    source text,
    payload jsonb,
    status text,
    error text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid,
    user_email text,
    action text,
    resource_type text,
    resource_id text,
    details text,
    timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_training_records (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    collaborator_id uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    training_type text NOT NULL,
    completion_date date NOT NULL,
    status text DEFAULT 'Concluído',
    score integer,
    notes text,
    valid_until date,
    duration_hours numeric,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policies (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    content text,
    version text NOT NULL DEFAULT '1.0',
    is_active boolean DEFAULT true,
    is_mandatory boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_acceptances (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    accepted_at timestamptz DEFAULT now(),
    version text NOT NULL
);

CREATE TABLE IF NOT EXISTS procurement_requests (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    description text,
    quantity integer DEFAULT 1,
    estimated_cost numeric,
    requester_id uuid REFERENCES collaborators(id) ON DELETE SET NULL,
    approver_id uuid REFERENCES collaborators(id) ON DELETE SET NULL,
    supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'Pendente',
    request_date date DEFAULT CURRENT_DATE,
    approval_date date,
    order_date date,
    received_date date,
    order_reference text,
    invoice_number text,
    priority text DEFAULT 'Normal',
    attachments jsonb DEFAULT '[]'::jsonb,
    resource_type text,
    equipment_type_id uuid REFERENCES equipment_types(id),
    specifications jsonb,
    software_category_id uuid REFERENCES config_software_categories(id),
    brand_id uuid REFERENCES brands(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_date timestamptz NOT NULL,
    end_date timestamptz,
    is_all_day boolean DEFAULT false,
    color text,
    created_by uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    is_private boolean DEFAULT false,
    reminder_minutes integer,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS continuity_plans (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    type text NOT NULL,
    description text,
    document_url text,
    document_name text,
    service_id uuid REFERENCES business_services(id) ON DELETE SET NULL,
    last_review_date date NOT NULL,
    next_review_date date,
    owner_id uuid REFERENCES collaborators(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 4. SECURITY: RLS POLICIES (REFORÇO)
-- ==========================================

-- Ativar RLS em todas as tabelas
DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        -- Limpar políticas antigas "Allow all" inseguras
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- 4.1 Políticas para Tabelas de Configuração (Leitura: Todos, Escrita: Admin/Técnico)
DO $$ 
DECLARE t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'config_%' OR table_name LIKE 'contact_%' OR table_name = 'brands' OR table_name = 'equipment_types' OR table_name = 'ticket_categories' OR table_name = 'security_incident_types'
    LOOP 
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Public Read" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Public Read" ON %I FOR SELECT USING (auth.role() = ''authenticated'');', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Admin Write" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Admin Write" ON %I FOR ALL USING (is_admin_or_tech());', t); EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- 4.2 Políticas para Tabelas Operacionais (Equipment, Tickets, etc.)

-- Equipment: Leitura Todos, Escrita Admin/Tech
DROP POLICY IF EXISTS "Equipment Read" ON equipment;
CREATE POLICY "Equipment Read" ON equipment FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Equipment Write" ON equipment;
CREATE POLICY "Equipment Write" ON equipment FOR ALL USING (is_admin_or_tech());

-- Collaborators: Leitura Todos, Edição Apenas Próprio ou Admin
DROP POLICY IF EXISTS "Collab Read" ON collaborators;
CREATE POLICY "Collab Read" ON collaborators FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Collab Update Self" ON collaborators;
CREATE POLICY "Collab Update Self" ON collaborators FOR UPDATE USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Collab Insert/Delete" ON collaborators;
CREATE POLICY "Collab Insert/Delete" ON collaborators FOR INSERT WITH CHECK (is_admin()); 

DROP POLICY IF EXISTS "Collab Delete" ON collaborators;
CREATE POLICY "Collab Delete" ON collaborators FOR DELETE USING (is_admin());

-- Tickets: Leitura (Requerente, Técnico ou Admin), Escrita (Requerente, Técnico ou Admin)
DROP POLICY IF EXISTS "Ticket Read" ON tickets;
CREATE POLICY "Ticket Read" ON tickets FOR SELECT USING (
    auth.uid() = "collaboratorId" OR 
    auth.uid() = "technicianId" OR 
    is_admin_or_tech()
);

DROP POLICY IF EXISTS "Ticket Create" ON tickets;
CREATE POLICY "Ticket Create" ON tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Ticket Update" ON tickets;
CREATE POLICY "Ticket Update" ON tickets FOR UPDATE USING (
    auth.uid() = "collaboratorId" OR 
    auth.uid() = "technicianId" OR 
    is_admin_or_tech()
);

-- Procurement: Leitura (Requerente, Aprovador ou Admin)
DROP POLICY IF EXISTS "Procurement Read" ON procurement_requests;
CREATE POLICY "Procurement Read" ON procurement_requests FOR SELECT USING (
    auth.uid() = requester_id OR 
    auth.uid() = approver_id OR 
    is_admin_or_tech()
);

DROP POLICY IF EXISTS "Procurement Create" ON procurement_requests;
CREATE POLICY "Procurement Create" ON procurement_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Procurement Update" ON procurement_requests;
CREATE POLICY "Procurement Update" ON procurement_requests FOR UPDATE USING (
    auth.uid() = requester_id OR 
    is_admin_or_tech()
);

-- Audit Logs: Apenas leitura para Admin, Escrita via Trigger (System)
DROP POLICY IF EXISTS "Audit Read Admin" ON audit_logs;
CREATE POLICY "Audit Read Admin" ON audit_logs FOR SELECT USING (is_admin());
-- (Insert is handled by system or Trigger)

-- Global Settings: Apenas Admin pode ver keys sensíveis (API keys), mas app precisa de algumas
DROP POLICY IF EXISTS "Settings Read" ON global_settings;
CREATE POLICY "Settings Read" ON global_settings FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Settings Write" ON global_settings;
CREATE POLICY "Settings Write" ON global_settings FOR ALL USING (is_admin());


-- ==========================================
-- 5. TRIGGER DE AUDITORIA (SERVER SIDE)
-- ==========================================
-- Garante que todas as alterações são logadas, mesmo se não passarem pela API da App

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger AS $$
DECLARE
  user_id uuid;
  user_email text;
BEGIN
  user_id := auth.uid();
  -- Tentar obter email (pode falhar se user foi apagado, mas auth.uid existe na sessão)
  SELECT email INTO user_email FROM public.collaborators WHERE id = user_id;
  
  INSERT INTO public.audit_logs (user_id, user_email, action, resource_type, resource_id, details)
  VALUES (
    user_id,
    COALESCE(user_email, 'System/Unknown'),
    TG_OP, -- INSERT, UPDATE, DELETE
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE 
      WHEN TG_OP = 'DELETE' THEN 'Record deleted via SQL/App'
      WHEN TG_OP = 'UPDATE' THEN 'Record updated'
      ELSE 'Record created'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar Trigger a tabelas críticas
DO $$ 
DECLARE t text;
BEGIN 
    FOREACH t IN ARRAY ARRAY['equipment', 'collaborators', 'tickets', 'global_settings', 'software_licenses']
    LOOP 
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %I;', t);
            EXECUTE format('CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION log_audit_event();', t);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- ==========================================
-- 6. SLACK NOTIFICATIONS (Manter existentes)
-- ==========================================
-- (Código dos triggers slack mantido aqui para garantir persistência)
CREATE OR REPLACE FUNCTION notify_slack_incident() RETURNS trigger AS $$
DECLARE slack_url text; payload jsonb;
BEGIN
  IF NEW."impactCriticality" IN ('Crítica', 'Alta') THEN
      SELECT setting_value INTO slack_url FROM global_settings WHERE setting_key = 'slack_webhook_url';
      IF slack_url IS NOT NULL AND slack_url != '' THEN
          payload := jsonb_build_object('text', format('🚨 *Incidente Crítico* 🚨%n*Título:* %s%n*Desc:* %s', NEW.title, NEW.description));
          PERFORM net.http_post(url := slack_url, body := payload);
      END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_critical_ticket_created ON tickets;
CREATE TRIGGER on_critical_ticket_created AFTER INSERT ON tickets FOR EACH ROW EXECUTE FUNCTION notify_slack_incident();

-- CORREÇÃO DE FOREIGN KEYS (ON UPDATE CASCADE)
-- Necessário para permitir a sincronização de IDs de colaboradores (Auth <-> Tabela)
DO $$
BEGIN
    -- assignments
    BEGIN
        ALTER TABLE assignments DROP CONSTRAINT "assignments_collaboratorId_fkey";
        ALTER TABLE assignments ADD CONSTRAINT "assignments_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES collaborators(id) ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- tickets (collaboratorId)
    BEGIN
        ALTER TABLE tickets DROP CONSTRAINT "tickets_collaboratorId_fkey";
        ALTER TABLE tickets ADD CONSTRAINT "tickets_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES collaborators(id) ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- tickets (technicianId)
    BEGIN
        ALTER TABLE tickets DROP CONSTRAINT "tickets_technicianId_fkey";
        ALTER TABLE tickets ADD CONSTRAINT "tickets_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES collaborators(id) ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- ticket_activities (technicianId)
    BEGIN
        ALTER TABLE ticket_activities DROP CONSTRAINT "ticket_activities_technicianId_fkey";
        ALTER TABLE ticket_activities ADD CONSTRAINT "ticket_activities_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES collaborators(id) ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- team_members
    BEGIN
        ALTER TABLE team_members DROP CONSTRAINT "team_members_collaborator_id_fkey";
        ALTER TABLE team_members ADD CONSTRAINT "team_members_collaborator_id_fkey" FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- procurement_requests (requester)
    BEGIN
        ALTER TABLE procurement_requests DROP CONSTRAINT "procurement_requests_requester_id_fkey";
        ALTER TABLE procurement_requests ADD CONSTRAINT "procurement_requests_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES collaborators(id) ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- procurement_requests (approver)
    BEGIN
        ALTER TABLE procurement_requests DROP CONSTRAINT "procurement_requests_approver_id_fkey";
        ALTER TABLE procurement_requests ADD CONSTRAINT "procurement_requests_approver_id_fkey" FOREIGN KEY (approver_id) REFERENCES collaborators(id) ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;

END $$;
`;

    const cleanupScript = `
-- ==========================================
-- SCRIPT DE LIMPEZA SAFE-MODE
-- APAGA DADOS OPERACIONAIS MAS MANTÉM SUPERADMIN
-- ==========================================

-- 1. Limpar tabelas de dados operacionais (Ordem correta de dependência)
DELETE FROM audit_logs;
DELETE FROM integration_logs;
DELETE FROM policy_acceptances;
DELETE FROM security_training_records;
DELETE FROM resilience_tests;
DELETE FROM backup_executions;
DELETE FROM service_dependencies;
DELETE FROM vulnerabilities;
DELETE FROM business_services;
DELETE FROM messages;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM license_assignments;
DELETE FROM software_licenses;
DELETE FROM ticket_activities;
DELETE FROM tickets;
DELETE FROM assignments;
DELETE FROM collaborator_history;
DELETE FROM procurement_requests;
DELETE FROM calendar_events;
DELETE FROM continuity_plans;
DELETE FROM equipment;
DELETE FROM resource_contacts;

-- 2. Limpar Storage (Cuidado: Apaga avatares e anexos)
DELETE FROM storage.objects;

-- 3. Limpar Colaboradores (EXCETO SUPERADMINS)
-- Mantém quem tem role 'SuperAdmin' para evitar lockout
DELETE FROM collaborators WHERE role != 'SuperAdmin';

-- 4. Sincronizar Auth Users (Remover Órfãos)
-- Apaga logins que já não têm ficha de colaborador associada
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.collaborators)
AND email != 'general@system.local'; -- Protege o bot de sistema

-- Fim do Script
`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const loadTriggers = async () => {
        setIsLoadingTriggers(true);
        try {
            const data = await dataService.fetchDatabaseTriggers();
            setTriggers(data);
        } catch (error) {
            console.error("Failed to fetch triggers", error);
        } finally {
            setIsLoadingTriggers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'triggers') {
            loadTriggers();
        }
    }, [activeTab]);

    const handleGenerateTest = async () => {
        if (!testRequest) return;
        setIsGeneratingTest(true);
        try {
            const code = await generatePlaywrightTest(testRequest, { email: testEmail, pass: testPassword });
            setGeneratedTest(code);
        } catch (error) {
            console.error(error);
            setGeneratedTest("// Erro ao gerar teste.");
        } finally {
            setIsGeneratingTest(false);
        }
    };

    return (
        <Modal title="Configuração de Base de Dados & Ferramentas" onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[70vh]">
                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4 gap-2 flex-wrap">
                     <button 
                        onClick={() => setActiveTab('update')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'update' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaDatabase className="inline mr-2"/> Atualizar BD (Schema)
                    </button>
                    <button 
                        onClick={() => setActiveTab('triggers')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'triggers' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBolt className="inline mr-2"/> Triggers Ativos
                    </button>
                    <button 
                        onClick={() => setActiveTab('cleanup')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cleanup' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBroom className="inline mr-2"/> Limpeza & Reset
                    </button>
                    <button 
                        onClick={() => setActiveTab('playwright_ai')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'playwright_ai' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaRobot className="inline mr-2"/> Gerador de Testes E2E
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'update' && (
                        <div className="space-y-4">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-2">
                                <p>
                                    <strong>Instruções:</strong> Copie o script SQL abaixo e execute-o no <strong>SQL Editor</strong> do seu projeto Supabase.
                                    Este script implementa <strong>RLS (Row Level Security)</strong> rigoroso, Triggers de Auditoria e Slack, e Funções de Sistema.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-96 custom-scrollbar border border-gray-700">
                                    {updateScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(updateScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'triggers' && (
                         <div className="space-y-4">
                             <div className="flex justify-between items-center mb-2">
                                <div className="text-sm text-gray-400">Lista de automações ativas na base de dados.</div>
                                <button onClick={loadTriggers} className="flex items-center gap-2 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded">
                                    <FaSync className={isLoadingTriggers ? "animate-spin" : ""} /> Atualizar
                                </button>
                             </div>
                             
                             {isLoadingTriggers ? (
                                 <div className="text-center py-10 text-gray-500">A carregar triggers...</div>
                             ) : triggers.length > 0 ? (
                                 <div className="overflow-x-auto border border-gray-700 rounded-lg">
                                     <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                                         <thead className="bg-gray-800 text-gray-300 uppercase text-xs">
                                             <tr>
                                                 <th className="px-4 py-2">Tabela</th>
                                                 <th className="px-4 py-2">Nome do Trigger</th>
                                                 <th className="px-4 py-2">Evento</th>
                                                 <th className="px-4 py-2">Timing</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-700 bg-gray-900">
                                             {triggers.map((t, idx) => (
                                                 <tr key={idx} className="hover:bg-gray-800/50">
                                                     <td className="px-4 py-2 font-bold text-white">{t.table_name}</td>
                                                     <td className="px-4 py-2 font-mono text-xs text-brand-secondary">{t.trigger_name}</td>
                                                     <td className="px-4 py-2">{t.events}</td>
                                                     <td className="px-4 py-2">{t.timing}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             ) : (
                                 <div className="p-8 text-center bg-gray-900/50 rounded border border-dashed border-gray-700">
                                     <p className="text-gray-400 mb-2">Não foi possível carregar os triggers.</p>
                                     <p className="text-xs text-gray-500">
                                         Se é a primeira vez, certifique-se de que executou o script de "Atualizar BD" para criar a função de sistema necessária (<code>get_database_triggers</code>).
                                     </p>
                                 </div>
                             )}
                         </div>
                    )}
                    
                    {activeTab === 'cleanup' && (
                        <div className="space-y-4">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-1">
                                    <FaExclamationTriangle /> ATENÇÃO: Reset de Dados
                                </div>
                                <p>
                                    Este script apaga todos os dados operacionais (tickets, equipamentos, etc.) mas <strong>mantém</strong> os utilizadores com perfil <strong>SuperAdmin</strong> e a sua configuração de login.
                                    <br/>
                                    Utilize isto para limpar dados de teste antes de entrar em produção, sem perder o seu acesso de administrador.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-red-400 overflow-auto max-h-96 custom-scrollbar border border-gray-700">
                                    {cleanupScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(cleanupScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors"
                                    title="Copiar SQL de Limpeza"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'playwright_ai' && (
                        <div className="space-y-4 p-1">
                            <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded-lg text-sm text-purple-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2"><FaRobot /> QA Automation Assistant</div>
                                <p>
                                    Descreva o cenário de teste que pretende (ex: "Login com sucesso e criar um equipamento") e a IA irá gerar o código Playwright pronto a usar.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Email de Teste</label>
                                    <input type="text" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Password de Teste</label>
                                    <input type="password" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={testRequest} 
                                    onChange={(e) => setTestRequest(e.target.value)} 
                                    placeholder="Descreva o teste (ex: Criar um ticket de incidente crítico)..." 
                                    className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateTest()}
                                />
                                <button 
                                    onClick={handleGenerateTest} 
                                    disabled={isGeneratingTest || !aiConfigured}
                                    className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isGeneratingTest ? <FaSpinner className="animate-spin" /> : <FaPlay />} Gerar Código
                                </button>
                            </div>

                            {generatedTest && (
                                <div className="relative mt-4">
                                    <div className="flex justify-between items-center bg-gray-800 p-2 rounded-t-lg border border-gray-700 border-b-0">
                                        <span className="text-xs text-gray-400 font-bold ml-2">tests/generated.spec.ts</span>
                                        <button 
                                            onClick={() => { navigator.clipboard.writeText(generatedTest); alert("Código copiado!"); }} 
                                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                                        >
                                            <FaCopy /> Copiar
                                        </button>
                                    </div>
                                    <pre className="bg-gray-900 p-4 rounded-b-lg text-xs font-mono text-blue-300 overflow-auto max-h-64 custom-scrollbar border border-gray-700">
                                        {generatedTest}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
