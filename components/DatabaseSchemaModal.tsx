import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle } from 'react-icons/fa';

/**
 * DB Manager UI - v5.3 (Security & Storage Patch)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 4 & 7: MANTER E EXPANDIR ABAS
 * - PEDIDO 8: FIX RLS STORAGE & COLLABORATORS
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'triggers' | 'functions' | 'security' | 'seeding' | 'patch'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const fullInitScript = `-- 🛡️ AIManager - Script de Inicialização Completa (Novo Cliente)
-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DICIONÁRIOS E CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS config_custom_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, description TEXT, permissions JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS config_job_titles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS contact_titles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS contact_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_collaborator_deactivation_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_equipment_statuses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_ticket_statuses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_license_statuses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_software_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_software_products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, category_id UUID REFERENCES config_software_categories(id));
CREATE TABLE IF NOT EXISTS config_cpus (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_ram_sizes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_storage_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_accounting_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_conservation_states (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_decommission_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);

-- 3. ORGANIZAÇÃO
CREATE TABLE IF NOT EXISTS institutions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, codigo TEXT UNIQUE, email TEXT, telefone TEXT, nif TEXT, website TEXT, address_line TEXT, postal_code TEXT, city TEXT, locality TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS entities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), instituicao_id UUID REFERENCES institutions(id) ON DELETE CASCADE, codigo TEXT UNIQUE, name TEXT NOT NULL, description TEXT, email TEXT, nif TEXT, website TEXT, responsavel TEXT, telefone TEXT, status TEXT DEFAULT 'Ativo', address_line TEXT, postal_code TEXT, city TEXT, locality TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS collaborators (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, numero_mecanografico TEXT, role TEXT DEFAULT 'Utilizador', status TEXT DEFAULT 'Ativo', can_login BOOLEAN DEFAULT false, receives_notifications BOOLEAN DEFAULT true, instituicao_id UUID REFERENCES institutions(id), entidade_id UUID REFERENCES entities(id), job_title_id UUID REFERENCES config_job_titles(id), title TEXT, telemovel TEXT, telefone_interno TEXT, admission_date DATE, photo_url TEXT, address_line TEXT, postal_code TEXT, city TEXT, locality TEXT, nif TEXT, date_of_birth DATE, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), password_updated_at TIMESTAMPTZ);

-- 4. ATIVOS E INVENTÁRIO
CREATE TABLE IF NOT EXISTS brands (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, risk_level TEXT DEFAULT 'Baixa', is_iso27001_certified BOOLEAN DEFAULT false, security_contact_email TEXT);
CREATE TABLE IF NOT EXISTS equipment_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, requires_nome_na_rede BOOLEAN DEFAULT false, requires_mac_wifi BOOLEAN DEFAULT false, requires_mac_cabo BOOLEAN DEFAULT false, requires_inventory_number BOOLEAN DEFAULT false, requires_backup_test BOOLEAN DEFAULT false, requires_location BOOLEAN DEFAULT false, is_maintenance BOOLEAN DEFAULT false, requires_wwan_address BOOLEAN DEFAULT false, requires_bluetooth_address BOOLEAN DEFAULT false, requires_usb_thunderbolt_address BOOLEAN DEFAULT false, requires_ram_size BOOLEAN DEFAULT false, requires_disk_info BOOLEAN DEFAULT false, requires_cpu_info BOOLEAN DEFAULT false, requires_manufacture_date BOOLEAN DEFAULT false, requires_ip BOOLEAN DEFAULT false, default_team_id UUID);
CREATE TABLE IF NOT EXISTS equipment (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), brand_id UUID REFERENCES brands(id), type_id UUID REFERENCES equipment_types(id), serial_number TEXT UNIQUE, inventory_number TEXT, description TEXT, status TEXT DEFAULT 'Stock', purchase_date DATE, warranty_end_date DATE, acquisition_cost DECIMAL(12,2), nome_na_rede TEXT, os_version TEXT, last_security_update DATE, ip_address TEXT, parent_equipment_id UUID REFERENCES equipment(id), mac_address_wifi TEXT, mac_address_cabo TEXT, residual_value DECIMAL(12,2), accounting_category_id UUID REFERENCES config_accounting_categories(id), conservation_state_id UUID REFERENCES config_conservation_states(id), decommission_reason_id UUID REFERENCES config_decommission_reasons(id), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE, collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL, entidade_id UUID REFERENCES entities(id) ON DELETE SET NULL, instituicao_id UUID REFERENCES institutions(id) ON DELETE SET NULL, assigned_date DATE DEFAULT CURRENT_DATE, return_date DATE);
CREATE TABLE IF NOT EXISTS software_licenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_name TEXT NOT NULL, license_key TEXT NOT NULL, total_seats INTEGER DEFAULT 1, purchase_date DATE, expiry_date DATE, purchase_email TEXT, status TEXT DEFAULT 'Ativo', unit_cost DECIMAL(12,2), is_oem BOOLEAN DEFAULT false, category_id UUID REFERENCES config_software_categories(id), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS license_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), software_license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE, equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE, assigned_date DATE DEFAULT CURRENT_DATE, return_date DATE);

-- 5. SUPORTE
CREATE TABLE IF NOT EXISTS teams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS team_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID REFERENCES teams(id) ON DELETE CASCADE, collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS ticket_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true, is_security BOOLEAN DEFAULT false, sla_warning_hours INTEGER DEFAULT 0, sla_critical_hours INTEGER DEFAULT 0, default_team_id UUID REFERENCES teams(id));
CREATE TABLE IF NOT EXISTS security_incident_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true, description TEXT);
CREATE TABLE IF NOT EXISTS tickets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'Pedido', category TEXT, request_date TIMESTAMPTZ DEFAULT now(), finish_date TIMESTAMPTZ, collaborator_id UUID REFERENCES collaborators(id), technician_id UUID REFERENCES collaborators(id), team_id UUID REFERENCES teams(id), equipment_id UUID REFERENCES equipment(id), security_incident_type TEXT, impact_criticality TEXT DEFAULT 'Baixa', resolution_summary TEXT);
CREATE TABLE IF NOT EXISTS ticket_activities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE, technician_id UUID REFERENCES collaborators(id), description TEXT, date TIMESTAMPTZ DEFAULT now(), equipment_id UUID, software_license_id UUID);
CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id UUID, receiver_id UUID, content TEXT, timestamp TIMESTAMPTZ DEFAULT now(), read BOOLEAN DEFAULT false);

-- 6. COMPLIANCE E SISTEMA
CREATE TABLE IF NOT EXISTS business_services (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, criticality TEXT DEFAULT 'Baixa', rto_goal TEXT, owner_id UUID REFERENCES collaborators(id), status TEXT DEFAULT 'Ativo', external_provider_id UUID);
CREATE TABLE IF NOT EXISTS service_dependencies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), service_id UUID REFERENCES business_services(id) ON DELETE CASCADE, equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE, software_license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE, dependency_type TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS vulnerabilities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cve_id TEXT NOT NULL, description TEXT, severity TEXT, affected_software TEXT, remediation TEXT, status TEXT DEFAULT 'Open', published_date DATE, ticket_id UUID, affected_assets TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS backup_executions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), system_name TEXT NOT NULL, equipment_id UUID REFERENCES equipment(id), backup_date DATE, test_date DATE NOT NULL, status TEXT, type TEXT, restore_time_minutes INTEGER, tester_id UUID REFERENCES collaborators(id), notes TEXT, attachments JSONB DEFAULT '[]'::jsonb);
CREATE TABLE IF NOT EXISTS resilience_tests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, test_type TEXT, planned_date DATE, executed_date DATE, status TEXT, auditor_entity TEXT, summary_findings TEXT, attachments JSONB DEFAULT '[]'::jsonb);
CREATE TABLE IF NOT EXISTS security_trainings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE, training_type TEXT, completion_date DATE, status TEXT, score INTEGER, duration_hours DECIMAL(5,2), notes TEXT);
CREATE TABLE IF NOT EXISTS global_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), timestamp TIMESTAMPTZ DEFAULT now(), action TEXT NOT NULL, resource_type TEXT, resource_id UUID, user_email TEXT, details TEXT);
CREATE TABLE IF NOT EXISTS automation_rules (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, trigger_event TEXT, conditions JSONB DEFAULT '[]'::jsonb, actions JSONB DEFAULT '[]'::jsonb, priority INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, description TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS policies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, content TEXT, version TEXT, is_active BOOLEAN DEFAULT true, is_mandatory BOOLEAN DEFAULT true, target_type TEXT, target_instituicao_ids UUID[], target_entidade_ids UUID[], created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS policy_acceptances (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), policy_id UUID REFERENCES policies(id) ON DELETE CASCADE, collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE, version TEXT, accepted_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS procurement_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, quantity INTEGER DEFAULT 1, estimated_cost DECIMAL(12,2), requester_id UUID REFERENCES collaborators(id), status TEXT, request_date DATE, priority TEXT, resource_type TEXT, specifications JSONB, brand_id UUID, supplier_id UUID, order_reference TEXT, invoice_number TEXT, approval_date DATE, approver_id UUID, received_date DATE, equipment_type_id UUID, software_category_id UUID, order_date DATE, attachments JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS calendar_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, start_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ, is_all_day BOOLEAN DEFAULT false, color TEXT, is_private BOOLEAN DEFAULT true, team_id UUID, reminder_minutes INTEGER, created_by UUID REFERENCES collaborators(id), created_at TIMESTAMPTZ DEFAULT now());
`;

    const triggersScript = `-- 🔄 TRIGGERS DE SISTEMA (AUDITORIA E AUTOMATIZAÇÃO)

-- 1. Função Genérica para Atualizar updated_at
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 2. Aplicação do Trigger updated_at
CREATE TRIGGER update_institutions_modtime BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_entities_modtime BEFORE UPDATE ON entities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_collaborators_modtime BEFORE UPDATE ON collaborators FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_equipment_modtime BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_procurement_modtime BEFORE UPDATE ON procurement_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_policies_modtime BEFORE UPDATE ON policies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 3. Função para Log de Auditoria
CREATE OR REPLACE FUNCTION log_changes() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (action, resource_type, resource_id, details)
        VALUES ('CREATE', TG_TABLE_NAME, NEW.id, 'Registo criado.');
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (action, resource_type, resource_id, details)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, 'Registo atualizado.');
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (action, resource_type, resource_id, details)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, 'Registo removido.');
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- 4. Aplicação de Auditoria em Equipamento e Tickets
CREATE TRIGGER trigger_audit_equipment AFTER INSERT OR UPDATE OR DELETE ON equipment FOR EACH ROW EXECUTE PROCEDURE log_changes();
CREATE TRIGGER trigger_audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets FOR EACH ROW EXECUTE PROCEDURE log_changes();
`;

    const functionsScript = `-- 🛠️ FUNÇÕES RPC (API E INSPEÇÃO)

-- 1. Obter Políticas de RLS para Diagnóstico
CREATE OR REPLACE FUNCTION get_db_policies() 
RETURNS TABLE(tablename text, policyname text, cmd text, roles text[]) AS $$
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Obter Triggers para Diagnóstico
CREATE OR REPLACE FUNCTION get_db_triggers() 
RETURNS TABLE(trigger_name text, event_object_table text, action_statement text) AS $$
SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public';
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Obter Funções Registadas
CREATE OR REPLACE FUNCTION get_db_functions() 
RETURNS TABLE(routine_name text, routine_type text) AS $$
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
$$ LANGUAGE sql SECURITY DEFINER;
`;

    const securityScript = `-- 🔒 SEGURANÇA E RLS (FIX V5.0)
-- Este script garante que todas as tabelas têm RLS ativado e permissões de gestão para utilizadores autenticados.

DO $$ 
DECLARE 
    t text;
    tables_to_fix text[] := ARRAY[
        'teams', 'team_members', 'ticket_categories', 'security_incident_types',
        'collaborators', 'entities', 'institutions', 'brands', 'equipment_types',
        'equipment', 'tickets', 'messages', 'config_custom_roles', 'config_job_titles',
        'contact_titles', 'contact_roles', 'config_software_categories', 'config_software_products',
        'config_equipment_statuses', 'config_ticket_statuses', 'config_license_statuses',
        'config_cpus', 'config_ram_sizes', 'config_storage_types', 'config_decommission_reasons',
        'config_accounting_categories', 'config_conservation_states', 'assignments',
        'software_licenses', 'license_assignments', 'ticket_activities', 'business_services',
        'service_dependencies', 'vulnerabilities', 'backup_executions', 'resilience_tests',
        'security_trainings', 'global_settings', 'audit_log', 'automation_rules',
        'policies', 'policy_acceptances', 'procurement_requests', 'calendar_events'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access for authenticated" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow management for authenticated users" ON public.%I', t);
        
        -- Política Global v5.0: CRUD total para utilizadores autenticados
        EXECUTE format('CREATE POLICY "Allow management for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
`;

    const seedingScript = `-- 🌱 DADOS BASE (SEEDING INICIAL)
-- Categorias Base
INSERT INTO ticket_categories (name, is_active) VALUES ('Avaria Hardware', true), ('Software / Configuração', true), ('Rede / Conectividade', true), ('Incidentes Segurança', true) ON CONFLICT (name) DO NOTHING;

-- Equipa de Triagem
INSERT INTO teams (name, description, is_active) VALUES ('Triagem', 'Análise inicial de tickets e incidentes', true) ON CONFLICT (name) DO NOTHING;

-- Estados Padrão
INSERT INTO config_equipment_statuses (name, color) VALUES ('Operacional', '#22c55e'), ('Stock', '#3b82f6'), ('Garantia', '#eab308'), ('Abate', '#ef4444') ON CONFLICT (name) DO NOTHING;
INSERT INTO config_ticket_statuses (name, color) VALUES ('Pedido', '#fbbf24'), ('Em progresso', '#60a5fa'), ('Finalizado', '#4ade80'), ('Cancelado', '#f87171') ON CONFLICT (name) DO NOTHING;
`;

    const patchScript = `-- ⚡ PATCH / ALTERAÇÕES DE MOMENTO (MANTENÇÃO v5.3)
-- Fixes para Pedido 8: Storage & RLS Colaboradores

-- 1. [Fix: Pedido 8] Políticas de Segurança para o Bucket 'avatars'
-- Execute isto se o bucket já existir. Garante upload e leitura.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar Public Read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Auth Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE TO authenticated WITH CHECK (bucket_id = 'avatars');

-- 2. [Fix: Pedido 8] Reparação RLS Colaboradores (Evitar erro 403 ao editar)
-- Garante que utilizadores autenticados podem gerir a tabela colaboradores
DROP POLICY IF EXISTS "Allow management for authenticated users" ON public.collaborators;
CREATE POLICY "Allow management for authenticated users" ON public.collaborators 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. [Nota Técnica] O comando abaixo força o PostgREST a recarregar o schema cache
NOTIFY pgrst, 'reload schema';

-- 4. [Aviso] Após correr este script, aguarde 30s e faça Refresh (F5) no browser.
`;

    return (
        <Modal title="Consola de Base de Dados (SQL)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('triggers')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'triggers' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Triggers</button>
                    <button onClick={() => setActiveTab('functions')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'functions' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSearch /> Funções</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Segurança</button>
                    <button onClick={() => setActiveTab('seeding')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'seeding' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaDatabase /> Seed</button>
                    <button onClick={() => setActiveTab('patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'patch' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch / Fixes</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg text-xs text-blue-200">
                        <h3 className="font-bold flex items-center gap-2 mb-1"><FaInfoCircle className="text-blue-400" /> Referência de Gestão (Pedido 7)</h3>
                        <p>Copie os scripts abaixo e execute-os no <strong>SQL Editor</strong> do seu Supabase Dashboard.</p>
                    </div>

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden group">
                        <div className="absolute top-2 right-4 z-20 flex gap-2">
                            <button 
                                onClick={() => {
                                    const script = activeTab === 'full' ? fullInitScript : 
                                                 activeTab === 'triggers' ? triggersScript :
                                                 activeTab === 'functions' ? functionsScript :
                                                 activeTab === 'security' ? securityScript : 
                                                 activeTab === 'patch' ? patchScript : seedingScript;
                                    handleCopy(script, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} {copied === activeTab ? 'Copiado!' : 'Copiar SQL'}
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            {activeTab === 'full' && <pre className="whitespace-pre-wrap">{fullInitScript}</pre>}
                            {activeTab === 'triggers' && <pre className="whitespace-pre-wrap text-yellow-300">{triggersScript}</pre>}
                            {activeTab === 'functions' && <pre className="whitespace-pre-wrap text-green-300">{functionsScript}</pre>}
                            {activeTab === 'security' && <pre className="whitespace-pre-wrap text-red-300">{securityScript}</pre>}
                            {activeTab === 'seeding' && <pre className="whitespace-pre-wrap text-purple-300">{seedingScript}</pre>}
                            {activeTab === 'patch' && <pre className="whitespace-pre-wrap text-orange-300">{patchScript}</pre>}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;