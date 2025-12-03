
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaSeedling } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'update' | 'reset' | 'cleanup' | 'playwright_ai' | 'seed'>('update');
    
    // Playwright AI State
    const [testRequest, setTestRequest] = useState('');
    const [generatedTest, setGeneratedTest] = useState('');
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [testEmail, setTestEmail] = useState('josefsmoreira@outlook.com');
    const [testPassword, setTestPassword] = useState('QSQmZf62!');
    const aiConfigured = isAiConfigured();

    const updateScript = `
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE PARA ATUALIZAR A BASE DE DADOS

-- ==========================================
-- 1. EXTENSÕES E FUNÇÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net"; -- Necessário para Slack Webhooks

-- Funções de Diagnóstico para Contagem de Órfãos
CREATE OR REPLACE FUNCTION count_orphaned_entities()
RETURNS integer AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM entidades WHERE "instituicaoId" NOT IN (SELECT id FROM instituicoes));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION count_orphaned_collaborators()
RETURNS integer AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM collaborators WHERE "entidadeId" IS NOT NULL AND "entidadeId" NOT IN (SELECT id FROM entidades));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION count_orphaned_assignments()
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) FROM assignments 
        WHERE "equipmentId" NOT IN (SELECT id FROM equipment)
        OR ("collaboratorId" IS NOT NULL AND "collaboratorId" NOT IN (SELECT id FROM collaborators))
        OR ("entidadeId" IS NOT NULL AND "entidadeId" NOT IN (SELECT id FROM entidades))
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se o pg_cron está ativo
CREATE OR REPLACE FUNCTION check_pg_cron()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 2. STORAGE (IMAGENS DE PERFIL)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Add RLS policy on BUCKETS table for public read access (solves diagnostic issue)
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Public read access for buckets" ON storage.buckets FOR SELECT USING (true);
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Add/Confirm RLS policies on OBJECTS in the 'avatars' bucket
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Avatar Public Read Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        CREATE POLICY "Avatar Upload Access" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        CREATE POLICY "Avatar Update Access" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        CREATE POLICY "Avatar Delete Access" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' );
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- ==========================================
-- 3. CRIAÇÃO DE TABELAS
-- ==========================================

-- Tabelas de Configuração (Garantir constraints UNIQUE para evitar erros futuros)
CREATE TABLE IF NOT EXISTS config_equipment_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_equipment_statuses ADD CONSTRAINT config_equipment_statuses_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_criticality_levels (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_criticality_levels ADD CONSTRAINT config_criticality_levels_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_cia_ratings (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_cia_ratings ADD CONSTRAINT config_cia_ratings_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_service_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_service_statuses ADD CONSTRAINT config_service_statuses_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_backup_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_backup_types ADD CONSTRAINT config_backup_types_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_training_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_training_types ADD CONSTRAINT config_training_types_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_resilience_test_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_resilience_test_types ADD CONSTRAINT config_resilience_test_types_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_software_categories (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE config_software_categories ADD CONSTRAINT config_software_categories_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS contact_roles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE contact_roles ADD CONSTRAINT contact_roles_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS contact_titles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL);
DO $$ BEGIN ALTER TABLE contact_titles ADD CONSTRAINT contact_titles_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS config_decommission_reasons (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);

-- NOVA TABELA DE MOTIVOS DE INATIVAÇÃO DE COLABORADOR
CREATE TABLE IF NOT EXISTS config_collaborator_deactivation_reasons (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config_custom_roles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_system boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
DO $$ BEGIN ALTER TABLE config_custom_roles ADD CONSTRAINT config_custom_roles_name_key UNIQUE (name); EXCEPTION WHEN OTHERS THEN NULL; END $$;

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
    requester_id uuid REFERENCES collaborators(id),
    approver_id uuid REFERENCES collaborators(id),
    supplier_id uuid REFERENCES suppliers(id),
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
    created_by uuid REFERENCES collaborators(id),
    team_id uuid REFERENCES teams(id),
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
-- 4. SLACK NOTIFICATIONS (DATABASE WEBHOOKS)
-- ==========================================

-- Função 1: Notificar Incidente Crítico
CREATE OR REPLACE FUNCTION notify_slack_incident()
RETURNS trigger AS $$
DECLARE
  slack_url text;
  payload jsonb;
BEGIN
  -- Check if ticket is Critical or High
  IF NEW."impactCriticality" IN ('Crítica', 'Alta') THEN
      -- Get Webhook URL
      SELECT setting_value INTO slack_url FROM global_settings WHERE setting_key = 'slack_webhook_url';
      
      IF slack_url IS NOT NULL AND slack_url != '' THEN
          payload := jsonb_build_object(
              'text', format('🚨 *Novo Incidente Crítico Detetado* 🚨%n*Título:* %s%n*Severidade:* %s%n*Descrição:* %s', NEW.title, NEW."impactCriticality", NEW.description)
          );
          PERFORM net.http_post(
              url := slack_url,
              body := payload
          );
      END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 1
DROP TRIGGER IF EXISTS on_critical_ticket_created ON tickets;
CREATE TRIGGER on_critical_ticket_created
AFTER INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION notify_slack_incident();


-- Função 2: Notificar Aprovação Pendente
CREATE OR REPLACE FUNCTION notify_slack_approval()
RETURNS trigger AS $$
DECLARE
  slack_url text;
  payload jsonb;
BEGIN
  -- Only for new requests
  IF NEW.status = 'Pendente' THEN
      -- Get Webhook URL
      SELECT setting_value INTO slack_url FROM global_settings WHERE setting_key = 'slack_webhook_url';
      
      IF slack_url IS NOT NULL AND slack_url != '' THEN
          payload := jsonb_build_object(
              'text', format('📦 *Novo Pedido de Aquisição* 📦%n*Item:* %s%n*Custo Est:* %s%n*Prioridade:* %s%n_A aguardar aprovação_', NEW.title, COALESCE(NEW.estimated_cost::text, 'N/A'), NEW.priority)
          );
          PERFORM net.http_post(
              url := slack_url,
              body := payload
          );
      END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 2
DROP TRIGGER IF EXISTS on_procurement_created ON procurement_requests;
CREATE TRIGGER on_procurement_created
AFTER INSERT ON procurement_requests
FOR EACH ROW
EXECUTE FUNCTION notify_slack_approval();


-- ==========================================
-- 5. INSERIR VALORES PADRÃO (Robust INSERT)
-- ==========================================

-- Config Equipment Statuses
INSERT INTO config_equipment_statuses (name)
SELECT v.name FROM (VALUES ('Stock'), ('Operacional'), ('Abate'), ('Garantia'), ('Empréstimo')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_equipment_statuses WHERE name = v.name);

-- Config Criticality
INSERT INTO config_criticality_levels (name)
SELECT v.name FROM (VALUES ('Baixa'), ('Média'), ('Alta'), ('Crítica')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_criticality_levels WHERE name = v.name);

-- Config CIA
INSERT INTO config_cia_ratings (name)
SELECT v.name FROM (VALUES ('Baixo'), ('Médio'), ('Alto')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_cia_ratings WHERE name = v.name);

-- Config Service Statuses
INSERT INTO config_service_statuses (name)
SELECT v.name FROM (VALUES ('Ativo'), ('Inativo'), ('Em Manutenção')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_service_statuses WHERE name = v.name);

-- Config Backup Types
INSERT INTO config_backup_types (name)
SELECT v.name FROM (VALUES ('Completo'), ('Incremental'), ('Diferencial'), ('Snapshot VM')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_backup_types WHERE name = v.name);

-- Config Training Types
INSERT INTO config_training_types (name)
SELECT v.name FROM (VALUES ('Simulação Phishing'), ('Leitura Política Segurança'), ('Higiene Cibernética (Geral)'), ('RGPD / Privacidade'), ('Ferramenta Específica')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_training_types WHERE name = v.name);

-- Config Resilience Test Types
INSERT INTO config_resilience_test_types (name)
SELECT v.name FROM (VALUES ('Scan Vulnerabilidades'), ('Penetration Test (Pentest)'), ('TLPT (Red Teaming)'), ('Exercício de Mesa (DRP)'), ('Recuperação de Desastres (Full)')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_resilience_test_types WHERE name = v.name);

-- Config Decommission Reasons
INSERT INTO config_decommission_reasons (name)
SELECT v.name FROM (VALUES ('Fim de Vida (EOL)'), ('Avaria Irreparável'), ('Roubo / Perda'), ('Substituição Tecnológica')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_decommission_reasons WHERE name = v.name);

-- Config Collaborator Deactivation Reasons (Novo)
INSERT INTO config_collaborator_deactivation_reasons (name)
SELECT v.name FROM (VALUES ('Fim de Contrato'), ('Saída Voluntária'), ('Reforma'), ('Despedimento')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_collaborator_deactivation_reasons WHERE name = v.name);

-- Config Contacts
INSERT INTO contact_roles (name)
SELECT v.name FROM (VALUES ('Técnico'), ('Comercial'), ('Financeiro'), ('Diretor'), ('Administrativo'), ('DPO/CISO')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM contact_roles WHERE name = v.name);

INSERT INTO contact_titles (name)
SELECT v.name FROM (VALUES ('Sr.'), ('Sra.'), ('Dr.'), ('Dra.'), ('Eng.'), ('Eng.ª'), ('Arq.')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM contact_titles WHERE name = v.name);

INSERT INTO config_software_categories (name)
SELECT v.name FROM (VALUES ('Sistema Operativo'), ('Segurança / Endpoint'), ('Produtividade'), ('Design & Multimédia'), ('Desenvolvimento')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM config_software_categories WHERE name = v.name);

-- ATUALIZAÇÃO DE PERFIS: SuperAdmin é System, Admin é Normal mas poderoso
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('SuperAdmin', true, '{}')
ON CONFLICT (name) DO UPDATE SET is_system = true;

INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Admin', false, '{"equipment":{"view":true,"create":true,"edit":true,"delete":true},"licensing":{"view":true,"create":true,"edit":true,"delete":true},"tickets":{"view":true,"create":true,"edit":true,"delete":true},"organization":{"view":true,"create":true,"edit":true,"delete":true},"suppliers":{"view":true,"create":true,"edit":true,"delete":true},"procurement":{"view":true,"create":true,"edit":true,"delete":true},"reports":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":true,"create":true,"edit":true,"delete":true},"dashboard_smart":{"view":true,"create":false,"edit":false,"delete":false},"compliance_bia":{"view":true,"create":true,"edit":true,"delete":true},"compliance_security":{"view":true,"create":true,"edit":true,"delete":true},"compliance_backups":{"view":true,"create":true,"edit":true,"delete":true},"compliance_resilience":{"view":true,"create":true,"edit":true,"delete":true},"compliance_training":{"view":true,"create":true,"edit":true,"delete":true},"compliance_policies":{"view":true,"create":true,"edit":true,"delete":true},"brands":{"view":true,"create":true,"edit":true,"delete":true},"equipment_types":{"view":true,"create":true,"edit":true,"delete":true},"config_equipment_statuses":{"view":true,"create":true,"edit":true,"delete":true},"config_software_categories":{"view":true,"create":true,"edit":true,"delete":true},"ticket_categories":{"view":true,"create":true,"edit":true,"delete":true},"security_incident_types":{"view":true,"create":true,"edit":true,"delete":true},"contact_roles":{"view":true,"create":true,"edit":true,"delete":true},"contact_titles":{"view":true,"create":true,"edit":true,"delete":true},"config_custom_roles":{"view":true,"create":true,"edit":true,"delete":false},"config_automation":{"view":true,"create":false,"edit":true,"delete":false},"config_collaborator_deactivation_reasons":{"view":true,"create":true,"edit":true,"delete":true}}')
ON CONFLICT (name) DO UPDATE SET is_system = false, permissions = EXCLUDED.permissions;

INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Técnico', false, '{"equipment":{"view":true,"create":true,"edit":true,"delete":false},"licensing":{"view":true,"create":true,"edit":true,"delete":false},"tickets":{"view":true,"create":true,"edit":true,"delete":false},"organization":{"view":true,"create":false,"edit":false,"delete":false},"suppliers":{"view":true,"create":false,"edit":false,"delete":false},"procurement":{"view":true,"create":true,"edit":false,"delete":false},"reports":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":false,"create":false,"edit":false,"delete":false},"dashboard_smart":{"view":false,"create":false,"edit":false,"delete":false},"compliance_bia":{"view":true,"create":true,"edit":true,"delete":false},"compliance_security":{"view":true,"create":true,"edit":true,"delete":false},"compliance_backups":{"view":true,"create":true,"edit":true,"delete":false},"compliance_resilience":{"view":true,"create":true,"edit":true,"delete":false},"compliance_training":{"view":true,"create":true,"edit":true,"delete":false},"compliance_policies":{"view":true,"create":false,"edit":false,"delete":false}}')
ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Utilizador', false, '{"tickets":{"view":true,"create":true,"edit":false,"delete":false},"procurement":{"view":true,"create":true,"edit":false,"delete":false}}')
ON CONFLICT (name) DO NOTHING;

-- CANAL GERAL (System User)
INSERT INTO collaborators (id, "fullName", email, "numeroMecanografico", role, status, "canLogin", "receivesNotifications")
VALUES ('00000000-0000-0000-0000-000000000000', 'Canal Geral', 'general@system.local', 'SYS-001', 'System', 'Ativo', false, false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 6. PERMISSÕES (RLS)
-- ==========================================
DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_name LIKE 'config_%' 
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true);', t); 
    END LOOP;
    
    FOREACH t IN ARRAY ARRAY['contact_roles', 'contact_titles', 'resource_contacts', 'global_settings', 'integration_logs', 'security_training_records', 'policies', 'policy_acceptances', 'procurement_requests', 'calendar_events', 'continuity_plans']
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true);', t); 
    END LOOP;
END $$;

-- ==========================================
-- 7. SCRIPT DE CORREÇÃO DE COLUNAS (Atualizações)
-- ==========================================
DO $$ 
DECLARE t text;
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'config_equipment_statuses') THEN
        ALTER TABLE config_equipment_statuses ADD COLUMN IF NOT EXISTS color text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collaborators') THEN
         ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS deactivation_reason_id uuid REFERENCES config_collaborator_deactivation_reasons(id);
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_types') THEN
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS is_maintenance boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_wwan_address boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_bluetooth_address boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_usb_thunderbolt_address boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_ram_size boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_disk_info boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_cpu_info boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_manufacture_date boolean DEFAULT false;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "isLoan" boolean DEFAULT false;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "requisitionNumber" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "installationLocation" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "parent_equipment_id" uuid REFERENCES equipment(id) ON DELETE SET NULL;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "os_version" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "last_security_update" date;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "firmware_version" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "encryption_status" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "wwan_address" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "bluetooth_address" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "usb_thunderbolt_address" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "ip_address" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "ram_size" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "cpu_info" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "disk_info" jsonb;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "monitor_info" jsonb;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "procurement_request_id" uuid REFERENCES procurement_requests(id) ON DELETE SET NULL;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "manufacture_date" date;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_training_records') THEN
        ALTER TABLE security_training_records ADD COLUMN IF NOT EXISTS duration_hours numeric;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'config_custom_roles') THEN
        ALTER TABLE config_custom_roles ADD COLUMN IF NOT EXISTS requires_mfa boolean DEFAULT false;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'procurement_requests') THEN
        ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS resource_type text;
        ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS equipment_type_id uuid REFERENCES equipment_types(id);
        ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS specifications jsonb;
        ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS software_category_id uuid REFERENCES config_software_categories(id);
    END IF;
END $$;`;

    const handleCopy = () => {
        navigator.clipboard.writeText(updateScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
        <Modal title="Configuração de Base de Dados & Ferramentas" onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[70vh]">
                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4">
                     <button 
                        onClick={() => setActiveTab('update')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'update' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaDatabase className="inline mr-2"/> Atualizar BD
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
                                    Este script cria/atualiza todas as tabelas, funções e permissões necessárias.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-96 custom-scrollbar border border-gray-700">
                                    {updateScript}
                                </pre>
                                <button 
                                    onClick={handleCopy} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors"
                                    title="Copiar SQL"
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
