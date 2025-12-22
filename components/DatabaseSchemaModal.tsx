import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch } from 'react-icons/fa';

/**
 * DB Manager UI - V4.1 (Full Tab Restoration)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 4 & 8: MANTER TODAS AS ABAS (Inicialização, Triggers, Funções, Segurança, Seed)
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

    const fullInitScript = `-- 1. TABELAS BASE (REDUZIDO PARA EXEMPLO NO MODAL)
CREATE TABLE IF NOT EXISTS config_custom_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, permissions JSONB DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS institutions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, codigo TEXT UNIQUE, address_line TEXT, postal_code TEXT, city TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS entities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), instituicao_id UUID REFERENCES institutions(id), name TEXT NOT NULL, codigo TEXT UNIQUE, status TEXT DEFAULT 'Ativo');
CREATE TABLE IF NOT EXISTS collaborators (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, role TEXT DEFAULT 'Utilizador', status TEXT DEFAULT 'Ativo', address_line TEXT);
CREATE TABLE IF NOT EXISTS teams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS ticket_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT true, is_security BOOLEAN DEFAULT false, default_team_id UUID REFERENCES teams(id));
`;

    const triggersScript = `-- 2. TRIGGERS DE AUDITORIA E ATUALIZAÇÃO
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_institutions_modtime BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_entities_modtime BEFORE UPDATE ON entities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_collaborators_modtime BEFORE UPDATE ON collaborators FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
`;

    const functionsScript = `-- 3. FUNÇÕES RPC (INSPEÇÃO DE SCHEMA)
CREATE OR REPLACE FUNCTION get_db_policies() RETURNS TABLE(tablename text, policyname text, cmd text, roles text[]) AS $$
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_db_triggers() RETURNS TABLE(trigger_name text, event_object_table text, action_statement text) AS $$
SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public';
$$ LANGUAGE sql SECURITY DEFINER;
`;

    const securityScript = `-- 4. FIX RLS V4.1 (Permissões de Escrita para Equipes e Categorias)
DO $$ 
DECLARE 
    t text;
    tables_to_fix text[] := ARRAY[
        'teams', 'team_members', 'ticket_categories', 'security_incident_types',
        'collaborators', 'entities', 'institutions', 'brands', 'equipment_types',
        'equipment', 'tickets', 'messages', 'config_custom_roles', 'config_job_titles',
        'contact_titles', 'contact_roles', 'config_software_categories', 'config_software_products'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access for authenticated" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow management for authenticated users" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow management for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
`;

    const seedingScript = `-- 5. SEED DE DADOS INICIAIS
INSERT INTO ticket_categories (name, is_active) VALUES ('Hardware / Avaria', true), ('Software / Instalação', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO teams (name, description, is_active) VALUES ('Triagem', 'Análise inicial de tickets', true) ON CONFLICT (name) DO NOTHING;
`;

    return (
        <Modal title="Configuração Avançada de Base de Dados" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('triggers')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'triggers' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Triggers</button>
                    <button onClick={() => setActiveTab('functions')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'functions' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSearch /> Funções</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Segurança (FIX)</button>
                    <button onClick={() => setActiveTab('seeding')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'seeding' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaDatabase /> Seed</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg text-xs text-red-200">
                        <h3 className="font-bold flex items-center gap-2 mb-1"><FaExclamationTriangle className="text-yellow-500" /> Reparação de Permissões (Pedido 7)</h3>
                        <p>Se não consegue criar equipas ou categorias, execute o script na aba <strong>"Segurança (FIX)"</strong>. Isto restaurará o acesso total (CRUD) para utilizadores autenticados.</p>
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
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;