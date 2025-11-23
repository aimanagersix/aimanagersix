
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
-- CRIAÇÃO DE TABELAS DE CONFIGURAÇÃO (Listas Dinâmicas)
-- ==========================================

CREATE TABLE IF NOT EXISTS config_equipment_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_user_roles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_criticality_levels (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_cia_ratings (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_service_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_backup_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_training_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_resilience_test_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);

-- Inserir valores padrão (Segurança contra duplicados via ON CONFLICT)
INSERT INTO config_equipment_statuses (name) VALUES ('Stock'), ('Operacional'), ('Abate'), ('Garantia') ON CONFLICT DO NOTHING;
INSERT INTO config_user_roles (name) VALUES ('Admin'), ('Normal'), ('Básico'), ('Utilizador') ON CONFLICT DO NOTHING;
INSERT INTO config_criticality_levels (name) VALUES ('Baixa'), ('Média'), ('Alta'), ('Crítica') ON CONFLICT DO NOTHING;
INSERT INTO config_cia_ratings (name) VALUES ('Baixo'), ('Médio'), ('Alto') ON CONFLICT DO NOTHING;
INSERT INTO config_service_statuses (name) VALUES ('Ativo'), ('Inativo'), ('Em Manutenção') ON CONFLICT DO NOTHING;
INSERT INTO config_backup_types (name) VALUES ('Completo'), ('Incremental'), ('Diferencial'), ('Snapshot VM') ON CONFLICT DO NOTHING;
INSERT INTO config_training_types (name) VALUES ('Simulação Phishing'), ('Leitura Política Segurança'), ('Higiene Cibernética (Geral)'), ('RGPD / Privacidade'), ('Ferramenta Específica') ON CONFLICT DO NOTHING;
INSERT INTO config_resilience_test_types (name) VALUES ('Scan Vulnerabilidades'), ('Penetration Test (Pentest)'), ('TLPT (Red Teaming)'), ('Exercício de Mesa (DRP)'), ('Recuperação de Desastres (Full)') ON CONFLICT DO NOTHING;

-- Ativar RLS para as novas tabelas
DO $$ 
DECLARE 
    t text;
BEGIN 
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
END $$;

-- ==========================================
-- SCRIPT DE CORREÇÃO GERAL (Antigo)
-- ==========================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Funções Auxiliares
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."modifiedDate" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN 
    -- Tickets: Adicionar Fornecedor Requerente
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requester_supplier_id uuid;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "securityIncidentType" text; 
    END IF;

    -- Resilience Tests: Adicionar Links
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resilience_tests') THEN
        ALTER TABLE resilience_tests ADD COLUMN IF NOT EXISTS auditor_supplier_id uuid;
        ALTER TABLE resilience_tests ADD COLUMN IF NOT EXISTS auditor_internal_entidade_id uuid;
    END IF;

    -- 1. Adicionar flag 'requiresBackupTest' a EQUIPMENT_TYPES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_types') THEN
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS "requiresBackupTest" boolean DEFAULT false;
    END IF;

    -- 2. Adicionar colunas à tabela BACKUP_EXECUTIONS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_executions') THEN
        ALTER TABLE backup_executions ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
        ALTER TABLE backup_executions ADD COLUMN IF NOT EXISTS equipment_id uuid;
    END IF;

    -- 3. Adicionar colunas de NIS2/Segurança à tabela TICKETS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactCriticality" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactConfidentiality" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactIntegrity" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactAvailability" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
        -- New for KB RAG
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_summary text;
        -- New for NIS2 Regulatory Reporting
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS regulatory_status text DEFAULT 'NotRequired';
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS regulatory_24h_deadline timestamptz;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS regulatory_72h_deadline timestamptz;
    END IF;
    
    -- 4. Adicionar colunas de SLA à tabela TICKET_CATEGORIES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ticket_categories') THEN
        ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS sla_warning_hours integer DEFAULT 0;
        ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS sla_critical_hours integer DEFAULT 0;
    END IF;

    -- 5. Adicionar colunas de NIS2 e FinOps à tabela EQUIPMENT
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Baixa';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS confidentiality text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS integrity text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS availability text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS os_version text;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_security_update text;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS supplier_id uuid;
        -- FinOps
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "acquisitionCost" numeric DEFAULT 0;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "expectedLifespanYears" integer DEFAULT 4;
        -- OEM License Key (Specific machine)
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS embedded_license_key text;
        -- REMOVIDO 'has_embedded_license' da lógica anterior (migrado para is_oem em software_licenses)
    END IF;

    -- 6. Adicionar colunas de NIS2 e FinOps à tabela SOFTWARE_LICENSES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_licenses') THEN
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Baixa';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS confidentiality text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS integrity text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS availability text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS supplier_id uuid;
        -- FinOps
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS "unitCost" numeric DEFAULT 0;
        -- OEM Flag
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS is_oem boolean DEFAULT false;
    END IF;

    -- 7. Adicionar coluna de fornecedor externo a BUSINESS_SERVICES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_services') THEN
        ALTER TABLE business_services ADD COLUMN IF NOT EXISTS external_provider_id uuid;
    END IF;

    -- 8. Adicionar colunas de Risco à tabela BRANDS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'brands') THEN
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'Baixa';
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_iso27001_certified boolean DEFAULT false;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS security_contact_email text;
    END IF;

    -- 9. Adicionar colunas a SUPPLIERS (incluindo contratos DORA)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS iso_certificate_expiry text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS other_certifications jsonb DEFAULT '[]';
        -- DORA Article 28: Information Register
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contracts jsonb DEFAULT '[]';
    END IF;
    
    -- Adicionar campos de morada e NIF às entidades
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instituicoes') THEN
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS nif text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'entidades') THEN
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS nif text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collaborators') THEN
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS nif text;
        -- Novo: Trato
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS title text;
    END IF;
    
    -- Resource Contacts: Adicionar campo Title
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_contacts') THEN
        ALTER TABLE resource_contacts ADD COLUMN IF NOT EXISTS title text;
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
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    <div className="flex items-center gap-2 font-bold mb-2 text-blue-100">
                        <FaDatabase />
                        <span>Instruções de Atualização</span>
                    </div>
                    <p className="mb-2">
                        Este script cria as tabelas necessárias para tornar as listas de configuração (Estados, Perfis, Tipos) dinâmicas e editáveis.
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Clique em <strong>Copiar SQL</strong>.</li>
                        <li>Vá ao seu projeto no <strong>Supabase</strong>.</li>
                        <li>Abra o <strong>SQL Editor</strong> no menu lateral.</li>
                        <li>Cole o código e clique em <strong>RUN</strong>.</li>
                    </ol>
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
