import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);

    const sqlScript = `
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE PARA CONFIGURAR TODAS AS TABELAS E PERMISSÕES

-- 1. Habilitar extensão para UUIDs (geralmente já vem ativa)
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
-- TABELAS PRINCIPAIS
-- ==========================================

-- Instituições
CREATE TABLE IF NOT EXISTS instituicoes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    codigo text,
    email text,
    telefone text,
    created_at timestamptz DEFAULT now()
);

-- Entidades (Departamentos/Escolas)
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

-- Colaboradores
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
    "allowedModules" text[], -- Array de strings
    created_at timestamptz DEFAULT now()
);

-- Marcas
CREATE TABLE IF NOT EXISTS brands (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE
);

-- Equipas (Teams)
CREATE TABLE IF NOT EXISTS teams (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Tipos de Equipamento
CREATE TABLE IF NOT EXISTS equipment_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    "requiresNomeNaRede" boolean DEFAULT false,
    "requiresMacWIFI" boolean DEFAULT false,
    "requiresMacCabo" boolean DEFAULT false,
    "requiresInventoryNumber" boolean DEFAULT false,
    default_team_id uuid REFERENCES teams(id)
);

-- Equipamentos
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

-- Atribuições (Assignments)
CREATE TABLE IF NOT EXISTS assignments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "equipmentId" uuid REFERENCES equipment(id),
    "entidadeId" uuid REFERENCES entidades(id),
    "collaboratorId" uuid REFERENCES collaborators(id),
    "assignedDate" text NOT NULL,
    "returnDate" text,
    created_at timestamptz DEFAULT now()
);

-- Categorias de Tickets
CREATE TABLE IF NOT EXISTS ticket_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean DEFAULT true,
    default_team_id uuid REFERENCES teams(id),
    created_at timestamptz DEFAULT now()
);

-- Tickets
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

-- Atividades dos Tickets
CREATE TABLE IF NOT EXISTS ticket_activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "ticketId" uuid REFERENCES tickets(id) ON DELETE CASCADE,
    "technicianId" uuid REFERENCES collaborators(id),
    date timestamptz DEFAULT now(),
    description text NOT NULL,
    "equipmentId" uuid REFERENCES equipment(id)
);

-- Licenças de Software
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

-- Atribuição de Licenças
CREATE TABLE IF NOT EXISTS license_assignments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "softwareLicenseId" uuid REFERENCES software_licenses(id) ON DELETE CASCADE,
    "equipmentId" uuid REFERENCES equipment(id) ON DELETE CASCADE,
    "assignedDate" timestamptz DEFAULT now(),
    "returnDate" timestamptz
);

-- Membros de Equipa
CREATE TABLE IF NOT EXISTS team_members (
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    collaborator_id uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (team_id, collaborator_id)
);

-- Mensagens (Chat)
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "senderId" uuid REFERENCES collaborators(id),
    "receiverId" uuid REFERENCES collaborators(id),
    content text NOT NULL,
    timestamp timestamptz DEFAULT now(),
    read boolean DEFAULT false
);

-- Histórico de Colaboradores
CREATE TABLE IF NOT EXISTS collaborator_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "collaboratorId" uuid REFERENCES collaborators(id) ON DELETE CASCADE,
    "entidadeId" uuid REFERENCES entidades(id),
    "startDate" text,
    "endDate" text,
    created_at timestamptz DEFAULT now()
);

-- Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid, -- Pode ser NULL se for sistema
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    details text,
    timestamp timestamptz DEFAULT now()
);

-- Snoozes de Notificações
CREATE TABLE IF NOT EXISTS user_notification_snoozes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    reference_id text NOT NULL,
    notification_type text NOT NULL,
    snooze_until timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS) - ACESSO TOTAL
-- ==========================================
-- Este bloco habilita RLS mas cria uma política 'Allow all' para permitir
-- leitura e escrita a utilizadores autenticados e anonimos (configuração simples).

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
        
        -- Remover politicas antigas para evitar duplicados
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Permitir escrita a Admins e Normais" ON %I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Permitir leitura a utilizadores autenticados" ON %I;', t);
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Criar nova politica permissiva
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
        <Modal title="SQL de Configuração da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    <div className="flex items-center gap-2 font-bold mb-2 text-blue-100">
                        <FaDatabase />
                        <span>Instruções</span>
                    </div>
                    <p>
                        Copie o código SQL abaixo e execute-o no <strong>Editor SQL</strong> do seu projeto Supabase. 
                        Isto irá criar todas as tabelas necessárias e aplicar as permissões (RLS) para garantir que a aplicação funciona corretamente.
                    </p>
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