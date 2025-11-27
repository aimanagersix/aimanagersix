
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'update' | 'reset' | 'cleanup'>('update');

    const updateScript = `
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE PARA ATUALIZAR A BASE DE DADOS

-- ==========================================
-- 1. EXTENSÕES E FUNÇÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CRIAÇÃO DE TABELAS DE CONFIGURAÇÃO E CONTACTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS config_equipment_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_criticality_levels (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_cia_ratings (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_service_statuses (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_backup_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_training_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_resilience_test_types (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS config_software_categories (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS contact_roles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS contact_titles (id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, name text NOT NULL UNIQUE);

-- NOVA TABELA DE PERFIS PERSONALIZADOS (RBAC)
CREATE TABLE IF NOT EXISTS config_custom_roles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_system boolean DEFAULT false, -- Se true, não pode ser apagado (ex: Admin)
    created_at timestamptz DEFAULT now()
);

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

-- Tabela para logs de integração (SIEM/RMM)
CREATE TABLE IF NOT EXISTS integration_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    source text,
    payload jsonb,
    status text, -- 'processed', 'failed'
    error text,
    created_at timestamptz DEFAULT now()
);

-- Tabela para Registos de Formação (NIS2)
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

-- ==========================================
-- 3. INSERIR VALORES PADRÃO
-- ==========================================

INSERT INTO config_equipment_statuses (name) VALUES ('Stock'), ('Operacional'), ('Abate'), ('Garantia'), ('Empréstimo') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_criticality_levels (name) VALUES ('Baixa'), ('Média'), ('Alta'), ('Crítica') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_cia_ratings (name) VALUES ('Baixo'), ('Médio'), ('Alto') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_service_statuses (name) VALUES ('Ativo'), ('Inativo'), ('Em Manutenção') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_backup_types (name) VALUES ('Completo'), ('Incremental'), ('Diferencial'), ('Snapshot VM') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_training_types (name) VALUES ('Simulação Phishing'), ('Leitura Política Segurança'), ('Higiene Cibernética (Geral)'), ('RGPD / Privacidade'), ('Ferramenta Específica') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_resilience_test_types (name) VALUES ('Scan Vulnerabilidades'), ('Penetration Test (Pentest)'), ('TLPT (Red Teaming)'), ('Exercício de Mesa (DRP)'), ('Recuperação de Desastres (Full)') ON CONFLICT (name) DO NOTHING;
INSERT INTO contact_roles (name) VALUES ('Técnico'), ('Comercial'), ('Financeiro'), ('Diretor'), ('Administrativo'), ('DPO/CISO') ON CONFLICT (name) DO NOTHING;
INSERT INTO contact_titles (name) VALUES ('Sr.'), ('Sra.'), ('Dr.'), ('Dra.'), ('Eng.'), ('Eng.ª'), ('Arq.') ON CONFLICT (name) DO NOTHING;

INSERT INTO config_software_categories (name) VALUES ('Sistema Operativo'), ('Segurança / Endpoint'), ('Produtividade'), ('Design & Multimédia'), ('Desenvolvimento') ON CONFLICT (name) DO NOTHING;

-- MIGRAÇÃO DE PERFIS ANTIGOS PARA A NOVA TABELA
-- Admin (Acesso Total)
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Admin', true, '{"inventory":{"view":true,"create":true,"edit":true,"delete":true},"tickets":{"view":true,"create":true,"edit":true,"delete":true},"organization":{"view":true,"create":true,"edit":true,"delete":true},"compliance":{"view":true,"create":true,"edit":true,"delete":true},"settings":{"view":true,"create":true,"edit":true,"delete":true}}')
ON CONFLICT (name) DO NOTHING;

-- Técnico (Pode gerir tickets e inventário, mas não configurações ou apagar organização)
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Técnico', false, '{"inventory":{"view":true,"create":true,"edit":true,"delete":false},"tickets":{"view":true,"create":true,"edit":true,"delete":false},"organization":{"view":true,"create":false,"edit":false,"delete":false},"compliance":{"view":true,"create":true,"edit":true,"delete":false},"settings":{"view":false,"create":false,"edit":false,"delete":false}}')
ON CONFLICT (name) DO NOTHING;

-- Utilizador (Apenas ver e abrir tickets)
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Utilizador', false, '{"inventory":{"view":true,"create":false,"edit":false,"delete":false},"tickets":{"view":true,"create":true,"edit":false,"delete":false},"organization":{"view":false,"create":false,"edit":false,"delete":false},"settings":{"view":false,"create":false,"edit":false,"delete":false}}')
ON CONFLICT (name) DO NOTHING;

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
    FOREACH t IN ARRAY ARRAY['contact_roles', 'contact_titles', 'resource_contacts', 'global_settings', 'integration_logs', 'security_training_records']
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t);
        EXCEPTION WHEN OTHERS THEN NULL; END;
        EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true);', t); 
    END LOOP;
END $$;

-- ==========================================
-- 5. SCRIPT DE CORREÇÃO DE COLUNAS (Atualizações)
-- ==========================================

DO $$ 
DECLARE
    t text;
BEGIN 
    -- Config Status (Color)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'config_equipment_statuses') THEN
        ALTER TABLE config_equipment_statuses ADD COLUMN IF NOT EXISTS color text;
    END IF;
    
    -- Collaborators (Allow NULL EntidadeId for Super Admin & New Instituicao Link)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collaborators') THEN
         ALTER TABLE collaborators ALTER COLUMN "entidadeId" DROP NOT NULL;
         ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS "instituicaoId" uuid REFERENCES instituicoes(id);
         ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS "preferences" jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Software Licenses (Category)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_licenses') THEN
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS category_id uuid;
    END IF;
    
    -- Resource Contacts (Active Status)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_contacts') THEN
        ALTER TABLE resource_contacts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    END IF;

    -- Resilience Tests
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resilience_tests') THEN
        ALTER TABLE resilience_tests ADD COLUMN IF NOT EXISTS auditor_supplier_id uuid;
        ALTER TABLE resilience_tests ADD COLUMN IF NOT EXISTS auditor_internal_entidade_id uuid;
    END IF;

    -- Equipment Types (Localização e Backups)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_types') THEN
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS "requiresBackupTest" boolean DEFAULT false;
        ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS "requiresLocation" boolean DEFAULT false;
    END IF;
    
    -- Assignments (Instituicao Link)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments') THEN
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS "instituicaoId" uuid REFERENCES instituicoes(id);
        ALTER TABLE assignments ALTER COLUMN "entidadeId" DROP NOT NULL;
    END IF;
    
    -- Equipment (Loan & Requisition)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "isLoan" boolean DEFAULT false;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "requisitionNumber" text;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "installationLocation" text;
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
    
    -- Security Training Records
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_training_records') THEN
        ALTER TABLE security_training_records ADD COLUMN IF NOT EXISTS duration_hours numeric;
    END IF;

    -- Address Columns
    FOREACH t IN ARRAY ARRAY['instituicoes', 'entidades', 'collaborators', 'suppliers']
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = t) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS address text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS address_line text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS postal_code text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS city text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS locality text;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS nif text;', t);
            
            IF t = 'instituicoes' OR t = 'entidades' THEN
                 EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS website text;', t);
            END IF;
        END IF;
    END LOOP;
    
    -- Collaborators Title
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collaborators') THEN
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS title text;
    END IF;
END $$;
`;

    const cleanupScript = `
-- SCRIPT DE LIMPEZA DE TABELAS OBSOLETAS (LEGACY)
-- Remove tabelas antigas (singular) e mantém as atuais (plural)
-- O 'CASCADE' remove automaticamente as chaves estrangeiras associadas.

BEGIN;

-- Tabelas Principais (Versões Singular Antigas)
DROP TABLE IF EXISTS collaborator CASCADE;
DROP TABLE IF EXISTS entidade CASCADE;
DROP TABLE IF EXISTS instituicao CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS team CASCADE;

-- Tabelas de Associação Antigas
DROP TABLE IF EXISTS supplier_contacts CASCADE; -- Substituído por resource_contacts
DROP TABLE IF EXISTS license_assignment CASCADE; -- Substituído por license_assignments (plural)

-- Tabelas de Sistema (Opcional, se usadas por ORMs antigos)
-- DROP TABLE IF EXISTS _prisma_migrations CASCADE;

COMMIT;
`;

    const resetScript = `
-- SCRIPT DE LIMPEZA PROFUNDA (RESET)
-- ATENÇÃO: ISTO APAGA TODOS OS DADOS OPERACIONAIS!
-- EXECUTE APENAS SE TIVER A CERTEZA ABSOLUTA.

BEGIN;

-- 1. Proteger o Super Admin (josefsmoreira@outlook.com)
UPDATE collaborators 
SET role = 'SuperAdmin', "entidadeId" = NULL, status = 'Ativo'
WHERE email = 'josefsmoreira@outlook.com';

-- 2. Apagar Dados Operacionais e Dependências (Ordem Crítica)
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

-- 3. Apagar Ativos
DELETE FROM equipment;

-- 4. Desvincular Configurações de Equipas (Para permitir apagar as equipas)
UPDATE equipment_types SET default_team_id = NULL;
UPDATE ticket_categories SET default_team_id = NULL;

-- 5. Apagar Estrutura Organizacional (Exceto o Super Admin)
DELETE FROM collaborators WHERE email != 'josefsmoreira@outlook.com';
DELETE FROM teams;
DELETE FROM entidades;
DELETE FROM instituicoes;
DELETE FROM suppliers;

-- Nota: Mantém-se Marcas, Tipos, Categorias e Configurações Gerais.
-- Não apaga config_custom_roles para não quebrar a app.

COMMIT;
`;

    const handleCopy = (script: string) => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal title="SQL de Configuração e Manutenção" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4">
                    <button
                        onClick={() => setActiveTab('update')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'update' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaDatabase className="inline mr-2"/> Atualização (Schema)
                    </button>
                    <button
                        onClick={() => setActiveTab('cleanup')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'cleanup' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaBroom className="inline mr-2"/> Limpar Lixo (Legacy)
                    </button>
                    <button
                        onClick={() => setActiveTab('reset')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'reset' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaTrash className="inline mr-2"/> Reset Total
                    </button>
                </div>

                {activeTab === 'update' && (
                    <div className="animate-fade-in">
                        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200 mb-4">
                            <p>Este script cria tabelas em falta (incluindo <strong>security_training_records</strong>), adiciona colunas necessárias e cria a estrutura para <strong>Perfis Dinâmicos (Custom Roles)</strong>.</p>
                        </div>
                        <div className="relative">
                            <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs font-mono h-96 overflow-y-auto border border-gray-700 whitespace-pre-wrap">
                                {updateScript}
                            </pre>
                            <button 
                                onClick={() => handleCopy(updateScript)}
                                className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow-lg transition-colors flex items-center gap-2"
                            >
                                {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                {copied ? "Copiado!" : "Copiar SQL"}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'cleanup' && (
                    <div className="animate-fade-in">
                        <div className="bg-orange-900/20 border border-orange-500/50 p-4 rounded-lg text-sm text-orange-200 mb-4">
                            <p className="font-bold mb-2"><FaBroom className="inline mr-2"/> LIMPEZA DE TABELAS OBSOLETAS</p>
                            <p>Este script remove tabelas antigas (no singular, ex: <code>collaborator</code>) e FKs órfãs que já não são usadas pela aplicação atual (que usa <code>collaborators</code> no plural).</p>
                        </div>
                        <div className="relative">
                            <pre className="bg-gray-900 text-orange-300 p-4 rounded-lg text-xs font-mono h-64 overflow-y-auto border border-orange-900/50 whitespace-pre-wrap">
                                {cleanupScript}
                            </pre>
                            <button 
                                onClick={() => handleCopy(cleanupScript)}
                                className="absolute top-4 right-4 p-2 bg-orange-800 hover:bg-orange-700 text-white rounded-md shadow-lg transition-colors flex items-center gap-2"
                            >
                                {copied ? <FaCheck className="text-white" /> : <FaCopy />}
                                {copied ? "Copiado!" : "Copiar Cleanup SQL"}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'reset' && (
                    <div className="animate-fade-in">
                        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200 mb-4">
                            <p className="font-bold mb-2"><FaTrash className="inline mr-2"/> ATENÇÃO: AÇÃO DESTRUTIVA</p>
                            <p>Este script apaga TODOS os dados operacionais e estrutura organizacional.</p>
                            <p className="mt-1">Apenas o utilizador <strong>josefsmoreira@outlook.com</strong> será preservado e promovido a <strong>SuperAdmin</strong>.</p>
                        </div>
                        <div className="relative">
                            <pre className="bg-gray-900 text-red-300 p-4 rounded-lg text-xs font-mono h-96 overflow-y-auto border border-red-900/50 whitespace-pre-wrap">
                                {resetScript}
                            </pre>
                            <button 
                                onClick={() => handleCopy(resetScript)}
                                className="absolute top-4 right-4 p-2 bg-red-800 hover:bg-red-700 text-white rounded-md shadow-lg transition-colors flex items-center gap-2"
                            >
                                {copied ? <FaCheck className="text-white" /> : <FaCopy />}
                                {copied ? "Copiado!" : "Copiar Reset SQL"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mt-4">
                     <div className="flex flex-col items-center justify-center border border-gray-600 rounded-lg p-2 bg-gray-800">
                        <span className="text-xs text-gray-400 uppercase">App Version</span>
                        <span className="text-lg font-bold text-brand-secondary">v1.33</span>
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
