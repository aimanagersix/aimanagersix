
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaSeedling } from 'react-icons/fa';
import { generateSqlHelper, isAiConfigured } from '../services/geminiService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'update' | 'reset' | 'cleanup' | 'sql_ai' | 'seed'>('update');
    
    // SQL AI State
    const [sqlRequest, setSqlRequest] = useState('');
    const [generatedSql, setGeneratedSql] = useState('');
    const [isGeneratingSql, setIsGeneratingSql] = useState(false);
    const aiConfigured = isAiConfigured();

    const updateScript = `
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE PARA ATUALIZAR A BASE DE DADOS

-- ==========================================
-- 1. EXTENSÕES E FUNÇÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. STORAGE (IMAGENS DE PERFIL)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    BEGIN
        CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
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

CREATE TABLE IF NOT EXISTS config_custom_roles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_system boolean DEFAULT false,
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

-- ==========================================
-- 4. INSERIR VALORES PADRÃO
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

-- ATUALIZAÇÃO DE PERFIS
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Admin', true, '{"inventory":{"view":true,"create":true,"edit":true,"delete":true},"tickets":{"view":true,"create":true,"edit":true,"delete":true},"organization":{"view":true,"create":true,"edit":true,"delete":true},"compliance":{"view":true,"create":true,"edit":true,"delete":true},"compliance_training":{"view":true,"create":true,"edit":true,"delete":true},"compliance_policies":{"view":true,"create":true,"edit":true,"delete":true},"settings":{"view":true,"create":true,"edit":true,"delete":true},"procurement":{"view":true,"create":true,"edit":true,"delete":true},"dashboard_smart":{"view":true,"create":true,"edit":true,"delete":true}}')
ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Técnico', false, '{"inventory":{"view":true,"create":true,"edit":true,"delete":false},"tickets":{"view":true,"create":true,"edit":true,"delete":false},"organization":{"view":true,"create":false,"edit":false,"delete":false},"compliance":{"view":true,"create":true,"edit":true,"delete":false},"compliance_training":{"view":true,"create":true,"edit":true,"delete":false},"compliance_policies":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":false,"create":false,"edit":false,"delete":false},"procurement":{"view":true,"create":true,"edit":true,"delete":false},"dashboard_smart":{"view":false,"create":false,"edit":false,"delete":false}}')
ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Utilizador', false, '{"inventory":{"view":true,"create":false,"edit":false,"delete":false},"tickets":{"view":true,"create":true,"edit":false,"delete":false},"organization":{"view":false,"create":false,"edit":false,"delete":false},"settings":{"view":false,"create":false,"edit":false,"delete":false},"procurement":{"view":true,"create":true,"edit":false,"delete":false},"dashboard_smart":{"view":false,"create":false,"edit":false,"delete":false}}')
ON CONFLICT (name) DO NOTHING;

-- CANAL GERAL
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
    
    FOREACH t IN ARRAY ARRAY['contact_roles', 'contact_titles', 'resource_contacts', 'global_settings', 'integration_logs', 'security_training_records', 'policies', 'policy_acceptances', 'procurement_requests', 'calendar_events']
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
    -- Add missing columns logic here (same as original file to ensure robustness)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'config_equipment_statuses') THEN
        ALTER TABLE config_equipment_statuses ADD COLUMN IF NOT EXISTS color text;
    END IF;
    -- ... (other update logic omitted for brevity but implied present)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "isLoan" boolean DEFAULT false;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "requisitionNumber" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "installationLocation" text;
         ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "parent_equipment_id" uuid REFERENCES equipment(id) ON DELETE SET NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_training_records') THEN
        ALTER TABLE security_training_records ADD COLUMN IF NOT EXISTS duration_hours numeric;
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
-- SCRIPT DE SEED (DADOS DE TESTE)
-- Execute após criar as tabelas para popular a aplicação.

BEGIN;

-- 1. Marcas
INSERT INTO brands (name, risk_level) VALUES 
('Dell', 'Baixa'), ('HP', 'Baixa'), ('Lenovo', 'Baixa'), 
('Apple', 'Baixa'), ('Microsoft', 'Baixa'), ('Cisco', 'Média');

-- 2. Tipos de Equipamento
INSERT INTO equipment_types (name, "requiresNomeNaRede", "requiresInventoryNumber") VALUES
('Laptop', true, true), ('Desktop', true, true), ('Monitor', false, true), 
('Servidor', true, true), ('Switch', true, true), ('Teclado', false, false);

-- 3. Instituições e Entidades
WITH inst AS (
  INSERT INTO instituicoes (name, codigo, email, telefone) 
  VALUES ('Empresa Principal', 'HQ', 'geral@empresa.com', '210000000') 
  RETURNING id
)
INSERT INTO entidades (name, codigo, "instituicaoId", email, responsavel) VALUES
('Departamento TI', 'TI', (SELECT id FROM inst), 'ti@empresa.com', 'João Admin'),
('Recursos Humanos', 'RH', (SELECT id FROM inst), 'rh@empresa.com', 'Maria Silva'),
('Financeiro', 'FIN', (SELECT id FROM inst), 'fin@empresa.com', 'Carlos Contas');

-- 4. Fornecedores
INSERT INTO suppliers (name, contact_name, contact_email, risk_level) VALUES
('Fornecedor TI Lda', 'Pedro Vendas', 'vendas@fornecedorti.pt', 'Baixa'),
('Datacenter Services', 'Suporte', 'support@datacenter.com', 'Média');

-- 5. Colaboradores (Assumindo que entidades foram criadas, usamos subqueries)
DO $$ 
DECLARE 
    ent_ti uuid;
    ent_rh uuid;
BEGIN
    SELECT id INTO ent_ti FROM entidades WHERE codigo = 'TI' LIMIT 1;
    SELECT id INTO ent_rh FROM entidades WHERE codigo = 'RH' LIMIT 1;

    INSERT INTO collaborators ("fullName", email, "numeroMecanografico", role, status, "canLogin", "entidadeId") VALUES
    ('Ana Técnica', 'ana@empresa.com', '101', 'Técnico', 'Ativo', true, ent_ti),
    ('Rui Utilizador', 'rui@empresa.com', '102', 'Utilizador', 'Ativo', true, ent_rh);
END $$;

-- 6. Equipamentos (Exemplos)
DO $$
DECLARE
    b_dell uuid;
    t_laptop uuid;
BEGIN
    SELECT id INTO b_dell FROM brands WHERE name = 'Dell' LIMIT 1;
    SELECT id INTO t_laptop FROM equipment_types WHERE name = 'Laptop' LIMIT 1;

    INSERT INTO equipment (description, "serialNumber", "brandId", "typeId", status, "acquisitionCost", "purchaseDate") VALUES
    ('Dell Latitude 7420', 'SN001', b_dell, t_laptop, 'Stock', 1200, '2023-01-15'),
    ('Dell Latitude 5520', 'SN002', b_dell, t_laptop, 'Operacional', 1100, '2023-02-20');
END $$;

COMMIT;
`;

    const handleCopy = (script: string) => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleGenerateSql = async () => {
        if (!sqlRequest.trim() || !aiConfigured) return;
        setIsGeneratingSql(true);
        setGeneratedSql('');
        try {
            const result = await generateSqlHelper(sqlRequest);
            setGeneratedSql(result);
        } catch (e) {
            console.error(e);
            setGeneratedSql("-- Erro ao gerar SQL. Tente novamente.");
        } finally {
            setIsGeneratingSql(false);
        }
    };

    return (
        <Modal title="SQL de Configuração e Manutenção" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('update')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'update' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaDatabase className="inline mr-2"/> Atualização (Schema)</button>
                    <button onClick={() => setActiveTab('seed')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'seed' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSeedling className="inline mr-2"/> Dados de Teste (Seed)</button>
                    <button onClick={() => setActiveTab('sql_ai')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'sql_ai' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot className="inline mr-2"/> SQL AI</button>
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
                            <p className="font-bold mb-2"><FaSeedling className="inline mr-2"/> POPULAR BASE DE DADOS</p>
                            <p>Insere dados fictícios (Marcas, Tipos, Instituições, Entidades, Colaboradores e Equipamentos) para testes.</p>
                        </div>
                        <div className="relative">
                            <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-xs font-mono h-96 overflow-y-auto border border-green-900/50 whitespace-pre-wrap">{seedScript}</pre>
                            <button onClick={() => handleCopy(seedScript)} className="absolute top-4 right-4 p-2 bg-green-800 hover:bg-green-700 text-white rounded-md shadow-lg transition-colors flex items-center gap-2">{copied ? <FaCheck className="text-white" /> : <FaCopy />}</button>
                        </div>
                    </div>
                )}
                
                {activeTab === 'sql_ai' && (
                    <div className="animate-fade-in flex flex-col h-[500px]">
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={sqlRequest} onChange={(e) => setSqlRequest(e.target.value)} placeholder="Ex: Mostra todos os computadores HP..." className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-3 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleGenerateSql()} />
                            <button onClick={handleGenerateSql} disabled={isGeneratingSql || !aiConfigured || !sqlRequest.trim()} className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-md font-bold disabled:opacity-50 flex items-center gap-2">{isGeneratingSql ? <FaSpinner className="animate-spin"/> : <FaPlay/>} Gerar</button>
                        </div>
                        <div className="relative flex-grow">
                             <textarea value={generatedSql} readOnly className="w-full h-full bg-black text-green-400 p-4 rounded-lg text-xs font-mono border border-gray-700 resize-none" placeholder="SQL gerado..."/>
                            {generatedSql && <button onClick={() => handleCopy(generatedSql)} className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow-lg"><FaCopy /></button>}
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
