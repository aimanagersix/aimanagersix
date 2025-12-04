import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling } from 'react-icons/fa';
import { generatePlaywrightTest, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'update' | 'cleanup' | 'seed' | 'triggers' | 'playwright_ai'>('update');
    
    // Playwright AI State
    const [testRequest, setTestRequest] = useState('');
    const [generatedTest, setGeneratedTest] = useState('');
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [testEmail, setTestEmail] = useState('josefsmoreira@outlook.com');
    const [testPassword, setTestPassword] = useState('QSQmZf62!');
    
    // Triggers State
    const [triggers, setTriggers] = useState<any[]>([]);
    const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);

    // Seed State
    const [isSeeding, setIsSeeding] = useState(false);

    const aiConfigured = isAiConfigured();

    const updateScript = `
-- ==================================================================================
-- SCRIPT DE CORREÇÃO DE ESTRUTURA E SEGURANÇA v3.2
-- Resolve erro: column "user_email" of relation "audit_logs" does not exist
-- ==================================================================================

-- 1. EXTENSÕES E FUNÇÕES BÁSICAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net"; 

-- 2. CORREÇÃO DA ESTRUTURA DA TABELA AUDIT_LOGS (CRÍTICO)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    action text,
    resource_type text,
    resource_id text,
    details text,
    timestamp timestamptz DEFAULT now()
);

-- Adicionar coluna user_email se não existir (Migração)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_email') THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_email text;
    END IF;
END $$;

-- 3. FUNÇÕES DE PERMISSÕES
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collaborators 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'SuperAdmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_tech()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collaborators 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'SuperAdmin', 'Técnico')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função RPC para ler Triggers (Frontend)
CREATE OR REPLACE FUNCTION get_database_triggers()
RETURNS TABLE (
    table_name text,
    trigger_name text,
    events text,
    timing text,
    definition text
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, information_schema
AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_object_table::text,
        trigger_name::text,
        event_manipulation::text,
        action_timing::text,
        action_statement::text
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
END;
$$;
GRANT EXECUTE ON FUNCTION get_database_triggers() TO authenticated;

-- ==========================================
-- 4. RLS - POLÍTICAS DE SEGURANÇA
-- ==========================================

-- Habilitar RLS em todas as tabelas públicas
DO $$ 
DECLARE t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
    END LOOP;
END $$;

-- *** Tabela Collaborators ***
DROP POLICY IF EXISTS "Collab Base Read" ON collaborators;
DROP POLICY IF EXISTS "Collab Admin Write" ON collaborators;
DROP POLICY IF EXISTS "Collab Admin Update" ON collaborators;
DROP POLICY IF EXISTS "Collab Admin Delete" ON collaborators;
-- Limpar políticas legadas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collaborators;
DROP POLICY IF EXISTS "Allow all" ON collaborators;

CREATE POLICY "Collab Base Read" ON collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Collab Admin Write" ON collaborators FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Collab Admin Update" ON collaborators FOR UPDATE USING (is_admin() OR id = auth.uid());
CREATE POLICY "Collab Admin Delete" ON collaborators FOR DELETE USING (is_admin());

-- *** Organização (Instituições, Entidades) ***
DROP POLICY IF EXISTS "Org Instituicoes Read" ON instituicoes;
DROP POLICY IF EXISTS "Org Instituicoes Write" ON instituicoes;
CREATE POLICY "Org Instituicoes Read" ON instituicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Org Instituicoes Write" ON instituicoes FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Org Entidades Read" ON entidades;
DROP POLICY IF EXISTS "Org Entidades Write" ON entidades;
CREATE POLICY "Org Entidades Read" ON entidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Org Entidades Write" ON entidades FOR ALL TO authenticated USING (is_admin_or_tech());

-- *** Tabelas Auxiliares ***
DO $$ 
DECLARE t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_name IN ('teams', 'team_members', 'suppliers', 'resource_contacts')
    LOOP 
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Aux Read" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Aux Write" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Aux Read" ON %I FOR SELECT TO authenticated USING (true);', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Aux Write" ON %I FOR ALL TO authenticated USING (is_admin_or_tech());', t); EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- *** Tabelas de Configuração ***
DO $$ 
DECLARE t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'config_%' OR table_name LIKE 'contact_%' OR table_name IN ('brands', 'equipment_types', 'ticket_categories', 'security_incident_types')
    LOOP 
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Config Read" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Config Write" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Config Read" ON %I FOR SELECT TO authenticated USING (true);', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Config Write" ON %I FOR ALL TO authenticated USING (is_admin_or_tech());', t); EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- *** Tabelas Operacionais ***
DO $$ 
DECLARE t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_name IN ('equipment', 'assignments', 'software_licenses', 'license_assignments', 'procurement_requests', 'backup_executions', 'resilience_tests', 'vulnerabilities')
    LOOP
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Ops Read" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('DROP POLICY IF EXISTS "Ops Write" ON %I;', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Ops Read" ON %I FOR SELECT TO authenticated USING (true);', t); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN EXECUTE format('CREATE POLICY "Ops Write" ON %I FOR ALL TO authenticated USING (is_admin_or_tech());', t); EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- Tickets (Permissões especiais)
DROP POLICY IF EXISTS "Tickets Read" ON tickets;
DROP POLICY IF EXISTS "Tickets Write" ON tickets;
CREATE POLICY "Tickets Read" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tickets Write" ON tickets FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Ticket Activities Read" ON ticket_activities;
DROP POLICY IF EXISTS "Ticket Activities Write" ON ticket_activities;
CREATE POLICY "Ticket Activities Read" ON ticket_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ticket Activities Write" ON ticket_activities FOR ALL TO authenticated USING (true);

-- *** Audit Logs ***
DROP POLICY IF EXISTS "Audit Read Admin" ON audit_logs;
DROP POLICY IF EXISTS "Audit System Insert" ON audit_logs;
CREATE POLICY "Audit Read Admin" ON audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Audit System Insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- *** Global Settings ***
DROP POLICY IF EXISTS "Settings Read" ON global_settings;
DROP POLICY IF EXISTS "Settings Write" ON global_settings;
CREATE POLICY "Settings Read" ON global_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings Write" ON global_settings FOR ALL TO authenticated USING (is_admin());

-- ==========================================
-- 5. AUDIT LOG TRIGGER (ATUALIZADO)
-- ==========================================
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger AS $$
DECLARE
  uid uuid;
  uemail text;
BEGIN
  uid := auth.uid();
  BEGIN
    -- Tenta buscar o email na tabela collaborators
    SELECT email INTO uemail FROM public.collaborators WHERE id = uid;
  EXCEPTION WHEN OTHERS THEN
    uemail := 'unknown';
  END;
  
  -- Tenta fallback se collaborators estiver vazio mas auth.uid existir (ex: admin console)
  IF uemail IS NULL AND uid IS NOT NULL THEN
     uemail := 'System/Admin';
  END IF;

  INSERT INTO public.audit_logs (user_id, user_email, action, resource_type, resource_id, details)
  VALUES (
    uid,
    uemail,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP || ' on ' || TG_TABLE_NAME
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar Trigger
DO $$ 
DECLARE t text;
BEGIN 
    FOREACH t IN ARRAY ARRAY['equipment', 'collaborators', 'tickets', 'software_licenses', 'instituicoes', 'entidades', 'brands']
    LOOP 
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %I;', t);
            EXECUTE format('CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION log_audit_event();', t);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- CRÍTICO: FORÇAR RECARREGAMENTO DA CACHE DO POSTGREST
NOTIFY pgrst, 'reload config';
`;

    const cleanupScript = `
-- ==========================================
-- SCRIPT DE LIMPEZA SAFE-MODE
-- ==========================================
-- Apaga dados mas mantém utilizadores SuperAdmin

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
DELETE FROM instituicoes;
DELETE FROM entidades;

-- Limpar utilizadores normais
DELETE FROM collaborators WHERE role != 'SuperAdmin';

-- Limpar Auth Users órfãos (que já não estão na tabela collaborators)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.collaborators)
AND email != 'general@system.local';
`;

    const seedScript = `
-- ==========================================
-- SCRIPT DE SEED (DADOS DE TESTE)
-- ==========================================

-- 1. Instituições e Entidades
INSERT INTO instituicoes (id, name, email, telefone, codigo, is_active) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TechCorp Global', 'admin@techcorp.com', '210000000', 'TCG', true);

INSERT INTO entidades (id, instituicaoId, name, codigo, email, status) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Departamento TI', 'TI-HQ', 'it@techcorp.com', 'Ativo'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Recursos Humanos', 'RH-HQ', 'hr@techcorp.com', 'Ativo');

-- 2. Configurações Básicas
INSERT INTO brands (name) VALUES ('Dell'), ('HP'), ('Apple'), ('Lenovo'), ('Logitech') ON CONFLICT DO NOTHING;
INSERT INTO equipment_types (name, "requiresNomeNaRede") VALUES ('Laptop', true), ('Monitor', false), ('Telemóvel', false) ON CONFLICT DO NOTHING;

-- 3. Equipamentos de Exemplo
-- Nota: Requer IDs válidos de marcas e tipos. Se falhar, execute manualmente ajustando os UUIDs.
-- O ideal é usar a interface da aplicação para criar equipamentos para garantir integridade.
`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const loadTriggers = async () => {
        setIsLoadingTriggers(true);
        setTriggerError(null);
        try {
            // dataService.fetchDatabaseTriggers now returns { data, error }
            const { data, error } = await dataService.fetchDatabaseTriggers();
            
            if (error) {
                console.error("Error fetching triggers RPC:", error);
                if (error.code === '42883' || error.message?.includes('does not exist') || error.message?.includes('not found')) {
                     setTriggerError("A função 'get_database_triggers' não foi encontrada. A cache da API pode estar desatualizada. Execute o script 'Atualizar BD' novamente, que inclui o comando 'NOTIFY pgrst' para forçar a atualização.");
                } else if (error.code === '42501' || error.message?.includes('permission denied')) {
                     setTriggerError("Permissão negada. Verifique se o utilizador tem permissão para executar a função (GRANT EXECUTE).");
                } else {
                     setTriggerError(`Erro desconhecido: ${error.message || JSON.stringify(error)}`);
                }
                setTriggers([]);
            } else {
                setTriggers(data || []);
                if (!data || data.length === 0) {
                    // Not an error, just empty
                    setTriggerError(null); 
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch triggers (exception)", error);
            setTriggerError("Erro de rede ou exceção ao contactar base de dados: " + (error.message));
        } finally {
            setIsLoadingTriggers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'triggers') {
            loadTriggers();
        }
    }, [activeTab]);

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
        <Modal title="Configuração de Base de Dados & Ferramentas" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-700 mb-4 gap-2 flex-wrap bg-gray-900/50 p-2 rounded-t-lg">
                     <button 
                        onClick={() => setActiveTab('update')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'update' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaDatabase /> Atualizar BD (Schema)
                    </button>
                    <button 
                        onClick={() => setActiveTab('seed')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'seed' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaSeedling /> Dados de Teste (Seed)
                    </button>
                    <button 
                        onClick={() => setActiveTab('triggers')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'triggers' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBolt /> Triggers Ativos
                    </button>
                    <button 
                        onClick={() => setActiveTab('cleanup')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'cleanup' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaBroom /> Limpeza & Reset
                    </button>
                    <button 
                        onClick={() => setActiveTab('playwright_ai')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'playwright_ai' ? 'border-brand-secondary text-white bg-gray-800 rounded-t' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        <FaRobot /> Gerador de Testes E2E
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 p-1">
                    
                    {/* UPDATE TAB */}
                    {activeTab === 'update' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-2 text-lg">
                                    <FaExclamationTriangle /> AÇÃO NECESSÁRIA: CORREÇÃO DE PERMISSÕES & CACHE
                                </div>
                                <p className="mb-2">
                                    Se está a ter problemas a gravar dados ou a carregar triggers, execute este script.
                                    Ele inclui um comando <strong>NOTIFY pgrst</strong> que força o Supabase a atualizar a cache da API e cria a coluna <strong>user_email</strong> na tabela de auditoria.
                                </p>
                                <ol className="list-decimal list-inside ml-2 space-y-1">
                                    <li>Copie o código SQL abaixo.</li>
                                    <li>Vá ao <strong>SQL Editor</strong> do Supabase.</li>
                                    <li>Cole e execute o script completo.</li>
                                </ol>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-[500px] custom-scrollbar border border-gray-700">
                                    {updateScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(updateScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors shadow-lg"
                                    title="Copiar SQL"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* SEED TAB */}
                    {activeTab === 'seed' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200 mb-2">
                                <div className="flex items-center gap-2 font-bold mb-1"><FaSeedling /> Povoar Base de Dados</div>
                                <p>
                                    Use este script para inserir dados iniciais de exemplo (Instituições, Entidades e Configurações Básicas) caso a aplicação esteja vazia.
                                </p>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-yellow-300 overflow-auto max-h-96 custom-scrollbar border border-gray-700">
                                    {seedScript}
                                </pre>
                                <button 
                                    onClick={() => handleCopy(seedScript)} 
                                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors"
                                    title="Copiar SQL de Seed"
                                >
                                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* TRIGGERS TAB */}
                    {activeTab === 'triggers' && (
                         <div className="space-y-4 animate-fade-in">
                             <div className="flex justify-between items-center mb-2 bg-gray-800 p-3 rounded border border-gray-700">
                                <div className="text-sm text-gray-300">
                                    <p>Lista de automações ativas na base de dados (Auditoria, Slack, etc.).</p>
                                </div>
                                <button onClick={loadTriggers} className="flex items-center gap-2 text-sm bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded shadow transition-colors">
                                    <FaSync className={isLoadingTriggers ? "animate-spin" : ""} /> Atualizar Lista
                                </button>
                             </div>
                             
                             {isLoadingTriggers ? (
                                 <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                                     <FaSpinner className="animate-spin text-3xl mb-4 text-brand-secondary"/>
                                     <p>A consultar base de dados...</p>
                                 </div>
                             ) : triggerError ? (
                                 <div className="p-6 text-center bg-red-900/20 rounded border border-red-500/50 text-red-200">
                                     <FaExclamationTriangle className="text-3xl mx-auto mb-3 text-red-500"/>
                                     <p className="font-bold mb-2">Erro ao carregar triggers</p>
                                     <p className="text-sm">{triggerError}</p>
                                 </div>
                             ) : triggers.length > 0 ? (
                                 <div className="overflow-x-auto border border-gray-700 rounded-lg shadow-lg">
                                     <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                                         <thead className="bg-gray-800 text-gray-300 uppercase text-xs">
                                             <tr>
                                                 <th className="px-4 py-3">Tabela</th>
                                                 <th className="px-4 py-3">Nome do Trigger</th>
                                                 <th className="px-4 py-3">Evento</th>
                                                 <th className="px-4 py-3">Timing</th>
                                                 <th className="px-4 py-3">Definição</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-700 bg-gray-900">
                                             {triggers.map((t, idx) => (
                                                 <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                                     <td className="px-4 py-3 font-bold text-white">{t.table_name}</td>
                                                     <td className="px-4 py-3 font-mono text-xs text-brand-secondary">{t.trigger_name}</td>
                                                     <td className="px-4 py-3">
                                                         <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">{t.events}</span>
                                                     </td>
                                                     <td className="px-4 py-3">{t.timing}</td>
                                                     <td className="px-4 py-3 text-xs font-mono text-gray-500 truncate max-w-xs" title={t.definition}>
                                                         {t.definition}
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             ) : (
                                 <div className="p-8 text-center bg-gray-900/50 rounded border border-dashed border-gray-700">
                                     <p className="text-gray-400 mb-2">Nenhum trigger detetado (Array vazio).</p>
                                     <p className="text-xs text-gray-500">Isto é normal se a base de dados estiver vazia ou se o trigger de auditoria não tiver sido criado.</p>
                                 </div>
                             )}
                         </div>
                    )}
                    
                    {/* CLEANUP TAB */}
                    {activeTab === 'cleanup' && (
                        <div className="space-y-4 animate-fade-in">
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

                    {/* PLAYWRIGHT AI TAB */}
                    {activeTab === 'playwright_ai' && (
                        <div className="space-y-4 animate-fade-in p-1">
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

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto bg-gray-900/80 p-4 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors shadow-lg">
                        Fechar Janela
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
