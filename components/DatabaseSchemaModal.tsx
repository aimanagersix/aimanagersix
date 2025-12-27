import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal, FaKey, FaEnvelope, FaExternalLinkAlt, FaListOl, FaPlay, FaFolderOpen, FaTrash, FaLock, FaExclamationCircle, FaUmbrellaBeach, FaClock, FaStethoscope, FaSpinner, FaBalanceScale } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * DB Manager UI - v45.0 (RPC & Type Fix)
 * -----------------------------------------------------------------------------
 * - FIX: Criação da função 'inspect_table_columns' via SQL Patch.
 * - FIX: Normalização do tipo 'resource_id' para UUID na tabela de contactos.
 * - AUDITORIA: Melhoria no log de diagnóstico.
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
                    report += `  DICA: Execute o Patch v45.0 para criar esta função.\n`;
                }
                report += `\n`;
            }

            report += `[3/3] ANÁLISE DE CONTACTOS ADICIONAIS:\n`;
            try {
                const cols = await dataService.fetchTableSchema('resource_contacts');
                const hasType = cols.some(c => c.column_name === 'resource_type');
                const hasId = cols.some(c => c.column_name === 'resource_id');
                const idType = cols.find(c => c.column_name === 'resource_id')?.data_type;
                
                if (hasType && hasId) {
                    report += ` ✅ Colunas principais presentes.\n`;
                    if (idType !== 'uuid') {
                        report += ` ⚠️ ATENÇÃO: resource_id é '${idType}', deveria ser 'uuid'.\n`;
                        report += ` Use o SQL Editor para: ALTER TABLE resource_contacts ALTER COLUMN resource_id TYPE uuid USING resource_id::uuid;\n`;
                    }
                } else {
                    report += ` ❌ ESTRUTURA INVÁLIDA detetada em resource_contacts.\n`;
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

    const automationPatch = `-- 🤖 AIMANAGER - AUTOMATION & FIX PATCH (v45.0)
-- Este script instala a função de diagnóstico e corrige a tabela de contactos.

-- 1. FUNÇÃO DE INSPEÇÃO DE SCHEMA (Necessária para o Diagnóstico)
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

-- 2. CORREÇÃO DE TIPO DE DADOS (resource_contacts)
-- Garante que o ID de ligação aceita UUIDs (Necessário para fornecedores)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resource_contacts' AND column_name = 'resource_id') THEN
        ALTER TABLE public.resource_contacts ALTER COLUMN resource_id TYPE uuid USING resource_id::uuid;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível converter resource_id automaticamente. Verifique se existem dados inválidos.';
END $$;

-- 3. REFORÇO DE POLÍTICAS RLS
DO $$ 
DECLARE 
    t text;
    tables_to_policy text[] := ARRAY[
        'resource_contacts', 'suppliers', 'institutions', 'entities', 'collaborators', 'equipment', 'tickets'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_policy LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- Permitir Leitura
        EXECUTE format('DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow read for authenticated users" ON public.%I FOR SELECT TO authenticated USING (true)', t);
        
        -- Permitir Escrita Total (Técnicos e Admins)
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow full access for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- 4. FUNÇÃO DE AUDITORIA NIS2
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

NOTIFY pgrst, 'reload schema';
COMMIT;`;

    const universalZeroScript = `-- SCRIPT UNIVERSAL DE INICIALIZAÇÃO... (Para reposição completa)`;

    return (
        <Modal title="Gestão de Infraestrutura (Enterprise)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('automation_patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'automation_patch' ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch Automação (v45.0)</button>
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-indigo-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('live_diag')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'live_diag' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaStethoscope /> Diagnóstico</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'automation_patch' && (
                        <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-lg mb-2">
                            <h4 className="text-brand-secondary font-bold flex items-center gap-2 text-sm uppercase mb-1"><FaRobot /> PATCH v45.0: CORREÇÃO RPC & SCHEMA</h4>
                            <p className="text-[11px] text-gray-300">Instala a função SQL de diagnóstico e garante que os contactos adicionais podem ser gravados sem erro de UUID.</p>
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