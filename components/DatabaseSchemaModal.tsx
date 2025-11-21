
















import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);

    const sqlScript = `
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE PARA CORRIGIR A BASE DE DADOS

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

-- ==========================================
-- CORREÇÃO DE TABELAS EXISTENTES (CRÍTICO)
-- ==========================================
-- Se as tabelas já existem, adicionamos as colunas novas aqui

DO $$ 
BEGIN 
    -- Adicionar colunas de NIS2/Segurança à tabela TICKETS se não existirem
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactCriticality" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactConfidentiality" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactIntegrity" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "impactAvailability" text;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "securityIncidentType" text; 
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
    END IF;
    
    -- Adicionar colunas de SLA à tabela TICKET_CATEGORIES se não existirem
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ticket_categories') THEN
        ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS sla_warning_hours integer DEFAULT 0;
        ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS sla_critical_hours integer DEFAULT 0;
    END IF;

    -- Adicionar colunas de NIS2 à tabela EQUIPMENT se não existirem
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Baixa';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS confidentiality text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS integrity text DEFAULT 'Baixo';
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS availability text DEFAULT 'Baixo';
        -- NOVAS COLUNAS DE PATCHING E VERSÃO
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS os_version text;
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_security_update text;
        -- COLUNA DE FORNECEDOR
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS supplier_id uuid;
    END IF;

    -- Adicionar colunas de NIS2 à tabela SOFTWARE_LICENSES se não existirem
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_licenses') THEN
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Baixa';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS confidentiality text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS integrity text DEFAULT 'Baixo';
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS availability text DEFAULT 'Baixo';
        -- COLUNA DE FORNECEDOR
        ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS supplier_id uuid;
    END IF;

    -- Adicionar coluna de fornecedor externo a BUSINESS_SERVICES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_services') THEN
        ALTER TABLE business_services ADD COLUMN IF NOT EXISTS external_provider_id uuid;
    END IF;

    -- Adicionar colunas de Risco à tabela BRANDS (Fabricantes)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'brands') THEN
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'Baixa';
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_iso27001_certified boolean DEFAULT false;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS security_contact_email text;
    END IF;

    -- Adicionar coluna de validade de certificado, morada e anexos à tabela SUPPLIERS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS iso_certificate_expiry text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
    END IF;

    -- Adicionar colunas de morada e NIF à tabela INSTITUICOES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instituicoes') THEN
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE instituicoes ADD COLUMN IF NOT EXISTS nif text;
    END IF;

    -- Adicionar colunas de morada e NIF à tabela ENTIDADES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'entidades') THEN
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE entidades ADD COLUMN IF NOT EXISTS nif text;
    END IF;

    -- Adicionar colunas de morada e NIF à tabela COLLABORATORS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collaborators') THEN
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS address_line text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS locality text;
        ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS nif text;
    END IF;
END $$;


-- ==========================================
-- CRIAÇÃO DE TABELAS (Se não existirem)
-- ==========================================

CREATE TABLE IF NOT EXISTS instituicoes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    codigo text,
    email text,
    telefone text,
    nif text,
    address text,
    address_line text,
    postal_code text,
    city text,
    locality text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entidades (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "instituicaoId" uuid REFERENCES instituicoes(id),
    codigo text,
    name text NOT NULL,
    description text,
    email text,
    responsavel text,
    telefone text,
    telemovel text,
    "telefoneInterno" text,
    nif text,
    status text DEFAULT 'Ativo',
    address text,
    address_line text,
    postal_code text,
    city text,
    locality text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collaborators (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "numeroMecanografico" text,
    "fullName" text NOT NULL,
    "entidadeId" uuid REFERENCES entidades(id),
    email text,
    "telefoneInterno" text,
    telemovel text,
    nif text,
    "photoUrl" text,
    "dateOfBirth" text,
    "canLogin" boolean DEFAULT false,
    "receivesNotifications" boolean DEFAULT true,
    role text DEFAULT 'Utilizador',
    status text DEFAULT 'Ativo',
    "allowedModules" text[],
    address text,
    address_line text,
    postal_code text,
    city text,
    locality text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    risk_level text DEFAULT 'Baixa',
    is_iso27001_certified boolean DEFAULT false,
    security_contact_email text
);

-- NOVA TABELA: FORNECEDORES (SUPPLIERS)
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    contact_name text,
    contact_email text,
    contact_phone text,
    nif text,
    website text,
    notes text,
    address text,
    address_line text,
    postal_code text,
    city text,
    locality text,
    attachments jsonb DEFAULT '[]',
    is_iso27001_certified boolean DEFAULT false,
    iso_certificate_expiry text,
    security_contact_email text,
    risk_level text DEFAULT 'Baixa', -- Vendor Risk Rating
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    "requiresNomeNaRede" boolean DEFAULT false,
    "requiresMacWIFI" boolean DEFAULT false,
    "requiresMacCabo" boolean DEFAULT false,
    "requiresInventoryNumber" boolean DEFAULT false,
    default_team_id uuid REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS equipment (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "brandId" uuid REFERENCES brands(id),
    "typeId" uuid REFERENCES equipment_types(id),
    description text NOT NULL,
    "serialNumber" text NOT NULL,
    "inventoryNumber" text,
    "invoiceNumber" text,
    "nomeNaRede" text,
    "macAddressWIFI" text,
    "macAddressCabo" text,
    "purchaseDate" text,
    "warrantyEndDate" text,
    status text DEFAULT 'Stock',
    criticality text DEFAULT 'Baixa',
    confidentiality text DEFAULT 'Baixo',
    integrity text DEFAULT 'Baixo',
    availability text DEFAULT 'Baixo',
    os_version text,
    last_security_update text,
    supplier_id uuid REFERENCES suppliers(id),
    "creationDate" text DEFAULT to_char(now(), 'YYYY-MM-DD'),
    "modifiedDate" text DEFAULT to_char(now(), 'YYYY-MM-DD')
);

CREATE TABLE IF NOT EXISTS assignments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "equipmentId" uuid REFERENCES equipment(id),
    "entidadeId" uuid REFERENCES entidades(id),
    "collaboratorId" uuid REFERENCES collaborators(id),
    "assignedDate" text NOT NULL,
    "returnDate" text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean DEFAULT true,
    default_team_id uuid REFERENCES teams(id),
    sla_warning_hours integer DEFAULT 0,
    sla_critical_hours integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- NOVA TABELA: TIPOS DE INCIDENTE DE SEGURANÇA
CREATE TABLE IF NOT EXISTS security_incident_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- PREENCHER DADOS INICIAIS DE SEGURANÇA (SEED DATA)
INSERT INTO security_incident_types (name, description, is_active) VALUES
('Ransomware', 'Ataque que cifra dados e exige resgate.', true),
('Phishing / Engenharia Social', 'Tentativa de obter dados sensíveis via engano.', true),
('Fuga de Dados (Data Leak)', 'Exposição não autorizada de dados confidenciais.', true),
('Malware / Vírus', 'Software malicioso genérico.', true),
('Negação de Serviço (DDoS)', 'Interrupção de serviço por sobrecarga.', true),
('Acesso Não Autorizado / Compromisso de Conta', 'Acesso ilegítimo a contas ou sistemas.', true),
('Ameaça Interna', 'Ação maliciosa de colaborador ou parceiro.', true),
('Exploração de Vulnerabilidade', 'Uso de falha de software para ataque.', true),
('Outro', 'Outros tipos de incidente.', true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS tickets (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text,
    "entidadeId" uuid REFERENCES entidades(id),
    "collaboratorId" uuid REFERENCES collaborators(id),
    description text NOT NULL,
    "requestDate" timestamptz NOT NULL,
    "finishDate" timestamptz,
    status text DEFAULT 'Pedido',
    "technicianId" uuid REFERENCES collaborators(id),
    team_id uuid REFERENCES teams(id),
    "equipmentId" uuid REFERENCES equipment(id),
    category text,
    "securityIncidentType" text,
    "impactCriticality" text,
    "impactConfidentiality" text,
    "impactIntegrity" text,
    "impactAvailability" text,
    attachments jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "ticketId" uuid REFERENCES tickets(id) ON DELETE CASCADE,
    "technicianId" uuid REFERENCES collaborators(id),
    date timestamptz DEFAULT now(),
    description text NOT NULL,
    "equipmentId" uuid REFERENCES equipment(id)
);

CREATE TABLE IF NOT EXISTS software_licenses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "productName" text NOT NULL,
    "licenseKey" text NOT NULL,
    "totalSeats" integer DEFAULT 1,
    "purchaseDate" text,
    "expiryDate" text,
    "purchaseEmail" text,
    "invoiceNumber" text,
    status text DEFAULT 'Ativo',
    criticality text DEFAULT 'Baixa',
    confidentiality text DEFAULT 'Baixo',
    integrity text DEFAULT 'Baixo',
    availability text DEFAULT 'Baixo',
    supplier_id uuid REFERENCES suppliers(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS license_assignments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "softwareLicenseId" uuid REFERENCES software_licenses(id) ON DELETE CASCADE,
    "equipmentId" uuid REFERENCES equipment(id) ON DELETE CASCADE,
    "assignedDate" timestamptz DEFAULT now(),
    "returnDate" timestamptz
);

CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "senderId" uuid REFERENCES collaborators(id),
    "receiverId" uuid REFERENCES collaborators(id),
    content text NOT NULL,
    timestamp timestamptz DEFAULT now(),
    read boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS collaborator_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "collaboratorId" uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    "entidadeId" uuid REFERENCES entidades(id),
    "startDate" text,
    "endDate" text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    details text,
    timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_notification_snoozes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    reference_id text NOT NULL,
    notification_type text NOT NULL,
    snooze_until timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- TABELAS PARA GESTÃO DE SERVIÇOS (BIA - NIS2)

CREATE TABLE IF NOT EXISTS business_services (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    criticality text DEFAULT 'Média',
    rto_goal text,
    owner_id uuid REFERENCES collaborators(id),
    status text DEFAULT 'Ativo',
    external_provider_id uuid REFERENCES suppliers(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_dependencies (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id uuid REFERENCES business_services(id) ON DELETE CASCADE,
    equipment_id uuid REFERENCES equipment(id),
    software_license_id uuid REFERENCES software_licenses(id),
    dependency_type text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- TABELAS PARA GESTÃO DE VULNERABILIDADES (SEGURANÇA)

CREATE TABLE IF NOT EXISTS vulnerabilities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cve_id text NOT NULL,
    description text,
    severity text DEFAULT 'Média',
    status text DEFAULT 'Aberto',
    affected_software text,
    remediation text,
    published_date text,
    created_at timestamptz DEFAULT now()
);


-- ==========================================
-- CORREÇÃO DA TABELA TEAM_MEMBERS
-- ==========================================
DROP TABLE IF EXISTS team_members;

CREATE TABLE team_members (
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    collaborator_id uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (team_id, collaborator_id)
);

-- ==========================================
-- INDÍCES DE PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment("serialNumber");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_assignments_equipment ON assignments("equipmentId");
CREATE INDEX IF NOT EXISTS idx_assignments_collaborator ON assignments("collaboratorId");

-- Índices Novos para Segurança e BIA
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_status ON vulnerabilities(status);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_business_services_criticality ON business_services(criticality);

-- ==========================================
-- CORREÇÃO DE PERMISSÕES (RLS)
-- ==========================================
-- Habilita RLS e cria uma política 'Allow all' universal

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP 
        -- 1. Ativar RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        
        -- 2. Limpar políticas antigas (para evitar conflitos)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Permitir escrita a Admins e Normais" ON %I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Permitir leitura a utilizadores autenticados" ON %I;', t);
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- 3. Criar nova política permissiva
        EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true);', t); 
    END LOOP; 
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
                        <span>Instruções de Correção</span>
                    </div>
                    <p className="mb-2">
                        O script abaixo atualiza as tabelas para adicionar campos de <strong>Morada Estruturada</strong> e <strong>NIF</strong> a Instituições, Entidades e Colaboradores.
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