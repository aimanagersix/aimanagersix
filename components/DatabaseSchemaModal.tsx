
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
    -- 1. [Tabela: messages] Normalização Snake Case
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='senderId') THEN
        ALTER TABLE public.messages RENAME COLUMN "senderId" TO sender_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='receiverId') THEN
        ALTER TABLE public.messages RENAME COLUMN "receiverId" TO receiver_id;
    END IF;

    -- 2. Garantia de RLS para Mensagens (Canal Geral e Privado)
    ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "System can send messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can read system messages" ON public.messages;
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "System can send messages" ON public.messages
    FOR INSERT TO authenticated WITH CHECK (true);

    -- Política v42: Garante leitura de mensagens próprias OU do Canal Geral (ID Zero)
    EXECUTE 'CREATE POLICY "Users can read system messages" ON public.messages
    FOR SELECT TO authenticated
    USING (
        receiver_id = auth.uid() 
        OR sender_id = auth.uid()
        OR receiver_id = ''00000000-0000-0000-0000-000000000000''::uuid 
        OR sender_id = ''00000000-0000-0000-0000-000000000000''::uuid
    )';

    -- 3. Permissões de escrita para Tabelas de Atividade (Essencial para Triagem)
    GRANT ALL ON public.ticket_activities TO authenticated;
    GRANT ALL ON public.messages TO authenticated;
    GRANT ALL ON public.tickets TO authenticated;

END $$;`;

    return (
        <Modal title="Manutenção e Schema da Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('migration')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'migration' ? 'border-brand-primary text-white bg-gray-800/50' : 'border-transparent text-gray-400 hover:text-white'}`}>Reparação de Schema v42</button>
                    <button onClick={() => setActiveTab('cleanup')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'cleanup' ? 'border-red-500 text-white bg-red-900/10' : 'border-transparent text-gray-400 hover:text-white'}`}>Limpeza Total</button>
                </div>

                {activeTab === 'migration' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-sm text-amber-200">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><FaExclamationTriangle className="text-amber-400" /> Atualização v42.0</h3>
                            <p>Este script garante que as notificações do <strong>Canal Geral</strong> apareçam corretamente para todos os técnicos.</p>
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
