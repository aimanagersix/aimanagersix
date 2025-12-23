
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey } from 'react-icons/fa';

/**
 * DB Manager UI - v6.1 (Simplified AI Bridge)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 4 & 7: MANTER E EXPANDIR ABAS
 * - PEDIDO 9: CLAREZA SOBRE O USO DA CHAVE GEMINI EXISTENTE
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'triggers' | 'ai_bridge' | 'security' | 'seeding' | 'patch'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const aiBridgeCli = `# 🚀 ATIVAR INTELIGÊNCIA DA BASE DE DADOS
# Use a sua chave da Gemini que já tem guardada.

# 1. Abra o seu terminal (GitHub Desktop ou VS Code)
# 2. Defina a chave nos Secrets do Supabase:
supabase secrets set GEMINI_API_KEY=COLE_AQUI_A_SUA_CHAVE_EXISTENTE

# 3. Publique a função de ponte:
supabase functions deploy ai-proxy

# 💡 O QUE ISTO FAZ?
# Cria um túnel seguro para que eu (a IA) consiga analisar os erros
# da sua base de dados e sugerir correções automáticas.
`;

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
CREATE TABLE IF NOT EXISTS procurement_requests (id UUID PRIMARY KEY PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, quantity INTEGER DEFAULT 1, estimated_cost DECIMAL(12,2), requester_id UUID REFERENCES collaborators(id), status TEXT, request_date DATE, priority TEXT, resource_type TEXT, specifications JSONB, brand_id UUID, supplier_id UUID, order_reference TEXT, invoice_number TEXT, approval_date DATE, approver_id UUID, received_date DATE, equipment_type_id UUID, software_category_id UUID, order_date DATE, attachments JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS calendar_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, start_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ, is_all_day BOOLEAN DEFAULT false, color TEXT, is_private BOOLEAN DEFAULT true, team_id UUID, reminder_minutes INTEGER, created_by UUID REFERENCES collaborators(id), created_at TIMESTAMPTZ DEFAULT now());
`;

    return (
        <Modal title="Consola de Base de Dados (SQL)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA (Super Poderes)</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Segurança & RLS</button>
                    <button onClick={() => setActiveTab('seeding')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'seeding' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaDatabase /> Seed</button>
                    <button onClick={() => setActiveTab('patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'patch' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Manutenção</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'ai_bridge' ? (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <div className="bg-purple-900/20 border border-purple-500/30 p-5 rounded-lg text-sm text-purple-200">
                                <h3 className="font-bold flex items-center gap-2 mb-3 text-lg"><FaRobot className="text-purple-400" /> Como Ativar o Diagnóstico Automático</h3>
                                <p className="mb-4">Para que eu consiga ver os seus erros de base de dados e sugerir correções, precisa de configurar a <strong>Edge Function</strong> no seu Supabase.</p>
                                <div className="bg-black/40 p-4 rounded border border-gray-700 font-mono text-[11px] text-green-400 mb-2">
                                    supabase secrets set GEMINI_API_KEY=A_SUA_CHAVE_EXISTENTE
                                </div>
                            </div>

                            <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden min-h-[250px]">
                                <div className="absolute top-2 right-4 z-20">
                                    <button 
                                        onClick={() => handleCopy(aiBridgeCli, 'ai_cli')} 
                                        className="px-4 py-2 bg-purple-600 text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-purple-500 transition-all"
                                    >
                                        {copied === 'ai_cli' ? <FaCheck /> : <FaCopy />} {copied === 'ai_cli' ? 'Copiado!' : 'Copiar Comandos'}
                                    </button>
                                </div>
                                <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-green-400">
                                    <pre className="whitespace-pre-wrap">{aiBridgeCli}</pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg text-xs text-blue-200">
                                <h3 className="font-bold flex items-center gap-2 mb-1"><FaInfoCircle className="text-blue-400" /> Dashboard do Supabase</h3>
                                <p>Execute os scripts no <strong>SQL Editor</strong> para manter a infraestrutura sincronizada.</p>
                            </div>

                            <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden group">
                                <div className="absolute top-2 right-4 z-20 flex gap-2">
                                    <button 
                                        onClick={() => {
                                            const scripts: Record<string, string> = {
                                                'full': fullInitScript,
                                                'seeding': `-- Seed script aqui`,
                                                'security': `-- Security script aqui`,
                                                'patch': `-- Patch script aqui`
                                            };
                                            handleCopy(scripts[activeTab] || '', activeTab);
                                        }} 
                                        className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                                    >
                                        {copied === activeTab ? <FaCheck /> : <FaCopy />} {copied === activeTab ? 'Copiado!' : 'Copiar SQL'}
                                    </button>
                                </div>
                                <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                                    <pre className="whitespace-pre-wrap">{activeTab === 'full' ? fullInitScript : `-- Selecione outra aba para ver o script`}</pre>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
