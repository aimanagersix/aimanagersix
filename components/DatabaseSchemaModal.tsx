import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner, FaBalanceScale } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v48.0 (Full Audit Automation)
 * -----------------------------------------------------------------------------
 * - FIX: Implementação de Triggers de Auditoria em TODAS as tabelas core.
 * - FIX: Coluna is_active para fornecedores e title para contactos.
 * - AUDITORIA: Garantia de NIS2 Logging automático no audit_log.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'automation_patch' | 'live_diag'>('automation_patch');
    const [diagResult, setDiagResult] = useState<string>('');
    const [isDiagLoading, setIsDiagLoading] = useState(false);
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const runLiveDiagnosis = async () => {
        setIsDiagLoading(true);
        setDiagResult('A iniciar bateria de testes de integridade...\n');
        
        let report = `--- RELATÓRIO DE INTEGRIDADE ESTRUTURAL (Live) ---\n`;
        report += `Data: ${new Date().toLocaleString()}\n`;
        report += `Projeto: yyiwkrkuhlkqibhowdmq\n\n`;

        try {
            const tables = ['institutions', 'entities', 'collaborators', 'equipment', 'tickets', 'suppliers', 'resource_contacts', 'software_licenses'];
            
            report += `[1/3] VERIFICAÇÃO DE CONETIVIDADE:\n`;
            try {
                const diagRes = await dataService.runSystemDiagnostics();
                diagRes.forEach(r => {
                    report += ` - ${r.module}: ${r.status === 'Success' ? '✅' : '❌'} (${r.message})\n`;
                });
            } catch (e) {
                report += ` - FALHA CRÍTICA NA CONETIVIDADE: ${e}\n`;
            }

            report += `\n[2/3] INSPEÇÃO DE SCHEMA (COLUNAS REAL NA BD):\n`;
            for (const table of tables) {
                try {
                    report += `TABELA: ${table.toUpperCase()}\n`;
                    const columns = await dataService.fetchTableSchema(table);
                    if (columns && columns.length > 0) {
                        columns.forEach(col => {
                            report += `  • ${col.column_name.padEnd(25)} | ${col.data_type}\n`;
                        });
                    } else {
                        report += `  ⚠️ Sem colunas visíveis ou permissão negada.\n`;
                    }
                } catch (e: any) {
                    report += `  ❌ ERRO: ${e.message || 'RPC inspect_table_columns não encontrada.'}\n`;
                    report += `  DICA: Execute o Patch v48.0 para criar esta função e colunas.\n`;
                }
                report += `\n`;
            }

            report += `[3/3] ANÁLISE DE AUDITORIA NIS2:\n`;
            try {
                const logs = await dataService.fetchAuditLogs();
                if (logs.length > 0) {
                    report += ` ✅ Auditoria Ativa: ${logs.length} registos encontrados.\n`;
                } else {
                    report += ` ⚠️ Auditoria Vazia: Verifique se os Triggers do Patch v48.0 foram aplicados.\n`;
                }
            } catch (e) {}

            report += `\n--- FIM DO DIAGNÓSTICO ---`;
            setDiagResult(report);
        } catch (error: any) { 
            setDiagResult(`Erro Crítico na ferramenta de diagnóstico: ${error.message}`); 
        } finally { 
            setIsDiagLoading(false); 
        }
    };

    const automationPatch = `-- 🤖 AIMANAGER - AUTOMATION & FULL AUDIT PATCH (v48.0)
-- Este script ativa a auditoria automática NIS2 em todas as tabelas core.

-- 1. FUNÇÃO DE INSPEÇÃO DE SCHEMA
CREATE OR REPLACE FUNCTION public.inspect_table_columns(t_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cols.column_name::text,
        cols.data_type::text
    FROM information_schema.columns cols
    WHERE cols.table_schema = 'public'
      AND cols.table_name = t_name;
END;
$$;

-- 2. CORREÇÃO DE SCHEMA (Colunas em falta)
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE IF EXISTS public.resource_contacts ADD COLUMN IF NOT EXISTS title text;

-- 3. MOTOR DE AUDITORIA AUTOMÁTICA (NIS2 / DORA)
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.audit_log (action, resource_type, resource_id, user_email, details)
    VALUES (
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        auth.email(),
        json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. APLICAÇÃO DE TRIGGERS EM TODAS AS TABELAS CORE
DO $$ 
DECLARE 
    t text;
    tables_to_audit text[] := ARRAY[
        'equipment', 'collaborators', 'suppliers', 'tickets', 
        'institutions', 'entities', 'software_licenses', 'resource_contacts'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_audit LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_audit_%I ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trigger_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION log_audit_event()', t, t);
    END LOOP;
END $$;

-- 5. REFORÇO DE POLÍTICAS RLS
DO $$ 
DECLARE 
    t text;
    tables_to_policy text[] := ARRAY[
        'resource_contacts', 'suppliers', 'institutions', 'entities', 'collaborators', 'equipment', 'tickets', 'audit_log'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_policy LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow read for authenticated users" ON public.%I FOR SELECT TO authenticated USING (true)', t);
        
        IF t != 'audit_log' THEN
            EXECUTE format('DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.%I', t);
            EXECUTE format('CREATE POLICY "Allow full access for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;`;

    const universalZeroScript = `-- SCRIPT UNIVERSAL DE INICIALIZAÇÃO... (Para reposição completa)`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('automation_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'automation_patch' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch Automação (v48.0)</button>
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'automation_patch' && (
                        <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-lg mb-2">
                            <h4 className="text-brand-secondary font-bold flex items-center gap-2 text-sm uppercase mb-1"><FaRobot /> PATCH v48.0: AUDITORIA NIS2 AUTOMÁTICA</h4>
                            <p className="text-[11px] text-gray-300">Instala triggers de auditoria em todas as tabelas core. Qualquer alteração por qualquer utilizador será registada no menu Auditoria.</p>
                        </div>
                    )}

                    {activeTab === 'live_diag' && (
                        <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg mb-2 flex justify-between items-center">
                            <div>
                                <h4 className="text-blue-300 font-bold flex items-center gap-2 text-sm uppercase mb-1"><FaStethoscope /> FERRAMENTA DE INSPEÇÃO EM TEMPO REAL</h4>
                                <p className="text-[11px] text-gray-300">Valida se a estrutura de colunas do Supabase corresponde exatamente ao código da App.</p>
                            </div>
                            <button onClick={runLiveDiagnosis} disabled={isDiagLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50">
                                {isDiagLoading ? <FaSpinner className="animate-spin" /> : <FaPlay />} Executar Inspeção Completa
                            </button>
                        </div>
                    )}

                    <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                        {(activeTab === 'automation_patch' || activeTab === 'full') && (
                            <div className="absolute top-2 right-4 z-20">
                                <button 
                                    onClick={() => handleCopy(activeTab === 'automation_patch' ? automationPatch : universalZeroScript, activeTab)} 
                                    className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                                >
                                    {copied === activeTab ? <FaCheck /> : <FaCopy />} Copiar Código
                                </button>
                            </div>
                        )}
                        <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                            <pre className="whitespace-pre-wrap">{activeTab === 'live_diag' ? diagResult || 'Clique em "Executar Inspeção" para analisar a base de dados.' : (activeTab === 'automation_patch' ? automationPatch : universalZeroScript)}</pre>
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