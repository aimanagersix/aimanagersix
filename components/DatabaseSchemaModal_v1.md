
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaSearch, FaBroom, FaHistory } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'migration' | 'cleanup' | 'inspect'>('migration');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const migrationScript = `DO $$ 
BEGIN
    -- 1. [Índices] Otimização de Performance para Mensagens e Alertas
    CREATE INDEX IF NOT EXISTS idx_messages_unread_lookup 
    ON public.messages (receiver_id, read, sender_id);

    -- 2. [Índices] Otimização de Busca de Tickets por Status e Data
    CREATE INDEX IF NOT EXISTS idx_tickets_workflow_sort 
    ON public.tickets (status, request_date DESC);

    -- 3. [Tabela: messages] Hardening de RLS v47
    -- Garante leitura e atualização de estado 'read' para Canal Geral
    ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read and update messages" ON public.messages;
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can read and update messages" ON public.messages
    FOR ALL TO authenticated
    USING (
        receiver_id = auth.uid() 
        OR sender_id = auth.uid()
        OR receiver_id = '00000000-0000-0000-0000-000000000000'::uuid 
    );

    -- 4. [Permissões] Acesso total às tabelas de suporte para técnicos
    -- Removido GRANT em sequências inexistentes (UUID Tables não usam sequências de inteiros)
    GRANT ALL ON public.ticket_activities TO authenticated;
    GRANT ALL ON public.messages TO authenticated;
    GRANT ALL ON public.tickets TO authenticated;

    -- 5. Garantir que a equipe de Triagem existe (Fail-safe)
    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Triagem') THEN
        INSERT INTO public.teams (id, name, description, is_active)
        VALUES (gen_random_uuid(), 'Triagem', 'Equipa responsável pela primeira análise de tickets', true);
    END IF;

END $$;`;

    return (
        <Modal title="Manutenção e Schema da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('migration')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'migration' ? 'border-brand-primary text-white bg-gray-800/50' : 'border-transparent text-gray-400 hover:text-white'}`}>Reparação de Schema v47</button>
                    <button onClick={() => setActiveTab('cleanup')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'cleanup' ? 'border-red-500 text-white bg-red-900/10' : 'border-transparent text-gray-400 hover:text-white'}`}>Limpeza Total</button>
                </div>

                {activeTab === 'migration' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><FaExclamationTriangle className="text-green-400" /> Atualização v47.0 (Fix Sequências)</h3>
                            <p>Este script corrige o erro de permissões em sequências inexistentes e garante que a <strong>Triagem Automática</strong> funcione corretamente.</p>
                        </div>
                        <div className="relative bg-gray-900 border border-gray-700 rounded-lg h-[35vh]">
                            <button onClick={() => handleCopy(migrationScript, 'mig')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                                {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar SQL
                            </button>
                            <pre className="p-4 text-[10px] font-mono text-blue-400 overflow-auto h-full custom-scrollbar">{migrationScript}</pre>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fechar Janela</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
