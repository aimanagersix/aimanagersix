import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);

    const sqlScript = `
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE PARA ATUALIZAR A BASE DE DADOS

-- ==========================================
-- 1. EXTENSÕES E FUNÇÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CRIAÇÃO DE TABELAS DE CONFIGURAÇÃO E CONTACTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS config_equipment_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_user_roles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_criticality_levels (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_cia_ratings (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_service_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_backup_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_training_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_resilience_test_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS contact_roles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS contact_titles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);

-- Tabela para contactos adicionais (Instituições, Entidades, Fornecedores)
CREATE TABLE IF NOT EXISTS resource_contacts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_type text NOT NULL, -- 'supplier', 'entidade', 'instituicao'
    resource_id uuid NOT NULL,
    title text,
    name text NOT NULL,
    role text,
    email text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Tabela para configurações globais (Automação)
CREATE TABLE IF NOT EXISTS global_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key text NOT NULL UNIQUE,
    setting_value text,
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. INSERIR VALORES PADRÃO
-- ==========================================

INSERT INTO config_equipment_statuses (name) VALUES ('Stock'), ('Operacional'), ('Abate'), ('Garantia') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_user_roles (name) VALUES ('Admin'), ('Normal'), ('Básico'), ('Utilizador') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_criticality_levels (name) VALUES ('Baixa'), ('Média'), ('Alta'), ('Crítica') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_cia_ratings (name) VALUES ('Baixo'), ('Médio'), ('Alto') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_service_statuses (name) VALUES ('Ativo'), ('Inativo'), ('Em Manutenção') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_backup_types (name) VALUES ('Completo'), ('Incremental'), ('Diferencial'), ('Snapshot VM') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_training_types (name) VALUES ('Simulação Phishing'), ('Leitura Política Segurança'), ('Higiene Cibernética (Geral)'), ('RGPD / Privacidade'), ('Ferramenta Específica') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_resilience_test_types (name) VALUES ('Scan Vulnerabilidades'), ('Penetration Test (Pentest)'), ('TLPT (Red Teaming)'), ('Exercício de Mesa (DRP)'), ('Recuperação de Desastres (Full)') ON CONFLICT (name) DO NOTHING;
INSERT INTO contact_roles (name) VALUES ('Técnico'), ('Comercial'), ('Financeiro'), ('Diretor'), ('Administrativo'), ('DPO/CISO') ON CONFLICT (name) DO NOTHING;
INSERT INTO contact_titles (name) VALUES ('Sr.'), ('Sra.'), ('Dr.'), ('Dra.'), ('Eng.'), ('Eng.ª'), ('Arq.') ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 4. PERMISSÕES (RLS)
-- ==========================================

DO $$ 
DECLARE 
    t text;
BEGIN 
    -- Loop para tabelas config_*
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_name LIKE 'config_%' 
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t);
        EXCEPTION WHEN OTHERS THEN NULL; END;
        EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true);', t); 
    END LOOP;
    
    -- Loop manual para contact_* e resource_contacts
    FOREACH t IN ARRAY ARRAY['contact_roles', 'contact_titles', 'resource_contacts', 'global_settings']
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t);
        EXCEPTION WHEN OTHERS THEN NULL; END;
        EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true);', t); 
    END LOOP;
END $$;

-- ==========================================
-- 5. SCRIPT DE CORREÇÃO DE COLUNAS (Legado)
-- ==========================================

DO $$ 
DECLARE
    t text;
BEGIN 
    -- Vulnerabilities (Auto Ticket Link)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vulnerabilities') THEN
        ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS ticket_id uuid;
        ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS affected_assets text;
    END IF;

    -- Resource Contacts (Active Status)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_contacts') THEN
        ALTER TABLE resource_contacts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    END IF;

    -- Tickets
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requester_supplier_id uuid;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "securityIncidentType" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactCriticality" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactConfidentiality" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactIntegrity" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactAvailability" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_summary text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS regulatory_status text DEFAULT 'NotRequired';
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS regulatory_24h_deadline timestamptz;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS regulatory_72h_deadline timestamptz;
    END IF;

    -- Resilience Tests
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resilience_tests') THEN
        ALTER TABLE resilience_tests ADD COLUMN IF NOT EXISTS auditor_supplier_id uuid;
        ALTER TABLE resilience_tests ADD COLUMN IF NOT EXISTS auditor_internal_entidade_id uuid;
    END IF;

    -- Equipment Types
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_types') THEN
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS "requiresBackupTest" boolean DEFAULT false;
    END IF;

    -- Backup Executions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_executions') THEN
        ALTER TABLE backup_executions ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
        ALTER TABLE backup_executions ADD COLUMN IF NOT EXISTS equipment_id uuid;
    END IF;
    
    -- Ticket Categories
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ticket_categories') THEN
        ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS sla_warning_hours integer DEFAULT 0;
        ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS sla_critical_hours integer DEFAULT 0;
    END IF;

    -- Equipment
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Baixa';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS confidentiality text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS integrity text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS availability text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS os_version text;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_security_update text;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS supplier_id uuid;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "acquisitionCost" numeric DEFAULT 0;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "expectedLifespanYears" integer DEFAULT 4;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS embedded_license_key text;
    END IF;

    -- Software Licenses
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_licenses') THEN
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Baixa';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS confidentiality text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS integrity text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS availability text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS supplier_id uuid;
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS "unitCost" numeric DEFAULT 0;
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS is_oem boolean DEFAULT false;
    END IF;

    -- Business Services
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_services') THEN
        ALTER TABLE business_services ADD COLUMN IF NOT EXISTS external_provider_id uuid;
    END IF;

    -- Brands
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'brands') THEN
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'Baixa';
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_iso27001_certified boolean DEFAULT false;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS security_contact_email text;
    END IF;

    -- Suppliers
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS iso_certificate_expiry text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS other_certifications jsonb DEFAULT '[]';
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contracts jsonb DEFAULT '[]';
    END IF;
    
    -- Address Columns
    FOREACH t IN ARRAY ARRAY['instituicoes', 'entidades', 'collaborators']
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = t) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS address text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS address_line text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS postal_code text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS city text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS locality text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS nif text;', t);
        END IF;
    END LOOP;
    
    -- Resource Contacts & Collaborators (Title)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_contacts') THEN
        ALTER TABLE resource_contacts ADD COLUMN IF NOT EXISTS title text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collaborators') THEN
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS title text;
    END IF;
END $$;
`;

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal title="SQL de Correção da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200 flex-grow mr-4">
                        <div className="flex items-center gap-2 font-bold mb-2 text-blue-100">
                            <FaDatabase />
                            <span>Instruções de Atualização</span>
                        </div>
                        <p className="mb-2">
                            Este script cria todas as tabelas necessárias, incluindo a nova tabela de configurações globais (automação) e colunas de ligação de vulnerabilidades a tickets.
                        </p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Clique em <strong>Copiar SQL</strong>.</li>
                            <li>Vá ao seu projeto no <strong>Supabase</strong>.</li>
                            <li>Abra o <strong>SQL Editor</strong> no menu lateral.</li>
                            <li>Cole o código e clique em <strong>RUN</strong>.</li>
                        </ol>
                    </div>
                    <div className="flex flex-col items-center justify-center border border-gray-600 rounded-lg p-4 bg-gray-800">
                        <span className="text-xs text-gray-400 uppercase mb-1">App Version</span>
                        <span className="text-2xl font-bold text-brand-secondary">v1.6</span>
                    </div>
                </div>

                <div className="relative">
                    <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs font-mono h-96 overflow-y-auto border border-gray-700 whitespace-pre-wrap">
                        {sqlScript}
                    </pre>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow-lg transition-colors flex items-center gap-2"
                    >
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                        {copied ? "Copiado!" : "Copiar SQL"}
                    </button>
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;