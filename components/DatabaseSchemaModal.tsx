import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch } from 'react-icons/fa';

/**
 * DB Manager UI - V4.0 (CRUD Permission Fix)
 * -----------------------------------------------------------------------------
 * PEDIDO 7: Correção de erro de criação de equipas (RLS violation) e categorias.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'security' | 'seeding'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const fullInitScript = `-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS BASE
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

-- 3. ORGANIZAÇÃO
CREATE TABLE IF NOT EXISTS institutions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, codigo TEXT UNIQUE, email TEXT, telefone TEXT, nif TEXT, website TEXT, address_line TEXT, postal_code TEXT, city TEXT, locality TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS entities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), instituicao_id UUID REFERENCES institutions(id) ON DELETE CASCADE, codigo TEXT UNIQUE, name TEXT NOT NULL, description TEXT, email TEXT, nif TEXT, website TEXT, responsavel TEXT, telefone TEXT, status TEXT DEFAULT 'Ativo', address_line TEXT, postal_code TEXT, city TEXT, locality TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS collaborators (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, numero_mecanografico TEXT, role TEXT DEFAULT 'Utilizador', status TEXT DEFAULT 'Ativo', can_login BOOLEAN DEFAULT false, receives_notifications BOOLEAN DEFAULT true, instituicao_id UUID REFERENCES institutions(id), entidade_id UUID REFERENCES entities(id), job_title_id UUID REFERENCES config_job_titles(id), title TEXT, telemovel TEXT, telefone_interno TEXT, admission_date DATE, photo_url TEXT, address_line TEXT, postal_code TEXT, city TEXT, locality TEXT, created_at TIMESTAMPTZ DEFAULT now());

-- 4. ATIVOS
CREATE TABLE IF NOT EXISTS brands (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, risk_level TEXT DEFAULT 'Baixa', is_iso27001_certified BOOLEAN DEFAULT false, security_contact_email TEXT);
CREATE TABLE IF NOT EXISTS equipment_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, requires_nome_na_rede BOOLEAN DEFAULT false, requires_mac_wifi BOOLEAN DEFAULT false, requires_mac_cabo BOOLEAN DEFAULT false, requires_inventory_number BOOLEAN DEFAULT false, requires_backup_test BOOLEAN DEFAULT false, requires_location BOOLEAN DEFAULT false, is_maintenance BOOLEAN DEFAULT false, requires_wwan_address BOOLEAN DEFAULT false, requires_bluetooth_address BOOLEAN DEFAULT false, requires_usb_thunderbolt_address BOOLEAN DEFAULT false, requires_ram_size BOOLEAN DEFAULT false, requires_disk_info BOOLEAN DEFAULT false, requires_cpu_info BOOLEAN DEFAULT false, requires_manufacture_date BOOLEAN DEFAULT false, requires_ip BOOLEAN DEFAULT false);
CREATE TABLE IF NOT EXISTS equipment (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), brand_id UUID REFERENCES brands(id), type_id UUID REFERENCES equipment_types(id), serial_number TEXT UNIQUE, inventory_number TEXT, description TEXT, status TEXT DEFAULT 'Stock', purchase_date DATE, warranty_end_date DATE, acquisition_cost DECIMAL(12,2), nome_na_rede TEXT, os_version TEXT, last_security_update DATE, ip_address TEXT, parent_equipment_id UUID REFERENCES equipment(id), mac_address_wifi TEXT, mac_address_cabo TEXT, residual_value DECIMAL(12,2), created_at TIMESTAMPTZ DEFAULT now());

-- 5. SUPORTE
CREATE TABLE IF NOT EXISTS teams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS team_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID REFERENCES teams(id) ON DELETE CASCADE, collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS ticket_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true, is_security BOOLEAN DEFAULT false, sla_warning_hours INTEGER DEFAULT 0, sla_critical_hours INTEGER DEFAULT 0, default_team_id UUID REFERENCES teams(id));
CREATE TABLE IF NOT EXISTS security_incident_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true, description TEXT);
CREATE TABLE IF NOT EXISTS tickets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'Pedido', category TEXT, request_date TIMESTAMPTZ DEFAULT now(), collaborator_id UUID REFERENCES collaborators(id), technician_id UUID REFERENCES collaborators(id), team_id UUID REFERENCES teams(id), equipment_id UUID REFERENCES equipment(id), security_incident_type TEXT, impact_criticality TEXT DEFAULT 'Baixa');
CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id UUID, receiver_id UUID, content TEXT, timestamp TIMESTAMPTZ DEFAULT now(), read BOOLEAN DEFAULT false);

-- 6. CONFIGS
CREATE TABLE IF NOT EXISTS global_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), timestamp TIMESTAMPTZ DEFAULT now(), action TEXT NOT NULL, resource_type TEXT, user_email TEXT, details TEXT);
`;

    const securityScript = `-- FIX RLS V4.0 (Permissões de Escrita para Equipes e Categorias)
DO $$ 
DECLARE 
    t text;
    tables_to_fix text[] := ARRAY[
        'teams', 'team_members', 'ticket_categories', 'security_incident_types',
        'collaborators', 'entities', 'institutions', 'brands', 'equipment_types',
        'equipment', 'tickets', 'messages', 'config_custom_roles', 'config_job_titles',
        'contact_titles', 'contact_roles', 'config_software_categories', 'config_software_products',
        'config_equipment_statuses', 'config_ticket_statuses', 'config_license_statuses'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        -- Garantir que RLS está ativo
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
        -- Remover políticas de leitura restrita antigas
        EXECUTE format('DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access for authenticated" ON public.%I', t);
        -- Criar política de gestão total para utilizadores autenticados
        EXECUTE format('CREATE POLICY "Allow management for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
`;

    const seedingScript = `-- SEED BÁSICO DE SEGURANÇA
INSERT INTO ticket_categories (name, is_active) VALUES ('Hardware / Avaria', true), ('Software / Instalação', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO teams (name, description, is_active) VALUES ('Triagem', 'Análise inicial de tickets', true) ON CONFLICT (name) DO NOTHING;
`;

    return (
        <Modal title="Configuração Avançada de Base de Dados" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Segurança (Fix Pedido 7)</button>
                    <button onClick={() => setActiveTab('seeding')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'seeding' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaDatabase /> Seed</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg text-xs text-red-200">
                        <h3 className="font-bold flex items-center gap-2 mb-1"><FaExclamationTriangle className="text-yellow-500" /> Correção de Erros de Permissão (RLS)</h3>
                        <p>Se recebe erros ao criar Equipas ou Categorias, execute o script em <strong>"Segurança (Fix Pedido 7)"</strong> para autorizar a escrita na base de dados.</p>
                    </div>

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden group">
                        <div className="absolute top-2 right-4 z-20 flex gap-2">
                            <button 
                                onClick={() => {
                                    const script = activeTab === 'full' ? fullInitScript : 
                                                 activeTab === 'security' ? securityScript : seedingScript;
                                    handleCopy(script, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} {copied === activeTab ? 'Copiado!' : 'Copiar SQL'}
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            {activeTab === 'full' && <pre className="whitespace-pre-wrap">{fullInitScript}</pre>}
                            {activeTab === 'security' && <pre className="whitespace-pre-wrap text-red-300">{securityScript}</pre>}
                            {activeTab === 'seeding' && <pre className="whitespace-pre-wrap text-purple-300">{seedingScript}</pre>}
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