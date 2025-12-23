import React, { useState } from 'react';
import Modal from './common/Modal';
/* Added FaPlay to imports */
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay } from 'react-icons/fa';

/**
 * DB Manager UI - v10.0 (Guided Infrastructure Implementation)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 9: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION AI-PROXY.
 * - PEDIDO 8: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION ADMIN-AUTH-HELPER (V6).
 * - PEDIDO 4: SCRIPT UNIVERSAL "ABSOLUTE ZERO" COM GUIA DE EXECUÇÃO MANUAL.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'ai_bridge' | 'auth_helper'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const universalZeroScript = `-- 🛡️ AIMANAGER - SCRIPT UNIVERSAL "ABSOLUTE ZERO" (v10.0)
-- Este script reconstrói a base de dados completa para compatibilidade MCP.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 2. DICIONÁRIOS E CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS global_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS config_custom_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, permissions JSONB DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS config_job_titles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
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
CREATE TABLE IF NOT EXISTS config_collaborator_deactivation_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_training_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_resilience_test_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS config_service_statuses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS contact_titles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS contact_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL);

-- 3. ESTRUTURA ORGANIZACIONAL
CREATE TABLE IF NOT EXISTS institutions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, codigo TEXT UNIQUE, email TEXT, telefone TEXT, nif TEXT, website TEXT, address_line TEXT, postal_code TEXT, city TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS entities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), instituicao_id UUID REFERENCES institutions(id) ON DELETE CASCADE, codigo TEXT UNIQUE, name TEXT NOT NULL, email TEXT, status TEXT DEFAULT 'Ativo', address_line TEXT, city TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS collaborators (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, role TEXT DEFAULT 'Utilizador', status TEXT DEFAULT 'Ativo', can_login BOOLEAN DEFAULT false, instituicao_id UUID REFERENCES institutions(id), entidade_id UUID REFERENCES entities(id), job_title_id UUID REFERENCES config_job_titles(id), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), password_updated_at TIMESTAMPTZ, telemovel TEXT, photo_url TEXT);
CREATE TABLE IF NOT EXISTS suppliers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, nif TEXT, website TEXT, contact_name TEXT, contact_email TEXT, risk_level TEXT DEFAULT 'Baixa', is_iso27001_certified BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS resource_contacts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resource_type TEXT, resource_id UUID, name TEXT NOT NULL, role TEXT, email TEXT, phone TEXT, is_active BOOLEAN DEFAULT true);

-- 4. ATIVOS E INVENTÁRIO
CREATE TABLE IF NOT EXISTS brands (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, risk_level TEXT DEFAULT 'Baixa', is_iso27001_certified BOOLEAN DEFAULT false);
CREATE TABLE IF NOT EXISTS equipment_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, requires_nome_na_rede BOOLEAN DEFAULT false, requires_mac_wifi BOOLEAN DEFAULT false, requires_mac_cabo BOOLEAN DEFAULT false, requires_inventory_number BOOLEAN DEFAULT false, requires_backup_test BOOLEAN DEFAULT false, requires_location BOOLEAN DEFAULT false, is_maintenance BOOLEAN DEFAULT false, requires_ip BOOLEAN DEFAULT false);
CREATE TABLE IF NOT EXISTS equipment (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), brand_id UUID REFERENCES brands(id), type_id UUID REFERENCES equipment_types(id), serial_number TEXT UNIQUE, inventory_number TEXT, description TEXT, status TEXT DEFAULT 'Stock', purchase_date DATE, warranty_end_date DATE, acquisition_cost DECIMAL(12,2), nome_na_rede TEXT, os_version TEXT, ip_address TEXT, mac_address_wifi TEXT, mac_address_cabo TEXT, last_security_update DATE, parent_equipment_id UUID REFERENCES equipment(id), procurement_request_id UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE, collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL, entidade_id UUID REFERENCES entities(id) ON DELETE SET NULL, assigned_date DATE DEFAULT CURRENT_DATE, return_date DATE);
CREATE TABLE IF NOT EXISTS software_licenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_name TEXT NOT NULL, license_key TEXT, total_seats INTEGER DEFAULT 1, status TEXT DEFAULT 'Ativo', unit_cost DECIMAL(12,2), is_oem BOOLEAN DEFAULT false, category_id UUID REFERENCES config_software_categories(id), expiry_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS license_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), software_license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE, equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE, assigned_date DATE DEFAULT CURRENT_DATE, return_date DATE);

-- 5. SUPORTE
CREATE TABLE IF NOT EXISTS teams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS team_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID REFERENCES teams(id) ON DELETE CASCADE, collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS ticket_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true, is_security BOOLEAN DEFAULT false, default_team_id UUID REFERENCES teams(id));
CREATE TABLE IF NOT EXISTS security_incident_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS tickets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'Pedido', category TEXT, request_date TIMESTAMPTZ DEFAULT now(), finish_date TIMESTAMPTZ, collaborator_id UUID REFERENCES collaborators(id), technician_id UUID REFERENCES collaborators(id), team_id UUID REFERENCES teams(id), equipment_id UUID REFERENCES equipment(id), impact_criticality TEXT DEFAULT 'Baixa', security_incident_type TEXT);
CREATE TABLE IF NOT EXISTS ticket_activities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE, description TEXT, date TIMESTAMPTZ DEFAULT now(), technician_id UUID REFERENCES collaborators(id));
CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id UUID, receiver_id UUID, content TEXT, timestamp TIMESTAMPTZ DEFAULT now(), read BOOLEAN DEFAULT false);

-- 6. COMPLIANCE (NIS2 / DORA)
CREATE TABLE IF NOT EXISTS business_services (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, criticality TEXT DEFAULT 'Baixa', rto_goal TEXT, status TEXT DEFAULT 'Ativo');
CREATE TABLE IF NOT EXISTS service_dependencies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), service_id UUID REFERENCES business_services(id) ON DELETE CASCADE, equipment_id UUID REFERENCES equipment(id), software_license_id UUID REFERENCES software_licenses(id));
CREATE TABLE IF NOT EXISTS vulnerabilities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cve_id TEXT NOT NULL, severity TEXT, status TEXT DEFAULT 'Open', affected_assets TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS backup_executions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), system_name TEXT NOT NULL, equipment_id UUID REFERENCES equipment(id), test_date DATE NOT NULL, status TEXT, type TEXT, restore_time_minutes INTEGER, tester_id UUID REFERENCES collaborators(id), attachments JSONB DEFAULT '[]'::jsonb);
CREATE TABLE IF NOT EXISTS resilience_tests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, test_type TEXT, planned_date DATE, status TEXT, summary_findings TEXT, attachments JSONB DEFAULT '[]'::jsonb);
CREATE TABLE IF NOT EXISTS security_trainings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), collaborator_id UUID REFERENCES collaborators(id), training_type TEXT, completion_date DATE, status TEXT, score INTEGER);
CREATE TABLE IF NOT EXISTS policies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, content TEXT, version TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS policy_acceptances (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), policy_id UUID REFERENCES policies(id), collaborator_id UUID REFERENCES collaborators(id), accepted_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), timestamp TIMESTAMPTZ DEFAULT now(), action TEXT NOT NULL, resource_type TEXT, resource_id UUID, user_email TEXT, details TEXT);

-- 7. INFRAESTRUTURA ADICIONAL
CREATE TABLE IF NOT EXISTS procurement_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, status TEXT DEFAULT 'Pendente', quantity INTEGER, estimated_cost DECIMAL(12,2), request_date DATE);
CREATE TABLE IF NOT EXISTS calendar_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, start_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ, created_by UUID REFERENCES collaborators(id));
CREATE TABLE IF NOT EXISTS continuity_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, service_id UUID REFERENCES business_services(id), last_review_date DATE, owner_id UUID REFERENCES collaborators(id));

-- 8. TRIGGERS E FUNÇÕES ESSENCIAIS
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE 'plpgsql';
CREATE TRIGGER update_eq_modtime BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- SINCRONIZAÇÃO AUTH -> PUBLIC
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.collaborators (id, full_name, email, role, status, can_login)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), new.email, 'Utilizador', 'Ativo', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. METADADOS PARA MCP (INSPEÇÃO)
CREATE OR REPLACE FUNCTION get_db_policies() RETURNS TABLE(tablename text, policyname text, cmd text, roles text[]) AS $$
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_db_triggers() RETURNS TABLE(trigger_name text, event_object_table text, action_statement text) AS $$
SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_db_functions() RETURNS TABLE(routine_name text, routine_type text) AS $$
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
$$ LANGUAGE sql SECURITY DEFINER;

-- 10. SEGURANÇA GLOBAL (RLS)
DO $$ 
DECLARE t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow management for authenticated users" ON %I', t);
        EXECUTE format('CREATE POLICY "Allow management for authenticated users" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- 11. DADOS SEMENTE
INSERT INTO teams (name, is_active) VALUES ('Triagem', true) ON CONFLICT DO NOTHING;
INSERT INTO config_equipment_statuses (name, color) VALUES ('Operacional', '#22c55e'), ('Stock', '#3b82f6'), ('Abate', '#ef4444') ON CONFLICT DO NOTHING;
INSERT INTO config_ticket_statuses (name, color) VALUES ('Pedido', '#fbbf24'), ('Em progresso', '#60a5fa'), ('Finalizado', '#4ade80') ON CONFLICT DO NOTHING;
`;

    const aiProxyCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada nos Secrets do Supabase.')

    const { model, prompt, images, config } = await req.json()
    const ai = new GoogleGenAI({ apiKey })
    const parts = []
    if (images) images.forEach(img => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }))
    if (prompt) parts.push({ text: prompt })

    const response = await ai.models.generateContent({
        model: model || 'gemini-3-flash-preview',
        contents: { parts },
        config: config || {}
    })

    return new Response(JSON.stringify({ text: response.text || "" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
    })
  }
})`;

    const authHelperCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !key) {
      throw new Error('Variáveis de ambiente (URL/KEY) não configuradas.')
    }

    const supabaseAdmin = createClient(url, key)
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim().toLowerCase();
    const targetUserId = body.targetUserId;
    const newPassword = body.newPassword;

    if (action === 'update_password') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
      if (error) throw error
      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
    throw new Error(\`Ação "\${action}" não suportada.\`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})`;

    return (
        <Modal title="Gestão de Infraestrutura (Absolute Zero)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização Universal (v10.0)</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA (Deno)</button>
                    <button onClick={() => setActiveTab('auth_helper')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'auth_helper' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaKey /> Gestão Auth (Deno)</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    
                    {activeTab === 'full' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-shrink-0">
                            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex flex-col gap-2">
                                <h4 className="text-blue-300 font-bold flex items-center gap-2 text-sm"><FaListOl /> 1. Preparar</h4>
                                <p className="text-[11px] text-gray-400">Abra o seu projeto no <strong>Supabase Dashboard</strong> e clique em <strong>"SQL Editor"</strong>.</p>
                            </div>
                            <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg flex flex-col gap-2">
                                <h4 className="text-purple-300 font-bold flex items-center gap-2 text-sm"><FaCopy /> 2. Copiar</h4>
                                <p className="text-[11px] text-gray-400">Clique no botão <strong>"Copiar SQL"</strong> abaixo para obter o script universal v10.0.</p>
                            </div>
                            <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg flex flex-col gap-2">
                                <h4 className="text-green-300 font-bold flex items-center gap-2 text-sm"><FaPlay /> 3. Executar</h4>
                                <p className="text-[11px] text-gray-400">Cole o código no Supabase e clique em <strong>"Run"</strong>. Todas as 42 tabelas serão criadas.</p>
                            </div>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="absolute top-2 right-4 z-20">
                            <button 
                                onClick={() => {
                                    const code = activeTab === 'full' ? universalZeroScript : (activeTab === 'ai_bridge' ? aiProxyCode : authHelperCode);
                                    handleCopy(code, activeTab);
                                }} 
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                            >
                                {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar SQL
                            </button>
                        </div>
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">{activeTab === 'full' ? universalZeroScript : (activeTab === 'ai_bridge' ? aiProxyCode : authHelperCode)}</pre>
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