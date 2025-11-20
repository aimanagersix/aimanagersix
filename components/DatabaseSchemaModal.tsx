


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
-- CRIAÇÃO DE TABELAS (Se não existirem)
-- ==========================================

CREATE TABLE IF NOT EXISTS instituicoes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    codigo text,
    email text,
    telefone text,
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
    status text DEFAULT 'Ativo',
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
    "photoUrl" text,
    "dateOfBirth" text,
    "canLogin" boolean DEFAULT false,
    "receivesNotifications" boolean DEFAULT true,
    role text DEFAULT 'Utilizador',
    status text DEFAULT 'Ativo',
    "allowedModules" text[], 
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE
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
    created_at timestamptz DEFAULT now()
);

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
-- Esta secção remove a tabela antiga para corrigir erros de Foreign Key e a recria.
DROP TABLE IF EXISTS team_members;

CREATE TABLE team_members (
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    collaborator_id uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (team_id, collaborator_id)
);

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
                        O script abaixo foi atualizado para incluir as novas tabelas de <strong>Serviços de Negócio (BIA)</strong> e <strong>Vulnerabilidades (Segurança)</strong>.
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