
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);

    const sqlScript = `-- SCRIPT DE ATUALIZAÇÃO DE BASE DE DADOS (v1.32)

-- 1. Adicionar campos de Empréstimo e Atribuição a Instituições
DO $$ 
DECLARE
    t text;
BEGIN 
    -- Config Status: Adicionar 'Empréstimo'
    INSERT INTO config_equipment_statuses (name) VALUES ('Empréstimo') ON CONFLICT (name) DO NOTHING;

    -- Equipment: Flag de Empréstimo
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS "isLoan" boolean DEFAULT false;
    END IF;
    
    -- Assignments: Permitir atribuição direta a Instituições (Nullable EntidadeId, Add InstituicaoId)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments') THEN
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS "instituicaoId" uuid REFERENCES instituicoes(id);
        ALTER TABLE assignments ALTER COLUMN "entidadeId" DROP NOT NULL;
    END IF;

    -- Garantir permissões básicas
    -- ... (Restante das permissões já aplicadas)
END $$;
`;

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal title="Atualização de Base de Dados (SQL)" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    <p>Execute este script no <strong>SQL Editor</strong> do Supabase para ativar a funcionalidade de Empréstimos e atribuição a Instituições.</p>
                </div>
                
                <div className="relative">
                    <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 border border-gray-700 overflow-auto max-h-96 custom-scrollbar whitespace-pre-wrap">
                        {sqlScript}
                    </pre>
                    <button 
                        onClick={handleCopy} 
                        className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow transition-colors"
                        title="Copiar SQL"
                    >
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                </div>

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
