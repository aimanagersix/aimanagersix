
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaSpinner, FaCheck, FaExclamationTriangle, FaCopy, FaTerminal } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [schemaInfo, setSchemaInfo] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchSchema = async () => {
            setIsLoading(true);
            try {
                // Mocking schema fetch or implementing actual logic
                // Since we can't easily get full schema via client without RLS/Permissions, 
                // we'll display the maintenance scripts mostly.
                setSchemaInfo("-- Esquema carregado (simulação) --\n-- Use o editor SQL do Supabase para ver detalhes completos.");
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchema();
    }, []);

    const maintenanceScript = `
-- ==================================================================================
-- SCRIPT DE MANUTENÇÃO E CORREÇÃO (v6.0)
-- Execute este script no SQL Editor do Supabase para corrigir permissões e estrutura.
-- ==================================================================================

-- 1. Tabelas de Configuração (Garantir Existência e RLS)
create table if not exists public.global_settings (
  setting_key text primary key,
  setting_value text
);
alter table public.global_settings enable row level security;
create policy "Allow read access for all users" on public.global_settings for select using (true);
create policy "Allow all access for admins" on public.global_settings for all using (
  exists (select 1 from public.collaborators where email = auth.jwt() ->> 'email' and role = 'SuperAdmin')
);

-- 2. Correção de Colunas em Tickets
alter table if exists public.tickets add column if not exists supplier_id uuid references public.suppliers(id);
alter table if exists public.tickets add column if not exists requester_supplier_id uuid references public.suppliers(id);

-- 3. Correção de Colunas em Equipamentos
alter table if exists public.equipment_types add column if not exists requires_ip boolean default false;
alter table if exists public.equipment add column if not exists ip_address text;

-- 4. Função de Logs (Audit)
create or replace function public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_details text,
  p_resource_id text default null
) returns void language plpgsql security definer as $$
begin
  insert into public.audit_logs (user_id, user_email, action, resource_type, resource_id, details)
  values (auth.uid(), auth.jwt() ->> 'email', p_action, p_resource_type, p_resource_id, p_details);
end;
$$;
`;

    const handleCopy = () => {
        navigator.clipboard.writeText(maintenanceScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal title="Configuração e Manutenção da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                    <div className="flex items-center gap-2 font-bold mb-2">
                        <FaDatabase /> Manutenção do Esquema
                    </div>
                    <p>
                        Abaixo encontra-se o script SQL de manutenção. Execute este script no painel do Supabase (SQL Editor) 
                        se encontrar erros de "permissão negada" ou "coluna em falta".
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute top-0 right-0 p-2">
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                        >
                            {copied ? <FaCheck className="text-green-400" /> : <FaCopy />} 
                            {copied ? 'Copiado!' : 'Copiar SQL'}
                        </button>
                    </div>
                    <pre className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-xs font-mono text-green-400 overflow-auto max-h-96 whitespace-pre-wrap">
                        {maintenanceScript}
                    </pre>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
    