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

-- Funções de Diagnóstico para Contagem de Órfãos
CREATE OR REPLACE FUNCTION count_orphaned_entities()
RETURNS integer AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM entidades WHERE "instituicao_id" NOT IN (SELECT id FROM instituicoes));
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
-- 4. INSERIR VALORES PADRÃO (Robust INSERT)
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

-- Config Collaborator Deactivation Reasons
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

-- ATUALIZAÇÃO DE PERFIS (Usando INSERT ... ON CONFLICT para atualizar permissões)
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('SuperAdmin', true, '{}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Admin', false, '{"equipment":{"view":true,"create":true,"edit":true,"delete":true},"licensing":{"view":true,"create":true,"edit":true,"delete":true},"tickets":{"view":true,"create":true,"edit":true,"delete":true},"organization":{"view":true,"create":true,"edit":true,"delete":true},"suppliers":{"view":true,"create":true,"edit":true,"delete":true},"procurement":{"view":true,"create":true,"edit":true,"delete":true},"reports":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":true,"create":true,"edit":true,"delete":true},"dashboard_smart":{"view":true,"create":false,"edit":false,"delete":false},"compliance_bia":{"view":true,"create":true,"edit":true,"delete":true},"compliance_security":{"view":true,"create":true,"edit":true,"delete":true},"compliance_backups":{"view":true,"create":true,"edit":true,"delete":true},"compliance_resilience":{"view":true,"create":true,"edit":true,"delete":true},"compliance_training":{"view":true,"create":true,"edit":true,"delete":true},"compliance_policies":{"view":true,"create":true,"edit":true,"delete":true},"brands":{"view":true,"create":true,"edit":true,"delete":true},"equipment_types":{"view":true,"create":true,"edit":true,"delete":true},"config_equipment_statuses":{"view":true,"create":true,"edit":true,"delete":true},"config_software_categories":{"view":true,"create":true,"edit":true,"delete":true},"ticket_categories":{"view":true,"create":true,"edit":true,"delete":true},"security_incident_types":{"view":true,"create":true,"edit":true,"delete":true},"contact_roles":{"view":true,"create":true,"edit":true,"delete":true},"contact_titles":{"view":true,"create":true,"edit":true,"delete":true},"config_custom_roles":{"view":true,"create":true,"edit":true,"delete":false},"config_automation":{"view":true,"create":false,"edit":true,"delete":false}}')
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
-- 5. PERMISSÕES (RLS)
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
-- 6. SCRIPT DE CORREÇÃO DE COLUNAS (Atualizações)
-- ==========================================
DO $$ 
DECLARE t text;
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'config_equipment_statuses') THEN
        ALTER TABLE config_equipment_statuses ADD COLUMN IF NOT EXISTS color text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_types') THEN
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS is_maintenance boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_wwan_address boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_bluetooth_address boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_usb_thunderbolt_address boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_ram_size boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS requires_disk_info boolean DEFAULT false;
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
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_training_records') THEN
        ALTER TABLE security_training_records ADD COLUMN IF NOT EXISTS duration_hours numeric;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'config_custom_roles') THEN
        ALTER TABLE config_custom_roles ADD COLUMN IF NOT EXISTS requires_mfa boolean DEFAULT false;
    END IF;
END $$;
`;

    const cleanupScript = `
BEGIN;
-- Remover tabelas obsoletas
DROP TABLE IF EXISTS collaborator CASCADE;
DROP TABLE IF EXISTS entidade CASCADE;
DROP TABLE IF EXISTS instituicao CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS team CASCADE;
DROP TABLE IF EXISTS supplier_contacts CASCADE;
DROP TABLE IF EXISTS license_assignment CASCADE;
COMMIT;
`;

    const resetScript = `
-- SCRIPT DE LIMPEZA PROFUNDA (RESET)
-- ATENÇÃO: ISTO APAGA TODOS OS DADOS OPERACIONAIS!

BEGIN;

-- 1. Proteger o Super Admin
UPDATE collaborators 
SET role = 'SuperAdmin', "entidadeId" = NULL, status = 'Ativo'
WHERE email = 'josefsmoreira@outlook.com';

-- 2. Apagar Dados Operacionais
DELETE FROM service_dependencies;
DELETE FROM business_services;
DELETE FROM ticket_activities;
DELETE FROM tickets;
DELETE FROM vulnerabilities;
DELETE FROM license_assignments;
DELETE FROM assignments;
DELETE FROM backup_executions;
DELETE FROM resilience_tests;
DELETE FROM security_training_records;
DELETE FROM messages;
DELETE FROM audit_logs;
DELETE FROM resource_contacts;
DELETE FROM team_members;
DELETE FROM software_licenses;
DELETE FROM integration_logs;
DELETE FROM policy_acceptances;
DELETE FROM policies;
DELETE FROM procurement_requests;
DELETE FROM calendar_events;
DELETE FROM continuity_plans;

-- 3. Apagar Ativos e Configurações Vinculadas
UPDATE equipment SET parent_equipment_id = NULL; -- Break self-ref
DELETE FROM equipment;

UPDATE equipment_types SET default_team_id = NULL;
UPDATE ticket_categories SET default_team_id = NULL;

-- 4. Apagar Estrutura Organizacional (Exceto o Super Admin)
DELETE FROM collaborators WHERE email != 'josefsmoreira@outlook.com';
DELETE FROM teams;
DELETE FROM entidades;
DELETE FROM instituicoes;
DELETE FROM suppliers;

COMMIT;
`;

    const seedScript = `
-- SCRIPT DE SEED COMPLETO (TODOS OS MÓDulos)
-- Execute este script para popular a aplicação com dados de exemplo.
-- Utiliza WHERE NOT EXISTS para evitar erros de chave duplicada em bases existentes.

BEGIN;

-- 1. Marcas & Tipos
INSERT INTO brands (name, risk_level)
SELECT v.name, v.risk_level FROM (VALUES 
  ('Dell', 'Baixa'), ('HP', 'Baixa'), ('Lenovo', 'Baixa'), 
  ('Apple', 'Baixa'), ('Microsoft', 'Baixa'), ('Cisco', 'Média'), ('Fortinet', 'Alta')
) AS v(name, risk_level)
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = v.name);

INSERT INTO equipment_types (name, "requiresNomeNaRede", "requiresInventoryNumber", "is_maintenance")
SELECT v.name, v.req_net, v.req_inv, v.is_maint FROM (VALUES
  ('Laptop', true, true, false), ('Desktop', true, true, false), ('Monitor', false, true, false), 
  ('Servidor', true, true, false), ('Switch', true, true, false), ('Teclado', false, false, false),
  ('Componente Hardware', false, false, true)
) AS v(name, req_net, req_inv, is_maint)
WHERE NOT EXISTS (SELECT 1 FROM equipment_types WHERE name = v.name);

-- 2. Categorias de Tickets & Incidentes
INSERT INTO ticket_categories (name, is_active)
SELECT v.name, v.is_active FROM (VALUES 
  ('Falha Técnica', true), ('Acesso & Contas', true), ('Incidente de Segurança', true), ('Pedido de Equipamento', true)
) AS v(name, is_active)
WHERE NOT EXISTS (SELECT 1 FROM ticket_categories WHERE name = v.name);

INSERT INTO security_incident_types (name, is_active)
SELECT v.name, v.is_active FROM (VALUES 
  ('Phishing', true), ('Malware', true), ('Acesso Não Autorizado', true), ('Ransomware', true)
) AS v(name, is_active)
WHERE NOT EXISTS (SELECT 1 FROM security_incident_types WHERE name = v.name);

-- 3. Instituições e Entidades
WITH inst AS (
  INSERT INTO instituicoes (name, codigo, email, telefone) 
  VALUES ('Empresa Principal SA', 'HQ', 'geral@empresa.com', '210000000')
  ON CONFLICT DO NOTHING 
  RETURNING id
),
existing_inst AS (
  SELECT id FROM instituicoes WHERE name = 'Empresa Principal SA'
)
INSERT INTO entidades (name, codigo, "instituicaoId", email, responsavel) 
SELECT v.name, v.code, COALESCE((SELECT id FROM inst), (SELECT id FROM existing_inst)), v.email, v.resp
FROM (VALUES
  ('Departamento TI', 'TI', 'ti@empresa.com', 'João Admin'),
  ('Recursos Humanos', 'RH', 'rh@empresa.com', 'Maria Silva'),
  ('Financeiro', 'FIN', 'fin@empresa.com', 'Carlos Contas')
) AS v(name, code, email, resp)
WHERE NOT EXISTS (SELECT 1 FROM entidades WHERE codigo = v.code);

-- 4. Equipas
INSERT INTO teams (name, description)
SELECT v.name, v.description FROM (VALUES 
  ('Helpdesk N1', 'Suporte de primeira linha'), 
  ('Infraestruturas', 'Redes e Servidores'),
  ('Segurança (SOC)', 'Resposta a incidentes')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = v.name);

-- 5. Colaboradores
DO $$ 
DECLARE 
    ent_ti uuid;
    ent_rh uuid;
    t_helpdesk uuid;
BEGIN
    SELECT id INTO ent_ti FROM entidades WHERE codigo = 'TI' LIMIT 1;
    SELECT id INTO ent_rh FROM entidades WHERE codigo = 'RH' LIMIT 1;
    SELECT id INTO t_helpdesk FROM teams WHERE name = 'Helpdesk N1' LIMIT 1;

    IF ent_ti IS NOT NULL THEN
        -- Admin
        INSERT INTO collaborators ("fullName", email, "numeroMecanografico", role, status, "canLogin", "entidadeId") 
        SELECT 'Ana Técnica', 'ana@empresa.com', '101', 'Admin', 'Ativo', true, ent_ti
        WHERE NOT EXISTS (SELECT 1 FROM collaborators WHERE email = 'ana@empresa.com');
        
        -- Associar Ana à equipa Helpdesk (se existir)
        IF t_helpdesk IS NOT NULL THEN
             INSERT INTO team_members (team_id, collaborator_id) 
             SELECT t_helpdesk, id FROM collaborators WHERE email = 'ana@empresa.com'
             ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    IF ent_rh IS NOT NULL THEN
        -- Utilizador
        INSERT INTO collaborators ("fullName", email, "numeroMecanografico", role, status, "canLogin", "entidadeId") 
        SELECT 'Rui Utilizador', 'rui@empresa.com', '102', 'Utilizador', 'Ativo', true, ent_rh
        WHERE NOT EXISTS (SELECT 1 FROM collaborators WHERE email = 'rui@empresa.com');
    END IF;
END $$;

-- 6. Fornecedores
INSERT INTO suppliers (name, contact_name, contact_email, risk_level, is_iso27001_certified)
SELECT v.name, v.contact, v.email, v.risk, v.iso
FROM (VALUES
  ('Fornecedor TI Lda', 'Pedro Vendas', 'vendas@fornecedorti.pt', 'Baixa', true),
  ('Datacenter Services', 'Suporte', 'support@datacenter.com', 'Média', true),
  ('Loja de Esquina', 'Sr. Manel', 'manel@loja.pt', 'Alta', false)
) AS v(name, contact, email, risk, iso)
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = v.name);

-- 7. Equipamentos & Licenças
DO $$
DECLARE
    b_dell uuid;
    t_laptop uuid;
    t_server uuid;
    u_rui uuid;
    ent_ti uuid;
    new_eq_id uuid;
BEGIN
    SELECT id INTO b_dell FROM brands WHERE name = 'Dell' LIMIT 1;
    SELECT id INTO t_laptop FROM equipment_types WHERE name = 'Laptop' LIMIT 1;
    SELECT id INTO t_server FROM equipment_types WHERE name = 'Servidor' LIMIT 1;
    SELECT id INTO u_rui FROM collaborators WHERE email = 'rui@empresa.com' LIMIT 1;

    -- Laptop
    IF b_dell IS NOT NULL AND t_laptop IS NOT NULL AND u_rui IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM equipment WHERE "serialNumber" = 'SN001') THEN
            INSERT INTO equipment (description, "serialNumber", "brandId", "typeId", status, "acquisitionCost", "purchaseDate", "nomeNaRede", criticality, confidentiality, integrity, availability) 
            VALUES ('Dell Latitude 7420', 'SN001', b_dell, t_laptop, 'Operacional', 1200, '2023-01-15', 'PT-001', 'Média', 'Médio', 'Médio', 'Médio')
            RETURNING id INTO new_eq_id;
            
            INSERT INTO assignments ("equipmentId", "collaboratorId", "assignedDate")
            VALUES (new_eq_id, u_rui, '2023-01-20');
        END IF;
    END IF;

    -- Server (Stock)
    IF b_dell IS NOT NULL AND t_server IS NOT NULL THEN
        INSERT INTO equipment (description, "serialNumber", "brandId", "typeId", status, "acquisitionCost", "purchaseDate", "nomeNaRede", criticality, confidentiality, integrity, availability) 
        SELECT 'Dell PowerEdge R740', 'SRV001', b_dell, t_server, 'Stock', 5000, '2022-05-20', 'SRV-APP-01', 'Crítica', 'Alto', 'Alto', 'Alto'
        WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE "serialNumber" = 'SRV001');
    END IF;

    -- Licença Office
    INSERT INTO software_licenses ("productName", "licenseKey", "totalSeats", status, "unitCost") 
    SELECT 'Microsoft Office 365 E3', 'MS-365-KEY-001', 50, 'Ativo', 25.00
    WHERE NOT EXISTS (SELECT 1 FROM software_licenses WHERE "licenseKey" = 'MS-365-KEY-001');
END $$;

-- 8. Tickets de Suporte
DO $$
DECLARE
    u_rui uuid;
    u_ana uuid;
    ent_rh uuid;
BEGIN
    SELECT id INTO u_rui FROM collaborators WHERE email = 'rui@empresa.com' LIMIT 1;
    SELECT id INTO ent_rh FROM entidades WHERE codigo = 'RH' LIMIT 1;

    IF u_rui IS NOT NULL AND ent_rh IS NOT NULL THEN
        INSERT INTO tickets (title, description, status, priority, "collaboratorId", "entidadeId", "requestDate", category)
        SELECT 'Impressora não funciona', 'Não consigo imprimir o relatório mensal.', 'Pedido', 'Baixa', u_rui, ent_rh, NOW(), 'Falha Técnica'
        WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE title = 'Impressora não funciona' AND "collaboratorId" = u_rui);
        
        INSERT INTO tickets (title, description, status, priority, "collaboratorId", "entidadeId", "requestDate", category, "securityIncidentType", "impactCriticality")
        SELECT 'Email Suspeito', 'Recebi um email estranho a pedir password.', 'Em progresso', 'Alta', u_rui, ent_rh, NOW() - INTERVAL '1 day', 'Incidente de Segurança', 'Phishing', 'Alta'
        WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE title = 'Email Suspeito' AND "collaboratorId" = u_rui);
    END IF;
END $$;

-- 9. Compliance (BIA, Vulns, Backups, Policies)
DO $$
DECLARE
    u_ana uuid;
    s_datacenter uuid;
    eq_srv uuid;
BEGIN
    SELECT id INTO u_ana FROM collaborators WHERE email = 'ana@empresa.com' LIMIT 1;
    SELECT id INTO s_datacenter FROM suppliers WHERE name = 'Datacenter Services' LIMIT 1;
    SELECT id INTO eq_srv FROM equipment WHERE "serialNumber" = 'SRV001' LIMIT 1;

    IF u_ana IS NOT NULL THEN
        -- BIA Service
        INSERT INTO business_services (name, description, criticality, rto_goal, owner_id, status, external_provider_id)
        SELECT 'Sistema ERP', 'Gestão financeira e RH', 'Crítica', '4h', u_ana, 'Ativo', s_datacenter
        WHERE NOT EXISTS (SELECT 1 FROM business_services WHERE name = 'Sistema ERP');

        -- Vulnerability
        INSERT INTO vulnerabilities (cve_id, description, severity, status, affected_software, published_date)
        SELECT 'CVE-2024-1234', 'Remote Code Execution in Server OS', 'Crítica', 'Aberto', 'Windows Server 2019', '2024-01-01'
        WHERE NOT EXISTS (SELECT 1 FROM vulnerabilities WHERE cve_id = 'CVE-2024-1234');

        -- Policy
        INSERT INTO policies (title, content, version, is_active, is_mandatory)
        SELECT 'Política de Passwords', 'As passwords devem ter 12 caracteres...', '1.0', true, true
        WHERE NOT EXISTS (SELECT 1 FROM policies WHERE title = 'Política de Passwords');

        -- Training Record
        INSERT INTO security_training_records (collaborator_id, training_type, completion_date, status, score, duration_hours)
        SELECT u_ana, 'RGPD / Privacidade', '2024-01-10', 'Concluído', 95, 2
        WHERE NOT EXISTS (SELECT 1 FROM security_training_records WHERE collaborator_id = u_ana AND training_type = 'RGPD / Privacidade');
    END IF;

    IF eq_srv IS NOT NULL AND u_ana IS NOT NULL THEN
         -- Backup
        INSERT INTO backup_executions (system_name, equipment_id, backup_date, test_date, status, type, tester_id)
        SELECT 'Backup Diário ERP', eq_srv, '2024-02-01', '2024-02-02', 'Sucesso', 'Completo', u_ana
        WHERE NOT EXISTS (SELECT 1 FROM backup_executions WHERE equipment_id = eq_srv AND backup_date = '2024-02-01');
    END IF;
END $$;

-- 10. Aquisições (Procurement)
DO $$
DECLARE
    u_ana uuid;
    s_dell uuid;
BEGIN
    SELECT id INTO u_ana FROM collaborators WHERE email = 'ana@empresa.com' LIMIT 1;
    SELECT id INTO s_dell FROM suppliers WHERE name = 'Fornecedor TI Lda' LIMIT 1;

    IF u_ana IS NOT NULL AND s_dell IS NOT NULL THEN
        INSERT INTO procurement_requests (title, description, quantity, estimated_cost, requester_id, supplier_id, status, priority)
        SELECT '5x Monitores 24"', 'Para novos estagiários', 5, 750.00, u_ana, s_dell, 'Pendente', 'Normal'
        WHERE NOT EXISTS (SELECT 1 FROM procurement_requests WHERE title = '5x Monitores 24"' AND requester_id = u_ana);
    END IF;
END $$;

COMMIT;
`;

    const handleCopy = (script: string) => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleGenerateTest = async () => {
        if (!testRequest.trim() || !aiConfigured || !testEmail.trim() || !testPassword.trim()) return;
        setIsGeneratingTest(true);
        setGeneratedTest('');
        try {
            const result = await generatePlaywrightTest(testRequest, { email: testEmail, pass: testPassword });
            setGeneratedTest(result);
        } catch (e) {
            console.error(e);
            setGeneratedTest("// Erro ao gerar o código de teste.");
        } finally {
            setIsGeneratingTest(false);
        }
    };

    return (
        <Modal title="SQL de Configuração e Manutenção" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('update')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'update' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaDatabase className="inline mr-2"/> Atualização (Schema)</button>
                    <button onClick={() => setActiveTab('seed')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'seed' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSeedling className="inline mr-2"/> Dados de Teste (Seed)</button>
                    <button onClick={() => setActiveTab('playwright_ai')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'playwright_ai' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot className="inline mr-2"/> Playwright AI</button>
                    <button onClick={() => setActiveTab('cleanup')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'cleanup' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBroom className="inline mr-2"/> Limpar Lixo</button>
                    <button onClick={() => setActiveTab('reset')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reset' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-white'}`}><FaTrash className="inline mr-2"/> Reset Total</button>
                </div>

                {activeTab === 'update' && (
                    <div className="animate-fade-in">
                        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200 mb-4">
                            <p>Cria tabelas em falta e configura o Storage.</p>
                        </div>
                        <div className="relative">
                            <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs font-mono h-96 overflow-y-auto border border-gray-700 whitespace-pre-wrap">{updateScript}</pre>
                            <button onClick={() => handleCopy(updateScript)} className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow-lg transition-colors flex items-center gap-2">{copied ? <FaCheck className="text-green-400" /> : <FaCopy />}</button>
                        </div>
                    </div>
                )}

                {activeTab === 'seed' && (
                    <div className="animate-fade-in">
                         <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-4">
                            <p className="font-bold mb-2"><FaSeedling className="inline mr-2"/> POPULAR BASE DE DADOS (Completo)</p>
                            <p>Insere dados de exemplo em todos os módulos: Ativos, Tickets, Compliance, Fornecedores, Equipas, etc.</p>
                        </div>
                        <div className="relative">
                            <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-xs font-mono h-96 overflow-y-auto border border-green-900/50 whitespace-pre-wrap">{seedScript}</pre>
                            <button onClick={() => handleCopy(seedScript)} className="absolute top-4 right-4 p-2 bg-green-800 hover:bg-green-700 text-white rounded-md shadow-lg transition-colors flex items-center gap-2">{copied ? <FaCheck className="text-white" /> : <FaCopy />}</button>
                        </div>
                    </div>
                )}
                
                {activeTab === 'playwright_ai' && (
                    <div className="animate-fade-in flex flex-col h-[500px]">
                        <div className="bg-purple-900/20 border border-purple-500/50 p-3 rounded-lg text-sm text-purple-200 mb-4">
                            <p className="font-bold mb-1 flex items-center gap-2"><FaRobot/> Gerador de Testes E2E com IA</p>
                            <p className="text-xs">Descreva um cenário de teste em linguagem natural (ex: "fazer login, ir para o inventário e criar um novo equipamento") e a IA irá gerar o código Playwright correspondente.</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 mb-2">
                            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Email de teste" className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" />
                            <input type="password" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} placeholder="Password de teste" className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" />
                        </div>
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={testRequest} onChange={(e) => setTestRequest(e.target.value)} placeholder="Cenário de teste..." className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleGenerateTest()} />
                            <button onClick={handleGenerateTest} disabled={isGeneratingTest || !aiConfigured || !testRequest.trim() || !testEmail.trim() || !testPassword.trim()} className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-md font-bold disabled:opacity-50 flex items-center gap-2">
                                {isGeneratingTest ? <FaSpinner className="animate-spin"/> : <FaPlay/>} Gerar Teste
                            </button>
                        </div>
                        <div className="relative flex-grow">
                             <textarea value={generatedTest} readOnly className="w-full h-full bg-black text-green-400 p-4 rounded-lg text-xs font-mono border border-gray-700 resize-none" placeholder="Código Playwright gerado..."/>
                            {generatedTest && <button onClick={() => handleCopy(generatedTest)} className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow-lg"><FaCopy /></button>}
                        </div>
                    </div>
                )}

                {activeTab === 'cleanup' && (
                    <div className="animate-fade-in">
                        <div className="relative">
                            <pre className="bg-gray-900 text-orange-300 p-4 rounded-lg text-xs font-mono h-64 overflow-y-auto border border-orange-900/50 whitespace-pre-wrap">{cleanupScript}</pre>
                            <button onClick={() => handleCopy(cleanupScript)} className="absolute top-4 right-4 p-2 bg-orange-800 hover:bg-orange-700 text-white rounded-md shadow-lg">{copied ? <FaCheck /> : <FaCopy />}</button>
                        </div>
                    </div>
                )}

                {activeTab === 'reset' && (
                    <div className="animate-fade-in">
                        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4">
                            <p className="font-bold mb-2"><FaTrash className="inline mr-2"/> ATENÇÃO: AÇÃO DESTRUTIVA</p>
                            <p>Apaga TODOS os dados operacionais, mantendo apenas o SuperAdmin.</p>
                        </div>
                        <div className="relative">
                            <pre className="bg-gray-900 text-red-300 p-4 rounded-lg text-xs font-mono h-96 overflow-y-auto border border-red-900/50 whitespace-pre-wrap">{resetScript}</pre>
                            <button onClick={() => handleCopy(resetScript)} className="absolute top-4 right-4 p-2 bg-red-800 hover:bg-red-700 text-white rounded-md shadow-lg">{copied ? <FaCheck /> : <FaCopy />}</button>
                        </div>
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;