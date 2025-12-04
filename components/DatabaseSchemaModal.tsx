
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaSeedling, FaExclamationTriangle } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'update' | 'cleanup' | 'playwright_ai'>('update');
    
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
        BEGIN EXECUTE format('CREATE POLICY "Public Read" ON %I FOR SELECT USING (auth.role() = ''authenticated'');', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Admin Write" ON %I FOR ALL USING (is_admin_or_tech());', t); EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- 4.2 Políticas para Tabelas Operacionais (Equipment, Tickets, etc.)

-- Equipment: Leitura Todos, Escrita Admin/Tech
CREATE POLICY "Equipment Read" ON equipment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Equipment Write" ON equipment FOR ALL USING (is_admin_or_tech());

-- Collaborators: Leitura Todos, Edição Apenas Próprio ou Admin
CREATE POLICY "Collab Read" ON collaborators FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Collab Update Self" ON collaborators FOR UPDATE USING (id = auth.uid() OR is_admin());
CREATE POLICY "Collab Insert/Delete" ON collaborators FOR INSERT WITH CHECK (is_admin()); 
CREATE POLICY "Collab Delete" ON collaborators FOR DELETE USING (is_admin());

-- Tickets: Leitura (Requerente, Técnico ou Admin), Escrita (Requerente, Técnico ou Admin)
CREATE POLICY "Ticket Read" ON tickets FOR SELECT USING (
    auth.uid() = "collaboratorId" OR 
    auth.uid() = "technicianId" OR 
    is_admin_or_tech()
);
CREATE POLICY "Ticket Create" ON tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Ticket Update" ON tickets FOR UPDATE USING (
    auth.uid() = "collaboratorId" OR 
    auth.uid() = "technicianId" OR 
    is_admin_or_tech()
);

-- Procurement: Leitura (Requerente, Aprovador ou Admin)
CREATE POLICY "Procurement Read" ON procurement_requests FOR SELECT USING (
    auth.uid() = requester_id OR 
    auth.uid() = approver_id OR 
    is_admin_or_tech()
);
CREATE POLICY "Procurement Create" ON procurement_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Procurement Update" ON procurement_requests FOR UPDATE USING (
    auth.uid() = requester_id OR 
    is_admin_or_tech()
);

-- Audit Logs: Apenas leitura para Admin, Escrita via Trigger (System)
CREATE POLICY "Audit Read Admin" ON audit_logs FOR SELECT USING (is_admin());
-- (Insert is handled by system or Trigger)

-- Global Settings: Apenas Admin pode ver keys sensíveis (API keys), mas app precisa de algumas
-- Simplificação: Admin Full, Outros Read Only (cuidado com API keys no frontend)
CREATE POLICY "Settings Read" ON global_settings FOR SELECT USING (auth.role() = 'authenticated');
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
                <div className="flex border-b border-gray-700 mb-4 gap-2">
                     <button 
                        onClick={() => setActiveTab('update')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'update' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaDatabase className="inline mr-2"/> Atualizar BD (Schema)
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
                                    Este script implementa <strong>RLS (Row Level Security)</strong> rigoroso e Triggers de Auditoria.
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
