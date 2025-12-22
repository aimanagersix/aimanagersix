import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync } from 'react-icons/fa';

/**
 * DB Manager UI - V3.4 (Integrity Guard & Massive Seeding)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 1 (Menu Tickets):     FECHADO - BLOQUEADO - NÃO ALTERAR
 * - PEDIDO 2 (Menu Mensagens):   FECHADO - BLOQUEADO - NÃO ALTERAR
 * - PEDIDO 3 (Menu Notificações): FECHADO - BLOQUEADO - NÃO ALTERAR
 * - PEDIDO 4 (Abas BD):          FECHADO - AS 5 ABAS SÃO ESTRUTURAIS
 * -----------------------------------------------------------------------------
 * PEDIDO 6: Correção de erros SQL de relação inexistente e atualização do Seed.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'triggers' | 'functions' | 'security' | 'seeding'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const fullInitScript = `-- 1. EXTENSÕES & PERMISSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS DE CONFIGURAÇÃO (AUXILIARES - DEVEM VIR PRIMEIRO)
CREATE TABLE IF NOT EXISTS config_custom_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, description TEXT, permissions JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS config_job_titles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS contact_titles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS contact_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_collaborator_deactivation_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_equipment_statuses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_ticket_statuses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_license_statuses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_cpus (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_ram_sizes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_storage_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_decommission_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_accounting_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_conservation_states (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, color TEXT);
CREATE TABLE IF NOT EXISTS config_software_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);

-- 3. ORGANIZAÇÃO & RH
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    codigo TEXT UNIQUE,
    email TEXT,
    telefone TEXT,
    nif TEXT,
    website TEXT,
    address_line TEXT,
    postal_code TEXT,
    city TEXT,
    locality TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instituicao_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    codigo TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    email TEXT,
    nif TEXT,
    website TEXT,
    responsavel TEXT,
    telefone TEXT,
    status TEXT DEFAULT 'Ativo',
    address_line TEXT,
    postal_code TEXT,
    city TEXT,
    locality TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    numero_mecanografico TEXT,
    role TEXT DEFAULT 'Utilizador',
    status TEXT DEFAULT 'Ativo',
    can_login BOOLEAN DEFAULT false,
    receives_notifications BOOLEAN DEFAULT true,
    instituicao_id UUID REFERENCES institutions(id),
    entidade_id UUID REFERENCES entities(id),
    job_title_id UUID REFERENCES config_job_titles(id),
    title TEXT,
    telemovel TEXT,
    telefone_interno TEXT,
    admission_date DATE,
    photo_url TEXT,
    password_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INVENTÁRIO & ATIVOS
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    risk_level TEXT DEFAULT 'Baixa',
    is_iso27001_certified BOOLEAN DEFAULT false,
    security_contact_email TEXT
);

CREATE TABLE IF NOT EXISTS config_software_products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, category_id UUID REFERENCES config_software_categories(id));

CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    requires_nome_na_rede BOOLEAN DEFAULT false,
    requires_mac_wifi BOOLEAN DEFAULT false,
    requires_mac_cabo BOOLEAN DEFAULT false,
    requires_inventory_number BOOLEAN DEFAULT false,
    requires_backup_test BOOLEAN DEFAULT false,
    requires_location BOOLEAN DEFAULT false,
    is_maintenance BOOLEAN DEFAULT false,
    requires_wwan_address BOOLEAN DEFAULT false,
    requires_bluetooth_address BOOLEAN DEFAULT false,
    requires_usb_thunderbolt_address BOOLEAN DEFAULT false,
    requires_ram_size BOOLEAN DEFAULT false,
    requires_disk_info BOOLEAN DEFAULT false,
    requires_cpu_info BOOLEAN DEFAULT false,
    requires_manufacture_date BOOLEAN DEFAULT false,
    requires_ip BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    type_id UUID REFERENCES equipment_types(id),
    serial_number TEXT UNIQUE,
    inventory_number TEXT,
    description TEXT,
    status TEXT DEFAULT 'Stock',
    purchase_date DATE,
    warranty_end_date DATE,
    acquisition_cost DECIMAL(12,2),
    nome_na_rede TEXT,
    os_version TEXT,
    last_security_update DATE,
    ip_address TEXT,
    parent_equipment_id UUID REFERENCES equipment(id),
    mac_address_wifi TEXT,
    mac_address_cabo TEXT,
    residual_value DECIMAL(12,2),
    accounting_category_id UUID REFERENCES config_accounting_categories(id),
    conservation_state_id UUID REFERENCES config_conservation_states(id),
    decommission_reason_id UUID REFERENCES config_decommission_reasons(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SUPORTE & MENSAGENS
CREATE TABLE IF NOT EXISTS teams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS team_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID REFERENCES teams(id) ON DELETE CASCADE, collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    name TEXT UNIQUE NOT NULL, 
    is_active BOOLEAN DEFAULT true, 
    is_security BOOLEAN DEFAULT false,
    sla_warning_hours INTEGER DEFAULT 0,
    sla_critical_hours INTEGER DEFAULT 0,
    default_team_id UUID REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS security_incident_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    name TEXT UNIQUE NOT NULL, 
    is_active BOOLEAN DEFAULT true, 
    description TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pedido',
    category TEXT,
    request_date TIMESTAMPTZ DEFAULT now(),
    collaborator_id UUID REFERENCES collaborators(id),
    technician_id UUID REFERENCES collaborators(id),
    team_id UUID REFERENCES teams(id),
    equipment_id UUID REFERENCES equipment(id),
    security_incident_type TEXT,
    impact_criticality TEXT DEFAULT 'Baixa'
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID,
    receiver_id UUID,
    content TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    read BOOLEAN DEFAULT false
);

-- 6. CONFIGURAÇÕES GLOBAIS
CREATE TABLE IF NOT EXISTS global_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), timestamp TIMESTAMPTZ DEFAULT now(), action TEXT NOT NULL, resource_type TEXT, user_email TEXT, details TEXT);

-- 7. SEED BÁSICO (SUPERADMIN)
INSERT INTO config_custom_roles (id, name, permissions) VALUES (gen_random_uuid(), 'SuperAdmin', '{"*": {"*": true}}'::jsonb) ON CONFLICT (name) DO NOTHING;
INSERT INTO institutions (id, name, codigo, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 'Organização Sede', 'SEDE', true) ON CONFLICT (codigo) DO NOTHING;
INSERT INTO entities (id, instituicao_id, name, codigo, status) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Administração Geral', 'ADM', 'Ativo') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO collaborators (id, full_name, email, role, status, can_login, receives_notifications, instituicao_id, entidade_id) VALUES ('00000000-0000-0000-0000-000000000003', 'Super Administrador', 'josefsmoreira@outlook.com', 'SuperAdmin', 'Ativo', true, true, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') ON CONFLICT (email) DO NOTHING;
`;

    const triggersScript = `-- AUTO-AUDIT LOG TRIGGER
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (action, resource_type, user_email, details)
    VALUES (TG_OP, TG_TABLE_NAME, 'System', 'Automatic log of ' || TG_OP || ' operation');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- APLICAR AOS EQUIPAMENTOS
CREATE TRIGGER trigger_audit_equipment
AFTER INSERT OR UPDATE OR DELETE ON equipment
FOR EACH ROW EXECUTE FUNCTION public.log_changes();

-- AUTO-UPDATE TIMESTAMP FOR SETTINGS
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_modtime
BEFORE UPDATE ON global_settings
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
`;

    const functionsScript = `-- FUNÇÃO PARA SINCRONIZAÇÃO SOPHOS (EDGE FUNCTION HELPER)
CREATE OR REPLACE FUNCTION public.get_sophos_config()
RETURNS TABLE (client_id text, client_secret text) 
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        (SELECT setting_value FROM global_settings WHERE setting_key = 'sophos_client_id'),
        (SELECT setting_value FROM global_settings WHERE setting_key = 'sophos_client_secret');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNÇÃO PARA LIMPEZA DE MENSAGENS ANTIGAS (> 90 DIAS)
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages WHERE timestamp < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;
`;

    const securityScript = `-- ATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE config_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_roles ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RBAC (ROLES)
CREATE POLICY "Allow management for authenticated users" ON config_custom_roles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON contact_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON contact_roles FOR SELECT TO authenticated USING (true);

-- POLÍTICA BÁSICA: UTILIZADORES AUTENTICADOS PODEM LER TUDO
CREATE POLICY "Allow read access for authenticated users" ON institutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON tickets FOR SELECT TO authenticated USING (true);

-- POLÍTICA MENSAGENS: SÓ DESTINATÁRIO OU REMETENTE OU CANAL GERAL (UUID ZERO)
CREATE POLICY "Message Privacy" ON messages
FOR SELECT TO authenticated
USING (
    receiver_id = auth.uid() 
    OR sender_id = auth.uid()
    OR receiver_id = '00000000-0000-0000-0000-000000000000'::uuid
);
`;

    const seedingScript = `-- SCRIPT DE SEEDING COMPLETO: TABELAS AUXILIARES PADRÃO
-- IMPORTANTE: Execute primeiro a Aba "Inicialização Total" para criar as tabelas.

-- 1. TRATOS HONORÍFICOS
INSERT INTO contact_titles (name) VALUES 
('Sr.'), ('Sra.'), ('Dr.'), ('Dra.'), ('Eng.'), ('Eng.ª'), ('Prof.'), ('Prof.ª'), ('Arq.'), ('Arq.ª') 
ON CONFLICT (name) DO NOTHING;

-- 2. PAPÉIS DE CONTACTO EXTERNO
INSERT INTO contact_roles (name) VALUES 
('Técnico'), ('Comercial'), ('Financeiro'), ('DPO / CISO'), ('Diretor'), ('Secretaria'), ('Gestor de Conta'), ('Suporte Premium')
ON CONFLICT (name) DO NOTHING;

-- 3. MOTIVOS DE SAÍDA (RH)
INSERT INTO config_collaborator_deactivation_reasons (name) VALUES 
('Reforma'), ('Rescisão (Mútuo Acordo)'), ('Rescisão (Iniciativa Colaborador)'), ('Fim de Contrato'), ('Despedimento'), ('Transferência Externa')
ON CONFLICT (name) DO NOTHING;

-- 4. MARCAS (FABRICANTES)
INSERT INTO brands (name, risk_level, is_iso27001_certified) VALUES 
('Dell', 'Baixa', true), ('HP', 'Baixa', true), ('Apple', 'Baixa', true), ('Lenovo', 'Baixa', true),
('Cisco', 'Baixa', true), ('Ubiquiti', 'Média', false), ('Fortinet', 'Baixa', true),
('Microsoft', 'Baixa', true), ('Adobe', 'Baixa', true), ('Samsung', 'Baixa', true)
ON CONFLICT (name) DO NOTHING;

-- 5. TIPOS DE EQUIPAMENTO
INSERT INTO equipment_types (name, requires_nome_na_rede, requires_ram_size, requires_disk_info, requires_cpu_info) VALUES 
('Laptop', true, true, true, true),
('Desktop', true, true, true, true),
('Servidor', true, true, true, true),
('Monitor', false, false, false, false),
('Switch', true, false, false, false),
('Firewall', true, false, false, false),
('Access Point', true, false, false, false),
('Smartphone', false, false, false, false),
('Tablet', false, false, false, false),
('UPS', false, false, false, false)
ON CONFLICT (name) DO NOTHING;

-- 6. CATEGORIAS DE SOFTWARE E PRODUTOS (STANDARD)
INSERT INTO config_software_categories (name) VALUES 
('Sistema Operativo'), ('Produtividade'), ('Segurança'), ('Design'), ('Base de Dados')
ON CONFLICT (name) DO NOTHING;

INSERT INTO config_software_products (name, category_id) VALUES 
('Windows 11 Pro', (SELECT id FROM config_software_categories WHERE name='Sistema Operativo' LIMIT 1)),
('Microsoft 365 Business', (SELECT id FROM config_software_categories WHERE name='Produtividade' LIMIT 1)),
('Adobe Creative Cloud', (SELECT id FROM config_software_categories WHERE name='Design' LIMIT 1)),
('Sophos Endpoint Protection', (SELECT id FROM config_software_categories WHERE name='Segurança' LIMIT 1))
ON CONFLICT DO NOTHING;

-- 7. ESTADOS DE LICENÇAS
INSERT INTO config_license_statuses (name, color) VALUES 
('Ativo', '#22c55e'), ('Expirado', '#ef4444'), ('Suspenso', '#eab308'), ('Revogado', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- 8. CPUS
INSERT INTO config_cpus (name) VALUES 
('Intel Core i3'), ('Intel Core i5'), ('Intel Core i7'), ('Intel Core i9'),
('AMD Ryzen 5'), ('AMD Ryzen 7'), ('Apple M1'), ('Apple M2'), ('Apple M3')
ON CONFLICT (name) DO NOTHING;

-- 9. RAM SIZES
INSERT INTO config_ram_sizes (name) VALUES ('4 GB'), ('8 GB'), ('16 GB'), ('32 GB'), ('64 GB') ON CONFLICT (name) DO NOTHING;

-- 10. STORAGE TYPES
INSERT INTO config_storage_types (name) VALUES ('SSD SATA'), ('SSD NVMe Gen3'), ('SSD NVMe Gen4'), ('HDD 7200rpm') ON CONFLICT (name) DO NOTHING;

-- 11. ESTADOS DE EQUIPAMENTO (CORES)
INSERT INTO config_equipment_statuses (name, color) VALUES 
('Operacional', '#22c55e'), ('Stock', '#3b82f6'), ('Garantia', '#eab308'), ('Abate', '#ef4444'), ('Empréstimo', '#a855f7')
ON CONFLICT (name) DO NOTHING;

-- 12. ESTADOS DE TICKET (CORES)
INSERT INTO config_ticket_statuses (name, color) VALUES 
('Pedido', '#eab308'), ('Em progresso', '#3b82f6'), ('Finalizado', '#22c55e'), ('Cancelado', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- 13. CATEGORIAS DE TICKETS
INSERT INTO ticket_categories (name, is_active, is_security) VALUES 
('Hardware / Avaria', true, false),
('Software / Instalação', true, false),
('Rede / WIFI', true, false),
('Acessos / Passwords', true, false),
('Email / Office', true, false),
('Incidente de Segurança', true, true),
('Manutenção Preventiva', true, false)
ON CONFLICT (name) DO NOTHING;

-- 14. TIPOS DE ATAQUE / INCIDENTE (NIS2)
INSERT INTO security_incident_types (name, is_active, description) VALUES 
('Malware / Vírus', true, 'Infeção por software malicioso'),
('Phishing', true, 'Tentativa de obtenção de credenciais'),
('Ransomware', true, 'Cifragem de dados para resgate'),
('Acesso Não Autorizado', true, 'Intrusão em sistemas ou contas'),
('Fuga de Dados', true, 'Exposição inadvertida de dados')
ON CONFLICT (name) DO NOTHING;
`;

    return (
        <Modal title="Configuração Avançada de Base de Dados" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <FaCode /> Inicialização Total
                    </button>
                    <button onClick={() => setActiveTab('triggers')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'triggers' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <FaBolt /> Triggers (Automatos)
                    </button>
                    <button onClick={() => setActiveTab('functions')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'functions' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <FaSync /> Funções (RPC)
                    </button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <FaShieldAlt /> Segurança (RLS)
                    </button>
                    <button onClick={() => setActiveTab('seeding')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'seeding' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <FaDatabase /> Seed Auxiliar
                    </button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg text-xs text-blue-200">
                        <h3 className="font-bold flex items-center gap-2 mb-1">
                            <FaExclamationTriangle className="text-yellow-500" /> Instruções de Migração
                        </h3>
                        <p>Copie o código abaixo e execute-o no <strong>SQL Editor</strong> do seu painel Supabase. Estes scripts criam a estrutura necessária para o funcionamento de todos os módulos.</p>
                    </div>

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden group">
                        <div className="absolute top-2 right-4 z-20 flex gap-2">
                            <button 
                                onClick={() => {
                                    const script = activeTab === 'full' ? fullInitScript : 
                                                 activeTab === 'triggers' ? triggersScript :
                                                 activeTab === 'functions' ? functionsScript : 
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
                            {activeTab === 'triggers' && <pre className="whitespace-pre-wrap text-yellow-300">{triggersScript}</pre>}
                            {activeTab === 'functions' && <pre className="whitespace-pre-wrap text-green-300">{functionsScript}</pre>}
                            {activeTab === 'security' && <pre className="whitespace-pre-wrap text-red-300">{securityScript}</pre>}
                            {activeTab === 'seeding' && <pre className="whitespace-pre-wrap text-purple-300">{seedingScript}</pre>}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">
                        Fechar Consola
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;